package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.OcorrenciaMorador;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class OcorrenciaMoradorDAO
{
    public boolean gravar(OcorrenciaMorador ocorrenciaMorador, Banco conexao) throws SQLException
    {
        String sqlPadrao = """
                INSERT INTO moradorocorrencia (Morador_idMorador, MoradorOcorrencias_idOcorrencia)
                VALUES (#1, #2)
                """;
        sqlPadrao = sqlPadrao.replace("#1", String.valueOf(ocorrenciaMorador.getMorador().getIdMorador()));
        sqlPadrao = sqlPadrao.replace("#2", String.valueOf(ocorrenciaMorador.getOcorrencia().getIdOcorrencia()));

        boolean gravou = conexao.manipular(sqlPadrao);
        if (!gravou)
        {
            String sqlAlternativo = """
                    INSERT INTO moradorocorrencia (Morador_idMorador, Ocorrencias_idOcorrencia)
                    VALUES (#1, #2)
                    """;
            sqlAlternativo = sqlAlternativo.replace("#1", String.valueOf(ocorrenciaMorador.getMorador().getIdMorador()));
            sqlAlternativo = sqlAlternativo.replace("#2", String.valueOf(ocorrenciaMorador.getOcorrencia().getIdOcorrencia()));
            gravou = conexao.manipular(sqlAlternativo);
        }

        if (gravou)
        {
            int novoId = conexao.getMaxPK("moradorocorrencia", "idMoradorOcorrencia");
            if (novoId > 0)
            {
                ocorrenciaMorador.setIdMoradorOcorrencia(novoId);
            }
        }

        return gravou;
    }

    public List<Morador> listarMoradoresPorOcorrencia(int idOcorrencia, Banco conexao) throws SQLException
    {
        String sqlPadrao = """
                SELECT m.idmorador, m.nome
                FROM moradorocorrencia mo
                INNER JOIN morador m ON m.idmorador = mo.Morador_idMorador
                WHERE mo.MoradorOcorrencias_idOcorrencia = #1
                ORDER BY m.nome
                """;
        sqlPadrao = sqlPadrao.replace("#1", String.valueOf(idOcorrencia));

        List<Morador> moradores = consultarMoradores(sqlPadrao, conexao);
        if (!moradores.isEmpty())
        {
            return moradores;
        }

        String sqlAlternativo = """
                SELECT m.idmorador, m.nome
                FROM moradorocorrencia mo
                INNER JOIN morador m ON m.idmorador = mo.Morador_idMorador
                WHERE mo.Ocorrencias_idOcorrencia = #1
                ORDER BY m.nome
                """;
        sqlAlternativo = sqlAlternativo.replace("#1", String.valueOf(idOcorrencia));
        return consultarMoradores(sqlAlternativo, conexao);
    }

    public boolean deletarPorOcorrencia(int idOcorrencia, Banco conexao) throws SQLException
    {
        String sqlPadrao = """
                DELETE FROM moradorocorrencia
                WHERE MoradorOcorrencias_idOcorrencia = #1
                """;
        sqlPadrao = sqlPadrao.replace("#1", String.valueOf(idOcorrencia));
        boolean removeuPadrao = conexao.manipular(sqlPadrao);

        String sqlAlternativo = """
                DELETE FROM moradorocorrencia
                WHERE Ocorrencias_idOcorrencia = #1
                """;
        sqlAlternativo = sqlAlternativo.replace("#1", String.valueOf(idOcorrencia));
        boolean removeuAlternativo = conexao.manipular(sqlAlternativo);

        return removeuPadrao || removeuAlternativo;
    }

    private List<Morador> consultarMoradores(String sql, Banco conexao) throws SQLException
    {
        List<Morador> moradores = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                Morador morador = new Morador();
                morador.setIdMorador(rs.getInt("idmorador"));
                morador.setNome(rs.getString("nome"));
                moradores.add(morador);
            }
        }
        return moradores;
    }
}
