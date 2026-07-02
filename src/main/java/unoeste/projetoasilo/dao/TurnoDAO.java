package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.FuncionarioTurnos;
import unoeste.projetoasilo.entities.Turno;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class TurnoDAO
{
    private static final String SQL_SELECT_RESUMO_TURNO = """
            SELECT ft.idFuncionarioTurnos,
                   ft.Funcionario_idFuncionario,
                   f.nome AS nomeFuncionario,
                   ft.Turnos_idTurnos,
                   t.horaIni AS horaPrevistaInicio,
                   t.horaFim AS horaPrevistaFim,
                   ft.dataEscala,
                   ft.horaInicio,
                   ft.horaFim,
                   ft.status,
                   ft.descricao
            FROM funcionarioturnos ft
            INNER JOIN funcionario f ON f.idFuncionario = ft.Funcionario_idFuncionario
            INNER JOIN turnos t ON t.idTurnos = ft.Turnos_idTurnos
            """;
    private static final String SQL_ORDER_FIM_REAL_TURNO = """
            ORDER BY
                (
                    ft.dataEscala
                    + CASE
                        WHEN ft.Turnos_idTurnos = 2
                             AND COALESCE(ft.horaFim, t.horaFim) IS NOT NULL
                             AND COALESCE(ft.horaInicio, t.horaIni) IS NOT NULL
                             AND COALESCE(ft.horaFim, t.horaFim) <= COALESCE(ft.horaInicio, t.horaIni)
                        THEN INTERVAL '1 day'
                        ELSE INTERVAL '0 day'
                      END
                ) DESC,
                COALESCE(ft.horaFim, t.horaFim) DESC NULLS LAST,
                COALESCE(ft.horaInicio, t.horaIni) DESC NULLS LAST,
                ft.idFuncionarioTurnos DESC
            """;
    private static final String SQL_ESCALA_VENCIDA_SEM_INICIO = """
            ft.status = 'pendente'
            AND ft.horaInicio IS NULL
            AND (
                ft.dataEscala
                + CASE WHEN ft.Turnos_idTurnos = 2 THEN INTERVAL '1 day' ELSE INTERVAL '0 day' END
                + COALESCE(NULLIF(t.horaFim, '')::time, TIME '23:59:59')
            ) < CURRENT_TIMESTAMP
            """;

    public Turno buscarTurnoAtivoPorFuncionario(int idFuncionario, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT t.idTurnos,
                       COALESCE(ft.horaInicio, t.horaIni) AS horaIni,
                       COALESCE(ft.horaFim, t.horaFim) AS horaFim
                FROM funcionarioturnos ft
                INNER JOIN turnos t ON t.idTurnos = ft.Turnos_idTurnos
                WHERE ft.Funcionario_idFuncionario = #1
                AND ft.status = 'ativo'
                ORDER BY ft.dataEscala DESC, t.idTurnos DESC
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        ResultSet rs = conexao.consultar(sql);

        if (rs != null && rs.next())
        {
            return popularTurno(rs, "idTurnos");
        }

        return null;
    }

    public String buscarCategoriaFuncionario(int idFuncionario, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT categoria
                FROM funcionario
                WHERE idFuncionario = #1
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        ResultSet rs = conexao.consultar(sql);

        if (rs == null || !rs.next())
        {
            return null;
        }

        return rs.getString("categoria");
    }

    public Turno buscarEscalaPendenteHoje(int idFuncionario, Banco conexao) throws SQLException
    {
        String dataHoje = new SimpleDateFormat("yyyy-MM-dd").format(new Timestamp(System.currentTimeMillis()));
        String sql = """
                SELECT ft.Turnos_idTurnos,
                       COALESCE(ft.horaInicio, t.horaIni) AS horaIni,
                       COALESCE(ft.horaFim, t.horaFim) AS horaFim
                FROM funcionarioturnos ft
                INNER JOIN turnos t ON t.idTurnos = ft.Turnos_idTurnos
                WHERE ft.Funcionario_idFuncionario = #1
                AND ft.dataEscala = '#2'
                AND ft.status = 'pendente'
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        sql = sql.replace("#2", dataHoje);
        ResultSet rs = conexao.consultar(sql);

        if (rs == null || !rs.next())
        {
            return null;
        }

        return popularTurno(rs, "Turnos_idTurnos");
    }

    public boolean escalarFuncionarioTurno(int idFuncionario, int idTurno, Banco conexao) throws SQLException
    {
        String dataHoje = new SimpleDateFormat("yyyy-MM-dd").format(new Timestamp(System.currentTimeMillis()));
        String sql = """
                INSERT INTO funcionarioturnos (Funcionario_idFuncionario, Turnos_idTurnos, dataEscala, status)
                VALUES (#1, #2, '#3', 'pendente')
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        sql = sql.replace("#2", String.valueOf(idTurno));
        sql = sql.replace("#3", dataHoje);

        return conexao.manipular(sql);
    }

    public FuncionarioTurnos buscarUltimoTurnoFinalizado(int idFuncionario, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT_RESUMO_TURNO + """
                WHERE ft.Funcionario_idFuncionario = #1
                AND ft.status = 'finalizado'
                #2
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        sql = sql.replace("#2", SQL_ORDER_FIM_REAL_TURNO);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscalaTurno(rs);
        }

        return null;
    }

    public FuncionarioTurnos buscarEscalaAtivaPorFuncionario(int idFuncionario, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT_RESUMO_TURNO + """
                WHERE ft.Funcionario_idFuncionario = #1
                AND ft.status = 'ativo'
                ORDER BY ft.dataEscala DESC, ft.horaInicio DESC NULLS LAST, ft.idFuncionarioTurnos DESC
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscalaTurno(rs);
        }

        return null;
    }

    public FuncionarioTurnos buscarUltimoTurnoFinalizadoGeral(Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT_RESUMO_TURNO + """
                WHERE ft.status = 'finalizado'
                #1
                LIMIT 1
                """;
        sql = sql.replace("#1", SQL_ORDER_FIM_REAL_TURNO);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscalaTurno(rs);
        }

        return null;
    }

    public FuncionarioTurnos buscarTurnoAnteriorAoAtual(int idFuncionario, Banco conexao) throws SQLException
    {
        String sqlAtivo = """
                SELECT Turnos_idTurnos, dataEscala
                FROM funcionarioturnos
                WHERE Funcionario_idFuncionario = #1
                AND status = 'ativo'
                ORDER BY dataEscala DESC, horaInicio DESC NULLS LAST, idFuncionarioTurnos DESC
                LIMIT 1
                """;
        sqlAtivo = sqlAtivo.replace("#1", String.valueOf(idFuncionario));

        ResultSet rsAtivo = conexao.consultar(sqlAtivo);
        if (rsAtivo == null || !rsAtivo.next())
        {
            return buscarUltimoTurnoFinalizadoGeral(conexao);
        }

        int turnoAtual = rsAtivo.getInt("Turnos_idTurnos");
        LocalDate dataAtual = LocalDate.parse(rsAtivo.getString("dataEscala"));
        int turnoAnterior;
        LocalDate dataAnterior;

        if (turnoAtual == 1)
        {
            turnoAnterior = 2;
            dataAnterior = dataAtual.minusDays(1);
        }
        else
        {
            turnoAnterior = 1;
            dataAnterior = dataAtual;
        }

        String sql = SQL_SELECT_RESUMO_TURNO + """
                WHERE ft.Turnos_idTurnos = #1
                AND ft.dataEscala = '#2'
                AND (ft.status = 'finalizado' OR (#3))
                #4
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(turnoAnterior));
        sql = sql.replace("#2", String.valueOf(dataAnterior));
        sql = sql.replace("#3", SQL_ESCALA_VENCIDA_SEM_INICIO);
        sql = sql.replace("#4", SQL_ORDER_FIM_REAL_TURNO);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscalaTurno(rs);
        }

        return buscarUltimoTurnoFinalizadoGeral(conexao);
    }

    public FuncionarioTurnos buscarTurnoAnteriorPeloHorarioAtual(Banco conexao) throws SQLException
    {
        LocalTime agora = LocalTime.now();
        LocalDate dataTurnoAtual;
        int turnoAtual;

        if (!agora.isBefore(LocalTime.of(7, 0)) && agora.isBefore(LocalTime.of(19, 0)))
        {
            turnoAtual = 1;
            dataTurnoAtual = LocalDate.now();
        }
        else
        {
            turnoAtual = 2;
            if (agora.isBefore(LocalTime.of(7, 0)))
            {
                dataTurnoAtual = LocalDate.now().minusDays(1);
            }
            else
            {
                dataTurnoAtual = LocalDate.now();
            }
        }

        int turnoAnterior;
        LocalDate dataAnterior;
        if (turnoAtual == 1)
        {
            turnoAnterior = 2;
            dataAnterior = dataTurnoAtual.minusDays(1);
        }
        else
        {
            turnoAnterior = 1;
            dataAnterior = dataTurnoAtual;
        }

        String sql = SQL_SELECT_RESUMO_TURNO + """
                WHERE ft.Turnos_idTurnos = #1
                AND ft.dataEscala = '#2'
                AND (ft.status = 'finalizado' OR (#3))
                #4
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(turnoAnterior));
        sql = sql.replace("#2", String.valueOf(dataAnterior));
        sql = sql.replace("#3", SQL_ESCALA_VENCIDA_SEM_INICIO);
        sql = sql.replace("#4", SQL_ORDER_FIM_REAL_TURNO);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscalaTurno(rs);
        }

        return null;
    }

    public List<FuncionarioTurnos> listarHistoricoTurnos(Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT_RESUMO_TURNO + """
                WHERE ft.status IN ('pendente', 'ativo', 'finalizado')
                OR ft.horaInicio IS NOT NULL
                OR (#1)
                #2
                LIMIT 80
                """;
        sql = sql.replace("#1", SQL_ESCALA_VENCIDA_SEM_INICIO);
        sql = sql.replace("#2", SQL_ORDER_FIM_REAL_TURNO);

        List<FuncionarioTurnos> turnos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);
        if (rs != null)
        {
            while (rs.next())
            {
                turnos.add(popularEscalaTurno(rs));
            }
        }
        return turnos;
    }

    public FuncionarioTurnos buscarDetalhesTurno(int idFuncionarioTurnos, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT_RESUMO_TURNO + " WHERE ft.idFuncionarioTurnos = #1 LIMIT 1";
        sql = sql.replace("#1", String.valueOf(idFuncionarioTurnos));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularEscalaTurno(rs);
        }

        return null;
    }

    public boolean iniciarTurno(int idFuncionario, String descricao, Banco conexao) throws SQLException
    {
        Timestamp agora = new Timestamp(System.currentTimeMillis());
        String horaAgora = new SimpleDateFormat("HH:mm:ss").format(agora);
        String dataHoje = new SimpleDateFormat("yyyy-MM-dd").format(agora);

        String sql = """
                UPDATE funcionarioturnos
                SET status = 'ativo', horaInicio = '#1'
                WHERE Funcionario_idFuncionario = #2
                AND dataEscala = '#3'
                AND status = 'pendente'
                """;
        sql = sql.replace("#1", horaAgora);
        sql = sql.replace("#2", String.valueOf(idFuncionario));
        sql = sql.replace("#3", dataHoje);

        return conexao.manipular(sql);
    }

    public boolean fecharTurnoAtivo(int idFuncionario, String descricao, Banco conexao) throws SQLException
    {
        Turno turnoAtivo = buscarTurnoAtivoPorFuncionario(idFuncionario, conexao);
        if (turnoAtivo == null)
        {
            return false;
        }

        String dataEscala = buscarDataEscalaAtiva(idFuncionario, turnoAtivo.getIdTurnos(), conexao);
        if (dataEscala == null)
        {
            return false;
        }

        String horaAgora = new SimpleDateFormat("HH:mm:ss").format(new Timestamp(System.currentTimeMillis()));
        String sql = """
                UPDATE funcionarioturnos
                SET horaFim = '#1', status = 'finalizado', descricao = #5
                WHERE Funcionario_idFuncionario = #2
                AND Turnos_idTurnos = #3
                AND dataEscala = '#4'
                """;
        sql = sql.replace("#1", horaAgora);
        sql = sql.replace("#2", String.valueOf(idFuncionario));
        sql = sql.replace("#3", String.valueOf(turnoAtivo.getIdTurnos()));
        sql = sql.replace("#4", dataEscala);
        sql = sql.replace("#5", textoSql(descricao));

        return conexao.manipular(sql);
    }

    private String buscarDataEscalaAtiva(int idFuncionario, int idTurno, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT dataEscala
                FROM funcionarioturnos
                WHERE Funcionario_idFuncionario = #1
                AND Turnos_idTurnos = #2
                AND status = 'ativo'
                ORDER BY dataEscala DESC
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idFuncionario));
        sql = sql.replace("#2", String.valueOf(idTurno));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return rs.getString("dataEscala");
        }

        return null;
    }

    private Turno popularTurno(ResultSet rs, String colunaId) throws SQLException
    {
        Turno turno = new Turno();
        turno.setIdTurnos(rs.getInt(colunaId));

        Time horaIni = rs.getTime("horaIni");
        Time horaFim = rs.getTime("horaFim");
        if (horaIni != null)
        {
            turno.setHoraIni(horaIni.toLocalTime());
        }
        else
        {
            turno.setHoraIni(null);
        }

        if (horaFim != null)
        {
            turno.setHoraFim(horaFim.toLocalTime());
        }
        else
        {
            turno.setHoraFim(null);
        }
        return turno;
    }

    private FuncionarioTurnos popularEscalaTurno(ResultSet rs) throws SQLException
    {
        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(rs.getInt("Funcionario_idFuncionario"));
        funcionario.setNome(rs.getString("nomeFuncionario"));

        Turno turno = new Turno();
        turno.setIdTurnos(rs.getInt("Turnos_idTurnos"));

        Time horaPrevistaInicio = rs.getTime("horaPrevistaInicio");
        Time horaPrevistaFim = rs.getTime("horaPrevistaFim");
        if (horaPrevistaInicio != null)
        {
            turno.setHoraIni(horaPrevistaInicio.toLocalTime());
        }
        else
        {
            turno.setHoraIni(null);
        }

        if (horaPrevistaFim != null)
        {
            turno.setHoraFim(horaPrevistaFim.toLocalTime());
        }
        else
        {
            turno.setHoraFim(null);
        }

        FuncionarioTurnos escala = new FuncionarioTurnos();
        escala.setIdFuncionarioTurnos(rs.getInt("idFuncionarioTurnos"));
        escala.setFuncionario(funcionario);
        escala.setTurno(turno);
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
        return "'" + valor.replace("'", "''") + "'";
    }
}
