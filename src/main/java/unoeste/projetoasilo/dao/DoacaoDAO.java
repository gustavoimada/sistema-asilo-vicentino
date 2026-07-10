package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Doacao;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class DoacaoDAO
{
    private static final String COLUNAS_DOACAO = "idDoacao, valor, observacoes, nomeDoador, cpfDoador, dtDoacao, tipo, status, txid, pag_nome, pag_email";

    public boolean gravar(Doacao doacao, Banco conexao) throws SQLException
    {
        String sql = """
                INSERT INTO doacao
                    (valor, observacoes, nomeDoador, cpfDoador, dtDoacao, tipo, status, txid, pag_nome, pag_email)
                VALUES (?, ?, ?, ?, ?, ?, 'Em_Analise', NULL, NULL, ?)
                """;

        try (PreparedStatement ps = conexao.prepararComChaves(sql))
        {
            ps.setDouble(1, doacao.getValor());
            setTextoNulo(ps, 2, doacao.getObservacoes());
            setTextoNulo(ps, 3, doacao.getNomeDoador());
            setTextoNulo(ps, 4, doacao.getCpfDoador());
            ps.setTimestamp(5, doacao.getDtDoacao());
            setTextoNulo(ps, 6, doacao.getTipo());
            setTextoNulo(ps, 7, doacao.getPag_email());

            if (ps.executeUpdate() <= 0)
            {
                return false;
            }

            try (ResultSet chaves = ps.getGeneratedKeys())
            {
                if (chaves.next())
                {
                    doacao.setIdDoacao(chaves.getInt(1));
                }
            }
        }

        if (doacao.getIdDoacao() <= 0)
        {
            int novoId = conexao.getMaxPK("doacao", "idDoacao");
            if (novoId > 0)
            {
                doacao.setIdDoacao(novoId);
            }
        }
        return true;
    }

    public boolean editar(Doacao doacao, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE doacao
                SET valor = ?, observacoes = ?, nomeDoador = ?, cpfDoador = ?, dtDoacao = ?,
                    tipo = ?, txid = NULL, pag_nome = NULL, pag_email = NULL
                WHERE idDoacao = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setDouble(1, doacao.getValor());
            setTextoNulo(ps, 2, doacao.getObservacoes());
            setTextoNulo(ps, 3, doacao.getNomeDoador());
            setTextoNulo(ps, 4, doacao.getCpfDoador());
            ps.setTimestamp(5, doacao.getDtDoacao());
            setTextoNulo(ps, 6, doacao.getTipo());
            ps.setInt(7, doacao.getIdDoacao());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean atualizarStatus(int id, String status, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE doacao
                SET status = ?, txid = NULL, pag_nome = NULL, pag_email = NULL
                WHERE idDoacao = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setString(1, status);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deletar(int id, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM doacao WHERE idDoacao = ?";

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public List<Doacao> listar(Banco conexao) throws SQLException
    {
        String sql = "SELECT " + COLUNAS_DOACAO + " FROM doacao ORDER BY idDoacao";
        List<Doacao> doacoes = new ArrayList<>();

        try (PreparedStatement ps = conexao.preparar(sql);
             ResultSet rs = ps.executeQuery())
        {
            while (rs.next())
            {
                doacoes.add(popularDoacao(rs));
            }
        }

        return doacoes;
    }

    public Doacao buscarPorId(int id, Banco conexao) throws SQLException
    {
        String sql = "SELECT " + COLUNAS_DOACAO + " FROM doacao WHERE idDoacao = ?";

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return popularDoacao(rs);
                }
            }
        }

        return null;
    }

    public boolean existeDuplicada(Doacao doacao, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idDoacao
                FROM doacao
                WHERE valor = ?
                  AND observacoes IS NOT DISTINCT FROM ?
                  AND nomeDoador IS NOT DISTINCT FROM ?
                  AND cpfDoador IS NOT DISTINCT FROM ?
                  AND dtDoacao IS NOT DISTINCT FROM ?
                  AND tipo IS NOT DISTINCT FROM ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setDouble(1, doacao.getValor());
            setTextoNulo(ps, 2, doacao.getObservacoes());
            setTextoNulo(ps, 3, doacao.getNomeDoador());
            setTextoNulo(ps, 4, doacao.getCpfDoador());
            ps.setTimestamp(5, doacao.getDtDoacao());
            setTextoNulo(ps, 6, doacao.getTipo());

            try (ResultSet rs = ps.executeQuery())
            {
                return rs.next();
            }
        }
    }

    public boolean existeDuplicadaExcluindoId(Doacao doacao, int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idDoacao
                FROM doacao
                WHERE valor = ?
                  AND observacoes IS NOT DISTINCT FROM ?
                  AND nomeDoador IS NOT DISTINCT FROM ?
                  AND cpfDoador IS NOT DISTINCT FROM ?
                  AND dtDoacao IS NOT DISTINCT FROM ?
                  AND tipo IS NOT DISTINCT FROM ?
                  AND idDoacao <> ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setDouble(1, doacao.getValor());
            setTextoNulo(ps, 2, doacao.getObservacoes());
            setTextoNulo(ps, 3, doacao.getNomeDoador());
            setTextoNulo(ps, 4, doacao.getCpfDoador());
            ps.setTimestamp(5, doacao.getDtDoacao());
            setTextoNulo(ps, 6, doacao.getTipo());
            ps.setInt(7, id);

            try (ResultSet rs = ps.executeQuery())
            {
                return rs.next();
            }
        }
    }

    public List<Doacao> listarOrdenado(String valor, String ordem, String tipo, String dataInicio, String dataFim, Banco conexao) throws SQLException
    {
        if (valor == null || valor.trim().isEmpty())
        {
            valor = "idDoacao";
        }
        if (ordem == null || ordem.trim().isEmpty())
        {
            ordem = "ASC";
        }

        StringBuilder sql = new StringBuilder("SELECT " + COLUNAS_DOACAO + " FROM doacao");
        List<Object> parametros = new ArrayList<>();
        boolean temWhere = false;

        if (tipo != null && !tipo.trim().isEmpty())
        {
            sql.append(" WHERE tipo = ?");
            parametros.add(tipo.trim());
            temWhere = true;
        }

        if (dataInicio != null && !dataInicio.trim().isEmpty() && dataFim != null && !dataFim.trim().isEmpty())
        {
            sql.append(temWhere ? " AND" : " WHERE");
            temWhere = true;
            sql.append(" dtDoacao >= CAST(? AS timestamp) AND dtDoacao <= CAST(? AS timestamp)");
            parametros.add(dataInicio.trim() + " 00:00:00");
            parametros.add(dataFim.trim() + " 23:59:59");
        }
        else if (dataInicio != null && !dataInicio.trim().isEmpty())
        {
            sql.append(temWhere ? " AND" : " WHERE");
            temWhere = true;
            sql.append(" dtDoacao >= CAST(? AS timestamp)");
            parametros.add(dataInicio.trim() + " 00:00:00");
        }
        else if (dataFim != null && !dataFim.trim().isEmpty())
        {
            sql.append(temWhere ? " AND" : " WHERE");
            sql.append(" dtDoacao <= CAST(? AS timestamp)");
            parametros.add(dataFim.trim() + " 23:59:59");
        }

        sql.append(" ORDER BY ").append(colunaOrdenacao(valor)).append(" ").append(direcaoOrdenacao(ordem));
        List<Doacao> doacaoList = new ArrayList<>();

        try (PreparedStatement ps = conexao.preparar(sql.toString()))
        {
            preencherParametros(ps, parametros);
            try (ResultSet rs = ps.executeQuery())
            {
                while (rs.next())
                {
                    doacaoList.add(popularDoacao(rs));
                }
            }
        }

        return doacaoList;
    }

    private Doacao popularDoacao(ResultSet rs) throws SQLException
    {
        Doacao doacao = new Doacao();
        doacao.setIdDoacao(rs.getInt("idDoacao"));
        doacao.setValor(rs.getDouble("valor"));
        doacao.setObservacoes(rs.getString("observacoes"));
        doacao.setNomeDoador(rs.getString("nomeDoador"));
        doacao.setCpfDoador(rs.getString("cpfDoador"));
        doacao.setDtDoacao(rs.getTimestamp("dtDoacao"));
        doacao.setTipo(rs.getString("tipo"));
        doacao.setStatus(rs.getString("status"));
        doacao.setTxid(rs.getString("txid"));
        doacao.setPag_nome(rs.getString("pag_nome"));
        doacao.setPag_email(rs.getString("pag_email"));
        return doacao;
    }

    private void setTextoNulo(PreparedStatement ps, int indice, String valor) throws SQLException
    {
        if (valor == null || valor.trim().isEmpty())
        {
            ps.setString(indice, null);
            return;
        }
        ps.setString(indice, valor.trim());
    }

    private void preencherParametros(PreparedStatement ps, List<Object> parametros) throws SQLException
    {
        for (int i = 0; i < parametros.size(); i++)
        {
            Object parametro = parametros.get(i);
            int indice = i + 1;
            if (parametro instanceof String texto)
            {
                ps.setString(indice, texto);
            }
            else
            {
                ps.setObject(indice, parametro);
            }
        }
    }

    private String colunaOrdenacao(String valor)
    {
        if (valor == null)
        {
            return "idDoacao";
        }
        return switch (valor.toLowerCase())
        {
            case "valor" -> "valor";
            case "observacoes" -> "observacoes";
            case "nomedoador" -> "nomeDoador";
            case "cpfdoador" -> "cpfDoador";
            case "dtdoacao" -> "dtDoacao";
            case "tipo" -> "tipo";
            case "status" -> "status";
            default -> "idDoacao";
        };
    }

    private String direcaoOrdenacao(String ordem)
    {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }
}
