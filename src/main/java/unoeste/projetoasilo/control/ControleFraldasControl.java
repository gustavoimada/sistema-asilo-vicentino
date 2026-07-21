package unoeste.projetoasilo.control;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.dao.ControleFraldasDAO;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.ControleFraldas;
import unoeste.projetoasilo.entities.Error;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("controle-fraldas")
public class ControleFraldasControl
{
    @PostMapping
    public ResponseEntity<Object> registrar(@RequestParam int pacotes,
                                             @RequestParam int fraldasPorPacote,
                                             @RequestParam(required = false) String dataRegistro,
                                             @RequestParam(required = false) String observacao,
                                             HttpSession session)
    {
        if (!sessaoAdministrativa(session))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Apenas secretaria e coordenacao podem registrar o controle de fraldas."));
        }
        if (pacotes <= 0 || fraldasPorPacote <= 0)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Informe uma quantidade valida de pacotes e fraldas por pacote."));
        }
        if (pacotes > 10000 || fraldasPorPacote > 10000 || (long) pacotes * fraldasPorPacote > 1_000_000L)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "A quantidade informada e muito alta. Verifique os dados."));
        }

        LocalDate data = resolverData(dataRegistro);
        if (data == null)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "A data do lancamento esta invalida."));
        }
        if (observacao != null && observacao.length() > 300)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "A observacao pode ter no maximo 300 caracteres."));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            ControleFraldas controle = new ControleFraldas();
            controle.setQuantidadePacotes(pacotes);
            controle.setFraldasPorPacote(fraldasPorPacote);
            controle.setTotalFraldas(Math.multiplyExact(pacotes, fraldasPorPacote));
            controle.setDataRegistro(data);
            controle.setObservacao(observacao);
            controle.setIdFuncionario(idFuncionario(session));

            if (!new ControleFraldasDAO().gravar(controle, conexao))
            {
                return ResponseEntity.internalServerError().body(new Error("Erro", "Nao foi possivel registrar o controle de fraldas."));
            }
            return ResponseEntity.ok(controle);
        }
        catch (ArithmeticException ex)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "A quantidade calculada de fraldas e invalida."));
        }
        catch (Exception ex)
        {
            return ResponseEntity.internalServerError().body(new Error("Erro", "Nao foi possivel registrar o controle de fraldas."));
        }
        finally
        {
            conexao.fechar();
        }
    }

    @GetMapping("resumo")
    public ResponseEntity<Object> resumo(@RequestParam(required = false) Integer ano,
                                          @RequestParam(required = false) Integer mes,
                                          HttpSession session)
    {
        if (!sessaoAdministrativa(session))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Voce nao possui permissao para ver este relatorio."));
        }

        YearMonth referencia;
        try
        {
            referencia = YearMonth.of(ano == null ? LocalDate.now().getYear() : ano, mes == null ? LocalDate.now().getMonthValue() : mes);
        }
        catch (Exception ex)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Mes de referencia invalido."));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            List<ControleFraldas> lancamentos = new ControleFraldasDAO().listarNoPeriodo(referencia.atDay(1), referencia.atEndOfMonth(), conexao);
            int totalFraldas = lancamentos.stream().mapToInt(ControleFraldas::getTotalFraldas).sum();
            int totalPacotes = lancamentos.stream().mapToInt(ControleFraldas::getQuantidadePacotes).sum();
            Map<String, Object> resumo = new LinkedHashMap<>();
            resumo.put("ano", referencia.getYear());
            resumo.put("mes", referencia.getMonthValue());
            resumo.put("totalFraldas", totalFraldas);
            resumo.put("totalPacotes", totalPacotes);
            resumo.put("lancamentos", lancamentos);
            return ResponseEntity.ok(resumo);
        }
        catch (Exception ex)
        {
            return ResponseEntity.internalServerError().body(new Error("Erro", "Nao foi possivel carregar o resumo de fraldas."));
        }
        finally
        {
            conexao.fechar();
        }
    }

    private LocalDate resolverData(String dataRegistro)
    {
        if (dataRegistro == null || dataRegistro.isBlank()) return LocalDate.now();
        try { return LocalDate.parse(dataRegistro); }
        catch (Exception ex) { return null; }
    }

    private Integer idFuncionario(HttpSession session)
    {
        try
        {
            Object valor = session.getAttribute("idFuncionario");
            return valor == null ? null : Integer.parseInt(String.valueOf(valor));
        }
        catch (Exception ex)
        {
            return null;
        }
    }

    private boolean sessaoAdministrativa(HttpSession session)
    {
        if (session == null || session.getAttribute("categoria") == null) return false;
        String categoria = String.valueOf(session.getAttribute("categoria")).trim();
        return "secretaria".equalsIgnoreCase(categoria) || "coordenador".equalsIgnoreCase(categoria);
    }
}
