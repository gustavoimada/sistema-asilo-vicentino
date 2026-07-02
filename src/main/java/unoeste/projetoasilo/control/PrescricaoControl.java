package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Medicamento;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Prescricao;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("prescricao")
public class PrescricaoControl {
    @PostMapping("cadastrar")
    public ResponseEntity<Object> gravar(@RequestParam int idMorador, @RequestParam int idMedicamento, @RequestParam int frequenciaValor, @RequestParam String frequenciaUnidade, @RequestParam(required = false) Integer qtdDose, @RequestParam LocalDate dtInicio, @RequestParam LocalDate dtFim, @RequestParam LocalTime primeiraDose) {
        Medicamento medicamento = new Medicamento();
        medicamento.setIdMedicamento(idMedicamento);
        Morador morador = new Morador();
        morador.setIdMorador(idMorador);
        Prescricao prescricao = new Prescricao(morador, medicamento, qtdDose, dtInicio, dtFim, primeiraDose, frequenciaValor, frequenciaUnidade);
        Banco conexao = Banco.getConnection();
        try {
            if (prescricao.gravar(conexao)) {
                return ResponseEntity.ok(prescricao);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar a prescricao"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listar(){
        Prescricao prescricao = new Prescricao();
        Banco conexao = Banco.getConnection();
        try{
            List<Prescricao> prescricaoList = prescricao.listar(conexao);
            if (prescricaoList != null)
                return ResponseEntity.ok(prescricaoList);
            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possivel listar as prescrições"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarPrescricaoId(@PathVariable int id){
        Prescricao prescricao = new Prescricao();
        Banco conexao = Banco.getConnection();
        try{
            Prescricao prescricaoDeletar = prescricao.buscarId(id, conexao);
            if(prescricaoDeletar.deletar(conexao))
                return ResponseEntity.ok(prescricaoDeletar);
            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possivel deletar a prescricao"));
        }catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarPrescricao(@PathVariable int id, @RequestParam int idMorador, @RequestParam int idMedicamento, @RequestParam int frequenciaValor, @RequestParam String frequenciaUnidade, @RequestParam(required = false) Integer qtdDose, @RequestParam LocalDate dtInicio, @RequestParam LocalDate dtFim, @RequestParam LocalTime primeiraDose) {
        Prescricao prescricao = new Prescricao();
        Banco conexao = Banco.getConnection();
        try {
            Prescricao prescricaoEncontrada = prescricao.buscarId(id, conexao);
            if (prescricaoEncontrada != null) {
                Medicamento medicamento = new Medicamento();
                medicamento.setIdMedicamento(idMedicamento);

                Morador morador = new Morador();
                morador.setIdMorador(idMorador);
                prescricaoEncontrada.setMorador(morador);
                prescricaoEncontrada.setMedicamento(medicamento);
                prescricaoEncontrada.setFrequenciaValor(frequenciaValor);
                prescricaoEncontrada.setFrequenciaUnidade(frequenciaUnidade);
                prescricaoEncontrada.setQtdDose(qtdDose);
                prescricaoEncontrada.setDtInicio(dtInicio);
                prescricaoEncontrada.setDtFim(dtFim);
                prescricaoEncontrada.setPrimeiraDose(primeiraDose);

                if (prescricaoEncontrada.editar(conexao)) {
                    return ResponseEntity.ok(prescricaoEncontrada);
                }
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar a prescricao"));
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Prescricao nao encontrada"));
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
        Prescricao prescricao = new Prescricao();
        Banco conexao = Banco.getConnection();
        try{
            List<Prescricao> prescricaoList = prescricao.listarOrdenado(valor.toLowerCase(), ordem, conexao);
            if (prescricaoList != null)
                return ResponseEntity.ok(prescricaoList);
            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possivel listar as prescrições"));
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
        Prescricao prescricao = new Prescricao();
        Banco conexao = Banco.getConnection();
        try {
            Prescricao achou = prescricao.buscarId(id, conexao);
            if (achou != null) {
                return ResponseEntity.ok(achou);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel achar a prescricao"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar o banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }
}
