package unoeste.projetoasilo.control;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.dao.NutricaoDAO;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.EvolucaoNutricional;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.ProntuarioNutricional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("nutricao")
public class NutricaoControl
{
    @GetMapping("moradores")
    public ResponseEntity<Object> listarMoradores(HttpSession session)
    {
        if (!ehNutricionista(session))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Acesso permitido apenas para nutricionistas."));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            return ResponseEntity.ok(new Morador().listarAtivos(conexao));
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar moradores ativos."));
        }
        finally
        {
            conexao.fechar();
        }
    }

    @GetMapping("prontuario/{idMorador}")
    public ResponseEntity<Object> carregarProntuario(@PathVariable int idMorador, HttpSession session)
    {
        if (!ehNutricionista(session))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Acesso permitido apenas para nutricionistas."));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            Morador morador = new Morador().buscarId(idMorador, conexao);
            if (morador == null || !morador.isAtivo())
            {
                return ResponseEntity.status(404).body(new Error("Erro", "Morador ativo nao encontrado."));
            }

            NutricaoDAO dao = new NutricaoDAO();
            ProntuarioNutricional prontuario = dao.buscarProntuarioPorMorador(idMorador, conexao);
            List<EvolucaoNutricional> evolucoes = prontuario == null
                    ? List.of()
                    : dao.listarEvolucoes(prontuario.getIdProntuario(), conexao);

            Map<String, Object> resposta = new LinkedHashMap<>();
            resposta.put("morador", morador);
            resposta.put("prontuario", prontuario);
            resposta.put("evolucoes", evolucoes);
            return ResponseEntity.ok(resposta);
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel carregar prontuario nutricional."));
        }
        finally
        {
            conexao.fechar();
        }
    }

    @PostMapping("estimativa")
    public ResponseEntity<Object> estimarMedidas(@RequestBody EstimativaRequest request, HttpSession session)
    {
        if (!ehNutricionista(session))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Acesso permitido apenas para nutricionistas."));
        }

        try
        {
            return ResponseEntity.ok(calcularEstimativa(request));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
    }

    @PostMapping("prontuario")
    public ResponseEntity<Object> salvarProntuario(@RequestBody ProntuarioRequest request, HttpSession session)
    {
        Funcionario nutricionista = nutricionistaDaSessao(session);
        if (nutricionista == null)
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Acesso permitido apenas para nutricionistas."));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            Morador morador = new Morador().buscarId(request.idMorador(), conexao);
            if (morador == null || !morador.isAtivo())
            {
                return ResponseEntity.status(404).body(new Error("Erro", "Morador ativo nao encontrado."));
            }

            NutricaoDAO dao = new NutricaoDAO();
            if (dao.buscarProntuarioPorMorador(morador.getIdMorador(), conexao) != null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Este morador ja possui prontuario nutricional. Registre uma evolucao."));
            }

            ProntuarioNutricional prontuario = montarProntuario(request, morador, nutricionista);
            return ResponseEntity.ok(dao.salvarProntuario(prontuario, conexao));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel salvar prontuario nutricional."));
        }
        finally
        {
            conexao.fechar();
        }
    }

    @PostMapping("evolucao")
    public ResponseEntity<Object> salvarEvolucao(@RequestBody EvolucaoRequest request, HttpSession session)
    {
        Funcionario nutricionista = nutricionistaDaSessao(session);
        if (nutricionista == null)
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Acesso permitido apenas para nutricionistas."));
        }

        Banco conexao = Banco.getConnection();
        try
        {
            NutricaoDAO dao = new NutricaoDAO();
            ProntuarioNutricional prontuario = dao.buscarProntuarioPorId(request.idProntuario(), conexao);
            if (prontuario == null)
            {
                return ResponseEntity.status(404).body(new Error("Erro", "Prontuario nutricional nao encontrado."));
            }

            EvolucaoNutricional evolucao = new EvolucaoNutricional();
            evolucao.setProntuarioId(prontuario.getIdProntuario());
            evolucao.setNutricionista(nutricionista);
            evolucao.setEvolucao(textoObrigatorio(request.evolucao(), "Informe a evolucao nutricional."));
            evolucao.setPesoKg(decimalOpcional(request.pesoKg()));
            evolucao.setAlturaCm(decimalOpcional(request.alturaCm()));
            evolucao.setMetodoMedicao(metodoOpcional(request.metodoMedicao()));
            evolucao.setObservacoes(textoOpcional(request.observacoes()));

            return ResponseEntity.ok(dao.salvarEvolucao(evolucao, prontuario.getMorador().getIdMorador(), conexao));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel salvar evolucao nutricional."));
        }
        finally
        {
            conexao.fechar();
        }
    }

    private ProntuarioNutricional montarProntuario(ProntuarioRequest request, Morador morador, Funcionario nutricionista)
    {
        String metodo = request.acamado() ? "ESTIMADO" : "AFERIDO";
        ProntuarioNutricional prontuario = new ProntuarioNutricional();
        prontuario.setMorador(morador);
        prontuario.setNutricionista(nutricionista);
        prontuario.setAcamado(request.acamado());
        prontuario.setMetodoMedicao(metodo);
        prontuario.setDiagnosticoInicial(textoObrigatorio(request.diagnosticoInicial(), "Informe o diagnostico inicial."));

        if ("ESTIMADO".equals(metodo))
        {
            EstimativaResultado estimativa = calcularEstimativa(new EstimativaRequest(
                    morador.getIdade(),
                    morador.getGenero(),
                    request.grupoEquacao(),
                    request.alturaJoelhoCm(),
                    request.circunferenciaBracoCm()
            ));

            prontuario.setGrupoEquacao(normalizarGrupo(request.grupoEquacao()));
            prontuario.setAlturaJoelhoCm(decimalObrigatorio(request.alturaJoelhoCm(), "Informe a altura do joelho."));
            prontuario.setCircunferenciaBracoCm(decimalObrigatorio(request.circunferenciaBracoCm(), "Informe a circunferencia do braco."));
            prontuario.setPesoKg(estimativa.pesoKg());
            prontuario.setAlturaCm(estimativa.alturaCm());
            prontuario.setPesoEstimado(true);
            prontuario.setAlturaEstimada(true);
            prontuario.setFormulaPeso(estimativa.formulaPeso());
            prontuario.setFormulaAltura(estimativa.formulaAltura());
            return prontuario;
        }

        prontuario.setPesoKg(decimalObrigatorio(request.pesoKg(), "Informe o peso."));
        prontuario.setAlturaCm(decimalObrigatorio(request.alturaCm(), "Informe a altura."));
        prontuario.setPesoEstimado(false);
        prontuario.setAlturaEstimada(false);
        return prontuario;
    }

    private EstimativaResultado calcularEstimativa(EstimativaRequest request)
    {
        int idade = request.idade();
        if (idade < 60 || idade > 80)
        {
            throw new IllegalArgumentException("As formulas de estimativa cadastradas sao para moradores entre 60 e 80 anos.");
        }

        String genero = normalizar(request.genero());
        String grupo = normalizarGrupo(request.grupoEquacao());
        BigDecimal alturaJoelho = decimalObrigatorio(request.alturaJoelhoCm(), "Informe a altura do joelho.");
        BigDecimal circunferenciaBraco = decimalObrigatorio(request.circunferenciaBracoCm(), "Informe a circunferencia do braco.");

        boolean homem = genero.startsWith("m");
        boolean mulher = genero.startsWith("f");
        if (!homem && !mulher)
        {
            throw new IllegalArgumentException("Genero do morador deve ser masculino ou feminino para estimativa.");
        }

        BigDecimal peso;
        String formulaPeso;
        if (mulher && "BRANCA".equals(grupo))
        {
            peso = alturaJoelho.multiply(BigDecimal.valueOf(1.09))
                    .add(circunferenciaBraco.multiply(BigDecimal.valueOf(2.68)))
                    .subtract(BigDecimal.valueOf(65.51));
            formulaPeso = "AJ x 1,09 + CB x 2,68 - 65,51";
        }
        else if (mulher)
        {
            peso = alturaJoelho.multiply(BigDecimal.valueOf(1.50))
                    .add(circunferenciaBraco.multiply(BigDecimal.valueOf(2.58)))
                    .subtract(BigDecimal.valueOf(84.22));
            formulaPeso = "AJ x 1,50 + CB x 2,58 - 84,22";
        }
        else if ("BRANCA".equals(grupo))
        {
            peso = alturaJoelho.multiply(BigDecimal.valueOf(1.10))
                    .add(circunferenciaBraco.multiply(BigDecimal.valueOf(3.07)))
                    .subtract(BigDecimal.valueOf(75.81));
            formulaPeso = "AJ x 1,10 + CB x 3,07 - 75,81";
        }
        else
        {
            peso = alturaJoelho.multiply(BigDecimal.valueOf(0.44))
                    .add(circunferenciaBraco.multiply(BigDecimal.valueOf(2.86)))
                    .subtract(BigDecimal.valueOf(39.21));
            formulaPeso = "AJ x 0,44 + CB x 2,86 - 39,21";
        }

        BigDecimal altura;
        String formulaAltura;
        if (homem)
        {
            altura = BigDecimal.valueOf(64.19)
                    .subtract(BigDecimal.valueOf(0.04).multiply(BigDecimal.valueOf(idade)))
                    .add(BigDecimal.valueOf(2.02).multiply(alturaJoelho));
            formulaAltura = "64,19 - 0,04 x idade + 2,02 x AJ";
        }
        else
        {
            altura = BigDecimal.valueOf(84.88)
                    .subtract(BigDecimal.valueOf(0.24).multiply(BigDecimal.valueOf(idade)))
                    .add(BigDecimal.valueOf(1.83).multiply(alturaJoelho));
            formulaAltura = "84,88 - 0,24 x idade + 1,83 x AJ";
        }

        BigDecimal pesoFinal = arredondar(peso);
        BigDecimal alturaFinal = arredondar(altura);
        return new EstimativaResultado(
                pesoFinal,
                alturaFinal,
                calcularImc(pesoFinal, alturaFinal),
                formulaPeso,
                formulaAltura
        );
    }

    private Funcionario nutricionistaDaSessao(HttpSession session)
    {
        if (!ehNutricionista(session))
        {
            return null;
        }
        Object id = session.getAttribute("idFuncionario");
        Object nome = session.getAttribute("funcionarioNome");
        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(Integer.parseInt(String.valueOf(id)));
        funcionario.setNome(nome == null ? "Nutricionista" : String.valueOf(nome));
        funcionario.setCategoria("Nutricionista");
        return funcionario;
    }

    private boolean ehNutricionista(HttpSession session)
    {
        if (session == null || session.getAttribute("categoria") == null)
        {
            return false;
        }
        return "nutricionista".equals(normalizar(String.valueOf(session.getAttribute("categoria"))));
    }

    private String metodoObrigatorio(String metodo)
    {
        String valor = metodoOpcional(metodo);
        if (valor == null)
        {
            throw new IllegalArgumentException("Informe o metodo de medicao.");
        }
        return valor;
    }

    private String metodoOpcional(String metodo)
    {
        String valor = normalizar(metodo).toUpperCase();
        if (valor.isBlank())
        {
            return null;
        }
        if (!valor.equals("AFERIDO") && !valor.equals("ESTIMADO") && !valor.equals("MANUAL_REVISADO"))
        {
            throw new IllegalArgumentException("Metodo de medicao invalido.");
        }
        return valor;
    }

    private String normalizarGrupo(String grupo)
    {
        String valor = normalizar(grupo).toUpperCase();
        if (!valor.equals("BRANCA") && !valor.equals("NEGRA"))
        {
            throw new IllegalArgumentException("Selecione o grupo da formula: branca ou negra.");
        }
        return valor;
    }

    private BigDecimal decimalObrigatorio(String valor, String mensagem)
    {
        BigDecimal decimal = decimalOpcional(valor);
        if (decimal == null || decimal.compareTo(BigDecimal.ZERO) <= 0)
        {
            throw new IllegalArgumentException(mensagem);
        }
        return decimal;
    }

    private BigDecimal decimalOpcional(String valor)
    {
        if (valor == null || valor.isBlank())
        {
            return null;
        }
        return new BigDecimal(valor.replace(",", ".")).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal arredondar(BigDecimal valor)
    {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularImc(BigDecimal pesoKg, BigDecimal alturaCm)
    {
        BigDecimal alturaMetros = alturaCm.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
        return pesoKg.divide(alturaMetros.multiply(alturaMetros), 2, RoundingMode.HALF_UP);
    }

    private String textoObrigatorio(String texto, String mensagem)
    {
        String valor = textoOpcional(texto);
        if (valor == null)
        {
            throw new IllegalArgumentException(mensagem);
        }
        return valor;
    }

    private String textoOpcional(String texto)
    {
        if (texto == null || texto.isBlank())
        {
            return null;
        }
        return texto.trim();
    }

    private String normalizar(String texto)
    {
        if (texto == null)
        {
            return "";
        }
        return texto.trim()
                .toLowerCase()
                .replace("á", "a")
                .replace("à", "a")
                .replace("ã", "a")
                .replace("â", "a")
                .replace("é", "e")
                .replace("ê", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ô", "o")
                .replace("õ", "o")
                .replace("ú", "u")
                .replace("ç", "c");
    }

    public record EstimativaRequest(int idade, String genero, String grupoEquacao, String alturaJoelhoCm, String circunferenciaBracoCm) {}
    public record ProntuarioRequest(int idMorador, boolean acamado, String metodoMedicao, String grupoEquacao,
                                    String alturaJoelhoCm, String circunferenciaBracoCm, String pesoKg,
                                    String alturaCm, String diagnosticoInicial) {}
    public record EvolucaoRequest(int idProntuario, String evolucao, String pesoKg, String alturaCm,
                                  String metodoMedicao, String observacoes) {}
    public record EstimativaResultado(BigDecimal pesoKg, BigDecimal alturaCm, BigDecimal imc,
                                      String formulaPeso, String formulaAltura) {}
}
