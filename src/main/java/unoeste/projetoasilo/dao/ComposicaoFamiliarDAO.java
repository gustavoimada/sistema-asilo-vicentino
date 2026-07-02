package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.ComposicaoFamiliar;
import unoeste.projetoasilo.entities.ComposicaoFamiliarMorador;
import unoeste.projetoasilo.entities.Morador;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ComposicaoFamiliarDAO {

    public boolean gravar(ComposicaoFamiliar fam, Banco conexao) throws SQLException {
        String sql = "INSERT INTO composicaofamiliar(nome, telefone, cpf) VALUES ('#1', '#2', '#3')";
        sql = sql.replace("#1", fam.getNome().replace("'", "''"));
        sql = sql.replace("#2", fam.getTelefone().replace("'", "''"));
        sql = sql.replace("#3", fam.getCpf().replace("'", "''"));

        if (conexao.manipular(sql)) {
            int novoId = conexao.getMaxPK("composicaofamiliar", "idcomposicaofamiliar");
            if (novoId > 0) {
                fam.setIdComposicaoFamiliar(novoId);
                return true;
            }
        }
        return false;
    }

    public boolean vincular(ComposicaoFamiliarMorador cfm, Banco conexao) throws SQLException {
        String sql = "INSERT INTO composicaofamiliarmorador(Morador_idMorador, ComposicaoFamiliar_idComposicaoFamiliar, vinculo) VALUES (#1, #2, '#3')";
        sql = sql.replace("#1", String.valueOf(cfm.getMorador().getIdMorador()));
        sql = sql.replace("#2", String.valueOf(cfm.getComposicaoFamiliar().getIdComposicaoFamiliar()));
        sql = sql.replace("#3", cfm.getVinculo().replace("'", "''"));

        return conexao.manipular(sql);
    }

    public boolean atualizarVinculo(ComposicaoFamiliarMorador cfm, Banco conexao) {
        String sql = "UPDATE composicaofamiliarmorador SET vinculo = '#3' WHERE morador_idmorador = #1 AND composicaofamiliar_idcomposicaofamiliar = #2";
        sql = sql.replace("#1", String.valueOf(cfm.getMorador().getIdMorador()));
        sql = sql.replace("#2", String.valueOf(cfm.getComposicaoFamiliar().getIdComposicaoFamiliar()));
        sql = sql.replace("#3", cfm.getVinculo().replace("'", "''"));

        return conexao.manipular(sql);
    }

    public boolean desvincular(ComposicaoFamiliarMorador cfm, Banco conexao) {
        String sql = "DELETE FROM composicaofamiliarmorador WHERE morador_idmorador = #1 AND composicaofamiliar_idcomposicaofamiliar = #2";
        sql = sql.replace("#1", String.valueOf(cfm.getMorador().getIdMorador()));
        sql = sql.replace("#2", String.valueOf(cfm.getComposicaoFamiliar().getIdComposicaoFamiliar()));
        return conexao.manipular(sql);
    }

    public int contarVinculos(int familiarId, Banco conexao) throws SQLException {
        String sql = "SELECT COUNT(*) AS total FROM composicaofamiliarmorador WHERE composicaofamiliar_idcomposicaofamiliar = " + familiarId;
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
            return rs.getInt("total");
        return 0;
    }

    public boolean deletar(int id, Banco conexao) {
        return conexao.manipular("DELETE FROM composicaofamiliar WHERE idcomposicaofamiliar = " + id);
    }

    public boolean desvincularTodosPorMorador(int moradorId, Banco conexao) {
        return conexao.manipular("DELETE FROM composicaofamiliarmorador WHERE morador_idmorador = " + moradorId);
    }

    public List<ComposicaoFamiliar> listarTodos(Banco conexao) throws SQLException {
        return listarTodos("nome", null, conexao);
    }

    public List<ComposicaoFamiliar> listarTodos(String ordenacao, Banco conexao) throws SQLException {
        return listarTodos(ordenacao, null, conexao);
    }

    public List<ComposicaoFamiliar> listarTodos(String ordenacao, String direcao, Banco conexao) throws SQLException {
        List<ComposicaoFamiliar> list = new ArrayList<>();
        String sql = "SELECT * FROM composicaofamiliar";
        sql += montarOrdenacaoCadastros(ordenacao, direcao);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null) {
            while (rs.next()) {
                ComposicaoFamiliar f = new ComposicaoFamiliar();
                f.setIdComposicaoFamiliar(rs.getInt("idcomposicaofamiliar"));
                f.setNome(rs.getString("nome"));
                f.setTelefone(rs.getString("telefone"));
                f.setCpf(rs.getString("cpf"));
                list.add(f);
            }
        }
        return list;
    }

    public ComposicaoFamiliar buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = "SELECT * FROM composicaofamiliar WHERE idcomposicaofamiliar = " + id;
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            ComposicaoFamiliar f = new ComposicaoFamiliar();
            f.setIdComposicaoFamiliar(rs.getInt("idcomposicaofamiliar"));
            f.setNome(rs.getString("nome"));
            f.setTelefone(rs.getString("telefone"));
            f.setCpf(rs.getString("cpf"));
            return f;
        } else
            return null;
    }

    public ComposicaoFamiliar buscarPorCpf(String cpf, Banco conexao) throws SQLException {
        if (cpf == null)
            return null;

        String sql = "SELECT * FROM composicaofamiliar WHERE cpf = '" + cpf.replace("'", "''") + "' LIMIT 1";
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            ComposicaoFamiliar f = new ComposicaoFamiliar();
            f.setIdComposicaoFamiliar(rs.getInt("idcomposicaofamiliar"));
            f.setNome(rs.getString("nome"));
            f.setTelefone(rs.getString("telefone"));
            f.setCpf(rs.getString("cpf"));
            return f;
        } else
            return null;
    }

    public ComposicaoFamiliarMorador buscarVinculo(int moradorId, int familiarId, Banco conexao) throws SQLException {
        String sql = "SELECT l.morador_idmorador, l.composicaofamiliar_idcomposicaofamiliar, l.vinculo, cf.nome, cf.telefone, cf.cpf, m.nome AS morador_nome "
                + "FROM composicaofamiliarmorador l "
                + "JOIN composicaofamiliar cf ON cf.idcomposicaofamiliar = l.composicaofamiliar_idcomposicaofamiliar "
                + "JOIN morador m ON m.idmorador = l.morador_idmorador "
                + "WHERE l.morador_idmorador = " + moradorId + " AND l.composicaofamiliar_idcomposicaofamiliar = " + familiarId;
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            ComposicaoFamiliarMorador v = new ComposicaoFamiliarMorador();

            Morador m = new Morador();
            m.setIdMorador(rs.getInt("morador_idmorador"));
            m.setNome(rs.getString("morador_nome"));
            v.setMorador(m);

            ComposicaoFamiliar cf = new ComposicaoFamiliar();
            cf.setIdComposicaoFamiliar(rs.getInt("composicaofamiliar_idcomposicaofamiliar"));
            cf.setNome(rs.getString("nome"));
            cf.setTelefone(rs.getString("telefone"));
            cf.setCpf(rs.getString("cpf"));
            v.setComposicaoFamiliar(cf);

            v.setVinculo(rs.getString("vinculo"));
            return v;
        }

        return null;
    }

    public List<ComposicaoFamiliarMorador> listarPorMorador(int moradorId, Banco conexao) throws SQLException {
        List<ComposicaoFamiliarMorador> list = new ArrayList<>();
        String sql = "SELECT l.morador_idmorador, l.composicaofamiliar_idcomposicaofamiliar, l.vinculo, cf.nome, cf.telefone, cf.cpf, m.nome AS morador_nome "
                + "FROM composicaofamiliarmorador l "
                + "JOIN composicaofamiliar cf ON cf.idcomposicaofamiliar = l.composicaofamiliar_idcomposicaofamiliar "
                + "JOIN morador m ON m.idmorador = l.morador_idmorador "
                + "WHERE l.morador_idmorador = " + moradorId + " ORDER BY cf.nome";
        ResultSet rs = conexao.consultar(sql);
        if (rs != null) {
            while (rs.next()) {
                ComposicaoFamiliarMorador v = new ComposicaoFamiliarMorador();

                Morador m = new Morador();
                m.setIdMorador(rs.getInt("morador_idmorador"));
                m.setNome(rs.getString("morador_nome"));
                v.setMorador(m);

                ComposicaoFamiliar cf = new ComposicaoFamiliar();
                cf.setIdComposicaoFamiliar(rs.getInt("composicaofamiliar_idcomposicaofamiliar"));
                cf.setNome(rs.getString("nome"));
                cf.setTelefone(rs.getString("telefone"));
                cf.setCpf(rs.getString("cpf"));
                v.setComposicaoFamiliar(cf);

                v.setVinculo(rs.getString("vinculo"));
                list.add(v);
            }
        }
        return list;
    }

    public List<ComposicaoFamiliarMorador> listarTodosVinculos(Banco conexao) throws SQLException {
        return listarTodosVinculos("morador", null, conexao);
    }

    public List<ComposicaoFamiliarMorador> listarTodosVinculos(String ordenacao, Banco conexao) throws SQLException {
        return listarTodosVinculos(ordenacao, null, conexao);
    }

    public List<ComposicaoFamiliarMorador> listarTodosVinculos(String ordenacao, String direcao, Banco conexao) throws SQLException {
        List<ComposicaoFamiliarMorador> list = new ArrayList<>();
        String sql = "SELECT l.morador_idmorador, l.composicaofamiliar_idcomposicaofamiliar, l.vinculo, cf.nome, cf.telefone, cf.cpf, m.nome AS morador_nome "
                + "FROM composicaofamiliarmorador l "
                + "JOIN composicaofamiliar cf ON cf.idcomposicaofamiliar = l.composicaofamiliar_idcomposicaofamiliar "
                + "JOIN morador m ON m.idmorador = l.morador_idmorador ";
        sql += montarOrdenacaoVinculos(ordenacao, direcao);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null) {
            while (rs.next()) {
                ComposicaoFamiliarMorador v = new ComposicaoFamiliarMorador();

                Morador m = new Morador();
                m.setIdMorador(rs.getInt("morador_idmorador"));
                m.setNome(rs.getString("morador_nome"));
                v.setMorador(m);

                ComposicaoFamiliar cf = new ComposicaoFamiliar();
                cf.setIdComposicaoFamiliar(rs.getInt("composicaofamiliar_idcomposicaofamiliar"));
                cf.setNome(rs.getString("nome"));
                cf.setTelefone(rs.getString("telefone"));
                cf.setCpf(rs.getString("cpf"));
                v.setComposicaoFamiliar(cf);

                v.setVinculo(rs.getString("vinculo"));
                list.add(v);
            }
        }
        return list;
    }

    private String montarOrdenacaoCadastros(String ordenacao, String direcao) {
        String direcaoFinal = "ASC";

        if (direcao != null && direcao.equalsIgnoreCase("desc"))
            direcaoFinal = "DESC";

        if (ordenacao != null && ordenacao.equalsIgnoreCase("id"))
            return " ORDER BY idcomposicaofamiliar " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("cpf"))
            return " ORDER BY cpf " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("telefone"))
            return " ORDER BY telefone " + direcaoFinal;
        else
            return " ORDER BY nome " + direcaoFinal;
    }

    private String montarOrdenacaoVinculos(String ordenacao, String direcao) {
        String direcaoFinal = "ASC";

        if (direcao != null && direcao.equalsIgnoreCase("desc"))
            direcaoFinal = "DESC";

        if (ordenacao != null && ordenacao.equalsIgnoreCase("familiar"))
            return " ORDER BY cf.nome " + direcaoFinal + ", m.nome " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("vinculo"))
            return " ORDER BY l.vinculo " + direcaoFinal + ", m.nome " + direcaoFinal + ", cf.nome " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("telefone"))
            return " ORDER BY cf.telefone " + direcaoFinal + ", cf.nome " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("cpf"))
            return " ORDER BY cf.cpf " + direcaoFinal + ", cf.nome " + direcaoFinal;
        else
            return " ORDER BY m.nome " + direcaoFinal + ", cf.nome " + direcaoFinal;
    }
}
