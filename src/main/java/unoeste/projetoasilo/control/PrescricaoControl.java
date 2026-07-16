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
@RequestMapping({"prescricao", "caixinha"})
public class PrescricaoControl {
    @PostMapping("cadastrar")
    public ResponseEntity<Object> gravar(@RequestParam int idMorador, @RequestParam int idMedicamento, @RequestParam int frequenciaValor, @RequestParam String frequenciaUnidade, @RequestParam(required = false) Integer qtdDose, @RequestParam(required = false) Integer diaSemana, @RequestParam LocalDate dtInicio, @RequestParam LocalDate dtFim, @RequestParam LocalTime primeiraDose) {
        dtInicio = ajustarDataInicioSemanal(dtInicio, frequenciaUnidade, diaSemana);
        String erroValidacao = validarDadosCaixinha(frequenciaValor, frequenciaUnidade, dtInicio, dtFim, primeiraDose, diaSemana);
        if (erroValidacao != null) {
            return ResponseEntity.badRequest().body(new Error("Erro", erroValidacao));
        }

        Medicamento medicamento = new Medicamento();
        medicamento.setIdMedicamento(idMedicamento);
        Morador morador = new Morador();
        morador.setIdMorador(idMorador);
        Prescricao prescricao = new Prescricao(morador, medicamento, normalizarQtdDose(qtdDose), dtInicio, dtFim, primeiraDose, frequenciaValor, frequenciaUnidade);
        Banco conexao = Banco.getConnection();
        try {
            if (prescricao.gravar(conexao)) {
                return ResponseEntity.ok(prescricao);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel adicionar o medicamento a caixinha"));
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
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar as caixinhas"));
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
            if (prescricaoDeletar == null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Medicamento da caixinha nao encontrado"));
            }
            if(prescricaoDeletar.removerDaCaixinha(conexao))
                return ResponseEntity.ok(prescricaoDeletar);
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel remover o medicamento da caixinha"));
        }catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarPrescricao(@PathVariable int id, @RequestParam int idMorador, @RequestParam int idMedicamento, @RequestParam int frequenciaValor, @RequestParam String frequenciaUnidade, @RequestParam(required = false) Integer qtdDose, @RequestParam(required = false) Integer diaSemana, @RequestParam LocalDate dtInicio, @RequestParam LocalDate dtFim, @RequestParam LocalTime primeiraDose) {
        dtInicio = ajustarDataInicioSemanal(dtInicio, frequenciaUnidade, diaSemana);
        String erroValidacao = validarDadosCaixinha(frequenciaValor, frequenciaUnidade, dtInicio, dtFim, primeiraDose, diaSemana);
        if (erroValidacao != null) {
            return ResponseEntity.badRequest().body(new Error("Erro", erroValidacao));
        }

        Prescricao prescricao = new Prescricao();
        Banco conexao = Banco.getConnection();
        try {
            Prescricao prescricaoEncontrada = prescricao.buscarId(id, conexao);
            if (prescricaoEncontrada != null) {
                if (prescricaoEncontrada.possuiUsoRegistrado(conexao)) {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao e possivel editar este medicamento porque ja existem usos registrados no historico"));
                }
                Medicamento medicamento = new Medicamento();
                medicamento.setIdMedicamento(idMedicamento);

                Morador morador = new Morador();
                morador.setIdMorador(idMorador);
                prescricaoEncontrada.setMorador(morador);
                prescricaoEncontrada.setMedicamento(medicamento);
                prescricaoEncontrada.setFrequenciaValor(frequenciaValor);
                prescricaoEncontrada.setFrequenciaUnidade(frequenciaUnidade);
                prescricaoEncontrada.setQtdDose(normalizarQtdDose(qtdDose));
                prescricaoEncontrada.setDtInicio(dtInicio);
                prescricaoEncontrada.setDtFim(dtFim);
                prescricaoEncontrada.setPrimeiraDose(primeiraDose);

                if (prescricaoEncontrada.editar(conexao)) {
                    return ResponseEntity.ok(prescricaoEncontrada);
                }
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o medicamento da caixinha"));
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Medicamento da caixinha nao encontrado"));
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
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar as caixinhas"));
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
            return ResponseEntity.badRequest().body(new Error("Erro", "Medicamento da caixinha nao encontrado"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar o banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    private String validarDadosCaixinha(int frequenciaValor, String frequenciaUnidade, LocalDate dtInicio, LocalDate dtFim, LocalTime primeiraDose, Integer diaSemana) {
        if (frequenciaValor <= 0) {
            return "Frequencia deve ser maior que zero";
        }
        if (!unidadeFrequenciaValida(frequenciaUnidade)) {
            return "Periodo da frequencia invalido";
        }
        if (ehFrequenciaSemanal(frequenciaUnidade) && (diaSemana == null || diaSemana < 1 || diaSemana > 7)) {
            return "Dia da semana invalido";
        }
        if (dtInicio == null) {
            return "Data de inicio obrigatoria";
        }
        if (dtFim == null) {
            return "Data de fim obrigatoria";
        }
        if (dtFim.isBefore(dtInicio)) {
            return "Data de fim nao pode ser menor que a data de inicio";
        }
        if (primeiraDose == null) {
            return "Primeiro horario obrigatorio";
        }
        return null;
    }

    private boolean unidadeFrequenciaValida(String frequenciaUnidade) {
        if (frequenciaUnidade == null) {
            return false;
        }
        String unidade = frequenciaUnidade.trim().toLowerCase();
        return unidade.startsWith("hora") || unidade.startsWith("dia") || unidade.startsWith("semana");
    }

    private boolean ehFrequenciaSemanal(String frequenciaUnidade) {
        return frequenciaUnidade != null && frequenciaUnidade.trim().toLowerCase().startsWith("semana");
    }

    private LocalDate ajustarDataInicioSemanal(LocalDate dtInicio, String frequenciaUnidade, Integer diaSemana) {
        if (dtInicio == null || !ehFrequenciaSemanal(frequenciaUnidade) || diaSemana == null) {
            return dtInicio;
        }

        int diferenca = Math.floorMod(diaSemana - dtInicio.getDayOfWeek().getValue(), 7);
        return dtInicio.plusDays(diferenca);
    }

    private int normalizarQtdDose(Integer qtdDose) {
        return qtdDose != null && qtdDose > 0 ? qtdDose : 1;
    }
}
