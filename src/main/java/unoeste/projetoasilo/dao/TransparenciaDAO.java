package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.Transparencia;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TransparenciaDAO
{
    private static final String SQL_SELECT = """
            SELECT t.idtransparencia, t.nomearquivo, t.caminhoarquivo, t.evento,
                   t.datareferencia, t.observacao, t.dataupload, t.ano, t.mes,
                   f.idfuncionario, f.nome
            FROM transparencia t
            INNER JOIN funcionario f ON f.idfuncionario = t.Funcionario_idFuncionario
            """;

    public boolean gravar(Transparencia transparencia, Banco conexao) throws SQLException
    {
        garantirEstruturaTransparencia(conexao);
        String sql = """
                INSERT INTO transparencia
                    (nomearquivo, caminhoarquivo, evento, datareferencia, observacao, dataupload, ano, mes, Funcionario_idFuncionario)
                VALUES
                    (#1, #2, #3, #4, #5, #6, #7, #8, #9)
                """;
        sql = sql.replace("#1", textoSql(transparencia.getNomeArquivo()));
        sql = sql.replace("#2", textoSql(transparencia.getCaminhoArquivo()));
        sql = sql.replace("#3", textoSql(transparencia.getEvento()));
        sql = sql.replace("#4", dataReferenciaSql(transparencia.getDataReferencia()));
        sql = sql.replace("#5", textoSql(transparencia.getObservacao()));
        sql = sql.replace("#6", dataSql(transparencia.getDataUpload()));
        sql = sql.replace("#7", String.valueOf(transparencia.getAno()));
        sql = sql.replace("#8", String.valueOf(transparencia.getMes()));
        sql = sql.replace("#9", String.valueOf(transparencia.getFuncionario().getIdFuncionario()));

        if (!conexao.manipular(sql))
        {
            return false;
        }

        int novoId = conexao.getMaxPK("transparencia", "idtransparencia");
        if (novoId > 0)
        {
            transparencia.setIdTransparencia(novoId);
        }
        return true;
    }

    public Transparencia buscarPorId(int id, Banco conexao) throws SQLException
    {
        garantirEstruturaTransparencia(conexao);
        String sql = SQL_SELECT + " WHERE t.idtransparencia = #1 LIMIT 1";
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularTransparencia(rs);
        }
        return null;
    }

    public List<Transparencia> listar(Banco conexao) throws SQLException
    {
        garantirEstruturaTransparencia(conexao);
        String sql = SQL_SELECT + """
                 ORDER BY t.ano DESC, t.mes DESC, t.evento ASC,
                          COALESCE(t.datareferencia, t.dataupload::date) DESC,
                          t.dataupload DESC, t.idtransparencia DESC
                """;
        List<Transparencia> arquivos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);
        if (rs != null)
        {
            while (rs.next())
            {
                arquivos.add(popularTransparencia(rs));
            }
        }
        return arquivos;
    }

    public boolean deletar(int id, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM transparencia WHERE idtransparencia = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean atualizar(Transparencia transparencia, Banco conexao) throws SQLException
    {
        garantirEstruturaTransparencia(conexao);
        String sql = """
                UPDATE transparencia
                SET nomearquivo = #1,
                    caminhoarquivo = #2,
                    evento = #3,
                    datareferencia = #4,
                    observacao = #5,
                    ano = #6,
                    mes = #7,
                    atualizado_em = CURRENT_TIMESTAMP,
                    atualizado_por = #8
                WHERE idtransparencia = #9
                """;
        sql = sql.replace("#1", textoSql(transparencia.getNomeArquivo()));
        sql = sql.replace("#2", textoSql(transparencia.getCaminhoArquivo()));
        sql = sql.replace("#3", textoSql(transparencia.getEvento()));
        sql = sql.replace("#4", dataReferenciaSql(transparencia.getDataReferencia()));
        sql = sql.replace("#5", textoSql(transparencia.getObservacao()));
        sql = sql.replace("#6", String.valueOf(transparencia.getAno()));
        sql = sql.replace("#7", String.valueOf(transparencia.getMes()));
        sql = sql.replace("#8", String.valueOf(transparencia.getFuncionario().getIdFuncionario()));
        sql = sql.replace("#9", String.valueOf(transparencia.getIdTransparencia()));

        return conexao.manipular(sql);
    }

    private Transparencia popularTransparencia(ResultSet rs) throws SQLException
    {
        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(rs.getInt("idfuncionario"));
        funcionario.setNome(rs.getString("nome"));

        Transparencia transparencia = new Transparencia();
        transparencia.setIdTransparencia(rs.getInt("idtransparencia"));
        transparencia.setNomeArquivo(rs.getString("nomearquivo"));
        transparencia.setCaminhoArquivo(rs.getString("caminhoarquivo"));
        transparencia.setEvento(rs.getString("evento"));
        if (rs.getDate("datareferencia") != null)
        {
            transparencia.setDataReferencia(rs.getDate("datareferencia").toLocalDate());
        }
        transparencia.setObservacao(rs.getString("observacao"));
        transparencia.setDataUpload(rs.getTimestamp("dataupload"));
        transparencia.setAno(rs.getInt("ano"));
        transparencia.setMes(rs.getInt("mes"));
        transparencia.setFuncionario(funcionario);
        return transparencia;
    }

    private void garantirEstruturaTransparencia(Banco conexao)
    {
        conexao.manipular("ALTER TABLE transparencia ADD COLUMN IF NOT EXISTS mes INTEGER");
        conexao.manipular("UPDATE transparencia SET mes = EXTRACT(MONTH FROM dataupload)::INTEGER WHERE mes IS NULL");
        conexao.manipular("ALTER TABLE transparencia ADD COLUMN IF NOT EXISTS datareferencia DATE");
        conexao.manipular("""
                UPDATE transparencia
                SET datareferencia = MAKE_DATE(ano, mes, 1)
                WHERE datareferencia IS NULL
                  AND ano BETWEEN 2000 AND 2100
                  AND mes BETWEEN 1 AND 12
                """);
        conexao.manipular("ALTER TABLE transparencia ADD COLUMN IF NOT EXISTS observacao VARCHAR(500)");
        conexao.manipular("ALTER TABLE transparencia ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        conexao.manipular("ALTER TABLE transparencia ADD COLUMN IF NOT EXISTS atualizado_por INTEGER");
    }

    private String textoSql(String valor)
    {
        if (valor == null || valor.isBlank())
        {
            return "NULL";
        }
        return "'" + valor.replace("'", "''") + "'";
    }

    private String dataSql(Timestamp data)
    {
        if (data == null)
        {
            return "NULL";
        }
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return "'" + sdf.format(data) + "'";
    }

    private String dataReferenciaSql(LocalDate data)
    {
        if (data == null)
        {
            return "NULL";
        }
        return "'" + data + "'";
    }
}
