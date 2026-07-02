package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.dao.TurnoDAO;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.FuncionarioTurnos;
import unoeste.projetoasilo.entities.Ocorrencia;
import unoeste.projetoasilo.entities.RegistrarUsoMedicacao;
import unoeste.projetoasilo.entities.Turno;

import jakarta.servlet.http.HttpSession;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("turno")
public class TurnoControl
{
    // Inicia o turno do funcionario que esta logado na sessao.
    @PostMapping("iniciar")
    public ResponseEntity<Object> iniciarTurno(@RequestParam(required = false) String descricao, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = resolverFuncionario(conexao, session);
            if (funcionario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
            }

            // verificar se já tem turno ativo
            Turno turno = new Turno();
            Turno ativo = turno.buscarTurnoAtivoPorFuncionario(funcionario.getIdFuncionario(), conexao);
            if (ativo != null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario ja possui turno ativo"));
            }

            String validacao = turno.validarIniciarTurno(funcionario.getIdFuncionario(), conexao);
            if (!validacao.equals("OK"))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", validacao));
            }

            if (!turno.iniciarTurno(funcionario.getIdFuncionario(), descricao, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel iniciar o turno"));
            }

            Turno turnoCriado = turno.buscarTurnoAtivoPorFuncionario(funcionario.getIdFuncionario(), conexao);
            if (turnoCriado != null)
            {
                return ResponseEntity.ok(turnoCriado);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel localizar o turno iniciado"));
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

    // Busca o turno ativo do funcionario logado.
    @GetMapping("resumo-ativo")
    public ResponseEntity<Object> resumoTurnoAtivo(HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = resolverFuncionario(conexao, session);
            if (funcionario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
            }

            Turno turno = new Turno();
            TurnoDAO turnoDAO = new TurnoDAO();
            Turno turnoAtivo = turno.buscarTurnoAtivoPorFuncionario(funcionario.getIdFuncionario(), conexao);
            if (turnoAtivo != null)
            {
                FuncionarioTurnos escalaAtiva = turnoDAO.buscarEscalaAtivaPorFuncionario(funcionario.getIdFuncionario(), conexao);
                int totalOcorrencias = 0;
                int totalUsosMedicacao = 0;

                if (escalaAtiva != null)
                {
                    totalOcorrencias = new Ocorrencia().listarPorTurno(escalaAtiva, conexao).size();
                    totalUsosMedicacao = new RegistrarUsoMedicacao().listarPorTurno(escalaAtiva, conexao).size();
                }

                Map<String, Object> resumo = new LinkedHashMap<>();
                resumo.put("funcionario", funcionario);
                resumo.put("turnoAtivo", turnoAtivo);
                resumo.put("escalaAtiva", escalaAtiva);
                resumo.put("totalOcorrencias", totalOcorrencias);
                resumo.put("totalUsosMedicacao", totalUsosMedicacao);

                return ResponseEntity.ok(resumo);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nenhum turno ativo encontrado"));
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

    // Busca o ultimo turno finalizado para mostrar o resumo.
    @GetMapping("ultimo-finalizado")
    public ResponseEntity<Object> ultimoTurnoFinalizado(@RequestParam(required = false, defaultValue = "false") boolean geral, @RequestParam(required = false, defaultValue = "false") boolean anteriorAtual, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            TurnoDAO dao = new TurnoDAO();
            FuncionarioTurnos turno;
            if (anteriorAtual)
            {
                turno = dao.buscarTurnoAnteriorPeloHorarioAtual(conexao);
            }
            else if (geral)
            {
                turno = dao.buscarUltimoTurnoFinalizadoGeral(conexao);
            }
            else
            {
                Funcionario funcionario = resolverFuncionario(conexao, session);
                if (funcionario == null)
                {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
                }
                turno = dao.buscarUltimoTurnoFinalizado(funcionario.getIdFuncionario(), conexao);
            }

            if (turno != null)
            {
                return ResponseEntity.ok(turno);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nenhum turno finalizado encontrado"));
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

    // Lista o historico geral de turnos.
    @GetMapping("historico")
    public ResponseEntity<Object> historicoTurnos()
    {
        Banco conexao = Banco.getConnection();
        try
        {
            return ResponseEntity.ok(new TurnoDAO().listarHistoricoTurnos(conexao));
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

    // Busca os detalhes de uma escala pelo id dela.
    @GetMapping("detalhes")
    public ResponseEntity<Object> detalhesTurno(@RequestParam int idFuncionarioTurnos)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            FuncionarioTurnos turno = new TurnoDAO().buscarDetalhesTurno(idFuncionarioTurnos, conexao);
            if (turno != null)
            {
                return ResponseEntity.ok(turno);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Turno nao encontrado"));
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

    // Fecha o turno ativo do funcionario logado.
    @PostMapping("fechar")
    public ResponseEntity<Object> fecharTurno(@RequestParam(required = false) String descricao, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = resolverFuncionario(conexao, session);
            if (funcionario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
            }

            Turno turno = new Turno();
            Turno ativo = turno.buscarTurnoAtivoPorFuncionario(funcionario.getIdFuncionario(), conexao);
            if (ativo == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nenhum turno ativo encontrado"));
            }

            if (!turno.fecharTurnoAtivo(funcionario.getIdFuncionario(), descricao, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel fechar o turno"));
            }

            return ResponseEntity.ok().body("Turno fechado com sucesso");
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

    // Escala um cuidador selecionado pelo coordenador.
    @PostMapping("escalar")
    public ResponseEntity<Object> escalarFuncionario(@RequestParam(required = true) Integer idFuncionario, @RequestParam(required = true) Integer idTurno)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = new Funcionario();
            Funcionario func = funcionario.buscarId(idFuncionario, conexao);
            if (func == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
            }

            if (func.getCategoria() == null || !func.getCategoria().equalsIgnoreCase("Cuidador"))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Apenas cuidadores podem ser escalados"));
            }

            Turno turno = new Turno();
            if (!turno.escalarFuncionarioTurno(idFuncionario, idTurno, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel escalar o funcionario"));
            }

            return ResponseEntity.ok("Funcionario escalado com sucesso");
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados: " + e.getMessage()));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Retorna o funcionario logado para preencher dados na tela.
    @GetMapping("funcionario-contexto")
    public ResponseEntity<Object> buscarFuncionarioContexto(HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = resolverFuncionario(conexao, session);
            if (funcionario != null)
            {
                return ResponseEntity.ok(funcionario);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
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

    // Busca o funcionario usando primeiro o idFuncionario salvo na sessao.
    private Funcionario resolverFuncionario(Banco conexao, HttpSession session) throws SQLException
    {
        if (session == null)
        {
            return null;
        }

        Object idFuncionarioSessao = session.getAttribute("idFuncionario");
        if (idFuncionarioSessao != null)
        {
            int idFuncionario = Integer.parseInt(String.valueOf(idFuncionarioSessao));
            if (idFuncionario > 0)
            {
                Funcionario funcionario = new Funcionario().buscarId(idFuncionario, conexao);
                if (funcionario != null)
                {
                    return funcionario;
                }
            }
        }

        Object idUserSessao = session.getAttribute("idUser");
        if (idUserSessao != null)
        {
            int idUser = Integer.parseInt(String.valueOf(idUserSessao));
            if (idUser > 0)
            {
                return new Funcionario().buscarPorUsuario(idUser, conexao);
            }
        }

        return null;
    }
}
