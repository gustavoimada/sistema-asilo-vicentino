package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.TiposDespesas;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("tipodespesas")
public class TiposDespesasControl
{
	@PostMapping("cadastrar")
	public ResponseEntity<Object> cadastrarTipoDespesa(@RequestParam("tipo") String tipo)
	{
		TiposDespesas tipoDespesa = new TiposDespesas();
		Banco conexao = Banco.getConnection();
		try
		{
			String tipoNormalizado = tipo == null ? "" : tipo.trim().toUpperCase();
			if (tipoNormalizado.isEmpty())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa obrigatorio"));
			}

			tipoDespesa.setTipo(tipoNormalizado);
			if (tipoDespesa.buscarPorTipo(tipoNormalizado, conexao) != null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa ja cadastrado"));
			}

			if (tipoDespesa.gravar(conexao))
			{
				return ResponseEntity.ok(tipoDespesa);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o tipo de despesa"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@GetMapping("listar")
	public ResponseEntity<Object> listarTiposDespesas()
	{
		TiposDespesas tipoDespesa = new TiposDespesas();
		Banco conexao = Banco.getConnection();
		try
		{
			List<TiposDespesas> tiposDespesas = tipoDespesa.listar(conexao);
			if (tiposDespesas != null)
			{
				return ResponseEntity.ok(tiposDespesas);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os tipos de despesas"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@PutMapping("editar")
	public ResponseEntity<Object> editarTipoDespesa(@RequestParam("id") int id, @RequestParam("tipo") String tipo)
	{
		TiposDespesas tipoDespesa = new TiposDespesas();
		Banco conexao = Banco.getConnection();
		try
		{
			String tipoNormalizado = tipo == null ? "" : tipo.trim().toUpperCase();
			if (tipoNormalizado.isEmpty())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa obrigatorio"));
			}

			TiposDespesas tipoDespesaEncontrado = tipoDespesa.buscarPorId(id, conexao);
			TiposDespesas tipoExistente = tipoDespesa.buscarPorTipo(tipoNormalizado, conexao);
			if (tipoDespesaEncontrado == null || (tipoExistente != null && tipoExistente.getIdtiposDespesas() != id))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa nao encontrado ou ja cadastrado"));
			}
			if (!tipoDespesaEncontrado.isAtivo())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa inativo"));
			}

			tipoDespesaEncontrado.setTipo(tipoNormalizado);
			if (tipoDespesaEncontrado.editar(conexao))
			{
				return ResponseEntity.ok(tipoDespesaEncontrado);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o tipo de despesa"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@DeleteMapping("deletar")
	public ResponseEntity<Object> deletarTipoDespesa(@RequestParam("id") int id)
	{
		TiposDespesas tipoDespesa = new TiposDespesas();
		Banco conexao = Banco.getConnection();
		try
		{
			TiposDespesas tipoDespesaEncontrado = tipoDespesa.buscarPorId(id, conexao);
			if (tipoDespesaEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa nao encontrado"));
			}
			if (!tipoDespesaEncontrado.isAtivo())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa ja esta inativo"));
			}

			if (tipoDespesaEncontrado.possuiDespesaVinculada(conexao))
			{
				if (tipoDespesaEncontrado.desativar(conexao))
				{
					return ResponseEntity.ok(tipoDespesaEncontrado);
				}
				return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel desativar o tipo de despesa"));
			}

			if (tipoDespesaEncontrado.deletar(conexao))
			{
				return ResponseEntity.ok(tipoDespesaEncontrado);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o tipo de despesa"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@GetMapping("buscar")
	public ResponseEntity<Object> buscarTipoDespesaPorId(@RequestParam("id") int id)
	{
		TiposDespesas tipoDespesa = new TiposDespesas();
		Banco conexao = Banco.getConnection();
		try
		{
			TiposDespesas tipoDespesaEncontrado = tipoDespesa.buscarPorId(id, conexao);
			if (tipoDespesaEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de despesa nao encontrado"));
			}
			return ResponseEntity.ok(tipoDespesaEncontrado);
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}

	@GetMapping("listarOrdenado")
	public ResponseEntity<Object> listarOrdenado(@RequestParam("valor") String valor, @RequestParam("ordem") String ordem)
	{
		TiposDespesas tipoDespesa = new TiposDespesas();
		Banco conexao = Banco.getConnection();
		try
		{
			List<TiposDespesas> tiposDespesasList = tipoDespesa.listarOrdenado(valor.toLowerCase(), ordem, conexao);
			if (tiposDespesasList != null)
			{
				return ResponseEntity.ok(tiposDespesasList);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os tipos de despesas"));
		}
		catch (SQLException e)
		{
			return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
		}
		finally
		{
			conexao.fechar();
		}
	}
}
