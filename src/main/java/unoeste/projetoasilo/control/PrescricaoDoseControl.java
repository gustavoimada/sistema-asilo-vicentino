package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.PrescricaoDose;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping({"prescricaodose", "caixinhadose"})
public class PrescricaoDoseControl {
    @GetMapping("listarHoje")
    public ResponseEntity<Object> listarHoje(
            @RequestParam(required = false) String morador,
            @RequestParam(required = false) String horario,
            @RequestParam(required = false) Boolean somenteAtrasados
    ) {
        PrescricaoDose prescricaoDose = new PrescricaoDose();
        Banco conexao = Banco.getConnection();
        try {
            boolean filtrarSomenteAtrasados = false;
            if (somenteAtrasados != null) {
                if (somenteAtrasados) {
                    filtrarSomenteAtrasados = true;
                }
            }

            List<PrescricaoDose> lista = prescricaoDose.listarHojeFiltrado(
                    morador,
                    horario,
                    filtrarSomenteAtrasados,
                    conexao
            );
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listarAtrasadasDiasAnteriores")
    public ResponseEntity<Object> listarAtrasadasDiasAnteriores(
            @RequestParam(required = false) String dia,
            @RequestParam(required = false) String diaInicio,
            @RequestParam(required = false) String diaFim,
            @RequestParam(required = false) String morador
    ) {
        PrescricaoDose prescricaoDose = new PrescricaoDose();
        Banco conexao = Banco.getConnection();
        try {
            if (dia != null && (diaInicio == null || diaInicio.isBlank()) && (diaFim == null || diaFim.isBlank())) {
                diaInicio = dia;
                diaFim = dia;
            }
            List<PrescricaoDose> lista = prescricaoDose.listarAtrasadasDiasAnterioresFiltrado(diaInicio, diaFim, morador, conexao);
            return ResponseEntity.ok(lista);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listar() {
        PrescricaoDose prescricaoDose = new PrescricaoDose();
        Banco conexao = Banco.getConnection();
        try {
            List<PrescricaoDose> lista = prescricaoDose.listar(conexao);
            return ResponseEntity.ok(lista);
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
        PrescricaoDose prescricaoDose = new PrescricaoDose();
        Banco conexao = Banco.getConnection();
        try {
            PrescricaoDose registro = prescricaoDose.buscarId(id, conexao);
            if (registro != null) {
                return ResponseEntity.ok(registro);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel achar a prescricao dose"));
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
        PrescricaoDose prescricaoDose = new PrescricaoDose();
        Banco conexao = Banco.getConnection();
        try {
            PrescricaoDose dose = prescricaoDose.buscarId(id, conexao);
            if (dose.deletar(conexao)) {
                return ResponseEntity.ok(dose);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel deletar a prescricao dose"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> atualizar(@PathVariable Long id){
        PrescricaoDose prescricaoDose = new PrescricaoDose();
        Banco conexao = Banco.getConnection();
        try{
            PrescricaoDose dose = prescricaoDose.buscarId(id, conexao);
            if(dose.atualizar(conexao))
                return ResponseEntity.ok(dose);
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel deletar a prescricao dose"));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }
}
