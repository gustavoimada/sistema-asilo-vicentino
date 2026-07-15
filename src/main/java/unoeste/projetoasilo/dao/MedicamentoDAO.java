package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Medicamento;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class MedicamentoDAO {
    public boolean gravar(Medicamento medicamento, Banco conexao) throws SQLException {
        String sql = """
                INSERT INTO medicamento(nome, tipomedicamento, dosagemvalor, dosagemunidade)
                VALUES (?, ?, ?, ?)
                """;

        try (PreparedStatement ps = conexao.prepararComChaves(sql)) {
            ps.setString(1, medicamento.getNome());
            ps.setString(2, medicamento.getTipoMedicamento());
            definirInteiroOpcional(ps, 3, medicamento.getDosagemValor());
            definirTextoOpcional(ps, 4, medicamento.getDosagemUnidade());

            if (ps.executeUpdate() > 0) {
                try (ResultSet chaves = ps.getGeneratedKeys()) {
                    if (chaves.next()) {
                        medicamento.setIdMedicamento(chaves.getInt(1));
                    }
                }
                return true;
            }
        }

        return false;
    }

    public List<Medicamento> listar(Banco conexao) throws SQLException {
        return listarPorSql("SELECT * FROM medicamento ORDER BY nome", conexao);
    }

    public List<Medicamento> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        String sql = "SELECT * FROM medicamento ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        return listarPorSql(sql, conexao);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM medicamento WHERE idmedicamento = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean editar(Medicamento medicamento, Banco conexao) throws SQLException {
        String sql = """
                UPDATE medicamento
                SET nome = ?, tipomedicamento = ?, dosagemvalor = ?, dosagemunidade = ?
                WHERE idmedicamento = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setString(1, medicamento.getNome());
            ps.setString(2, medicamento.getTipoMedicamento());
            definirInteiroOpcional(ps, 3, medicamento.getDosagemValor());
            definirTextoOpcional(ps, 4, medicamento.getDosagemUnidade());
            ps.setInt(5, medicamento.getIdMedicamento());
            return ps.executeUpdate() > 0;
        }
    }

    public Medicamento bucarPorId(int id, Banco conexao) throws SQLException {
        String sql = """
                SELECT idmedicamento, nome, tipomedicamento, dosagemvalor, dosagemunidade
                FROM medicamento
                WHERE idmedicamento = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return montarMedicamento(rs);
                }
            }
        }

        return null;
    }

    public boolean buscarMedicamento(String nome, String tipoMedicamento, String dosagemUnidade,
                                     Integer dosagemValor, int idIgnorado, Banco conexao) throws SQLException {
        String sql = """
                SELECT 1
                FROM medicamento
                WHERE LOWER(nome) = LOWER(?)
                  AND LOWER(tipomedicamento) = LOWER(?)
                  AND dosagemvalor IS NOT DISTINCT FROM ?
                  AND dosagemunidade IS NOT DISTINCT FROM ?
                  AND (? = 0 OR idmedicamento <> ?)
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setString(1, nome);
            ps.setString(2, tipoMedicamento);
            definirInteiroOpcional(ps, 3, dosagemValor);
            definirTextoOpcional(ps, 4, dosagemUnidade);
            ps.setInt(5, idIgnorado);
            ps.setInt(6, idIgnorado);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private List<Medicamento> listarPorSql(String sql, Banco conexao) throws SQLException {
        List<Medicamento> medicamentoList = new ArrayList<>();

        try (PreparedStatement ps = conexao.preparar(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                medicamentoList.add(montarMedicamento(rs));
            }
        }

        return medicamentoList;
    }

    private Medicamento montarMedicamento(ResultSet rs) throws SQLException {
        Medicamento medicamento = new Medicamento();
        medicamento.setIdMedicamento(rs.getInt("idmedicamento"));
        medicamento.setNome(rs.getString("nome"));
        medicamento.setTipoMedicamento(rs.getString("tipomedicamento"));
        medicamento.setDosagemValor(rs.getObject("dosagemvalor", Integer.class));
        medicamento.setDosagemUnidade(rs.getString("dosagemunidade"));
        return medicamento;
    }

    private void definirInteiroOpcional(PreparedStatement ps, int indice, Integer valor) throws SQLException {
        if (valor == null) {
            ps.setNull(indice, Types.INTEGER);
        } else {
            ps.setInt(indice, valor);
        }
    }

    private void definirTextoOpcional(PreparedStatement ps, int indice, String valor) throws SQLException {
        if (valor == null) {
            ps.setNull(indice, Types.VARCHAR);
        } else {
            ps.setString(indice, valor);
        }
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "nome";
        }
        return switch (valor.toLowerCase()) {
            case "idmedicamento" -> "idmedicamento";
            case "nome" -> "nome";
            case "tipomedicamento" -> "tipomedicamento";
            case "dosagemvalor" -> "dosagemvalor";
            case "dosagemunidade" -> "dosagemunidade";
            default -> "nome";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }
}
