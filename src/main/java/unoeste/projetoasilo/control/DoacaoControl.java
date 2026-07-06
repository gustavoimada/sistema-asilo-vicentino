package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Doacao;
import unoeste.projetoasilo.entities.Error;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

@RestController
@RequestMapping({"doacao", "doacoes"})
public class DoacaoControl
{
    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarDoacao(@RequestParam double valor, @RequestParam(required = false) String observacoes, @RequestParam(required = false) String cpfDoador, @RequestParam(required = false) String nomeDoador, @RequestParam(required = false) String dtDoacao, @RequestParam String tipo, @RequestParam(required = false) String pagEmail)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            ResponseEntity<Object> erroValidacao = validarDados(valor, observacoes, cpfDoador, nomeDoador, tipo, pagEmail);
            if (erroValidacao != null)
            {
                return erroValidacao;
            }

            Timestamp data = resolverDataDoacao(dtDoacao);
            if (data.toLocalDateTime().getYear() < 1)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "A data da doação está inválida. Verifique e tente novamente."));
            }

            Doacao doacao = new Doacao(valor, observacoes, cpfDoador, padronizarTextoNulo(nomeDoador), data, tipo);
            doacao.setStatus("Em_Analise");
            doacao.setPag_email(padronizarTextoNulo(pagEmail));

            if (new unoeste.projetoasilo.dao.DoacaoDAO().existeDuplicada(doacao, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Esta doação já foi registrada. Verifique se ela não está duplicada na lista."));
            }

            if (doacao.gravar(conexao))
            {
                return ResponseEntity.ok(doacao);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar a doação. Tente novamente."));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listarDoacoes()
    {
        Banco conexao = Banco.getConnection();
        try
        {
            List<Doacao> doacoes = new Doacao().listar(conexao);
            return ResponseEntity.ok(doacoes);
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos carregar as doações. Tente novamente."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarDoacao(@PathVariable int id, @RequestParam double valor, @RequestParam(required = false) String observacoes, @RequestParam(required = false) String cpfDoador, @RequestParam(required = false) String nomeDoador, @RequestParam(required = false) String dtDoacao, @RequestParam String tipo)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Doacao doacaoEncontrada = new Doacao().buscarId(id, conexao);
            if (doacaoEncontrada == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Doação não encontrada. Ela pode ter sido excluída."));
            }

            if ("Concluida".equals(doacaoEncontrada.getStatus()))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Esta doação já foi concluída e não pode ser alterada."));
            }

            ResponseEntity<Object> erroValidacao = validarDados(valor, observacoes, cpfDoador, nomeDoador, tipo, null);
            if (erroValidacao != null)
            {
                return erroValidacao;
            }

            Timestamp data = resolverDataDoacao(dtDoacao);
            if (data.toLocalDateTime().getYear() < 1)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "A data da doação está inválida. Verifique e tente novamente."));
            }

            doacaoEncontrada.setValor(valor);
            doacaoEncontrada.setObservacoes(observacoes);
            doacaoEncontrada.setCpfDoador(cpfDoador);
            doacaoEncontrada.setNomeDoador(padronizarTextoNulo(nomeDoador));
            doacaoEncontrada.setDtDoacao(data);
            doacaoEncontrada.setTipo(tipo);

            if (new unoeste.projetoasilo.dao.DoacaoDAO().existeDuplicadaExcluindoId(doacaoEncontrada, id, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Já existe uma doação igual registrada. Verifique os dados e tente novamente."));
            }

            if (doacaoEncontrada.editar(conexao))
            {
                return ResponseEntity.ok(doacaoEncontrada);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível salvar as alterações. Tente novamente."));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarDoacao(@PathVariable int id)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Doacao doacaoEncontrada = new Doacao().buscarId(id, conexao);
            if (doacaoEncontrada == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Doação não encontrada. Ela pode ter sido excluída."));
            }

            if ("Concluida".equals(doacaoEncontrada.getStatus()))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Esta doação já foi concluída e não pode ser excluída."));
            }

            if (doacaoEncontrada.deletar(conexao))
            {
                return ResponseEntity.ok(doacaoEncontrada);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível excluir a doação. Tente novamente."));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("buscar")
    public ResponseEntity<Object> buscarDoacaoPorId(@RequestParam int id)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Doacao doacaoEncontrada = new Doacao().buscarId(id, conexao);
            if (doacaoEncontrada != null)
            {
                return ResponseEntity.ok(doacaoEncontrada);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Doação não encontrada. Ela pode ter sido excluída."));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}/concluir")
    public ResponseEntity<Object> concluirAnalise(@PathVariable int id)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Doacao doacaoEncontrada = new Doacao().buscarId(id, conexao);
            if (doacaoEncontrada == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Doacao nao encontrada"));
            }

            doacaoEncontrada.setStatus("Concluida");
            if (doacaoEncontrada.concluirAnalise(conexao))
            {
                return ResponseEntity.ok(doacaoEncontrada);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível concluir a análise. Tente novamente."));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}/retornar-analise")
    public ResponseEntity<Object> retornarAnalise(@PathVariable int id)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Doacao doacaoEncontrada = new Doacao().buscarId(id, conexao);
            if (doacaoEncontrada == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Doacao nao encontrada"));
            }

            doacaoEncontrada.setStatus("Em_Analise");
            if (doacaoEncontrada.retornarAnalise(conexao))
            {
                return ResponseEntity.ok(doacaoEncontrada);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Não foi possível retornar a doação para análise. Tente novamente."));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Não conseguimos acessar o sistema no momento. Tente novamente em instantes."));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listarOrdenado")
    public ResponseEntity<Object> listarOrdenado(@RequestParam(required = false) String valor, @RequestParam(required = false) String ordem, @RequestParam(required = false) String tipo, @RequestParam(required = false) String dataInicio, @RequestParam(required = false) String dataFim)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            if (valor != null)
            {
                valor = valor.toLowerCase();
            }

            List<Doacao> doacaoList = new Doacao().listarOrdenado(valor, ordem, tipo, dataInicio, dataFim, conexao);
            return ResponseEntity.ok(doacaoList);
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    private ResponseEntity<Object> validarDados(double valor, String observacoes, String cpfDoador, String nomeDoador, String tipo, String pagEmail)
    {
        if (!"Patrimônio".equalsIgnoreCase(tipo) && valor <= 0)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "O valor da doação deve ser maior que zero."));
        }
        if (tipo == null || tipo.trim().isEmpty())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Selecione o tipo da doação."));
        }
        if (cpfDoador != null && !cpfDoador.trim().isEmpty() && !validaCpf(cpfDoador))
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "O CPF informado é inválido. Verifique os números e tente novamente."));
        }
        if (observacoes != null && observacoes.length() > 45)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "O campo de observações é muito longo. Use no máximo 45 caracteres."));
        }
        if (nomeDoador != null && nomeDoador.length() > 45)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "O nome do doador é muito longo. Use no máximo 45 caracteres."));
        }
        if (pagEmail != null && !pagEmail.trim().isEmpty())
        {
            String email = pagEmail.trim();
            if (email.length() > 45)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "O e-mail informado é muito longo. Use no máximo 45 caracteres."));
            }
            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "O e-mail informado é inválido. Verifique e tente novamente."));
            }
        }
        return null;
    }

    private Timestamp resolverDataDoacao(String dtDoacao)
    {
        if (dtDoacao == null || dtDoacao.isEmpty())
        {
            return new Timestamp(System.currentTimeMillis());
        }
        return Timestamp.valueOf(dtDoacao);
    }

    private String padronizarTextoNulo(String valor)
    {
        if (valor == null || valor.trim().isEmpty())
        {
            return null;
        }
        return valor.trim();
    }

    private boolean validaCpf(String cpf)
    {
        String valor = cpf.replaceAll("\\D", "");
        if (valor.length() != 11 || valor.matches("(\\d)\\1{10}"))
        {
            return false;
        }

        int soma = 0;
        int peso = 10;
        for (int i = 0; i < 9; i++)
        {
            soma += (valor.charAt(i) - '0') * peso--;
        }
        int digito1 = 11 - (soma % 11);
        if (digito1 >= 10)
        {
            digito1 = 0;
        }

        soma = 0;
        peso = 11;
        for (int i = 0; i < 10; i++)
        {
            soma += (valor.charAt(i) - '0') * peso--;
        }
        int digito2 = 11 - (soma % 11);
        if (digito2 >= 10)
        {
            digito2 = 0;
        }

        return digito1 == (valor.charAt(9) - '0') && digito2 == (valor.charAt(10) - '0');
    }
}
