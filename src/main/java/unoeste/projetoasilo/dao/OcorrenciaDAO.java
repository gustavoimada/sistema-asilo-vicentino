package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.FuncionarioTurnos;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Ocorrencia;
import unoeste.projetoasilo.entities.TipoOcorrencia;
import unoeste.projetoasilo.entities.Turno;
import unoeste.projetoasilo.util.TurnosPadrao;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OcorrenciaDAO
{
    public boolean gravar(Ocorrencia ocorrencia, Banco conexao) throws SQLException
    {
        boolean gravou = false;
        String observacoesSql = textoSql(ocorrencia.getObservacoes());
        String dtSql = formatarData(ocorrencia.getDtOcorrencia());

        String sql = """
                INSERT INTO ocorrencias
                (Ocorrencias_idOcorrencias, Funcionario_idFuncionario, observacoes, dtOcorrencia, Turnos_idTurnos)
                VALUES (#1, #2, #3, #4, #5)
                """;
        sql = sql.replace("#1", String.valueOf(ocorrencia.getTipoOcorrencia().getIdOcorrencias()));
        sql = sql.replace("#2", String.valueOf(ocorrencia.getFuncionario().getIdFuncionario()));
        sql = sql.replace("#3", observacoesSql);
        sql = sql.replace("#4", dtSql);
        sql = sql.replace("#5", String.valueOf(ocorrencia.getTurno().getIdTurnos()));

        if (conexao.manipular(sql))
        {
            int novoId = conexao.getMaxPK("ocorrencias", "idOcorrencia");
            if (novoId > 0)
            {
                ocorrencia.setIdOcorrencia(novoId);
                gravou = true;
            }
        }

        return gravou;
    }

    public List<Ocorrencia> listar(Banco conexao) throws SQLException
    {
        String sql = """
                SELECT o.idOcorrencia, o.observacoes, o.dtOcorrencia,
                       tpo.idOcorrencias, tpo.descricao, tpo.gravidade,
                       f.idfuncionario, f.nome,
                       o.Turnos_idTurnos AS idTurnos
                FROM ocorrencias o
                INNER JOIN tiposocorrencias tpo ON tpo.idOcorrencias = o.Ocorrencias_idOcorrencias
                INNER JOIN funcionario f ON f.idfuncionario = o.Funcionario_idFuncionario
                ORDER BY o.idOcorrencia DESC
                """;
        List<Ocorrencia> ocorrencias = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                ocorrencias.add(popularOcorrencia(rs));
            }
        }

        return ocorrencias;
    }

    private Ocorrencia popularOcorrencia(ResultSet rs) throws SQLException
    {
        TipoOcorrencia tipo = new TipoOcorrencia();
        tipo.setIdOcorrencias(rs.getInt("idOcorrencias"));
        tipo.setDescricao(rs.getString("descricao"));
        tipo.setGravidade(rs.getInt("gravidade"));

        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(rs.getInt("idfuncionario"));
        funcionario.setNome(rs.getString("nome"));

        Turno turno = null;
        int idTurno = rs.getInt("idTurnos");
        if (!rs.wasNull())
        {
            turno = new Turno();
            turno.setIdTurnos(idTurno);
            turno.setHoraIni(TurnosPadrao.horaInicio(idTurno));
            turno.setHoraFim(TurnosPadrao.horaFim(idTurno));
        }

        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.setIdOcorrencia(rs.getInt("idOcorrencia"));
        ocorrencia.setObservacoes(rs.getString("observacoes"));
        ocorrencia.setDtOcorrencia(rs.getTimestamp("dtOcorrencia"));
        ocorrencia.setTipoOcorrencia(tipo);
        ocorrencia.setFuncionario(funcionario);
        ocorrencia.setTurno(turno);
        return ocorrencia;
    }

    public Ocorrencia buscarPorId(int idOcorrencia, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT o.idOcorrencia, o.observacoes, o.dtOcorrencia,
                       tpo.idOcorrencias, tpo.descricao, tpo.gravidade,
                       f.idfuncionario, f.nome,
                       o.Turnos_idTurnos AS idTurnos
                FROM ocorrencias o
                INNER JOIN tiposocorrencias tpo ON tpo.idOcorrencias = o.Ocorrencias_idOcorrencias
                INNER JOIN funcionario f ON f.idfuncionario = o.Funcionario_idFuncionario
                WHERE o.idOcorrencia = #1
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idOcorrencia));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularOcorrencia(rs);
        }
        return null;
    }

    public List<Ocorrencia> listarPorTurno(FuncionarioTurnos turno, Banco conexao) throws SQLException
    {
        String inicio = montarDataHora(turno);
        String fim = montarFimDataHora(turno);
        if (inicio == null || inicio.isBlank())
        {
            return new ArrayList<>();
        }

        String sql = """
                SELECT o.idOcorrencia, o.observacoes, o.dtOcorrencia,
                       tpo.idOcorrencias, tpo.descricao, tpo.gravidade,
                       f.idfuncionario, f.nome,
                       o.Turnos_idTurnos AS idTurnos,
                       m.idMorador, m.nome AS nomeMorador
                FROM ocorrencias o
                INNER JOIN tiposocorrencias tpo ON tpo.idOcorrencias = o.Ocorrencias_idOcorrencias
                INNER JOIN funcionario f ON f.idfuncionario = o.Funcionario_idFuncionario
                LEFT JOIN moradorocorrencia mo ON mo.MoradorOcorrencias_idOcorrencia = o.idOcorrencia
                LEFT JOIN morador m ON m.idMorador = mo.Morador_idMorador
                WHERE o.Funcionario_idFuncionario = #1
                AND o.Turnos_idTurnos = #2
                AND o.dtOcorrencia >= '#3'
                AND o.dtOcorrencia <= '#4'
                ORDER BY o.dtOcorrencia
                """;
        sql = sql.replace("#1", String.valueOf(turno.getIdFuncionario()));
        sql = sql.replace("#2", String.valueOf(turno.getIdTurno()));
        sql = sql.replace("#3", inicio);
        sql = sql.replace("#4", fim);

        Map<Integer, Ocorrencia> ocorrencias = new LinkedHashMap<>();
        ResultSet rs = conexao.consultar(sql);
        if (rs != null)
        {
            while (rs.next())
            {
                int idOcorrencia = rs.getInt("idOcorrencia");
                Ocorrencia ocorrencia = ocorrencias.get(idOcorrencia);
                if (ocorrencia == null)
                {
                    ocorrencia = popularOcorrencia(rs);
                    ocorrencia.setMoradores(new ArrayList<>());
                    ocorrencias.put(idOcorrencia, ocorrencia);
                }

                int idMorador = rs.getInt("idMorador");
                if (!rs.wasNull())
                {
                    Morador morador = new Morador();
                    morador.setIdMorador(idMorador);
                    morador.setNome(rs.getString("nomeMorador"));
                    ocorrencia.getMoradores().add(morador);
                }
            }
        }

        return new ArrayList<>(ocorrencias.values());
    }

    public boolean atualizar(Ocorrencia ocorrencia, Banco conexao) throws SQLException
    {
        String observacoesSql = textoSql(ocorrencia.getObservacoes());

        String sql = """
                UPDATE ocorrencias
                SET Ocorrencias_idOcorrencias = #1, observacoes = #2
                WHERE idOcorrencia = #3
                """;
        sql = sql.replace("#1", String.valueOf(ocorrencia.getTipoOcorrencia().getIdOcorrencias()));
        sql = sql.replace("#2", observacoesSql);
        sql = sql.replace("#3", String.valueOf(ocorrencia.getIdOcorrencia()));
        return conexao.manipular(sql);
    }

    public boolean deletar(int idOcorrencia, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM ocorrencias WHERE idOcorrencia = #1";
        sql = sql.replace("#1", String.valueOf(idOcorrencia));
        return conexao.manipular(sql);
    }

    private String formatarData(Timestamp data)
    {
        if (data == null)
        {
            return "NULL";
        }
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return "'" + sdf.format(data) + "'";
    }

    private String textoSql(String valor)
    {
        if (valor == null || valor.isBlank())
        {
            return "NULL";
        }
        return "'" + valor.replace("'", "''") + "'";
    }

    private String montarDataHora(FuncionarioTurnos turno)
    {
        if (turno == null || turno.getDataEscala() == null || turno.getHoraInicio() == null)
        {
            return null;
        }
        return turno.getDataEscala() + " " + padronizarHora(turno.getHoraInicio());
    }

    private String montarFimDataHora(FuncionarioTurnos turno)
    {
        if (turno == null || turno.getDataEscala() == null)
        {
            return null;
        }

        if (turno.getHoraFim() == null)
        {
            return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Timestamp(System.currentTimeMillis()));
        }

        LocalDate dataBase = turno.getDataEscala();
        if (turno.getIdTurno() == 2 && turno.getHoraInicio() != null && !turno.getHoraFim().isAfter(turno.getHoraInicio()))
        {
            dataBase = dataBase.plusDays(1);
        }
        return dataBase + " " + padronizarHora(turno.getHoraFim());
    }

    private String padronizarHora(LocalTime hora)
    {
        if (hora == null)
        {
            return "00:00:00";
        }
        String texto = hora.toString();
        if (texto.length() == 5)
        {
            return texto + ":00";
        }
        return texto;
    }
}
