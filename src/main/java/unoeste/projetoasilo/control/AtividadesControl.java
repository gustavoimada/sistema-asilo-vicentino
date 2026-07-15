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
import unoeste.projetoasilo.entities.TiposAtividades;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("atividades")
public class AtividadesControl
{
	@PostMapping("cadastrar")
	public ResponseEntity<Object> cadastrarAtividade(@RequestParam String nome, @RequestParam String descricao,
			@RequestParam LocalDate date, @RequestParam(required = false) LocalDate datafim,
			@RequestParam LocalTime horainicio, @RequestParam LocalTime horafim,
			@RequestParam int idtipoatividade)
	{
		Atividades atividade = new Atividades();
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			LocalDate dataFinal = datafim == null ? date : datafim;
			if (nome == null || nome.isBlank() ||
					descricao == null || descricao.isBlank() ||
					date == null ||
					dataFinal == null ||
					horainicio == null ||
					horafim == null ||
					dataFinal.isBefore(date) ||
					!horafim.isAfter(horainicio) ||
					idtipoatividade <= 0)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Dados inválidos para cadastro da atividade"));
			}

			if (!LocalDateTime.of(date, horainicio).isAfter(LocalDateTime.now()))
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "A atividade deve ser agendada para um horário futuro"));
			}

			TiposAtividades tipoAtividadeEncontrado =
					tipoAtividade.buscarPorId(idtipoatividade, conexao);

			if (tipoAtividadeEncontrado == null)
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade não encontrado"));
			}
			if (!tipoAtividadeEncontrado.isAtivo())
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Tipo de atividade inativo para novos cadastros"));
			}

			if (atividade.existeNoMesmoHorario(date, dataFinal, horainicio, horafim, null, conexao))
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Já existe atividade nesse horário"));
			}

			atividade.setNome(nome.trim());
			atividade.setDescricao(descricao.trim());
			atividade.setDate(date);
			atividade.setDataFim(dataFinal);
			atividade.setHorainicio(horainicio);
			atividade.setHorafim(horafim);
			atividade.setTipoatividades(tipoAtividadeEncontrado);

			if (!atividade.gravar(conexao))
			{
				return ResponseEntity.badRequest()
						.body(new Error("Erro", "Não foi possível cadastrar a atividade"));
			}

			return ResponseEntity.ok(atividade);
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
	public ResponseEntity<Object> listarAtividades()
	{
		Atividades atividade = new Atividades();
		Banco conexao = Banco.getConnection();
		try
		{
			List<Atividades> atividades = atividade.listar(conexao);
			if (atividades == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}
			return ResponseEntity.ok(atividades);
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

	@GetMapping("listarAntigas")
	public ResponseEntity<Object> listarAtividadesAntigas()
	{
		Atividades atividade = new Atividades();
		Banco conexao = Banco.getConnection();
		try
		{
			List<Atividades> atividades = atividade.listarAntigas(conexao);
			if (atividades == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}
			return ResponseEntity.ok(atividades);
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
	public ResponseEntity<Object> editarAtividade(@RequestParam int id, @RequestParam String nome,
			@RequestParam String descricao, @RequestParam LocalDate date,
			@RequestParam(required = false) LocalDate datafim, @RequestParam LocalTime horainicio,
			@RequestParam LocalTime horafim, @RequestParam int idtipoatividade)
	{
		Atividades atividade = new Atividades();
		TiposAtividades tipoAtividade = new TiposAtividades();
		Banco conexao = Banco.getConnection();
		try
		{
			LocalDate dataFinal = datafim == null ? date : datafim;
			if (nome == null || nome.trim().isEmpty() || descricao == null || descricao.trim().isEmpty())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			if (date == null || dataFinal == null || horainicio == null || horafim == null
					|| dataFinal.isBefore(date) || !horafim.isAfter(horainicio))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			if (!LocalDateTime.of(date, horainicio).isAfter(LocalDateTime.now()))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "A atividade deve ser agendada para um horário futuro"));
			}

			Atividades atividadeEncontrada = atividade.buscarPorId(id, conexao);
			TiposAtividades tipoAtividadeEncontrado = tipoAtividade.buscarPorId(idtipoatividade, conexao);
			if (atividadeEncontrada == null || tipoAtividadeEncontrado == null
				|| !tipoAtividadeEncontrado.isAtivo()
				|| atividade.existeNoMesmoHorario(date, dataFinal, horainicio, horafim, id, conexao))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			atividadeEncontrada.setNome(nome);
			atividadeEncontrada.setDescricao(descricao);
			atividadeEncontrada.setDate(date);
			atividadeEncontrada.setDataFim(dataFinal);
			atividadeEncontrada.setHorainicio(horainicio);
			atividadeEncontrada.setHorafim(horafim);
			atividadeEncontrada.setTipoatividades(tipoAtividadeEncontrado);
			if (!atividadeEncontrada.editar(conexao))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			return ResponseEntity.ok(atividadeEncontrada);
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
	public ResponseEntity<Object> deletarAtividade(@RequestParam int id)
	{
		Atividades atividade = new Atividades();
		AtividadesMorador atividadeMorador = new AtividadesMorador();
		Banco conexao = Banco.getConnection();
		try
		{
			Atividades atividadeEncontrada = atividade.buscarPorId(id, conexao);
			if (atividadeEncontrada == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			atividadeMorador.deletarPorAtividade(id, conexao);
			if (!atividadeEncontrada.deletar(conexao))
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}

			return ResponseEntity.ok(atividadeEncontrada);
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
	public ResponseEntity<Object> buscarAtividadePorId(@RequestParam int id)
	{
		Atividades atividade = new Atividades();
		Banco conexao = Banco.getConnection();
		try
		{
			Atividades atividadeEncontrada = atividade.buscarPorId(id, conexao);
			if (atividadeEncontrada == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
			}
			return ResponseEntity.ok(atividadeEncontrada);
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
