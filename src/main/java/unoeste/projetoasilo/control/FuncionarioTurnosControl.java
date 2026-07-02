package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.FuncionarioTurnos;

import java.time.LocalDate;

@RestController
@RequestMapping("/funcionarioTurnos")
public class FuncionarioTurnosControl
{
    // ====================== CRUD ===========================

    // Cria uma escala ligando um funcionario a um turno.
    @PostMapping("/criar")
    public ResponseEntity<Object> criarEscala(@RequestParam int idFuncionario, @RequestParam int idTurno, @RequestParam(required = false) String descricao, @RequestParam(required = false) String dataEscala)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            FuncionarioTurnos escala = new FuncionarioTurnos(idFuncionario, idTurno);
            escala.setDescricao(descricao);

            if (dataEscala != null && !dataEscala.isBlank())
            {
                escala.setDataEscala(LocalDate.parse(dataEscala));
            }

            if (escala.gravar(conexao))
            {
                return ResponseEntity.ok(escala);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Erro ao escalar funcionario. O cuidador precisa completar 36h de descanso entre turnos 12x36."));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Atualiza o status de uma escala ja cadastrada.
    @PutMapping("/atualizarStatus")
    public ResponseEntity<Object> atualizarStatus(@RequestParam int idFuncionarioTurnos, @RequestParam String novoStatus)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            FuncionarioTurnos escala = new FuncionarioTurnos();
            if (escala.atualizarStatus(idFuncionarioTurnos, novoStatus, conexao))
            {
                return ResponseEntity.ok("Status atualizado para: " + novoStatus);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Erro ao atualizar status"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Deleta uma escala pelo id.
    @DeleteMapping("/deletar")
    public ResponseEntity<Object> deletarEscala(@RequestParam int idFuncionarioTurnos)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            FuncionarioTurnos escala = new FuncionarioTurnos();
            if (escala.deletar(idFuncionarioTurnos, conexao))
            {
                return ResponseEntity.ok("Escala deletada com sucesso!");
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Erro ao deletar escala"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // ====================== FUNCOES AUXILIARES ===========================

    // Lista todas as escalas cadastradas.
    @GetMapping("/listarTodas")
    public ResponseEntity<Object> listarTodas()
    {
        Banco conexao = Banco.getConnection();

        try
        {
            return ResponseEntity.ok(new FuncionarioTurnos().listar(conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Lista as escalas de um funcionario especifico.
    @GetMapping("/listarPorFuncionario/{idFuncionario}")
    public ResponseEntity<Object> listarPorFuncionario(@PathVariable int idFuncionario)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            return ResponseEntity.ok(new FuncionarioTurnos().listarPorFuncionario(idFuncionario, conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Lista as escalas que estao com um determinado status.
    @GetMapping("/listarPorStatus/{status}")
    public ResponseEntity<Object> listarPorStatus(@PathVariable String status)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            return ResponseEntity.ok(new FuncionarioTurnos().listarPorStatus(status, conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Lista as escalas dentro de um periodo de datas.
    @GetMapping("/listarPeriodo")
    public ResponseEntity<Object> listarPorPeriodo(@RequestParam String inicio, @RequestParam String fim)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            LocalDate dtInicio = LocalDate.parse(inicio);
            LocalDate dtFim = LocalDate.parse(fim);
            return ResponseEntity.ok(new FuncionarioTurnos().listarPorPeriodo(dtInicio, dtFim, conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Busca uma escala especifica pelo id.
    @GetMapping("/buscar/{idFuncionarioTurnos}")
    public ResponseEntity<Object> buscarEscala(@PathVariable int idFuncionarioTurnos)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            FuncionarioTurnos escala = new FuncionarioTurnos().buscarPorId(idFuncionarioTurnos, conexao);
            if (escala != null)
            {
                return ResponseEntity.ok(escala);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Escala nao encontrada"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }
}
