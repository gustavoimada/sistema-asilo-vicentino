package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.ComposicaoFamiliar;
import unoeste.projetoasilo.entities.ComposicaoFamiliarMorador;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Morador;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("composicaoFamiliar")
public class ComposicaoFamiliarControl {

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarFamiliar(@RequestParam String nome, @RequestParam String telefone, @RequestParam String cpf) {
        Banco conexao = Banco.getConnection();
        ComposicaoFamiliar fam = new ComposicaoFamiliar(nome, telefone, cpf);
        try {
            if (!fam.validarCpf()) {
                return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
            } else if (new Morador().buscarPorCpf(cpf, conexao) != null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Este CPF ja esta cadastrado para um morador"));
            } else if (fam.gravar(conexao)) {
                return ResponseEntity.ok(fam);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o familiar"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("listarTodos")
    public ResponseEntity<Object> listarTodos(@RequestParam(required = false) String ordenacao,
                                              @RequestParam(required = false) String direcao) {
        Banco conexao = Banco.getConnection();
        try {
            List<ComposicaoFamiliar> lista = new ComposicaoFamiliar().listarTodos(ordenacao, direcao, conexao);
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listarPorMorador(@RequestParam int moradorId) {
        Banco conexao = Banco.getConnection();
        try {
            List<ComposicaoFamiliarMorador> lista = new ComposicaoFamiliar().listarPorMorador(moradorId, conexao);
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("listarVinculos")
    public ResponseEntity<Object> listarTodosVinculos(@RequestParam(required = false) String ordenacao,
                                                      @RequestParam(required = false) String direcao) {
        Banco conexao = Banco.getConnection();
        try {
            List<ComposicaoFamiliarMorador> lista = new ComposicaoFamiliar().listarTodosVinculos(ordenacao, direcao, conexao);
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PostMapping("relacionar")
    public ResponseEntity<Object> relacionar(@RequestParam int moradorId, @RequestParam int familiarId, @RequestParam String vinculo) {
        Banco conexao = Banco.getConnection();
        ComposicaoFamiliarMorador cfm = new ComposicaoFamiliarMorador(moradorId, familiarId, vinculo);
        try {
            if (cfm.vincular(conexao)) {
                return ResponseEntity.ok(cfm);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel relacionar"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @DeleteMapping("desvincular")
    public ResponseEntity<Object> desvincular(@RequestParam int moradorId, @RequestParam int familiarId) {
        Banco conexao = Banco.getConnection();
        try {
            ComposicaoFamiliarMorador cfm = new ComposicaoFamiliarMorador(moradorId, familiarId, null);
            if (cfm.desvincular(conexao)) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel desvincular"));
        } finally {
            conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarFamiliar(@PathVariable int id) {
        Banco conexao = Banco.getConnection();
        try {
            ComposicaoFamiliar fam = new ComposicaoFamiliar().buscarPorId(id, conexao);

            if (fam != null) {
                int vinculos = new ComposicaoFamiliar().contarVinculos(id, conexao);

                if (vinculos > 0) {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir: o familiar ainda possui vinculos com moradores"));
                }
                else if (fam.deletar(conexao)) {
                    return ResponseEntity.ok(fam);
                }
                else
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o familiar"));
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Familiar nao existe"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }
}
