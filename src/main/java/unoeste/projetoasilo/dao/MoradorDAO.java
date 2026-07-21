package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Quarto;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.sql.Connection;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MoradorDAO {

    private static final String SQL_SELECT_COMPLETO = """
            SELECT m.*, q.idquartos AS quarto_id, q.ala AS quarto_ala, q.idquartos AS quarto_numero
            FROM morador m
            LEFT JOIN quartos q ON q.idquartos = m.quartos_idquartos
            """;

    public boolean gravar(Morador morador, Banco conexao) throws SQLException {
        String sql = """
                INSERT INTO morador(
                    cpf, nome, genero, endereco, numero, dtnasc, cidade, estado, cep, quartos_idquartos)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (PreparedStatement ps = conexao.prepararComChaves(sql)) {
            preencherCamposMorador(ps, morador, false);

            if (ps.executeUpdate() > 0) {
                try (ResultSet chaves = ps.getGeneratedKeys()) {
                    if (chaves.next()) {
                        morador.setIdMorador(chaves.getInt(1));
                    }
                }
                return true;
            }
        }

        return false;
    }

    public List<Morador> listar(Banco conexao) throws SQLException {
        return listar(null, null, conexao);
    }

    public List<Morador> listarAtivos(Banco conexao) throws SQLException {
        return listarPorSql(SQL_SELECT_COMPLETO + " WHERE m.ativo = TRUE ORDER BY m.nome ASC", List.of(), conexao);
    }

    public List<Morador> listarInativos(Banco conexao) throws SQLException {
        return listarPorSql(SQL_SELECT_COMPLETO + " WHERE m.ativo = FALSE ORDER BY m.nome ASC", List.of(), conexao);
    }

    public List<Morador> listar(String ordenacao, Banco conexao) throws SQLException {
        return listar(ordenacao, null, conexao);
    }

    public List<Morador> listar(String ordenacao, String direcao, Banco conexao) throws SQLException {
        String sql = SQL_SELECT_COMPLETO + montarClausulaOrdenacao(ordenacao, direcao);
        return listarPorSql(sql, List.of(), conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimento, String endereco, String cidade, String estado, String ordenacao, Banco conexao) throws SQLException {
        return filtrar(nome, cpf, dtNascimento, dtNascimento, endereco, cidade, estado, ordenacao, null, conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimento, String endereco, String cidade, String estado, String ordenacao, String direcao, Banco conexao) throws SQLException {
        return filtrar(nome, cpf, dtNascimento, dtNascimento, endereco, cidade, estado, ordenacao, direcao, conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimentoInicio, LocalDate dtNascimentoFim, String endereco, String cidade, String estado, String ordenacao, String direcao, Banco conexao) throws SQLException {
        return filtrar(nome, cpf, dtNascimentoInicio, dtNascimentoFim, endereco, cidade, estado, null, ordenacao, direcao, conexao);
    }

    public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimentoInicio, LocalDate dtNascimentoFim, String endereco, String cidade, String estado, Boolean ativo, String ordenacao, String direcao, Banco conexao) throws SQLException {
        StringBuilder sql = new StringBuilder(SQL_SELECT_COMPLETO);
        sql.append(" WHERE 1=1");

        List<Object> params = new ArrayList<>();

        if (nome != null && !nome.isBlank()) {
            sql.append(" AND LOWER(m.nome) LIKE ?");
            params.add("%" + nome.toLowerCase() + "%");
        }

        if (cpf != null && !cpf.isBlank()) {
            sql.append(" AND m.cpf LIKE ?");
            params.add("%" + cpf + "%");
        }

        if (dtNascimentoInicio != null) {
            sql.append(" AND m.dtnasc::date >= ?");
            params.add(Date.valueOf(dtNascimentoInicio));
        }

        if (dtNascimentoFim != null) {
            sql.append(" AND m.dtnasc::date <= ?");
            params.add(Date.valueOf(dtNascimentoFim));
        }

        if (endereco != null && !endereco.isBlank()) {
            sql.append(" AND LOWER(m.endereco) LIKE ?");
            params.add("%" + endereco.toLowerCase() + "%");
        }

        if (cidade != null && !cidade.isBlank()) {
            sql.append(" AND LOWER(m.cidade) LIKE ?");
            params.add("%" + cidade.toLowerCase() + "%");
        }

        if (estado != null && !estado.isBlank()) {
            sql.append(" AND m.estado = ?");
            params.add(estado);
        }

        if (ativo != null) {
            sql.append(" AND m.ativo = ?");
            params.add(ativo);
        }

        sql.append(montarClausulaOrdenacao(ordenacao, direcao));

        return listarPorSql(sql.toString(), params, conexao);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM morador WHERE idmorador = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean alterarAtivo(int id, boolean ativo, Banco conexao) throws SQLException {
        if (ativo) {
            try (PreparedStatement ps = conexao.preparar("UPDATE morador SET ativo = TRUE WHERE idmorador = ?")) {
                ps.setInt(1, id);
                return ps.executeUpdate() > 0;
            }
        }

        Connection conexaoJdbc = conexao.conexaoJdbc();
        boolean autoCommitOriginal = conexaoJdbc.getAutoCommit();
        try {
            conexaoJdbc.setAutoCommit(false);
            Integer quartoId = buscarQuartoAtual(conexaoJdbc, id);

            boolean desligou;
            try (PreparedStatement ps = conexaoJdbc.prepareStatement(
                    "UPDATE morador SET ativo = FALSE, quartos_idquartos = NULL WHERE idmorador = ? AND ativo = TRUE")) {
                ps.setInt(1, id);
                desligou = ps.executeUpdate() > 0;
            }

            if (!desligou) {
                conexaoJdbc.rollback();
                return false;
            }
            if (quartoId != null && !new QuartoDAO().liberarVaga(quartoId, conexao)) {
                throw new SQLException("Nao foi possivel liberar a vaga do quarto do morador");
            }

            conexaoJdbc.commit();
            return true;
        } catch (SQLException e) {
            conexaoJdbc.rollback();
            throw e;
        } finally {
            conexaoJdbc.setAutoCommit(autoCommitOriginal);
        }
    }

    private Integer buscarQuartoAtual(Connection conexao, int idMorador) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT quartos_idquartos FROM morador WHERE idmorador = ? FOR UPDATE")) {
            ps.setInt(1, idMorador);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Object valor = rs.getObject("quartos_idquartos");
                return valor == null ? null : ((Number) valor).intValue();
            }
        }
    }

    public boolean deletarComDependencias(int id, Banco banco) throws SQLException {
        Connection conexao = banco.conexaoJdbc();
        boolean autoCommitOriginal = conexao.getAutoCommit();

        try {
            conexao.setAutoCommit(false);

            Integer quartoId = buscarQuartoAtual(conexao, id);

            executarExclusao(conexao, """
                    DELETE FROM registrarusomedicacao
                    WHERE prescricaodose_idprescricaodose IN (
                        SELECT pd.idprescricaodose
                        FROM prescricaodose pd
                        JOIN prescricao p ON p.idprescricao = pd.prescricao_idprescricao
                        WHERE p.morador_idmorador = ?
                    )
                    """, id);
            executarExclusao(conexao, """
                    DELETE FROM prescricaodose
                    WHERE prescricao_idprescricao IN (
                        SELECT idprescricao FROM prescricao WHERE morador_idmorador = ?
                    )
                    """, id);
            executarExclusao(conexao, "DELETE FROM prescricao WHERE morador_idmorador = ?", id);
            executarExclusao(conexao, """
                    DELETE FROM evolucao_nutricional
                    WHERE prontuario_id IN (
                        SELECT id FROM prontuario_nutricional WHERE morador_id = ?
                    )
                    """, id);
            executarExclusao(conexao, "DELETE FROM prontuario_nutricional WHERE morador_id = ?", id);
            executarExclusao(conexao, "DELETE FROM atividadesmorador WHERE morador_idmorador = ?", id);
            executarExclusao(conexao, "DELETE FROM moradorocorrencia WHERE morador_idmorador = ?", id);
            executarExclusao(conexao, "DELETE FROM composicaofamiliarmorador WHERE morador_idmorador = ?", id);

            if (quartoId != null && !new QuartoDAO().liberarVaga(quartoId, banco)) {
                throw new SQLException("Nao foi possivel liberar a vaga do quarto do morador");
            }

            boolean excluiu;
            try (PreparedStatement ps = conexao.prepareStatement("DELETE FROM morador WHERE idmorador = ?")) {
                ps.setInt(1, id);
                excluiu = ps.executeUpdate() > 0;
            }

            if (!excluiu) {
                conexao.rollback();
                return false;
            }

            conexao.commit();
            return true;
        } catch (SQLException e) {
            conexao.rollback();
            throw e;
        } finally {
            conexao.setAutoCommit(autoCommitOriginal);
        }
    }

    private void executarExclusao(Connection conexao, String sql, int idMorador) throws SQLException {
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            ps.setInt(1, idMorador);
            ps.executeUpdate();
        }
    }

    public boolean atualizarAntropometria(int id, BigDecimal pesoKg, BigDecimal alturaCm, Banco conexao) throws SQLException {
        String sql = "UPDATE morador SET peso_atual_kg = ?, altura_atual_cm = ?, dados_antropometricos_atualizados_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE idmorador = ? AND ativo = TRUE";
        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setBigDecimal(1, pesoKg);
            ps.setBigDecimal(2, alturaCm);
            ps.setInt(3, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean editar(Morador morador, Banco conexao) throws SQLException {
        String sql = """
                UPDATE morador
                SET cpf = ?, nome = ?, genero = ?, endereco = ?, numero = ?, dtnasc = ?, cidade = ?, estado = ?, cep = ?, quartos_idquartos = ?
                WHERE idmorador = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            preencherCamposMorador(ps, morador, true);
            return ps.executeUpdate() > 0;
        }
    }

    public Morador buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = SQL_SELECT_COMPLETO + " WHERE m.idmorador = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return montarMorador(rs);
                }
            }
        }

        return null;
    }

    public Morador buscarPorCpf(String cpf, Banco conexao) throws SQLException {
        if (cpf == null) {
            return null;
        }

        String sql = SQL_SELECT_COMPLETO + " WHERE m.cpf = ? LIMIT 1";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setString(1, cpf);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return montarMorador(rs);
                }
            }
        }

        return null;
    }

    private void preencherCamposMorador(PreparedStatement ps, Morador morador, boolean incluirId) throws SQLException {
        ps.setString(1, morador.getCpf());
        ps.setString(2, morador.getNome());
        ps.setString(3, morador.getGenero());
        ps.setString(4, morador.getEndereco());
        ps.setInt(5, morador.getNumero());
        ps.setDate(6, Date.valueOf(morador.getDtNascimento()));
        ps.setString(7, morador.getCidade());
        ps.setString(8, morador.getEstado());
        ps.setString(9, morador.getCep());

        if (morador.getQuartoId() == null) {
            ps.setNull(10, Types.INTEGER);
        } else {
            ps.setInt(10, morador.getQuartoId());
        }

        if (incluirId) {
            ps.setInt(11, morador.getIdMorador());
        }
    }

    private List<Morador> listarPorSql(String sql, List<Object> params, Banco conexao) throws SQLException {
        List<Morador> moradores = new ArrayList<>();

        try (PreparedStatement ps = conexao.preparar(sql)) {
            aplicarParametros(ps, params);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    moradores.add(montarMorador(rs));
                }
            }
        }

        return moradores;
    }

    private void aplicarParametros(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object valor = params.get(i);
            if (valor instanceof Date data) {
                ps.setDate(i + 1, data);
            } else {
                ps.setObject(i + 1, valor);
            }
        }
    }

    private Morador montarMorador(ResultSet rs) throws SQLException {
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
        morador.setAtivo(rs.getBoolean("ativo"));
        morador.setPesoAtualKg(rs.getBigDecimal("peso_atual_kg"));
        morador.setAlturaAtualCm(rs.getBigDecimal("altura_atual_cm"));
        if (rs.getTimestamp("dados_antropometricos_atualizados_em") != null) {
            morador.setDadosAntropometricosAtualizadosEm(rs.getTimestamp("dados_antropometricos_atualizados_em").toLocalDateTime());
        }
        if (rs.getTimestamp("atualizado_em") != null) {
            morador.setAtualizadoEm(rs.getTimestamp("atualizado_em").toLocalDateTime());
        }

        int quartoId = rs.getInt("quartos_idquartos");
        if (!rs.wasNull()) {
            morador.setQuartoId(quartoId);
            preencherQuarto(morador, rs);
        }

        return morador;
    }

    private String montarClausulaOrdenacao(String ordenacao, String direcao) {
        String campoOrdenacao;
        String direcaoOrdenacao = "ASC";

        if (direcao != null && direcao.equalsIgnoreCase("desc")) {
            direcaoOrdenacao = "DESC";
        }

        if (ordenacao != null && ordenacao.equalsIgnoreCase("id")) {
            campoOrdenacao = "idmorador";
        } else if (ordenacao != null && ordenacao.equalsIgnoreCase("nome")) {
            campoOrdenacao = "nome";
        } else if (ordenacao != null && ordenacao.equalsIgnoreCase("cpf")) {
            campoOrdenacao = "cpf";
        } else if (ordenacao != null && ordenacao.equalsIgnoreCase("dtNascimento")) {
            campoOrdenacao = "dtnasc";
        } else if (ordenacao != null && ordenacao.equalsIgnoreCase("endereco")) {
            campoOrdenacao = "endereco";
        } else if (ordenacao != null && ordenacao.equalsIgnoreCase("cidade")) {
            campoOrdenacao = "cidade";
        } else {
            campoOrdenacao = "idmorador";
        }

        if (campoOrdenacao.equals("cidade")) {
            return " ORDER BY m.cidade " + direcaoOrdenacao + ", m.estado " + direcaoOrdenacao;
        }

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
