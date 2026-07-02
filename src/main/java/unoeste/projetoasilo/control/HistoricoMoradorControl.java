package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unoeste.projetoasilo.dao.HistoricoMoradorDAO;
import unoeste.projetoasilo.dao.MoradorDAO;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.HistoricoMorador;
import unoeste.projetoasilo.entities.Morador;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("historicoMorador")
public class HistoricoMoradorControl {
    @GetMapping("listar")
    public ResponseEntity<Object> listarHistoricos() {
        HistoricoMoradorDAO historicoDAO = new HistoricoMoradorDAO();
        Banco conexao = Banco.getConnection();

        try {
            List<HistoricoMorador> historicos = historicoDAO.listar(conexao);
            return ResponseEntity.ok(historicos);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos carregar os históricos. Tente novamente."));
        }
    }

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarHistorico(@RequestParam int idMorador,
                                                     @RequestParam LocalDate dtEntrada,
                                                     @RequestParam(required = false) LocalDate dtSaida) {
        HistoricoMoradorDAO historicoDAO = new HistoricoMoradorDAO();
        MoradorDAO moradorDAO = new MoradorDAO();
        Banco conexao = Banco.getConnection();

        try {
            Morador morador = moradorDAO.buscarPorId(idMorador, conexao);

            if (morador == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador não encontrado. Verifique se ele está cadastrado."));

            if (dtSaida != null && !dtSaida.isAfter(dtEntrada))
                return ResponseEntity.badRequest().body(new Error("Erro", "A data de saída precisa ser depois da data de entrada."));

            if (historicoDAO.existeEntradaEmAndamento(idMorador, -1, conexao))
                return ResponseEntity.badRequest().body(new Error("Erro", "Este morador já tem uma entrada ativa. Finalize-a antes de cadastrar uma nova."));

            if (historicoDAO.existeSobreposicaoDatas(idMorador, dtEntrada, dtSaida, -1, conexao))
                return ResponseEntity.badRequest().body(new Error("Erro", "As datas informadas conflitam com um período já registrado para este morador."));

            HistoricoMorador historico = new HistoricoMorador(dtEntrada, dtSaida, morador);

            if (historicoDAO.gravar(historico, conexao))
                return ResponseEntity.ok(historico);

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar o histórico. Tente novamente."));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarHistorico(@PathVariable int id,
                                                  @RequestParam int idMorador,
                                                  @RequestParam LocalDate dtEntrada,
                                                  @RequestParam(required = false) LocalDate dtSaida) {
        HistoricoMoradorDAO historicoDAO = new HistoricoMoradorDAO();
        MoradorDAO moradorDAO = new MoradorDAO();
        Banco conexao = Banco.getConnection();

        try {
            HistoricoMorador historico = historicoDAO.buscarPorId(id, conexao);

            if (historico == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "Histórico não encontrado. Ele pode ter sido excluído."));

            Morador morador = moradorDAO.buscarPorId(idMorador, conexao);

            if (morador == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador não encontrado. Verifique se ele está cadastrado."));

            if (dtSaida != null && !dtSaida.isAfter(dtEntrada))
                return ResponseEntity.badRequest().body(new Error("Erro", "A data de saída precisa ser depois da data de entrada."));

            if (historicoDAO.existeEntradaEmAndamento(idMorador, id, conexao))
                return ResponseEntity.badRequest().body(new Error("Erro", "Este morador já tem outra entrada ativa. Finalize-a antes de continuar."));

            if (historicoDAO.existeSobreposicaoDatas(idMorador, dtEntrada, dtSaida, id, conexao))
                return ResponseEntity.badRequest().body(new Error("Erro", "As datas informadas conflitam com um período já registrado para este morador."));

            historico.setMorador(morador);
            historico.setDtEntrada(dtEntrada);
            historico.setDtSaida(dtSaida);

            if (historicoDAO.editar(historico, conexao))
                return ResponseEntity.ok(historico);

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar as alterações. Tente novamente."));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarHistorico(@PathVariable int id) {
        HistoricoMoradorDAO historicoDAO = new HistoricoMoradorDAO();
        Banco conexao = Banco.getConnection();

        try {
            HistoricoMorador historico = historicoDAO.buscarPorId(id, conexao);

            if (historico == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "Histórico não encontrado. Ele pode ter sido excluído."));

            if (historicoDAO.deletar(id, conexao))
                return ResponseEntity.ok(historico);

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível excluir o histórico. Tente novamente."));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
    }
}
