package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.MoradorDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Morador {

	private int idMorador;
	private String cpf;
	private String nome;
	private String genero;
	private String endereco;
	private int numero;
	private LocalDate dtNascimento;
	private String cidade;
	private String estado;
	private String cep;
	private String telefone;
	private Integer quartoId;
	private Quarto quarto;
	private List<ComposicaoFamiliarMorador> familiares = new ArrayList<>();

	public Morador() {
	}

	public Morador(String cpf, String nome, String genero, String endereco, int numero, LocalDate dtNascimento, String cidade, String estado, String cep, String telefone, Integer quartoId) {
		this.cpf = cpf;
		this.nome = nome;
		this.genero = genero;
		this.endereco = endereco;
		this.numero = numero;
		this.dtNascimento = dtNascimento;
		this.cidade = cidade;
		this.estado = estado;
		this.cep = cep;
		this.telefone = telefone;
		this.quartoId = quartoId;
	}

	public int getIdMorador() {
		return idMorador;
	}

	public void setIdMorador(int idMorador) {
		this.idMorador = idMorador;
	}

	public String getCpf() {
		return cpf;
	}

	public void setCpf(String cpf) {
		this.cpf = cpf;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getGenero() {
		return genero;
	}

	public void setGenero(String genero) {
		this.genero = genero;
	}

	public String getEndereco() {
		return endereco;
	}

	public void setEndereco(String endereco) {
		this.endereco = endereco;
	}

	public int getNumero() {
		return numero;
	}

	public void setNumero(int numero) {
		this.numero = numero;
	}

	public LocalDate getDtNascimento() {
		return dtNascimento;
	}

	public void setDtNascimento(LocalDate dtNascimento) {
		this.dtNascimento = dtNascimento;
	}

	public String getCidade() {
		return cidade;
	}

	public void setCidade(String cidade) {
		this.cidade = cidade;
	}

	public String getEstado() {
		return estado;
	}

	public void setEstado(String estado) {
		this.estado = estado;
	}

	public String getCep() {
		return cep;
	}

	public void setCep(String cep) {
		this.cep = cep;
	}

	public String getTelefone() {
		return telefone;
	}

	public void setTelefone(String telefone) {
		this.telefone = telefone;
	}

	public Integer getQuartoId() {
		return quartoId;
	}

	public void setQuartoId(Integer quartoId) {
		this.quartoId = quartoId;
	}

	public Quarto getQuarto() {
		return quarto;
	}

	public void setQuarto(Quarto quarto) {
		this.quarto = quarto;
	}

	public List<ComposicaoFamiliarMorador> getFamiliares() {
		return familiares;
	}

	public void setFamiliares(List<ComposicaoFamiliarMorador> familiares) {
		this.familiares = familiares;
	}


	public boolean gravar(Banco conexao) throws SQLException {
		if (cpf != null && validarCpf() && nome != null && genero != null && endereco != null && numero > 0 && dtNascimento != null && cidade != null && estado != null && cep != null && telefone != null) {
			MoradorDAO dao = new MoradorDAO();
			return dao.gravar(this, conexao);
		}
		return false;
	}

	public boolean deletar(Banco conexao) throws SQLException {
		MoradorDAO dao = new MoradorDAO();
		return dao.deletar(this.idMorador, conexao);
	}

	public boolean editar(Banco conexao) throws SQLException {
		if (idMorador > 0 && cpf != null && validarCpf() && nome != null && genero != null && endereco != null && numero > 0 && dtNascimento != null && cidade != null && estado != null && cep != null && telefone != null) {
			MoradorDAO dao = new MoradorDAO();
			return dao.editar(this, conexao);
		}
		return false;
	}

	public Morador buscarId(int id, Banco conexao) throws SQLException {
		MoradorDAO dao = new MoradorDAO();
		return dao.buscarPorId(id, conexao);
	}

	public List<Morador> listar(Banco conexao) throws SQLException {
		MoradorDAO dao = new MoradorDAO();
		return dao.listar(conexao);
	}

	public List<Morador> listar(String ordenacao, String direcao, Banco conexao) throws SQLException
	{
		MoradorDAO dao = new MoradorDAO();
		return dao.listar(ordenacao, direcao, conexao);
	}

	public List<Morador> filtrar(String nome, String cpf, LocalDate dtNascimento, String endereco, String cidade,
		String estado, String telefone, String ordenacao, String direcao, Banco conexao) throws SQLException
	{
		MoradorDAO dao = new MoradorDAO();
		return dao.filtrar(nome, cpf, dtNascimento, endereco, cidade, estado, telefone, ordenacao, direcao, conexao);
	}

	public Morador buscarPorCpf(String cpf, Banco conexao) throws SQLException
	{
		MoradorDAO dao = new MoradorDAO();
		return dao.buscarPorCpf(cpf, conexao);
	}

	public boolean validarGeneroComQuarto(Banco conexao) throws SQLException
	{
		if (quartoId == null)
			return true;
		else
		{
			Quarto quarto = new Quarto().buscarPorId(quartoId, conexao);

			if (quarto == null || genero == null || genero.isBlank())
				return false;
			else
				return genero.trim().equalsIgnoreCase(quarto.getAla());
		}
	}

	public boolean validarCpf() {
		if (cpf == null)
			return false;
		else {
			String valor = cpf.replaceAll("\\D", "");

			if (valor.length() != 11)
				return false;
			else if (valor.matches("(\\d)\\1{10}"))
				return false;
			else {
				int soma = 0;
				int peso = 10;

				for (int i = 0; i < 9; i++) {
					soma += Character.getNumericValue(valor.charAt(i)) * peso;
					peso--;
				}

				int digito1 = 11 - (soma % 11);
				if (digito1 >= 10)
					digito1 = 0;

				soma = 0;
				peso = 11;

				for (int i = 0; i < 10; i++) {
					soma += Character.getNumericValue(valor.charAt(i)) * peso;
					peso--;
				}

				int digito2 = 11 - (soma % 11);
				if (digito2 >= 10)
					digito2 = 0;

				if (digito1 != Character.getNumericValue(valor.charAt(9)))
					return false;
				else if (digito2 != Character.getNumericValue(valor.charAt(10)))
					return false;
				else
					return true;
			}
		}
	}
}
