package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.dao.TurnoDAO;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.FuncionarioTurnos;
import unoeste.projetoasilo.entities.PrescricaoDose;
import unoeste.projetoasilo.entities.RegistrarUsoMedicacao;

import jakarta.servlet.http.HttpSession;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("registrarusomedicacao")
public class RegistrarUsoMedicacaoControl {
    @PutMapping("gravar")
    public ResponseEntity<Object> gravar(@RequestParam Long idPrescricaoDose, @RequestParam LocalDateTime dataRegistro, HttpSession session) {
        Banco conexao = Banco.getConnection();
        Funcionario funcionario;
        try {
            funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null) {
                return ResponseEntity.status(401).body(new Error("Erro", "Sessao invalida"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar funcionario logado"));
        }
        finally
        {
        	conexao.fechar();
        }

        PrescricaoDose prescricaoDose = new PrescricaoDose();
        prescricaoDose.setIdPrescricaoDose(idPrescricaoDose);
        RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao(prescricaoDose, funcionario, dataRegistro);
        try {
            if (registrarUsoMedicacao.gravar(conexao)) {
                return ResponseEntity.ok(registrarUsoMedicacao);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel registrar o uso da medicacao"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listar() {
        RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
        Banco conexao = Banco.getConnection();
        try {
            List<RegistrarUsoMedicacao> lista = registrarUsoMedicacao.listar(conexao);
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listarHoje")
    public ResponseEntity<Object> listarHoje() {
        RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
        Banco conexao = Banco.getConnection();
        try {
            List<RegistrarUsoMedicacao> lista = registrarUsoMedicacao.listarHoje(conexao);
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("turno")
    public ResponseEntity<Object> listarPorTurno(@RequestParam int idFuncionarioTurnos) {
        RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
        Banco conexao = Banco.getConnection();
        try {
            FuncionarioTurnos turno = new TurnoDAO().buscarDetalhesTurno(idFuncionarioTurnos, conexao);
            if (turno == null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Turno nao encontrado"));
            }

            return ResponseEntity.ok(registrarUsoMedicacao.listarPorTurno(turno, conexao));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("buscarid")
    public ResponseEntity<Object> buscarId(@RequestParam Long id) {
        RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
        Banco conexao = Banco.getConnection();
        try {
            RegistrarUsoMedicacao registro = registrarUsoMedicacao.buscarId(id, conexao);
            if (registro != null) {
                return ResponseEntity.ok(registro);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel achar o registro"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletar(@PathVariable Long id) {
        RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
        Banco conexao = Banco.getConnection();
        try {
            RegistrarUsoMedicacao deletar = registrarUsoMedicacao.buscarId(id, conexao);
            if (deletar == null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Registro de uso nao encontrado"));
            }

            if (!deletar.deletar(conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel deletar o registro do uso da medicacao"));
            }

            if (deletar.getPrescricaoDose() != null) {
                boolean desmarcouAplicacao = deletar.getPrescricaoDose().atualizarAplicado(false, conexao);
                if (!desmarcouAplicacao) {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Registro removido, mas nao foi possivel atualizar a dose para pendente"));
                }
            }

            return ResponseEntity.ok(deletar);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    private Funcionario buscarFuncionarioDaSessao(HttpSession session, Banco conexao) throws SQLException {
        if (session == null) {
            return null;
        }

        Object idFuncionarioSessao = session.getAttribute("idFuncionario");
        if (idFuncionarioSessao != null) {
            int idFuncionario = Integer.parseInt(String.valueOf(idFuncionarioSessao));
            return new Funcionario().buscarId(idFuncionario, conexao);
        }

        Object idUserSessao = session.getAttribute("idUser");
        if (idUserSessao != null) {
            int idUser = Integer.parseInt(String.valueOf(idUserSessao));
            return new Funcionario().buscarPorUsuario(idUser, conexao);
        }

        return null;
    }
}
