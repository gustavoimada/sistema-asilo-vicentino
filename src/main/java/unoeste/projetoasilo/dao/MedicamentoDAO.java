package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Medicamento;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class MedicamentoDAO {
    public boolean gravar(Medicamento medicamento, Banco conexao) throws SQLException{
        boolean gravou = false;
        String sql = """
                INSERT INTO medicamento(
                	nome, tipomedicamento, dosagemvalor, dosagemunidade)
                	VALUES ('#1', '#2', #3, '#4');
                """;
        sql = sql.replace("#1", medicamento.getNome());
        sql = sql.replace("#2", medicamento.getTipoMedicamento());
        sql = sql.replace("#3", String.valueOf(medicamento.getDosagemValor()));
        sql = sql.replace("#4", medicamento.getDosagemUnidade());
        if(conexao.manipular(sql)){
            int novoId = conexao.getMaxPK("medicamento", "idmedicamento");
            if(novoId > 0){
                medicamento.setIdMedicamento(novoId);
                gravou = true;
            }
        }
        return gravou;
    }

    public List<Medicamento> listar(Banco conexao) throws SQLException {
        List<Medicamento> medicamentoList = new ArrayList<>();
        String sql = "SELECT * FROM medicamento ORDER BY nome";
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next()) {
                Medicamento medicamento = new Medicamento();
                medicamento.setIdMedicamento(rs.getInt("idmedicamento"));
                medicamento.setNome(rs.getString("nome"));
                medicamento.setTipoMedicamento(rs.getString("tipomedicamento"));
                medicamento.setDosagemValor(rs.getInt("dosagemvalor"));
                medicamento.setDosagemUnidade(rs.getString("dosagemunidade"));
                medicamentoList.add(medicamento);
            }
        }
        return medicamentoList;
    }

    public List<Medicamento> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        String sql = "SELECT * FROM medicamento ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<Medicamento> medicamentoList = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next()) {
                Medicamento medicamento = new Medicamento();
                medicamento.setIdMedicamento(rs.getInt("idmedicamento"));
                medicamento.setNome(rs.getString("nome"));
                medicamento.setTipoMedicamento(rs.getString("tipomedicamento"));
                medicamento.setDosagemValor(rs.getInt("dosagemvalor"));
                medicamento.setDosagemUnidade(rs.getString("dosagemunidade"));
                medicamentoList.add(medicamento);
            }
        }
        return medicamentoList;
    }

    public boolean deletar(int id, Banco conexao) throws SQLException{
        String sql = "DELETE FROM medicamento WHERE idmedicamento = "+id;
        boolean deletou = false;
        if (conexao.manipular(sql))
        {
            deletou = true;
        }
        return deletou;
    }

    public boolean editar(Medicamento medicamento, Banco conexao) throws SQLException{
        String sql = """
                UPDATE medicamento
                SET nome = '#1', tipomedicamento = '#2', dosagemvalor = #3, dosagemunidade = '#4'
                WHERE idmedicamento = #5
        """;
        boolean editou = false;
        sql = sql.replace("#1", medicamento.getNome());
        sql = sql.replace("#2", medicamento.getTipoMedicamento());
        sql = sql.replace("#3", String.valueOf(medicamento.getDosagemValor()));
        sql = sql.replace("#4", medicamento.getDosagemUnidade());
        sql = sql.replace("#5", String.valueOf(medicamento.getIdMedicamento()));

        if (conexao.manipular(sql))
        {
            editou = true;
        }

        return editou;
    }

    public Medicamento bucarPorId(int id, Banco conexao) throws SQLException{
        String sql = """
                SELECT idmedicamento, nome, tipomedicamento, dosagemvalor, dosagemunidade
                	FROM medicamento WHERE idmedicamento = #1;
                """;
        ResultSet rs;
        sql = sql.replace("#1", String.valueOf(id));
        rs = conexao.consultar(sql);

        Medicamento med = null;
        if (rs != null)
        {
            if (rs.next()) {
                Medicamento medicamento = new Medicamento();
                medicamento.setIdMedicamento(rs.getInt("idmedicamento"));
                medicamento.setNome(rs.getString("nome"));
                medicamento.setTipoMedicamento(rs.getString("tipomedicamento"));
                medicamento.setDosagemValor(rs.getInt("dosagemvalor"));
                medicamento.setDosagemUnidade(rs.getString("dosagemunidade"));
                med = medicamento;
            }
        }
        return med;
    }

    public boolean buscarMedicamento(String nome, String dosagemUnidade, Integer dosagemValor, Banco conexao) throws SQLException{
        String sql = """
                SELECT idmedicamento, nome, tipomedicamento, dosagemvalor, dosagemunidade
                	FROM medicamento WHERE nome = '#1' AND dosagemvalor = #2 AND dosagemunidade = '#3';
                """;
        ResultSet rs;
        sql = sql.replace("#1", nome);
        sql = sql.replace("#3", dosagemUnidade);
        sql = sql.replace("#2", String.valueOf(dosagemValor));
        rs = conexao.consultar(sql);
        if (rs != null)
        {
           return rs.next();
        }
        return false;
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
