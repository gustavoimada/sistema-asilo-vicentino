package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Quarto;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class QuartoDAO {
    private static final String DISPONIVEL = "S";
    private static final String INDISPONIVEL = "N";

    private static final String SQL_BASE_SELECT = """
            SELECT idquartos, ala, capacidademax, qntdhospedes, disponibilidade
            FROM quartos
            """;

    private String escaparSql(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("'", "''");
    }

    public boolean gravar(Quarto quarto, Banco conexao) throws SQLException {
        String sql = """
                INSERT INTO quartos (idquartos, ala, capacidademax, qntdhospedes, disponibilidade)
                VALUES (#1, '#2', #3, #4, '#5')
                """;

        sql = sql.replace("#1", String.valueOf(quarto.getIdQuartos()));
        sql = sql.replace("#2", escaparSql(quarto.getAla()));
        sql = sql.replace("#3", String.valueOf(quarto.getCapacidademax()));
        sql = sql.replace("#4", String.valueOf(quarto.getQtndHospedes()));
        sql = sql.replace("#5", escaparSql(quarto.getDisponibilidade()));

        return conexao.manipular(sql);
    }

    public boolean editar(Quarto quarto, Banco conexao) throws SQLException {
        return editar(quarto, quarto.getIdQuartos(), conexao);
    }

    public boolean editar(Quarto quarto, int idOriginal, Banco conexao) throws SQLException {
        String sql = """
                UPDATE quartos
                SET idquartos = #1, ala = '#2', capacidademax = #3, qntdhospedes = #4, disponibilidade = '#5'
                WHERE idquartos = #6
                """;

        sql = sql.replace("#1", String.valueOf(quarto.getIdQuartos()));
        sql = sql.replace("#2", escaparSql(quarto.getAla()));
        sql = sql.replace("#3", String.valueOf(quarto.getCapacidademax()));
        sql = sql.replace("#4", String.valueOf(quarto.getQtndHospedes()));
        sql = sql.replace("#5", escaparSql(quarto.getDisponibilidade()));
        sql = sql.replace("#6", String.valueOf(idOriginal));

        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM quartos WHERE idquartos = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public Quarto buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " WHERE idquartos = #1";
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            Quarto quarto = new Quarto();
            quarto.setIdQuartos(rs.getInt("idquartos"));
            quarto.setAla(rs.getString("ala"));
            quarto.setNumero(rs.getInt("idquartos"));
            quarto.setQtndHospedes(rs.getInt("qntdhospedes"));
            quarto.setDisponibilidade(rs.getString("disponibilidade"));
            quarto.setCapacidademax(rs.getInt("capacidademax"));
            return quarto;
        }
        return null;
    }

    public List<Quarto> listar(Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " ORDER BY idquartos";
        List<Quarto> quartos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                Quarto quarto = new Quarto();
                quarto.setIdQuartos(rs.getInt("idquartos"));
                quarto.setAla(rs.getString("ala"));
                quarto.setNumero(rs.getInt("idquartos"));
                quarto.setQtndHospedes(rs.getInt("qntdhospedes"));
                quarto.setDisponibilidade(rs.getString("disponibilidade"));
                quarto.setCapacidademax(rs.getInt("capacidademax"));
                quartos.add(quarto);
            }
        }
        return quartos;
    }

    public List<Quarto> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<Quarto> quartos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                Quarto quarto = new Quarto();
                quarto.setIdQuartos(rs.getInt("idquartos"));
                quarto.setAla(rs.getString("ala"));
                quarto.setNumero(rs.getInt("idquartos"));
                quarto.setQtndHospedes(rs.getInt("qntdhospedes"));
                quarto.setDisponibilidade(rs.getString("disponibilidade"));
                quarto.setCapacidademax(rs.getInt("capacidademax"));
                quartos.add(quarto);
            }
        }
        return quartos;
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "idquartos";
        }
        return switch (valor.toLowerCase()) {
            case "idquartos", "numero" -> "idquartos";
            case "ala" -> "ala";
            case "capacidademax" -> "capacidademax";
            case "qntdhospedes" -> "qntdhospedes";
            case "disponibilidade" -> "disponibilidade";
            default -> "idquartos";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }

    public List<Quarto> listarDisponiveis(Integer quartoAtualId, Banco conexao) throws SQLException {
        String sql = """
                SELECT idquartos, ala, capacidademax, qntdhospedes, disponibilidade
                FROM quartos
                WHERE (disponibilidade IN ('S', 'D') AND qntdhospedes < capacidademax)
                """;

        if (quartoAtualId != null && quartoAtualId > 0) {
            sql += " OR idquartos = " + quartoAtualId;
        }

        sql += " ORDER BY ala, idquartos";

        List<Quarto> quartos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                Quarto quarto = new Quarto();
                quarto.setIdQuartos(rs.getInt("idquartos"));
                quarto.setAla(rs.getString("ala"));
                quarto.setNumero(rs.getInt("idquartos"));
                quarto.setQtndHospedes(rs.getInt("qntdhospedes"));
                quarto.setDisponibilidade(rs.getString("disponibilidade"));
                quarto.setCapacidademax(rs.getInt("capacidademax"));
                quartos.add(quarto);
            }
        }

        return quartos;
    }

    public boolean ocuparVaga(int idQuarto, Banco conexao) throws SQLException {
        Quarto quarto = buscarPorId(idQuarto, conexao);

        if (quarto == null || quarto.getQtndHospedes() >= quarto.getCapacidademax()) {
            return false;
        }

        int novaQuantidade = quarto.getQtndHospedes() + 1;
        String disponibilidade = novaQuantidade >= quarto.getCapacidademax() ? INDISPONIVEL : DISPONIVEL;
        String sql = "UPDATE quartos SET qntdhospedes = " + novaQuantidade + ", disponibilidade = '" + disponibilidade + "' WHERE idquartos = " + idQuarto;
        return conexao.manipular(sql);
    }

    public boolean liberarVaga(int idQuarto, Banco conexao) throws SQLException {
        Quarto quarto = buscarPorId(idQuarto, conexao);

        if (quarto == null) {
            return false;
        }

        int novaQuantidade = Math.max(quarto.getQtndHospedes() - 1, 0);
        String disponibilidade = novaQuantidade < quarto.getCapacidademax() ? DISPONIVEL : INDISPONIVEL;
        String sql = "UPDATE quartos SET qntdhospedes = " + novaQuantidade + ", disponibilidade = '" + disponibilidade + "' WHERE idquartos = " + idQuarto;
        return conexao.manipular(sql);
    }
}

