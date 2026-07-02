package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.TipoOcorrenciaDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class TipoOcorrencia
{
	private int idOcorrencias;
	private String descricao;
	private int gravidade;

	public TipoOcorrencia()
	{
	}

	public TipoOcorrencia(String descricao, int gravidade)
	{
		this.descricao = descricao;
		this.gravidade = gravidade;
	}

	public int getIdOcorrencias()
	{
		return idOcorrencias;
	}

	public void setIdOcorrencias(int idOcorrencias)
	{
		this.idOcorrencias = idOcorrencias;
	}

	public String getDescricao()
	{
		return descricao;
	}

	public void setDescricao(String descricao)
	{
		this.descricao = descricao;
	}

	public int getGravidade()
	{
		return gravidade;
	}

	public void setGravidade(int gravidade)
	{
		this.gravidade = gravidade;
	}

	public boolean gravar(Banco conexao) throws SQLException
	{
		validar();
		TipoOcorrenciaDAO tipoOcorrenciaDAO = new TipoOcorrenciaDAO();
		return tipoOcorrenciaDAO.gravar(this, conexao);
	}

	public boolean editar(Banco conexao) throws SQLException
	{
		validar();
		TipoOcorrenciaDAO tipoOcorrenciaDAO = new TipoOcorrenciaDAO();
		return tipoOcorrenciaDAO.editar(this, conexao);
	}

	private void validar()
	{
		descricao = padronizarDescricao(descricao);

		if (descricao == null || descricao.isBlank())
		{
			throw new IllegalArgumentException("Nome da ocorrência é obrigatório.");
		}

		if (descricao.length() > 45)
		{
			throw new IllegalArgumentException("Nome da ocorrência deve ter no máximo 45 caracteres.");
		}

		if (!descricao.matches("^[\\p{L} ]+$"))
		{
			throw new IllegalArgumentException("Use apenas letras e espaços no nome.");
		}

		if (gravidade == 0)
		{
			throw new IllegalArgumentException("Gravidade da ocorrência é obrigatória.");
		}

		if (gravidade < 1 || gravidade > 3)
		{
			throw new IllegalArgumentException("Gravidade inválida. Use 1, 2 ou 3.");
		}
	}

	private String padronizarDescricao(String valor)
	{
		if (valor == null)
		{
			return null;
		}

		return valor.trim().replaceAll("\\s+", " ");
	}

	public boolean deletar(Banco conexao) throws SQLException
	{
		TipoOcorrenciaDAO tipoOcorrenciaDAO = new TipoOcorrenciaDAO();
		return tipoOcorrenciaDAO.deletar(this.idOcorrencias, conexao);
	}

	public boolean possuiOcorrenciaVinculada(Banco conexao) throws SQLException
	{
		TipoOcorrenciaDAO tipoOcorrenciaDAO = new TipoOcorrenciaDAO();
		return tipoOcorrenciaDAO.possuiOcorrenciaVinculada(this.idOcorrencias, conexao);
	}

	public TipoOcorrencia buscarPorId(int id, Banco conexao) throws SQLException
	{
		TipoOcorrenciaDAO tipoOcorrenciaDAO = new TipoOcorrenciaDAO();
		return tipoOcorrenciaDAO.buscarPorId(id, conexao);
	}

	public List<TipoOcorrencia> listar(Banco conexao) throws SQLException
	{
		TipoOcorrenciaDAO tipoOcorrenciaDAO = new TipoOcorrenciaDAO();
		return tipoOcorrenciaDAO.listar(conexao);
	}
}
