package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Quarto;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class QuartoDAO {
    private static final String DISPONIVEL = "S";
    private static final String INDISPONIVEL = "N";
    private static final int CAPACIDADE_MAXIMA_POR_QUARTO = Quarto.CAPACIDADE_MAXIMA_POR_QUARTO;

    private static final String SQL_BASE_SELECT = """
            SELECT idquartos, ala, capacidademax, qntdhospedes, disponibilidade
            FROM quartos
            """;

    public boolean gravar(Quarto quarto, Banco conexao) throws SQLException {
        String sql = """
                INSERT INTO quartos (idquartos, ala, capacidademax, qntdhospedes, disponibilidade)
                VALUES (?, ?, ?, ?, ?)
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, quarto.getIdQuartos());
            ps.setString(2, quarto.getAla());
            ps.setInt(3, quarto.getCapacidademax());
            ps.setInt(4, quarto.getQtndHospedes());
            ps.setString(5, quarto.getDisponibilidade());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean editar(Quarto quarto, Banco conexao) throws SQLException {
        return editar(quarto, quarto.getIdQuartos(), conexao);
    }

    public boolean editar(Quarto quarto, int idOriginal, Banco conexao) throws SQLException {
        String sql = """
                UPDATE quartos
                SET idquartos = ?, ala = ?, capacidademax = ?, qntdhospedes = ?, disponibilidade = ?
                WHERE idquartos = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, quarto.getIdQuartos());
            ps.setString(2, quarto.getAla());
            ps.setInt(3, quarto.getCapacidademax());
            ps.setInt(4, quarto.getQtndHospedes());
            ps.setString(5, quarto.getDisponibilidade());
            ps.setInt(6, idOriginal);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM quartos WHERE idquartos = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public Quarto buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " WHERE idquartos = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return montarQuarto(rs);
                }
            }
        }

        return null;
    }

    public List<Quarto> listar(Banco conexao) throws SQLException {
        return listarPorSql(SQL_BASE_SELECT + " ORDER BY idquartos", conexao);
    }

    public List<Quarto> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        return listarPorSql(sql, conexao);
    }

    public List<Quarto> listarDisponiveis(Integer quartoAtualId, Banco conexao) throws SQLException {
        String sql = """
                SELECT idquartos, ala, capacidademax, qntdhospedes, disponibilidade
                FROM quartos
                WHERE (disponibilidade IN ('S', 'D') AND qntdhospedes < ?)
                """;

        if (quartoAtualId != null && quartoAtualId > 0) {
            sql += " OR idquartos = ?";
        }

        sql += " ORDER BY ala, idquartos";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, CAPACIDADE_MAXIMA_POR_QUARTO);
            if (quartoAtualId != null && quartoAtualId > 0) {
                ps.setInt(2, quartoAtualId);
            }

            return listarPorStatement(ps);
        }
    }

    public boolean ocuparVaga(int idQuarto, Banco conexao) throws SQLException {
        Quarto quarto = buscarPorId(idQuarto, conexao);

        if (quarto == null || quarto.getQtndHospedes() >= CAPACIDADE_MAXIMA_POR_QUARTO) {
            return false;
        }

        int novaQuantidade = quarto.getQtndHospedes() + 1;
        String disponibilidade = novaQuantidade >= CAPACIDADE_MAXIMA_POR_QUARTO ? INDISPONIVEL : DISPONIVEL;
        String sql = "UPDATE quartos SET capacidademax = ?, qntdhospedes = ?, disponibilidade = ? WHERE idquartos = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, CAPACIDADE_MAXIMA_POR_QUARTO);
            ps.setInt(2, novaQuantidade);
            ps.setString(3, disponibilidade);
            ps.setInt(4, idQuarto);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean liberarVaga(int idQuarto, Banco conexao) throws SQLException {
        Quarto quarto = buscarPorId(idQuarto, conexao);

        if (quarto == null) {
            return false;
        }

        int novaQuantidade = Math.max(quarto.getQtndHospedes() - 1, 0);
        String disponibilidade = novaQuantidade < CAPACIDADE_MAXIMA_POR_QUARTO ? DISPONIVEL : INDISPONIVEL;
        String sql = "UPDATE quartos SET capacidademax = ?, qntdhospedes = ?, disponibilidade = ? WHERE idquartos = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, CAPACIDADE_MAXIMA_POR_QUARTO);
            ps.setInt(2, novaQuantidade);
            ps.setString(3, disponibilidade);
            ps.setInt(4, idQuarto);
            return ps.executeUpdate() > 0;
        }
    }

    private List<Quarto> listarPorSql(String sql, Banco conexao) throws SQLException {
        try (PreparedStatement ps = conexao.preparar(sql)) {
            return listarPorStatement(ps);
        }
    }

    private List<Quarto> listarPorStatement(PreparedStatement ps) throws SQLException {
        List<Quarto> quartos = new ArrayList<>();

        try (ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                quartos.add(montarQuarto(rs));
            }
        }

        return quartos;
    }

    private Quarto montarQuarto(ResultSet rs) throws SQLException {
        Quarto quarto = new Quarto();
        quarto.setIdQuartos(rs.getInt("idquartos"));
        quarto.setAla(rs.getString("ala"));
        quarto.setNumero(rs.getInt("idquartos"));
        quarto.setQtndHospedes(rs.getInt("qntdhospedes"));
        quarto.setDisponibilidade(rs.getString("disponibilidade"));
        quarto.setCapacidademax(CAPACIDADE_MAXIMA_POR_QUARTO);
        return quarto;
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "idquartos";
        }
        return switch (valor.toLowerCase()) {
            case "idquartos", "numero" -> "idquartos";
            case "ala" -> "ala";
            case "qntdhospedes" -> "qntdhospedes";
            case "disponibilidade" -> "disponibilidade";
            default -> "idquartos";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }
}
