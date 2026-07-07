package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Atividades;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.TiposAtividades;

import java.sql.SQLException;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping({"tipoatividades", "tipoatividade"})
public class TiposAtividadesControl
{
	@PostMapping("cadastrar")
	public ResponseEntity<Object> cadastrarTipoAtividade(
			@RequestParam("tipo") String tipo,
			@RequestParam("org") String org)
	{
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			String tipoNormalizado = tipo == null ? "" : tipo.trim().toUpperCase();
			String orgNormalizada = org == null ? "" : org.trim().toUpperCase();

			if (tipoNormalizado.isEmpty() || orgNormalizada.isEmpty())
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo e organizacao sao obrigatorios"));
			}

			List<TiposAtividades> tiposAtividades = tipoAtividade.listar(conexao);
			if (tiposAtividades != null)
			{
				for (TiposAtividades tipoExistente : tiposAtividades)
				{
					String tipoExistenteNormalizado =
							tipoExistente.getTipo() == null ? "" : tipoExistente.getTipo().trim().toUpperCase();
					String orgExistenteNormalizada =
							tipoExistente.getOrg() == null ? "" : tipoExistente.getOrg().trim().toUpperCase();

					if (tipoExistenteNormalizado.equals(tipoNormalizado) &&
							orgExistenteNormalizada.equals(orgNormalizada))
					{
						return ResponseEntity.badRequest()
								.body(new Error("Erro", "Tipo de atividade ja cadastrado"));
					}
				}
			}

			tipoAtividade.setTipo(tipoNormalizado);
			tipoAtividade.setOrg(orgNormalizada);

			if (tipoAtividade.gravar(conexao))
			{
				return ResponseEntity.ok(tipoAtividade);
			}

			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Nao foi possivel cadastrar o tipo de atividade"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@GetMapping("listar")
	public ResponseEntity<Object> listarTiposAtividades()
	{
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			List<TiposAtividades> tiposAtividades = tipoAtividade.listar(conexao);

			if (tiposAtividades != null)
			{
				return ResponseEntity.ok(tiposAtividades);
			}

			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Nao foi possivel listar os tipos de atividades"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@PutMapping("editar")
	public ResponseEntity<Object> editarTipoAtividade(
			@RequestParam("id") int id,
			@RequestParam("tipo") String tipo,
			@RequestParam("org") String org)
	{
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			String tipoNormalizado = tipo == null ? "" : tipo.trim().toUpperCase();
			String orgNormalizada = org == null ? "" : org.trim().toUpperCase();

			if (id <= 0 || tipoNormalizado.isEmpty() || orgNormalizada.isEmpty())
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Dados invalidos para edicao"));
			}

			TiposAtividades tipoAtividadeEncontrado = tipoAtividade.buscarPorId(id, conexao);
			if (tipoAtividadeEncontrado == null)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade nao encontrado"));
			}
			if (!tipoAtividadeEncontrado.isAtivo())
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade inativo"));
			}

			List<TiposAtividades> tiposAtividades = tipoAtividade.listar(conexao);
			if (tiposAtividades != null)
			{
				for (TiposAtividades tipoExistente : tiposAtividades)
				{
					if (tipoExistente.getIdtipoatividades() == id)
					{
						continue;
					}

					String tipoExistenteNormalizado =
							tipoExistente.getTipo() == null ? "" : tipoExistente.getTipo().trim().toUpperCase();
					String orgExistenteNormalizada =
							tipoExistente.getOrg() == null ? "" : tipoExistente.getOrg().trim().toUpperCase();

					if (tipoExistenteNormalizado.equals(tipoNormalizado) &&
							orgExistenteNormalizada.equals(orgNormalizada))
					{
						return ResponseEntity.badRequest()
								.body(new Error("Erro", "Tipo de atividade ja cadastrado"));
					}
				}
			}

			tipoAtividadeEncontrado.setTipo(tipoNormalizado);
			tipoAtividadeEncontrado.setOrg(orgNormalizada);

			if (tipoAtividadeEncontrado.editar(conexao))
			{
				return ResponseEntity.ok(tipoAtividadeEncontrado);
			}
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Nao foi possivel editar o tipo de atividade"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@DeleteMapping("deletar")
	public ResponseEntity<Object> deletarTipoAtividade(@RequestParam("id") int id)
	{
		TiposAtividades tipoAtividade = new TiposAtividades();
		Atividades atividade = new Atividades();
		Banco conexao = Banco.getConnection();
		try
		{
			if (id <= 0)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Id invalido"));
			}

			TiposAtividades tipoAtividadeEncontrado = tipoAtividade.buscarPorId(id, conexao);
			if (tipoAtividadeEncontrado == null)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade nao encontrado"));
			}
			if (!tipoAtividadeEncontrado.isAtivo())
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade ja esta inativo"));
			}

			if (atividade.existeParaTipoAtividade(id, conexao))
			{
				if (tipoAtividadeEncontrado.desativar(conexao))
				{
					return ResponseEntity.ok(tipoAtividadeEncontrado);
				}
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Nao foi possivel desativar o tipo de atividade"));
			}

			if (tipoAtividadeEncontrado.deletar(conexao))
			{
				return ResponseEntity.ok(tipoAtividadeEncontrado);
			}

			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Nao foi possivel deletar o tipo de atividade"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@GetMapping("buscar")
	public ResponseEntity<Object> buscarTipoAtividadePorId(@RequestParam("id") int id)
	{
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			if (id <= 0)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Id invalido"));
			}

			TiposAtividades tipoAtividadeEncontrado = tipoAtividade.buscarPorId(id, conexao);
			if (tipoAtividadeEncontrado == null)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade nao encontrado"));
			}
			return ResponseEntity.ok(tipoAtividadeEncontrado);
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@GetMapping("listarOrdenado")
	public ResponseEntity<Object> listarOrdenado(
			@RequestParam("valor") String valor,
			@RequestParam("ordem") String ordem)
	{
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			List<TiposAtividades> tiposAtividadesList =
					tipoAtividade.listarOrdenado(valor.toLowerCase(), ordem, conexao);

			if (tiposAtividadesList != null)
			{
				return ResponseEntity.ok(tiposAtividadesList);
			}

			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Nao foi possivel listar os tipos de atividades"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest()
					.body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}
}
