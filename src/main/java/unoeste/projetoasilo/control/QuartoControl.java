package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.dao.QuartoDAO;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Quarto;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("quarto")
public class QuartoControl
{
	private String normalizarDisponibilidade(String disponibilidade)
	{
		if (disponibilidade == null)
		{
			return null;
		}

		String valor = disponibilidade.trim().toUpperCase();

		if (valor.equals("D"))
		{
			return "S";
		}

		if (valor.equals("I"))
		{
			return "N";
		}

		return valor;
	}

	@PostMapping("cadastrar")
	public ResponseEntity<Object> cadastrarQuarto(@RequestParam String ala, @RequestParam int numero,
		@RequestParam String disponibilidade)
	{
		String disponibilidadeNormalizada = normalizarDisponibilidade(disponibilidade);
		Quarto quarto = new Quarto(ala, numero, 0, disponibilidadeNormalizada);
		quarto.setIdQuartos(numero);
		Banco conexao = Banco.getConnection();
		try
		{
			if (numero <= 0 || ala == null || ala.isBlank()
				|| disponibilidadeNormalizada == null || disponibilidadeNormalizada.isBlank())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Dados invalidos para cadastro do quarto"));
			}

			if (quarto.buscarPorId(numero, conexao) != null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Quarto ja cadastrado"));
			}

			if (quarto.gravar(conexao))
			{
				return ResponseEntity.ok(quarto);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o quarto"));
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
	public ResponseEntity<Object> listarQuartos()
	{
		Quarto quarto = new Quarto();
		Banco conexao = Banco.getConnection();
		try
		{
			List<Quarto> quartos = quarto.listar(conexao);
			if (quartos != null)
			{
				return ResponseEntity.ok(quartos);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os quartos"));
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

	@GetMapping("listarDisponiveis")
	public ResponseEntity<Object> listarQuartosDisponiveis(@RequestParam(required = false) Integer quartoAtualId)
	{
		Banco conexao = Banco.getConnection();
		QuartoDAO quartoDAO = new QuartoDAO();
		try
		{
			return ResponseEntity.ok(quartoDAO.listarDisponiveis(quartoAtualId, conexao));
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
	public ResponseEntity<Object> editarQuarto(@RequestParam int id, @RequestParam String ala, @RequestParam int numero,
		@RequestParam String disponibilidade)
	{
		Quarto quarto = new Quarto();
		Banco conexao = Banco.getConnection();
		try
		{
			String disponibilidadeNormalizada = normalizarDisponibilidade(disponibilidade);

			if (numero <= 0 || ala == null || ala.trim().isEmpty()
				|| disponibilidadeNormalizada == null || disponibilidadeNormalizada.trim().isEmpty())
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Dados invalidos para edicao do quarto"));
			}

			Quarto quartoEncontrado = quarto.buscarPorId(id, conexao);
			if (quartoEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Quarto nao encontrado"));
			}

			if (numero != id && quarto.buscarPorId(numero, conexao) != null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Quarto ja cadastrado"));
			}

			quartoEncontrado.setIdQuartos(numero);
			quartoEncontrado.setAla(ala);
			quartoEncontrado.setNumero(numero);
			quartoEncontrado.setCapacidademax(Quarto.CAPACIDADE_MAXIMA_POR_QUARTO);
			int qtndHospedesAtual = quartoEncontrado.getQtndHospedes();
			if (qtndHospedesAtual > Quarto.CAPACIDADE_MAXIMA_POR_QUARTO)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "O quarto possui mais moradores que o limite de duas vagas"));
			}

			if (qtndHospedesAtual == Quarto.CAPACIDADE_MAXIMA_POR_QUARTO)
			{
				quartoEncontrado.setDisponibilidade("N");
			}
			else
			{
				quartoEncontrado.setDisponibilidade(disponibilidadeNormalizada);
			}

			if (quartoEncontrado.editar(id, conexao))
			{
				return ResponseEntity.ok(quartoEncontrado);
			}

			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o quarto"));
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
	public ResponseEntity<Object> deletarQuarto(@RequestParam int id)
	{
		Quarto quarto = new Quarto();
		Banco conexao = Banco.getConnection();
		try
		{
			Quarto quartoEncontrado = quarto.buscarPorId(id, conexao);
			if (quartoEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Quarto nao encontrado"));
			}

			if (quartoEncontrado.deletar(conexao))
			{
				return ResponseEntity.ok(quartoEncontrado);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o quarto"));
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
	public ResponseEntity<Object> buscarQuartoPorId(@RequestParam int id)
	{
		Quarto quarto = new Quarto();
		Banco conexao = Banco.getConnection();
		try
		{
			Quarto quartoEncontrado = quarto.buscarPorId(id, conexao);
			if (quartoEncontrado == null)
			{
				return ResponseEntity.badRequest().body(new Error("Erro", "Quarto nao encontrado"));
			}
			return ResponseEntity.ok(quartoEncontrado);
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
	public ResponseEntity<Object> listarOrdenado(@RequestParam String valor, @RequestParam String ordem)
	{
		Quarto quarto = new Quarto();
		Banco conexao = Banco.getConnection();
		try
		{
			List<Quarto> quartoList = quarto.listarOrdenado(valor.toLowerCase(), ordem, conexao);
			if (quartoList != null)
			{
				return ResponseEntity.ok(quartoList);
			}
			return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os quartos"));
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
