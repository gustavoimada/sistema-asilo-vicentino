package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.FuncionarioTurnos;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class FuncionarioTurnosDAO
{
    private static final String SQL_SELECT = """
            SELECT idfuncionarioturnos, Funcionario_idFuncionario, Turnos_idTurnos,
                   status, descricao, horaInicio, horaFim, dataEscala
            FROM funcionarioturnos
            """;

    public boolean inserirEscala(FuncionarioTurnos escala, Banco conexao) throws SQLException
    {
        if (existeConflitoEscala(escala, conexao))
        {
            return false;
        }

        String dataEscalaSql;
        if (escala.getDataEscala() == null)
        {
            dataEscalaSql = "CURRENT_DATE";
        }
        else
        {
            dataEscalaSql = "'" + escala.getDataEscala() + "'";
        }

        String status;
        if (escala.getStatus() == null || escala.getStatus().isBlank())
        {
            status = "pendente";
        }
        else
        {
            status = escala.getStatus();
        }

        String sql = """
                INSERT INTO funcionarioturnos
                    (Funcionario_idFuncionario, Turnos_idTurnos, status, descricao, dataEscala)
                VALUES
                    (#1, #2, '#3', #4, #5)
                """;
        sql = sql.replace("#1", String.valueOf(escala.getIdFuncionario()));
        sql = sql.replace("#2", String.valueOf(escala.getIdTurno()));
        sql = sql.replace("#3", escaparSql(status));
        sql = sql.replace("#4", textoSql(escala.getDescricao()));
        sql = sql.replace("#5", dataEscalaSql);

        if (!conexao.manipular(sql))
        {
            return false;
        }

        int novoId = conexao.getMaxPK("funcionarioturnos", "idfuncionarioturnos");
        if (novoId > 0)
        {
            escala.setIdFuncionarioTurnos(novoId);
        }
        return true;
    }

    private boolean existeConflitoEscala(FuncionarioTurnos escala, Banco conexao) throws SQLException
    {
        LocalDate dataEscala = escala.getDataEscala();
        if (dataEscala == null)
        {
            dataEscala = LocalDate.now();
        }

        JanelaEscala janelaNova = montarJanelaEscala(dataEscala, escala.getIdTurno(), conexao);
        String sql = """
                SELECT ft.idfuncionarioturnos,
                       ft.Turnos_idTurnos,
                       ft.dataEscala,
                       t.horaIni,
                       t.horaFim
                FROM funcionarioturnos ft
                INNER JOIN turnos t ON t.idTurnos = ft.Turnos_idTurnos
                WHERE ft.Funcionario_idFuncionario = #1
                AND dataEscala >= '#2'
                AND dataEscala <= '#3'
                """;
        sql = sql.replace("#1", String.valueOf(escala.getIdFuncionario()));
        sql = sql.replace("#2", String.valueOf(dataEscala.minusDays(2)));
        sql = sql.replace("#3", String.valueOf(dataEscala.plusDays(2)));

        ResultSet rs = conexao.consultar(sql);
        if (rs == null)
        {
            return false;
        }

        while (rs.next())
        {
            LocalDate dataExistente = rs.getDate("dataEscala").toLocalDate();
            int idTurnoExistente = rs.getInt("Turnos_idTurnos");
            Time inicioExistente = rs.getTime("horaIni");
            Time fimExistente = rs.getTime("horaFim");
            JanelaEscala janelaExistente = montarJanelaEscala(
                    dataExistente,
                    idTurnoExistente,
                    inicioExistente != null ? inicioExistente.toLocalTime() : null,
                    fimExistente != null ? fimExistente.toLocalTime() : null
            );

            if (temConflitoDescanso(janelaNova, janelaExistente))
            {
                return true;
            }
        }

        return false;
    }

    private JanelaEscala montarJanelaEscala(LocalDate dataEscala, int idTurno, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT horaIni, horaFim
                FROM turnos
                WHERE idTurnos = #1
                """;
        sql = sql.replace("#1", String.valueOf(idTurno));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            Time horaIni = rs.getTime("horaIni");
            Time horaFim = rs.getTime("horaFim");
            return montarJanelaEscala(
                    dataEscala,
                    idTurno,
                    horaIni != null ? horaIni.toLocalTime() : null,
                    horaFim != null ? horaFim.toLocalTime() : null
            );
        }

        return montarJanelaEscala(dataEscala, idTurno, null, null);
    }

    private JanelaEscala montarJanelaEscala(LocalDate dataEscala, int idTurno, LocalTime horaInicio, LocalTime horaFim)
    {
        LocalTime inicio = horaInicio != null ? horaInicio : horaInicioPadrao(idTurno);
        LocalTime fim = horaFim != null ? horaFim : horaFimPadrao(idTurno);
        LocalDateTime inicioDataHora = LocalDateTime.of(dataEscala, inicio);
        LocalDateTime fimDataHora = LocalDateTime.of(dataEscala, fim);

        if (!fimDataHora.isAfter(inicioDataHora))
        {
            fimDataHora = fimDataHora.plusDays(1);
        }

        return new JanelaEscala(inicioDataHora, fimDataHora);
    }

    private boolean temConflitoDescanso(JanelaEscala nova, JanelaEscala existente)
    {
        if (nova.inicio.isBefore(existente.fim) && existente.inicio.isBefore(nova.fim))
        {
            return true;
        }

        long horasDescanso;
        if (!nova.inicio.isBefore(existente.fim))
        {
            horasDescanso = Duration.between(existente.fim, nova.inicio).toHours();
        }
        else
        {
            horasDescanso = Duration.between(nova.fim, existente.inicio).toHours();
        }

        return horasDescanso < 36;
    }

    private LocalTime horaInicioPadrao(int idTurno)
    {
        return idTurno == 2 ? LocalTime.of(19, 0) : LocalTime.of(7, 0);
    }

    private LocalTime horaFimPadrao(int idTurno)
    {
        return idTurno == 2 ? LocalTime.of(7, 0) : LocalTime.of(19, 0);
    }

    public List<FuncionarioTurnos> listarTodas(Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + " ORDER BY dataEscala, Funcionario_idFuncionario";
        return consultarLista(sql, conexao);
    }

    public List<FuncionarioTurnos> listarPorFuncionario(int idFuncionario, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + """
                 WHERE Funcionario_idFuncionario = #1
                 ORDER BY dataEscala, Turnos_idTurnos
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        return consultarLista(sql, conexao);
    }

    public List<FuncionarioTurnos> listarPorStatus(String status, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + " WHERE status = #1";
        sql = sql.replace("#1", textoSql(status));
        return consultarLista(sql, conexao);
    }

    public List<FuncionarioTurnos> listarPorPeriodo(LocalDate inicio, LocalDate fim, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + """
                 WHERE dataEscala >= '#1' AND dataEscala <= '#2'
                 ORDER BY dataEscala, Turnos_idTurnos, Funcionario_idFuncionario
                """;
        sql = sql.replace("#1", String.valueOf(inicio));
        sql = sql.replace("#2", String.valueOf(fim));
        return consultarLista(sql, conexao);
    }

    public FuncionarioTurnos buscarEscala(int idFuncionarioTurnos, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + " WHERE idfuncionarioturnos = #1";
        sql = sql.replace("#1", String.valueOf(idFuncionarioTurnos));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscala(rs);
        }
        return null;
    }

    public boolean atualizarStatus(int idFuncionarioTurnos, String novoStatus, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionarioturnos
                SET status = #1
                WHERE idfuncionarioturnos = #2
                """;
        sql = sql.replace("#1", textoSql(novoStatus));
        sql = sql.replace("#2", String.valueOf(idFuncionarioTurnos));
        return conexao.manipular(sql);
    }

    public boolean atualizarHoraInicio(int idFuncionarioTurnos, LocalTime hora, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionarioturnos
                SET horaInicio = #1
                WHERE idfuncionarioturnos = #2
                """;
        sql = sql.replace("#1", horaSql(hora));
        sql = sql.replace("#2", String.valueOf(idFuncionarioTurnos));
        return conexao.manipular(sql);
    }

    public boolean atualizarHoraFim(int idFuncionarioTurnos, LocalTime hora, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionarioturnos
                SET horaFim = #1
                WHERE idfuncionarioturnos = #2
                """;
        sql = sql.replace("#1", horaSql(hora));
        sql = sql.replace("#2", String.valueOf(idFuncionarioTurnos));
        return conexao.manipular(sql);
    }

    public boolean deletarEscala(int idFuncionarioTurnos, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM funcionarioturnos WHERE idfuncionarioturnos = #1";
        sql = sql.replace("#1", String.valueOf(idFuncionarioTurnos));
        return conexao.manipular(sql);
    }

    private List<FuncionarioTurnos> consultarLista(String sql, Banco conexao) throws SQLException
    {
        List<FuncionarioTurnos> lista = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                lista.add(popularEscala(rs));
            }
        }
        return lista;
    }

    private FuncionarioTurnos popularEscala(ResultSet rs) throws SQLException
    {
        FuncionarioTurnos escala = new FuncionarioTurnos();
        escala.setIdFuncionarioTurnos(rs.getInt("idfuncionarioturnos"));
        escala.setIdFuncionario(rs.getInt("Funcionario_idFuncionario"));
        escala.setIdTurno(rs.getInt("Turnos_idTurnos"));
        escala.setStatus(rs.getString("status"));
        escala.setDescricao(rs.getString("descricao"));

        Time horaInicio = rs.getTime("horaInicio");
        Time horaFim = rs.getTime("horaFim");
        if (horaInicio != null)
        {
            escala.setHoraInicio(horaInicio.toLocalTime());
        }

        if (horaFim != null)
        {
            escala.setHoraFim(horaFim.toLocalTime());
        }

        if (rs.getDate("dataEscala") != null)
        {
            escala.setDataEscala(rs.getDate("dataEscala").toLocalDate());
        }

        return escala;
    }

    private String textoSql(String valor)
    {
        if (valor == null || valor.isBlank())
        {
            return "NULL";
        }
        return "'" + escaparSql(valor) + "'";
    }

    private String horaSql(LocalTime hora)
    {
        if (hora == null)
        {
            return "NULL";
        }
        return "'" + hora + "'";
    }

    private String escaparSql(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.replace("'", "''");
    }

    private static class JanelaEscala
    {
        private final LocalDateTime inicio;
        private final LocalDateTime fim;

        private JanelaEscala(LocalDateTime inicio, LocalDateTime fim)
        {
            this.inicio = inicio;
            this.fim = fim;
        }
    }
}
