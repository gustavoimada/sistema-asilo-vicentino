package unoeste.projetoasilo.control;

import org.springframework.http.HttpStatus;
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
import unoeste.projetoasilo.entities.ComposicaoFamiliar;
import unoeste.projetoasilo.entities.ComposicaoFamiliarMorador;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Quarto;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("morador")
public class MoradorControl {

    @GetMapping("listar")
    public ResponseEntity<Object> listarMoradores(@RequestParam(required = false) String ordenacao, @RequestParam(required = false) String direcao) {
        Banco conexao = Banco.getConnection();
        try {
            List<Morador> moradores = new Morador().listar(ordenacao, direcao, conexao);
            return ResponseEntity.ok(moradores);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("listarAtivos")
    public ResponseEntity<Object> listarMoradoresAtivos() {
        Banco conexao = Banco.getConnection();
        try {
            return ResponseEntity.ok(new Morador().listarAtivos(conexao));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @GetMapping("filtrar")
    public ResponseEntity<Object> filtrarMoradores(@RequestParam(required = false) String nome, @RequestParam(required = false) String cpf, @RequestParam(required = false) LocalDate dtNascimento, @RequestParam(required = false) LocalDate dtNascimentoInicio, @RequestParam(required = false) LocalDate dtNascimentoFim, @RequestParam(required = false) String endereco, @RequestParam(required = false) String cidade, @RequestParam(required = false) String estado, @RequestParam(required = false) String ordenacao, @RequestParam(required = false) String direcao) {
        Banco conexao = Banco.getConnection();
        try {
            if (dtNascimento != null && dtNascimentoInicio == null && dtNascimentoFim == null) {
                dtNascimentoInicio = dtNascimento;
                dtNascimentoFim = dtNascimento;
            }
            List<Morador> moradores = new Morador().filtrar(nome, cpf, dtNascimentoInicio, dtNascimentoFim, endereco, cidade, estado, ordenacao, direcao, conexao);
            return ResponseEntity.ok(moradores);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarMorador(@RequestParam String nome, @RequestParam String cpf, @RequestParam String genero, @RequestParam LocalDate dtNascimento, @RequestParam String endereco, @RequestParam int numero, @RequestParam String cidade, @RequestParam String estado, @RequestParam String cep, @RequestParam Integer quartoId) {
        Banco conexao = Banco.getConnection();
        Morador morador = new Morador(cpf, nome, genero, endereco, numero, dtNascimento, cidade, estado, cep, quartoId);
        try {
            if (!morador.validarCpf()) {
                return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
            } else if (!morador.validarGeneroComQuarto(conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "O quarto selecionado pertence a outra ala"));
            } else if (new ComposicaoFamiliar().buscarPorCpf(cpf, conexao) != null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Este CPF ja esta cadastrado para um familiar"));
            } else if (morador.gravar(conexao)) {
                if (morador.getQuartoId() != null) {
                    boolean ocupou = new Quarto().ocuparVaga(morador.getQuartoId(), conexao);

                    if (!ocupou) {
                        morador.deletar(conexao);
                        return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o morador"));
                    }
                }

                return ResponseEntity.ok(morador);
            } else {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o morador"));
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PostMapping("cadastrarCompleto")
    public ResponseEntity<Object> cadastrarMoradorCompleto(@RequestParam String nome, @RequestParam String cpf, @RequestParam String genero, @RequestParam LocalDate dtNascimento, @RequestParam String endereco, @RequestParam int numero, @RequestParam String cidade, @RequestParam String estado, @RequestParam String cep, @RequestParam Integer quartoId, @RequestParam(required = false) String familiares) {
        Banco conexao = Banco.getConnection();
        Morador morador = new Morador(cpf, nome, genero, endereco, numero, dtNascimento, cidade, estado, cep, quartoId);
        morador.setFamiliares(montarFamiliares(familiares));

        try {
            if (!morador.validarCpf()) {
                return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
            } else if (!morador.validarGeneroComQuarto(conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "O quarto selecionado pertence a outra ala"));
            } else if (new ComposicaoFamiliar().buscarPorCpf(cpf, conexao) != null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Este CPF ja esta cadastrado para um familiar"));
            } else if (!morador.gravar(conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o morador"));
            } else {
                if (morador.getQuartoId() != null) {
                    boolean ocupou = new Quarto().ocuparVaga(morador.getQuartoId(), conexao);

                    if (!ocupou) {
                        morador.deletar(conexao);
                        return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o morador"));
                    }
                }

                String mensagemErro = salvarFamiliaresMorador(morador, conexao);

                if (mensagemErro == null) {
                    return ResponseEntity.ok(morador);
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new Error("Erro", mensagemErro));
                }
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarMoradorId(@PathVariable int id) {
        Banco conexao = Banco.getConnection();

        try {
            Morador morador = new Morador().buscarId(id, conexao);

            if (morador != null) {
                Integer quartoId = morador.getQuartoId();

                if (!morador.isAtivo()) {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Morador ja esta inativo"));
                }

                if (morador.inativar(conexao)) {
                    if (quartoId != null)
                        new Quarto().liberarVaga(quartoId, conexao);

                    morador.setAtivo(false);
                    morador.setQuartoId(null);
                    return ResponseEntity.ok(morador);
                }
                else
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel inativar o morador"));

            }
            else
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador nao existe"));

        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PutMapping("{id}/reativar")
    public ResponseEntity<Object> reativarMorador(@PathVariable int id) {
        Banco conexao = Banco.getConnection();
        try {
            Morador morador = new Morador().buscarId(id, conexao);
            if (morador == null) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador nao existe"));
            }
            if (morador.isAtivo()) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador ja esta ativo"));
            }
            if (!morador.reativar(conexao)) {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel reativar o morador"));
            }
            morador.setAtivo(true);
            return ResponseEntity.ok(morador);
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarMorador(@PathVariable int id, @RequestParam String nome, @RequestParam String cpf, @RequestParam String genero, @RequestParam LocalDate dtNascimento, @RequestParam String endereco, @RequestParam int numero, @RequestParam String cidade, @RequestParam String estado, @RequestParam String cep, @RequestParam Integer quartoId) {
        Banco conexao = Banco.getConnection();

        try {
            Morador morador = new Morador().buscarId(id, conexao);

            if (morador != null) {
                Integer quartoAnterior = morador.getQuartoId();
                morador.setNome(nome);
                morador.setCpf(cpf);
                morador.setGenero(genero);
                morador.setDtNascimento(dtNascimento);
                morador.setEndereco(endereco);
                morador.setNumero(numero);
                morador.setCidade(cidade);
                morador.setEstado(estado);
                morador.setCep(cep);
                morador.setQuartoId(quartoId);

                if (!morador.validarCpf())
                    return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
                else if (!morador.validarGeneroComQuarto(conexao))
                    return ResponseEntity.badRequest().body(new Error("Erro", "O quarto selecionado pertence a outra ala"));

                ComposicaoFamiliar existente = new ComposicaoFamiliar().buscarPorCpf(cpf, conexao);
                if (existente != null)
                    return ResponseEntity.badRequest().body(new Error("Erro", "Este CPF ja esta cadastrado para um familiar"));

                if (morador.editar(conexao))
                {
                    atualizarQuartoMorador(quartoAnterior, morador.getQuartoId(), conexao);
                    return ResponseEntity.ok(morador);
                }
                else
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o morador"));

            } else
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador nao encontrado"));

        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    @PutMapping("editarCompleto/{id}")
    public ResponseEntity<Object> editarMoradorCompleto(@PathVariable int id, @RequestParam String nome, @RequestParam String cpf, @RequestParam String genero, @RequestParam LocalDate dtNascimento, @RequestParam String endereco, @RequestParam int numero, @RequestParam String cidade, @RequestParam String estado, @RequestParam String cep, @RequestParam Integer quartoId, @RequestParam(required = false) String familiares) {
        Banco conexao = Banco.getConnection();

        try {
            Morador morador = new Morador().buscarId(id, conexao);
            if (morador == null)
                return ResponseEntity.badRequest().body(new Error("Erro", "Morador nao encontrado"));
            else {
                Integer quartoAnterior = morador.getQuartoId();
                morador.setNome(nome);
                morador.setCpf(cpf);
                morador.setGenero(genero);
                morador.setDtNascimento(dtNascimento);
                morador.setEndereco(endereco);
                morador.setNumero(numero);
                morador.setCidade(cidade);
                morador.setEstado(estado);
                morador.setCep(cep);
                morador.setQuartoId(quartoId);
                boolean deveAtualizarFamiliares = familiares != null;

                if (deveAtualizarFamiliares)
                    morador.setFamiliares(montarFamiliares(familiares));

                if (!morador.validarCpf())
                    return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
                else if (!morador.validarGeneroComQuarto(conexao))
                    return ResponseEntity.badRequest().body(new Error("Erro", "O quarto selecionado pertence a outra ala"));

                ComposicaoFamiliar existente = new ComposicaoFamiliar().buscarPorCpf(cpf, conexao);
                if (existente != null)
                    return ResponseEntity.badRequest().body(new Error("Erro", "Este CPF ja esta cadastrado para um familiar"));

                if (!morador.editar(conexao))
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o morador"));
                else {
                    atualizarQuartoMorador(quartoAnterior, morador.getQuartoId(), conexao);
                    String mensagemErro = null;

                    if (deveAtualizarFamiliares) {
                        new ComposicaoFamiliar().desvincularTodosPorMorador(id, conexao);
                        mensagemErro = salvarFamiliaresMorador(morador, conexao);
                    }

                    if (mensagemErro == null)
                        return ResponseEntity.ok(morador);
                    else
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new Error("Erro", mensagemErro));

                }
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        } finally {
            conexao.fechar();
        }
    }

    private String salvarFamiliaresMorador(Morador morador, Banco conexao) throws SQLException {
        List<ComposicaoFamiliarMorador> familiares = morador.getFamiliares();
        String mensagemErro = null;
        int i = 0;

        if (familiares == null)
            morador.setFamiliares(new ArrayList<>());
        else {
            while (i < familiares.size() && mensagemErro == null) {
                ComposicaoFamiliarMorador vinculo = familiares.get(i);

                if (vinculo != null)
                    mensagemErro = processarVinculoFamiliar(morador, vinculo, conexao);


                i++;
            }
        }

        return mensagemErro;
    }

    private String processarVinculoFamiliar(Morador morador, ComposicaoFamiliarMorador vinculo, Banco conexao) throws SQLException {
        String mensagemErro = null;
        ComposicaoFamiliar familiar = vinculo.getComposicaoFamiliar();

        if (vinculo.getVinculo() == null)
            mensagemErro = "Todo familiar precisa informar o vinculo";
        else if (familiar == null)
            mensagemErro = "Familiar invalido";
        else if (familiar.getCpf() != null && !familiar.getCpf().isBlank() && !familiar.validarCpf())
            mensagemErro = "CPF do familiar invalido";
        else {
            familiar = resolverFamiliar(familiar, conexao);

            if (familiar == null)
                mensagemErro = "Nao foi possivel cadastrar o familiar";
            else {
                vinculo.setMorador(morador);
                vinculo.setComposicaoFamiliar(familiar);

                ComposicaoFamiliarMorador vinculoExistente = new ComposicaoFamiliar().buscarVinculo(morador.getIdMorador(), familiar.getIdComposicaoFamiliar(), conexao);
                boolean salvou;

                if (vinculoExistente == null) {
                    salvou = vinculo.vincular(conexao);

                    if (!salvou)
                        mensagemErro = "Nao foi possivel vincular o familiar ao morador";

                } else {
                    salvou = vinculo.atualizarVinculo(conexao);

                    if (!salvou)
                        mensagemErro = "Nao foi possivel atualizar o vinculo do familiar";

                }
            }
        }

        return mensagemErro;
    }

    private ComposicaoFamiliar resolverFamiliar(ComposicaoFamiliar familiar, Banco conexao) throws SQLException {
        ComposicaoFamiliar familiarFinal = familiar;

        if (familiar.getIdComposicaoFamiliar() <= 0) {
            if (familiar.getCpf() != null && !familiar.getCpf().isBlank()) {
                ComposicaoFamiliar existentePorCpf = new ComposicaoFamiliar().buscarPorCpf(familiar.getCpf(), conexao);

                if (existentePorCpf != null)
                    familiarFinal = existentePorCpf;

            }

            if (familiarFinal.getIdComposicaoFamiliar() <= 0) {
                if (familiar.getNome() == null || familiar.getNome().isBlank())
                    familiarFinal = null;
                else {

                    if (!familiarFinal.gravar(conexao))
                        familiarFinal = null;

                }
            }
        } else {
            familiarFinal = new ComposicaoFamiliar().buscarPorId(familiar.getIdComposicaoFamiliar(), conexao);

            if (familiarFinal != null) {
                familiarFinal.setNome(familiar.getNome());
                familiarFinal.setTelefone(familiar.getTelefone());
                familiarFinal.setCpf(familiar.getCpf());

                if (!familiarFinal.editar(conexao))
                    familiarFinal = null;
            }
        }

        return familiarFinal;
    }

    private List<ComposicaoFamiliarMorador> montarFamiliares(String familiares) {
        List<ComposicaoFamiliarMorador> lista = new ArrayList<>();

        if (familiares != null && !familiares.isBlank()) {
            String[] registros = familiares.split("\\|\\|");
            int i = 0;

            while (i < registros.length) {
                String registro = registros[i];

                if (registro != null && !registro.isBlank()) {
                    String[] campos = registro.split(";;", -1);

                    if (campos.length >= 5) {
                        ComposicaoFamiliarMorador vinculo = new ComposicaoFamiliarMorador();
                        ComposicaoFamiliar familiar = new ComposicaoFamiliar();

                        if (campos[0] != null && !campos[0].isBlank())
                            familiar.setIdComposicaoFamiliar(Integer.parseInt(campos[0]));
                        else
                            familiar.setIdComposicaoFamiliar(0);

                        familiar.setNome(campos[1]);
                        familiar.setTelefone(campos[2]);
                        familiar.setCpf(campos[3]);

                        vinculo.setComposicaoFamiliar(familiar);
                        vinculo.setVinculo(campos[4]);
                        lista.add(vinculo);
                    }
                }

                i++;
            }
        }

        return lista;
    }

    private void atualizarQuartoMorador(Integer quartoAnterior, Integer quartoNovo, Banco conexao) throws SQLException {
        if (quartoAnterior == null || !quartoAnterior.equals(quartoNovo)) {
            if (quartoNovo != null)
                new Quarto().ocuparVaga(quartoNovo, conexao);

            if (quartoAnterior != null)
                new Quarto().liberarVaga(quartoAnterior, conexao);
        }
    }
}
