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
import unoeste.projetoasilo.entities.Atividades;
import unoeste.projetoasilo.entities.AtividadesMorador;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Morador;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("atividadesmorador")
public class AtividadesMoradorControl
{
	@PostMapping("cadastrar")
	public ResponseEntity<Object> cadastrarAtividadeMorador(@RequestParam int idatividade, @RequestParam int idmorador,
		@RequestParam(required = false) String observacao)
	{
		AtividadesMorador atividadesMorador = new AtividadesMorador();
		Atividades atividade = new Atividades();
		Morador morador = new Morador();
		Banco conexao = Banco.getConnection();
		try
		{
			String observacaoLimpa = padronizarObservacao(observacao);
			if (observacaoLimpa.length() > 500)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Observacao do morador deve ter no maximo 500 caracteres"));
			}

			Atividades atividadeEncontrada = atividade.buscarPorId(idatividade, conexao);
			Morador moradorEncontrado = morador.buscarId(idmorador, conexao);
			AtividadesMorador vinculoExistente = atividadesMorador.buscarPorIds(idatividade, idmorador, conexao);
			if (atividadeEncontrada == null || moradorEncontrado == null || vinculoExistente != null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			atividadesMorador.setIdatividade(atividadeEncontrada);
			atividadesMorador.setIdmorador(moradorEncontrado);
			atividadesMorador.setObservacao(observacaoLimpa);
			if (!atividadesMorador.gravar(conexao))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			return ResponseEntity.ok(atividadesMorador);
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
	public ResponseEntity<Object> editarAtividadeMorador(@RequestParam int idatividadeAnterior, @RequestParam int idmoradorAnterior,
		@RequestParam int idatividade, @RequestParam int idmorador, @RequestParam(required = false) String observacao)
	{
		AtividadesMorador atividadesMorador = new AtividadesMorador();
		Atividades atividade = new Atividades();
		Morador morador = new Morador();
		Banco conexao = Banco.getConnection();
		try
		{
			String observacaoLimpa = padronizarObservacao(observacao);
			if (observacaoLimpa.length() > 500)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Observacao do morador deve ter no maximo 500 caracteres"));
			}

			AtividadesMorador vinculoEncontrado = atividadesMorador.buscarPorIds(idatividadeAnterior, idmoradorAnterior, conexao);
			Atividades atividadeEncontrada = atividade.buscarPorId(idatividade, conexao);
			Morador moradorEncontrado = morador.buscarId(idmorador, conexao);
			if (vinculoEncontrado == null || atividadeEncontrada == null || moradorEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			AtividadesMorador duplicado = atividadesMorador.buscarPorIds(idatividade, idmorador, conexao);
			boolean mudouChave = idatividadeAnterior != idatividade || idmoradorAnterior != idmorador;
			if (mudouChave && duplicado != null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			vinculoEncontrado.setIdatividade(atividadeEncontrada);
			vinculoEncontrado.setIdmorador(moradorEncontrado);
			vinculoEncontrado.setObservacao(observacaoLimpa);
			if (!vinculoEncontrado.editar(idatividadeAnterior, idmoradorAnterior, conexao))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			return ResponseEntity.ok(vinculoEncontrado);
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
	public ResponseEntity<Object> deletarAtividadeMorador(@RequestParam int idatividade, @RequestParam int idmorador)
	{
		AtividadesMorador atividadesMorador = new AtividadesMorador();
		Banco conexao = Banco.getConnection();
		try
		{
			AtividadesMorador vinculoEncontrado = atividadesMorador.buscarPorIds(idatividade, idmorador, conexao);
			if (vinculoEncontrado == null || !vinculoEncontrado.deletar(conexao))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}
			return ResponseEntity.ok(vinculoEncontrado);
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
	public ResponseEntity<Object> buscarAtividadeMorador(@RequestParam int idatividade, @RequestParam int idmorador)
	{
		AtividadesMorador atividadesMorador = new AtividadesMorador();
		Banco conexao = Banco.getConnection();
		try
		{
			AtividadesMorador vinculoEncontrado = atividadesMorador.buscarPorIds(idatividade, idmorador, conexao);
			if (vinculoEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}
			return ResponseEntity.ok(vinculoEncontrado);
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

	@GetMapping("listarPorAtividade")
	public ResponseEntity<Object> listarPorAtividade(@RequestParam int idatividade)
	{
		AtividadesMorador atividadesMorador = new AtividadesMorador();
		Banco conexao = Banco.getConnection();
		try
		{
			List<AtividadesMorador> vinculos = atividadesMorador.listarPorAtividade(idatividade, conexao);
			if (vinculos == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}
			return ResponseEntity.ok(vinculos);
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

	private String padronizarObservacao(String observacao)
	{
		if (observacao == null)
		{
			return "";
		}
		return observacao.trim().replaceAll("\\s+", " ");
	}
}
