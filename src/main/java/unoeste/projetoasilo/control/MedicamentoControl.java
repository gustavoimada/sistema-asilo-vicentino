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
import unoeste.projetoasilo.entities.Medicamento;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("medicamentos")
public class MedicamentoControl {
    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastroMedicamento(@RequestParam String nome,@RequestParam String tipoMedicamento,@RequestParam(required = false) Integer dosagemValor,@RequestParam(required = false) String dosagemUnidade) {
        String erroValidacao = validarDadosMedicamento(nome, tipoMedicamento, dosagemValor, dosagemUnidade);
        if (erroValidacao != null) {
            return ResponseEntity.badRequest().body(new Error("Dados invalidos", erroValidacao));
        }

        Medicamento medicamento = new Medicamento();
        medicamento.setNome(nome.trim());
        medicamento.setTipoMedicamento(tipoMedicamento.trim().toLowerCase());
        medicamento.setDosagemValor(dosagemValor);
        medicamento.setDosagemUnidade(normalizarUnidade(dosagemUnidade));
        Banco conexao = Banco.getConnection();
        try {
            if(medicamento.buscaMedicamento(conexao)){
                return ResponseEntity.badRequest().body(new Error("Erro", "Medicamento já cadastrado"));
            }
            if (medicamento.gravar(conexao)) {
                return ResponseEntity.ok(medicamento);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o medicamento"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarMedicamentoId(@PathVariable int id) {
        Medicamento medicamento = new Medicamento();
        Banco conexao = Banco.getConnection();
        try {
            Medicamento medicamentoDeletar = medicamento.buscarId(id, conexao);
            if (medicamentoDeletar.deletar(conexao)) {
                return ResponseEntity.ok(medicamentoDeletar);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o medicamento"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarMedicamento(@PathVariable int id,
                                                    @RequestParam String nome,
                                                    @RequestParam String tipoMedicamento,
                                                    @RequestParam(required = false) Integer dosagemValor,
                                                    @RequestParam(required = false) String dosagemUnidade) {
        String erroValidacao = validarDadosMedicamento(nome, tipoMedicamento, dosagemValor, dosagemUnidade);
        if (erroValidacao != null) {
            return ResponseEntity.badRequest().body(new Error("Dados invalidos", erroValidacao));
        }

        Medicamento medicamento = new Medicamento();
        Banco conexao = Banco.getConnection();

        try {
            Medicamento medicamentoEncontrado = medicamento.buscarId(id, conexao);
            if (medicamentoEncontrado != null) {
                medicamentoEncontrado.setNome(nome.trim());
                medicamentoEncontrado.setTipoMedicamento(tipoMedicamento.trim().toLowerCase());
                medicamentoEncontrado.setDosagemValor(dosagemValor);
                medicamentoEncontrado.setDosagemUnidade(normalizarUnidade(dosagemUnidade));
                if(medicamentoEncontrado.buscaMedicamento(conexao))
                    return ResponseEntity.badRequest().body(new Error("Erro", "Medicamento já cadastrado"));
                if (medicamentoEncontrado.editar(conexao)) {
                    return ResponseEntity.ok(medicamentoEncontrado);
                }
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o medicamento"));
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Medicamento nao encontrado"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listarMedicamento() {
        Medicamento medicamento = new Medicamento();
        Banco conexao = Banco.getConnection();
        try {
            List<Medicamento> medicamentoList = medicamento.listar(conexao);
            if (medicamentoList != null) {
                return ResponseEntity.ok(medicamentoList);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os tipos de medicamentos"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listarOrdenado")
    public ResponseEntity<Object> listarOrdenado(@RequestParam String valor, @RequestParam String ordem){
        Medicamento medicamento = new Medicamento();
        Banco conexao = Banco.getConnection();
        try{
            List<Medicamento> medicamentoList = medicamento.listarOrdenado(valor.toLowerCase(), ordem, conexao);
            if (medicamentoList != null)
                return ResponseEntity.ok(medicamentoList);
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os tipos de medicamentos"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("buscarid")
    public ResponseEntity<Object> buscarId(@RequestParam int id) {
        Medicamento medicamento = new Medicamento();
        Banco conexao = Banco.getConnection();
        try {
            Medicamento achou = medicamento.buscarId(id, conexao);
            if (achou != null) {
                return ResponseEntity.ok(achou);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel achar o medicamento"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar o banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    private String validarDadosMedicamento(String nome, String tipoMedicamento, Integer dosagemValor,
                                            String dosagemUnidade) {
        if (nome == null || nome.isBlank()) {
            return "Nome do medicamento e obrigatorio";
        }
        if (tipoMedicamento == null || tipoMedicamento.isBlank()) {
            return "Tipo do medicamento e obrigatorio";
        }
        if (dosagemValor == null || dosagemValor <= 0) {
            return "Dosagem deve ser um numero inteiro maior que zero";
        }

        String tipo = tipoMedicamento.trim().toLowerCase();
        String unidade = normalizarUnidade(dosagemUnidade);
        return switch (tipo) {
            case "comprimido" -> ("mg".equals(unidade) || "g".equals(unidade))
                    ? null : "Comprimido deve usar mg ou g";
            case "pomada" -> "g".equals(unidade) ? null : "Pomada deve usar g";
            case "xarope", "injecao" -> "mL".equals(unidade)
                    ? null : "Xarope e injecao devem usar mL";
            default -> "Tipo de medicamento invalido";
        };
    }

    private String normalizarUnidade(String dosagemUnidade) {
        if (dosagemUnidade == null) {
            return null;
        }

        String unidade = dosagemUnidade.trim();
        return "ml".equalsIgnoreCase(unidade) ? "mL" : unidade.toLowerCase();
    }
}
