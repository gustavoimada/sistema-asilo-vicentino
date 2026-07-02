package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Doacao;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

public class DoacaoDAO
{
    public boolean gravar(Doacao doacao, Banco conexao) throws SQLException
    {
        String sql = String.format(
                "INSERT INTO doacao (valor, observacoes, nomeDoador, cpfDoador, dtDoacao, tipo, status, txid, pag_nome, pag_email) VALUES (%s, %s, %s, %s, %s, %s, 'Em_Analise', NULL, NULL, %s);",
                String.valueOf(doacao.getValor()),
                textoSqlNulo(doacao.getObservacoes()),
                textoSqlNulo(doacao.getNomeDoador()),
                textoSqlNulo(doacao.getCpfDoador()),
                dataSqlNula(doacao.getDtDoacao()),
                textoSqlNulo(doacao.getTipo()),
                textoSqlNulo(doacao.getPag_email())
        );

        if (!conexao.manipular(sql))
        {
            return false;
        }

        int novoId = conexao.getMaxPK("doacao", "idDoacao");
        if (novoId > 0)
        {
            doacao.setIdDoacao(novoId);
        }
        return true;
    }

    public boolean editar(Doacao doacao, Banco conexao) throws SQLException
    {
        String sql = String.format(
                "UPDATE doacao SET valor = %s, observacoes = %s, nomeDoador = %s, cpfDoador = %s, dtDoacao = %s, tipo = %s, txid = NULL, pag_nome = NULL, pag_email = NULL WHERE idDoacao = %d;",
                String.valueOf(doacao.getValor()),
                textoSqlNulo(doacao.getObservacoes()),
                textoSqlNulo(doacao.getNomeDoador()),
                textoSqlNulo(doacao.getCpfDoador()),
                dataSqlNula(doacao.getDtDoacao()),
                textoSqlNulo(doacao.getTipo()),
                doacao.getIdDoacao()
        );
        return conexao.manipular(sql);
    }

    public boolean atualizarStatus(int id, String status, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE doacao
                SET status = '#1', txid = NULL, pag_nome = NULL, pag_email = NULL
                WHERE idDoacao = #2
                """;
        sql = sql.replace("#1", escaparSql(status));
        sql = sql.replace("#2", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM doacao WHERE idDoacao = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public List<Doacao> listar(Banco conexao) throws SQLException
    {
        String sql = "SELECT idDoacao, valor, observacoes, nomeDoador, cpfDoador, dtDoacao, tipo, status, txid, pag_nome, pag_email FROM doacao ORDER BY idDoacao";
        List<Doacao> doacoes = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
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
        String sql = "SELECT idDoacao, valor, observacoes, nomeDoador, cpfDoador, dtDoacao, tipo, status, txid, pag_nome, pag_email FROM doacao WHERE idDoacao = #1";
        sql = sql.replace("#1", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularDoacao(rs);
        }

        return null;
    }

    public boolean existeDuplicada(Doacao doacao, Banco conexao) throws SQLException
    {
        String sql = String.format(
                "SELECT idDoacao FROM doacao WHERE valor = %s AND observacoes %s AND nomeDoador %s AND cpfDoador %s AND dtDoacao %s AND tipo %s",
                String.valueOf(doacao.getValor()),
                condicaoSqlNula(doacao.getObservacoes()),
                condicaoSqlNula(doacao.getNomeDoador()),
                condicaoSqlNula(doacao.getCpfDoador()),
                condicaoDataSqlNula(doacao.getDtDoacao()),
                condicaoSqlNula(doacao.getTipo())
        );

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public boolean existeDuplicadaExcluindoId(Doacao doacao, int id, Banco conexao) throws SQLException
    {
        String sql = String.format(
                "SELECT idDoacao FROM doacao WHERE valor = %s AND observacoes %s AND nomeDoador %s AND cpfDoador %s AND dtDoacao %s AND tipo %s AND idDoacao <> %d",
                String.valueOf(doacao.getValor()),
                condicaoSqlNula(doacao.getObservacoes()),
                condicaoSqlNula(doacao.getNomeDoador()),
                condicaoSqlNula(doacao.getCpfDoador()),
                condicaoDataSqlNula(doacao.getDtDoacao()),
                condicaoSqlNula(doacao.getTipo()),
                id
        );

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
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

        String sql = "SELECT idDoacao, valor, observacoes, nomeDoador, cpfDoador, dtDoacao, tipo, status, txid, pag_nome, pag_email FROM doacao";
        boolean temWhere = false;

        if (tipo != null && !tipo.trim().isEmpty())
        {
            sql += " WHERE tipo = '" + escaparSql(tipo) + "'";
            temWhere = true;
        }

        if (dataInicio != null && !dataInicio.trim().isEmpty() && dataFim != null && !dataFim.trim().isEmpty())
        {
            sql += temWhere ? " AND" : " WHERE";
            temWhere = true;
            sql += " dtDoacao >= '" + escaparSql(dataInicio) + " 00:00:00' AND dtDoacao <= '" + escaparSql(dataFim) + " 23:59:59'";
        }
        else if (dataInicio != null && !dataInicio.trim().isEmpty())
        {
            sql += temWhere ? " AND" : " WHERE";
            temWhere = true;
            sql += " dtDoacao >= '" + escaparSql(dataInicio) + " 00:00:00'";
        }
        else if (dataFim != null && !dataFim.trim().isEmpty())
        {
            sql += temWhere ? " AND" : " WHERE";
            sql += " dtDoacao <= '" + escaparSql(dataFim) + " 23:59:59'";
        }

        sql += " ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<Doacao> doacaoList = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                doacaoList.add(popularDoacao(rs));
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

    private String textoSqlNulo(String valor)
    {
        if (valor == null || valor.trim().isEmpty())
        {
            return "NULL";
        }
        return "'" + escaparSql(valor) + "'";
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

    private String dataSqlNula(Timestamp data)
    {
        if (data == null)
        {
            return "NULL";
        }

        return "'" + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(data) + "'";
    }

    private String condicaoSqlNula(String valor)
    {
        if (valor == null || valor.trim().isEmpty())
        {
            return "IS NULL";
        }
        return "= '" + escaparSql(valor) + "'";
    }

    private String condicaoDataSqlNula(Timestamp data)
    {
        if (data == null)
        {
            return "IS NULL";
        }
        return "= '" + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(data) + "'";
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
