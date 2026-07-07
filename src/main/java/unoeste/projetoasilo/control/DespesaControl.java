package unoeste.projetoasilo.control;

import org.springframework.format.annotation.DateTimeFormat;
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
import unoeste.projetoasilo.entities.Despesa;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.TipoDespesa;
import unoeste.projetoasilo.entities.TiposDespesas;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("despesa")
public class DespesaControl {

    @GetMapping("listar")
    public ResponseEntity<Object> listarDespesas(@RequestParam(required = false) String ordenacao,
                                                 @RequestParam(required = false) String direcao) {
        Despesa despesaEntidade = new Despesa();
        Banco conexao = Banco.getConnection();
        try {
            atualizarDespesasFixas(despesaEntidade, conexao);
            List<Despesa> despesas = despesaEntidade.listar(ordenacao, direcao, conexao);
            return ResponseEntity.ok(despesas);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("filtrar")
    public ResponseEntity<Object> filtrarDespesas(@RequestParam(required = false) String tipo, @RequestParam(required = false) String status, @RequestParam(required = false) String observacoes, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtVencimento, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtVencimentoInicio, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtVencimentoFim, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtQuitacao, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtQuitacaoInicio, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtQuitacaoFim, @RequestParam(required = false) String fixa, @RequestParam(required = false) String periodicidade, @RequestParam(required = false) String ordenacao, @RequestParam(required = false) String direcao) {
        Despesa despesaEntidade = new Despesa();
        Banco conexao = Banco.getConnection();
        try {
            atualizarDespesasFixas(despesaEntidade, conexao);
            if (dtVencimento != null && dtVencimentoInicio == null && dtVencimentoFim == null) {
                dtVencimentoInicio = dtVencimento;
                dtVencimentoFim = dtVencimento;
            }
            if (dtQuitacao != null && dtQuitacaoInicio == null && dtQuitacaoFim == null) {
                dtQuitacaoInicio = dtQuitacao;
                dtQuitacaoFim = dtQuitacao;
            }
            List<Despesa> despesas = despesaEntidade.filtrar(tipo, status, observacoes, dtVencimentoInicio, dtVencimentoFim, dtQuitacaoInicio, dtQuitacaoFim, fixa, periodicidade, ordenacao, direcao, conexao);

            return ResponseEntity.ok(despesas);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("tiposDespesa")
    public ResponseEntity<Object> listarTiposDespesa() {
        Despesa despesaEntidade = new Despesa();
        Banco conexao = Banco.getConnection();
        try {
            return ResponseEntity.ok(despesaEntidade.listarTipos(conexao));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarDespesa(@RequestParam double valor, @RequestParam String observacoes, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtVencimento, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtQuitacao, @RequestParam String tipo, @RequestParam(defaultValue = "false") boolean fixa, @RequestParam(required = false) String periodicidade) {
        Banco conexao = Banco.getConnection();
        if (fixa && (periodicidade == null || periodicidade.isBlank()))
            return ResponseEntity.badRequest().body(new Error("Erro", "Informe a periodicidade da despesa fixa"));

        if (!fixa)
            periodicidade = null;

        Despesa despesa = new Despesa(valor, observacoes, dtVencimento, dtQuitacao, fixa, periodicidade, new TipoDespesa(tipo));
        try {
            prepararTipoDespesa(despesa, conexao);

            if (despesa.gravar(conexao))
                return ResponseEntity.ok(despesa);
            else
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar a despesa"));

        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarDespesaId(@PathVariable int id) {
        Banco conexao = Banco.getConnection();
        try {
            Despesa despesa = new Despesa().buscarId(id, conexao);

            if (despesa != null) {
                if (despesa.getDtQuitacao() != null)
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao e permitido excluir uma despesa paga. Estorne o pagamento antes."));
                else if (despesa.deletar(conexao))
                    return ResponseEntity.ok(despesa);
                else
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir a despesa"));

            } else {
                return ResponseEntity.badRequest().body(new Error("Erro", "Despesa nao existe"));
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarDespesa(@PathVariable int id, @RequestParam double valor, @RequestParam String observacoes, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtVencimento, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtQuitacao, @RequestParam String tipo, @RequestParam(required = false) Boolean fixa, @RequestParam(required = false) String periodicidade) {
        Banco conexao = Banco.getConnection();

        try {
            Despesa despesa = new Despesa().buscarId(id, conexao);
            if (despesa != null) {
                despesa.setValor(valor);
                despesa.setObservacoes(observacoes);
                despesa.setDtVencimento(dtVencimento);
                despesa.setDtQuitacao(dtQuitacao);
                despesa.setTipoDespesa(new TipoDespesa(tipo));

                if (fixa != null)
                    despesa.setFixa(fixa);

                if (despesa.isFixa()) {
                    if (periodicidade != null)
                        despesa.setPeriodicidade(periodicidade);

                    if (despesa.getPeriodicidade() == null || despesa.getPeriodicidade().isBlank())
                        return ResponseEntity.badRequest().body(new Error("Erro", "Informe a periodicidade da despesa fixa"));
                }
                else
                    despesa.setPeriodicidade(null);

                prepararTipoDespesa(despesa, conexao);

                if (despesa.editar(conexao))
                    return ResponseEntity.ok(despesa);
                else
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar a despesa"));

            }
            else
                return ResponseEntity.badRequest().body(new Error("Erro", "Despesa nao encontrada"));

        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PutMapping("{id}/estornar")
    public ResponseEntity<Object> estornarDespesa(@PathVariable int id) {
        Banco conexao = Banco.getConnection();

        try {
            Despesa despesa = new Despesa().buscarId(id, conexao);
            if (despesa == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "Despesa nao encontrada"));
            else if (despesa.getDtQuitacao() == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "A despesa ja esta pendente"));
            else if (!despesa.estornar(conexao))
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel estornar a despesa"));
            else {
                return ResponseEntity.ok(despesa);
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    private void atualizarDespesasFixas(Despesa despesaEntidade, Banco conexao) throws SQLException {
        List<Despesa> despesasFixas = despesaEntidade.listarFixasPagasVencidas(conexao);
        LocalDate hoje = LocalDate.now();

        for (Despesa despesa : despesasFixas) {
            LocalDate novoVencimento = calcularProximoVencimento(despesa.getDtVencimento(), despesa.getPeriodicidade(), hoje);

            if (novoVencimento != null)
                despesa.atualizarCicloFixo(novoVencimento, conexao);
        }
    }

    private LocalDate calcularProximoVencimento(LocalDate vencimentoAtual, String periodicidade, LocalDate hoje) {
        LocalDate novoVencimento = vencimentoAtual;

        if (vencimentoAtual == null || periodicidade == null )
            return null;
        else {
            while (novoVencimento.isBefore(hoje)) {
                if (periodicidade.equalsIgnoreCase("mensal"))
                    novoVencimento = novoVencimento.plusMonths(1);
                else if (periodicidade.equalsIgnoreCase("bimestral"))
                    novoVencimento = novoVencimento.plusMonths(2);
                else if (periodicidade.equalsIgnoreCase("trimestral"))
                    novoVencimento = novoVencimento.plusMonths(3);
                else if (periodicidade.equalsIgnoreCase("semestral"))
                    novoVencimento = novoVencimento.plusMonths(6);
                else if (periodicidade.equalsIgnoreCase("anual"))
                    novoVencimento = novoVencimento.plusYears(1);
                else
                    return null;
            }

            return novoVencimento;
        }
    }

    private void prepararTipoDespesa(Despesa despesa, Banco conexao) throws SQLException {
        String tipo = despesa.getTipoDespesa().getTipo();
        String tipoNormalizado;

        if (tipo == null)
            tipoNormalizado = "";
        else
            tipoNormalizado = tipo.trim().toUpperCase();

        TiposDespesas tipoDespesa = new TiposDespesas();
        TiposDespesas tipoExistente = tipoDespesa.buscarPorTipo(tipoNormalizado, conexao);

        if (tipoExistente == null) {
            tipoDespesa.setTipo(tipoNormalizado);
            tipoDespesa.gravar(conexao);
            despesa.getTipoDespesa().setTipo(tipoNormalizado);
        }
        else
            despesa.getTipoDespesa().setTipo(tipoExistente.getTipo());
    }
}
