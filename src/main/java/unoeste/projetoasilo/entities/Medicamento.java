package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.MedicamentoDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class Medicamento {

	private int idMedicamento;

	private String nome;

	private String tipoMedicamento;

	private Integer dosagemValor;

	private String dosagemUnidade;



	public Medicamento() {
	}

	public Medicamento(String nome, String tipoMedicamento, Integer dosagemValor, String dosagemUnidade) {
		this.nome = nome;
		this.tipoMedicamento = tipoMedicamento;
		this.dosagemValor = dosagemValor;
		this.dosagemUnidade = dosagemUnidade;
	}

	public int getIdMedicamento() {
		return idMedicamento;
	}

	public void setIdMedicamento(int idMedicamento) {
		this.idMedicamento = idMedicamento;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getTipoMedicamento() {
		return tipoMedicamento;
	}

	public void setTipoMedicamento(String tipoMedicamento) {
		this.tipoMedicamento = tipoMedicamento;
	}

	public Integer getDosagemValor() {
		return dosagemValor;
	}

	public void setDosagemValor(Integer dosagemValor) {
		this.dosagemValor = dosagemValor;
	}

	public String getDosagemUnidade() {
		return dosagemUnidade;
	}

	public void setDosagemUnidade(String dosagemUnidade) {
		this.dosagemUnidade = dosagemUnidade;
	}

	public boolean gravar(Banco conexao) throws SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.gravar(this, conexao);
	}

	public boolean deletar(Banco conexao) throws SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.deletar(this.idMedicamento, conexao);
	}

	public boolean editar(Banco conexao) throws SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.editar(this, conexao);
	}

	public Medicamento buscarId(int id, Banco conexao) throws  SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.bucarPorId(id, conexao);
	}

	public List<Medicamento> listar(Banco conexao) throws SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.listar(conexao);
	}

	public List<Medicamento> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.listarOrdenado(valor, ordem, conexao);
	}

	public boolean buscaMedicamento(Banco conexao) throws SQLException{
		MedicamentoDAO medicamentoDAO = new MedicamentoDAO();
		return medicamentoDAO.buscarMedicamento(this.nome, this.dosagemUnidade, this.dosagemValor, conexao);
	}
}
