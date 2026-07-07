package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Quarto;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MoradorDAO {

    public boolean gravar(Morador morador, Banco conexao) throws SQLException {
        boolean gravou = false;
        String sql = """
                INSERT INTO morador(
                    cpf, nome, genero, endereco, numero, dtnasc, cidade, estado, cep, telefone, quartos_idquartos)
                    VALUES ('#1', '#2', '#3', '#4', #5, '#6', '#7', '#8', '#9', '#10', #11);
                """;
        sql = sql.replace("#11", String.valueOf(morador.getQuartoId()));
        sql = sql.replace("#10", morador.getTelefone().replace("'", "''"));
        sql = sql.replace("#9", morador.getCep().replace("'", "''"));
        sql = sql.replace("#8", morador.getEstado().replace("'", "''"));
        sql = sql.replace("#7", morador.getCidade().replace("'", "''"));
        sql = sql.replace("#6", morador.getDtNascimento().toString());
        sql = sql.replace("#5", String.valueOf(morador.getNumero()));
        sql = sql.replace("#4", morador.getEndereco().replace("'", "''"));
        sql = sql.replace("#3", morador.getGenero().replace("'", "''"));
        sql = sql.replace("#2", morador.getNome().replace("'", "''"));
        sql = sql.replace("#1", morador.getCpf().replace("'", "''"));

        if (conexao.manipular(sql)) {
            int novoId = conexao.getMaxPK("morador", "idmorador");
            if (novoId > 0) {
                morador.setIdMorador(novoId);
                gravou = true;
            }
        }
        return gravou;
    }

    public List<Morador> listar(Banco conexao) throws SQLException {
        return listar(null, null, conexao);
    }

    public List<Morador> listar(String ordenacao, Banco conexao) throws SQLException {
        return listar(ordenacao, null, conexao);
    }

    public List<Morador> listar(String ordenacao, String direcao, Banco conexao) throws SQLException {
        String sql = """
                SELECT m.*, q.idquartos AS quarto_id, q.ala AS quarto_ala, q.idquartos AS quarto_numero
                FROM morador m
                LEFT JOIN quartos q ON q.idquartos = m.quartos_idquartos
                """;
        sql += montarClausulaOrdenacao(ordenacao, direcao);

        return listarPorSql(sql, conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimento, String endereco, String cidade, String estado, String telefone, String ordenacao, Banco conexao) throws SQLException {
        return filtrar(nome, cpf, dtNascimento, endereco, cidade, estado, telefone, ordenacao, null, conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimento, String endereco, String cidade, String estado, String telefone, String ordenacao, String direcao, Banco conexao) throws SQLException {
        return filtrar(nome, cpf, dtNascimento, dtNascimento, endereco, cidade, estado, telefone, ordenacao, direcao, conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimentoInicio, LocalDate dtNascimentoFim, String endereco, String cidade, String estado, String telefone, String ordenacao, String direcao, Banco conexao) throws SQLException {
        String sql = """
                SELECT m.*, q.idquartos AS quarto_id, q.ala AS quarto_ala, q.idquartos AS quarto_numero
                FROM morador m
                LEFT JOIN quartos q ON q.idquartos = m.quartos_idquartos
                WHERE 1=1
                """;

        if (nome != null && !nome.isBlank()) {
            sql += " AND LOWER(nome) LIKE '%" + nome.toLowerCase() + "%'";
        }

        if (cpf != null && !cpf.isBlank()) {
            sql += " AND cpf LIKE '%" + cpf + "%'";
        }

        if (dtNascimentoInicio != null) {
            sql += " AND dtnasc::date >= '" + dtNascimentoInicio + "'";
        }

        if (dtNascimentoFim != null) {
            sql += " AND dtnasc::date <= '" + dtNascimentoFim + "'";
        }

        if (endereco != null && !endereco.isBlank()) {
            sql += " AND LOWER(endereco) LIKE '%" + endereco.toLowerCase() + "%'";
        }

        if (cidade != null && !cidade.isBlank()) {
            sql += " AND LOWER(cidade) LIKE '%" + cidade.toLowerCase() + "%'";
        }

        if (estado != null && !estado.isBlank()) {
            sql += " AND estado = '" + estado + "'";
        }

        if (telefone != null && !telefone.isBlank()) {
            sql += " AND telefone LIKE '%" + telefone + "%'";
        }

        sql += montarClausulaOrdenacao(ordenacao, direcao);

        return listarPorSql(sql, conexao);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        return conexao.manipular("DELETE FROM morador WHERE idmorador = " + id);
    }

    public boolean editar(Morador morador, Banco conexao) throws SQLException {
        String sql = """
                UPDATE morador
                SET cpf = '#1', nome = '#2', genero = '#3', endereco = '#4', numero = #5, dtnasc = '#6', cidade = '#7', estado = '#8', cep = '#9', telefone = '#10', quartos_idquartos = #11
                WHERE idmorador = #12
                """;
        sql = sql.replace("#12", String.valueOf(morador.getIdMorador()));
        sql = sql.replace("#11", String.valueOf(morador.getQuartoId()));
        sql = sql.replace("#10", morador.getTelefone().replace("'", "''"));
        sql = sql.replace("#9", morador.getCep().replace("'", "''"));
        sql = sql.replace("#8", morador.getEstado().replace("'", "''"));
        sql = sql.replace("#7", morador.getCidade().replace("'", "''"));
        sql = sql.replace("#6", morador.getDtNascimento().toString());
        sql = sql.replace("#5", String.valueOf(morador.getNumero()));
        sql = sql.replace("#4", morador.getEndereco().replace("'", "''"));
        sql = sql.replace("#3", morador.getGenero().replace("'", "''"));
        sql = sql.replace("#2", morador.getNome().replace("'", "''"));
        sql = sql.replace("#1", morador.getCpf().replace("'", "''"));

        return conexao.manipular(sql);
    }

    public Morador buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = """
                SELECT m.*, q.idquartos AS quarto_id, q.ala AS quarto_ala, q.idquartos AS quarto_numero
                FROM morador m
                LEFT JOIN quartos q ON q.idquartos = m.quartos_idquartos
                WHERE m.idmorador =
                """ + id;
        ResultSet rs = conexao.consultar(sql);
        Morador morador = null;

        if (rs != null && rs.next()) {
            morador = new Morador();
            morador.setIdMorador(rs.getInt("idmorador"));
            morador.setCpf(rs.getString("cpf"));
            morador.setNome(rs.getString("nome"));
            morador.setGenero(rs.getString("genero"));
            morador.setEndereco(rs.getString("endereco"));
            morador.setNumero(rs.getInt("numero"));
            morador.setDtNascimento(rs.getDate("dtnasc").toLocalDate());
            morador.setCidade(rs.getString("cidade"));
            morador.setEstado(rs.getString("estado"));
            morador.setCep(rs.getString("cep"));
            morador.setTelefone(rs.getString("telefone"));

            int quartoId = rs.getInt("quartos_idquartos");
            if (!rs.wasNull()) {
                morador.setQuartoId(quartoId);
                preencherQuarto(morador, rs);
            }
        }


        return morador;
    }

    public Morador buscarPorCpf(String cpf, Banco conexao) throws SQLException {
        if (cpf == null)
            return null;

        String sql = """
                SELECT m.*, q.idquartos AS quarto_id, q.ala AS quarto_ala, q.idquartos AS quarto_numero
                FROM morador m
                LEFT JOIN quartos q ON q.idquartos = m.quartos_idquartos
                WHERE m.cpf =
                """ + " '" + cpf.replace("'", "''") + "' LIMIT 1";

        ResultSet rs = conexao.consultar(sql);
        Morador morador = null;

        if (rs != null && rs.next()) {
            morador = new Morador();
            morador.setIdMorador(rs.getInt("idmorador"));
            morador.setCpf(rs.getString("cpf"));
            morador.setNome(rs.getString("nome"));
            morador.setGenero(rs.getString("genero"));
            morador.setEndereco(rs.getString("endereco"));
            morador.setNumero(rs.getInt("numero"));
            morador.setDtNascimento(rs.getDate("dtnasc").toLocalDate());
            morador.setCidade(rs.getString("cidade"));
            morador.setEstado(rs.getString("estado"));
            morador.setCep(rs.getString("cep"));
            morador.setTelefone(rs.getString("telefone"));

            int quartoId = rs.getInt("quartos_idquartos");
            if (!rs.wasNull()) {
                morador.setQuartoId(quartoId);
                preencherQuarto(morador, rs);
            }
        }

        return morador;
    }

    private List<Morador> listarPorSql(String sql, Banco conexao) throws SQLException {
        List<Morador> moradores = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {

            while (rs.next()) {
                Morador morador = new Morador();
                morador.setIdMorador(rs.getInt("idmorador"));
                morador.setCpf(rs.getString("cpf"));
                morador.setNome(rs.getString("nome"));
                morador.setGenero(rs.getString("genero"));
                morador.setEndereco(rs.getString("endereco"));
                morador.setNumero(rs.getInt("numero"));
                morador.setDtNascimento(rs.getDate("dtnasc").toLocalDate());
                morador.setCidade(rs.getString("cidade"));
                morador.setEstado(rs.getString("estado"));
                morador.setCep(rs.getString("cep"));
                morador.setTelefone(rs.getString("telefone"));

                int quartoId = rs.getInt("quartos_idquartos");
                if (!rs.wasNull()) {
                    morador.setQuartoId(quartoId);
                    preencherQuarto(morador, rs);
                }

                moradores.add(morador);
            }

        }
        return moradores;
    }

    private String montarClausulaOrdenacao(String ordenacao, String direcao) {
        String campoOrdenacao;
        String direcaoOrdenacao = "ASC";

        if (direcao != null && direcao.equalsIgnoreCase("desc"))
            direcaoOrdenacao = "DESC";

        if (ordenacao != null && ordenacao.equalsIgnoreCase("id"))
            campoOrdenacao = "idmorador";
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("nome"))
            campoOrdenacao = "nome";
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("cpf"))
            campoOrdenacao = "cpf";
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("dtNascimento"))
            campoOrdenacao = "dtnasc";
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("endereco"))
            campoOrdenacao = "endereco";
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("cidade"))
            campoOrdenacao = "cidade";
        else
            campoOrdenacao = "idmorador";

        if (campoOrdenacao.equals("cidade"))
            return " ORDER BY m.cidade " + direcaoOrdenacao + ", m.estado " + direcaoOrdenacao;
        else
            return " ORDER BY m." + campoOrdenacao + " " + direcaoOrdenacao;
    }

    private void preencherQuarto(Morador morador, ResultSet rs) throws SQLException {
        Quarto quarto = new Quarto();
        quarto.setIdQuartos(rs.getInt("quarto_id"));
        quarto.setAla(rs.getString("quarto_ala"));
        quarto.setNumero(rs.getInt("quarto_numero"));
        morador.setQuarto(quarto);
    }
}
