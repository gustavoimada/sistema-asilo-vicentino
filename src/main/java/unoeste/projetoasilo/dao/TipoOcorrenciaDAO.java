package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.TipoOcorrencia;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TipoOcorrenciaDAO
{
    public boolean gravar(TipoOcorrencia tipoOcorrencia, Banco conexao) throws SQLException
    {
        String sql = """
                INSERT INTO tiposocorrencias (descricao, gravidade)
                VALUES ('#1', #2)
                """;
        sql = sql.replace("#1", escaparSql(tipoOcorrencia.getDescricao()));
        sql = sql.replace("#2", String.valueOf(tipoOcorrencia.getGravidade()));

        if (!conexao.manipular(sql))
        {
            return false;
        }

        int novoId = conexao.getMaxPK("tiposocorrencias", "idOcorrencias");
        if (novoId > 0)
        {
            tipoOcorrencia.setIdOcorrencias(novoId);
            return true;
        }

        return false;
    }

    public boolean editar(TipoOcorrencia tipoOcorrencia, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE tiposocorrencias
                SET descricao = '#1', gravidade = #2
                WHERE idOcorrencias = #3
                """;
        sql = sql.replace("#1", escaparSql(tipoOcorrencia.getDescricao()));
        sql = sql.replace("#2", String.valueOf(tipoOcorrencia.getGravidade()));
        sql = sql.replace("#3", String.valueOf(tipoOcorrencia.getIdOcorrencias()));

        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM tiposocorrencias WHERE idOcorrencias = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean possuiOcorrenciaVinculada(int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT 1
                FROM ocorrencias
                WHERE Ocorrencias_idOcorrencias = #1
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public List<TipoOcorrencia> listar(Banco conexao) throws SQLException
    {
        String sql = "SELECT idOcorrencias, descricao, gravidade FROM tiposocorrencias ORDER BY idOcorrencias";
        List<TipoOcorrencia> tipos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                tipos.add(popularTipoOcorrencia(rs));
            }
        }
        return tipos;
    }

    public TipoOcorrencia buscarPorId(int id, Banco conexao) throws SQLException
    {
        String sql = "SELECT idOcorrencias, descricao, gravidade FROM tiposocorrencias WHERE idOcorrencias = #1";
        sql = sql.replace("#1", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularTipoOcorrencia(rs);
        }

        return null;
    }

    private TipoOcorrencia popularTipoOcorrencia(ResultSet rs) throws SQLException
    {
        TipoOcorrencia tipo = new TipoOcorrencia();
        tipo.setIdOcorrencias(rs.getInt("idOcorrencias"));
        tipo.setDescricao(rs.getString("descricao"));
        tipo.setGravidade(rs.getInt("gravidade"));
        return tipo;
    }

    private String escaparSql(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.replace("'", "''");
    }
}
