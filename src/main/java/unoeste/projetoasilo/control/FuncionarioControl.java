package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.User;

import jakarta.servlet.http.HttpSession;
import java.text.Normalizer;
import java.util.List;

@RestController
@RequestMapping({"funcionario", "funcionarios"})
public class FuncionarioControl
{
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarFuncionario(@RequestParam String nome, @RequestParam String cpf, @RequestParam String telefone, @RequestParam String categoria, @RequestParam String username, @RequestParam String senha, HttpSession session)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            String categoriaPadronizada = padronizarCategoria(categoria);
            String cpfPadronizado = limparNumeros(cpf);

            ResponseEntity<Object> erroValidacao = validarDadosCadastro(cpf, categoriaPadronizada, username, senha);
            if (erroValidacao != null)
            {
                return erroValidacao;
            }

            ResponseEntity<Object> erroPermissao = validarPermissaoCadastro(categoriaPadronizada, session);
            if (erroPermissao != null)
            {
                return erroPermissao;
            }

            String nomeLimpo = padronizarTexto(nome);
            Funcionario funcionario = new Funcionario(nomeLimpo, cpfPadronizado, telefone, categoriaPadronizada);

            if (funcionario.buscarCpf(conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "CPF ja cadastrado"));
            }

            if (funcionario.buscarTelefone(conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Telefone ja cadastrado"));
            }

            User usuario = criarUsuario(username, senha, categoriaPadronizada, conexao);
            if (usuario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Usuario ja existe"));
            }

            funcionario.setIdUser(usuario.getIdUser());
            if (gravarFuncionarioComCategoriaAlternativa(funcionario, conexao))
            {
                return ResponseEntity.ok(funcionario);
            }

            usuario.deletar(conexao);
            String detalheErro = conexao.getMensagemErro();
            if (detalheErro != null && !detalheErro.isBlank())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o funcionario: " + detalheErro));
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o funcionario"));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<Object> editarFuncionario(@PathVariable int id, @RequestParam String nome, @RequestParam String cpf, @RequestParam String telefone, @RequestParam String categoria, @RequestParam(required = false) String username, @RequestParam(required = false) String senha, HttpSession session)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            String categoriaPadronizada = padronizarCategoria(categoria);
            if (!validarCpf(cpf))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
            }

            if (categoriaPadronizada == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Categoria invalida"));
            }

            Funcionario funcionarioEncontrado = new Funcionario().buscarId(id, conexao);
            if (funcionarioEncontrado == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
            }

            ResponseEntity<Object> erroPermissaoEdicao = validarPermissaoEdicaoFuncionario(funcionarioEncontrado, categoriaPadronizada, session);
            if (erroPermissaoEdicao != null)
            {
                return erroPermissaoEdicao;
            }

            User usuario = new User().buscarPorId(funcionarioEncontrado.getIdUser(), conexao);
            if (usuario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Usuario de acesso do funcionario nao encontrado"));
            }

            String usernameAtualizado = username == null || username.trim().isEmpty()
                    ? usuario.getName()
                    : username.trim();
            String senhaAtualizada = senha == null || senha.trim().isEmpty()
                    ? usuario.getSenha()
                    : passwordEncoder.encode(senha.trim());

            if (usernameAtualizado.length() > 60)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Usuario deve ter no maximo 60 caracteres"));
            }

            User usuarioComMesmoNome = new User().buscarPorNome(usernameAtualizado, conexao);
            if (usuarioComMesmoNome != null && usuarioComMesmoNome.getIdUser() != usuario.getIdUser())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Usuario ja existe"));
            }

            String cpfPadronizado = limparNumeros(cpf);
            if (cpfJaExisteEmOutroFuncionario(funcionarioEncontrado, cpfPadronizado, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "CPF ja cadastrado"));
            }

            if (telefoneJaExisteEmOutroFuncionario(id, funcionarioEncontrado, telefone, conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Telefone ja cadastrado"));
            }

            funcionarioEncontrado.setNome(nome);
            funcionarioEncontrado.setCpf(cpfPadronizado);
            funcionarioEncontrado.setTelefone(telefone);
            funcionarioEncontrado.setCategoria(categoriaPadronizada);

            if (editarFuncionarioComCategoriaAlternativa(funcionarioEncontrado, conexao))
            {
                if (!usuario.atualizarAcesso(usernameAtualizado, senhaAtualizada, conexao))
                {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel atualizar o acesso do funcionario"));
                }

                if (session != null && Integer.toString(usuario.getIdUser()).equals(String.valueOf(session.getAttribute("idUser"))))
                {
                    session.setAttribute("usuarioNome", usernameAtualizado);
                }
                return ResponseEntity.ok(funcionarioEncontrado);
            }

            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o funcionario"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarFuncionario(@PathVariable int id, HttpSession session)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            Funcionario funcionarioEncontrado = new Funcionario().buscarId(id, conexao);
            if (funcionarioEncontrado == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
            }

            if (!funcionarioEncontrado.isAtivo())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario ja esta inativo"));
            }

            ResponseEntity<Object> erroRegraExclusao = validarRegraExclusaoFuncionario(funcionarioEncontrado, session, conexao);
            if (erroRegraExclusao != null)
            {
                return erroRegraExclusao;
            }

            if (!funcionarioEncontrado.desativar(conexao))
            {
                String detalheErro = conexao.getMensagemErro();
                if (detalheErro != null && !detalheErro.isBlank())
                {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o funcionario: " + detalheErro));
                }
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o funcionario"));
            }

            return ResponseEntity.ok(funcionarioEncontrado);
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }


    @GetMapping("listar")
    public ResponseEntity<Object> listarFuncionarios()
    {
        Banco conexao = Banco.getConnection();

        try
        {
            List<Funcionario> funcionarios = new Funcionario().listar(conexao);
            if (funcionarios != null)
            {
                return ResponseEntity.ok(funcionarios);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os funcionarios"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listarCuidadores")
    public ResponseEntity<Object> listarCuidadores()
    {
        Banco conexao = Banco.getConnection();

        try
        {
            List<Funcionario> cuidadores = new Funcionario().listarPorCategoria("Cuidador", conexao);
            if (cuidadores != null)
            {
                return ResponseEntity.ok(cuidadores);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os cuidadores"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("buscar")
    public ResponseEntity<Object> buscarFuncionarioPorId(@RequestParam int id)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            Funcionario funcionarioEncontrado = new Funcionario().buscarId(id, conexao);
            if (funcionarioEncontrado != null)
            {
                return ResponseEntity.ok(funcionarioEncontrado);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    private ResponseEntity<Object> validarDadosCadastro(String cpf, String categoria, String username, String senha)
    {
        if (!validarCpf(cpf))
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "CPF invalido"));
        }

        if (categoria == null)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Categoria invalida"));
        }

        if (username == null || username.trim().isEmpty())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Usuario obrigatorio"));
        }

        if (senha == null || senha.trim().isEmpty())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Senha obrigatoria"));
        }

        return null;
    }

    private ResponseEntity<Object> validarRegraExclusaoFuncionario(Funcionario funcionario, HttpSession session, Banco conexao) throws Exception
    {
        String categoriaAlvo = chaveCategoria(funcionario.getCategoria());
        String categoriaLogada = chaveCategoria(obterCategoriaSessao(session));
        int idFuncionarioLogado = obterIdFuncionarioSessao(session);

        if (idFuncionarioLogado > 0 && idFuncionarioLogado == funcionario.getIdFuncionario())
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao e permitido excluir o proprio usuario logado. Entre com outra conta administrativa para fazer essa alteracao."));
        }

        if ("coordenador".equals(categoriaAlvo) || "nutricionista".equals(categoriaAlvo))
        {
            if (!"coordenador".equals(categoriaLogada))
            {
                return ResponseEntity.status(403).body(new Error("Erro", "Apenas coordenadores podem inativar coordenadores ou nutricionistas."));
            }

            if ("coordenador".equals(categoriaAlvo))
            {
                int coordenadoresAtivos = funcionario.contarAtivosPorCategoria("Coordenador", conexao);
                if (coordenadoresAtivos <= 1)
                {
                    return ResponseEntity.badRequest().body(new Error("Erro", "Nao e possivel excluir o ultimo coordenador ativo. Cadastre outro coordenador antes de remover este acesso."));
                }
            }
        }

        if ("cuidador".equals(categoriaAlvo))
        {
            int escalasFuturas = funcionario.contarEscalasFuturasOuAtivas(conexao);
            if (escalasFuturas > 0)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir: o cuidador possui " + escalasFuturas + " escala(s) futura(s) ou em andamento. Remova ou altere essas escalas antes de excluir."));
            }
        }

        if (!"coordenador".equals(categoriaAlvo) && !"cuidador".equals(categoriaAlvo) && !"secretaria".equals(categoriaAlvo) && !"nutricionista".equals(categoriaAlvo))
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Categoria do funcionario invalida para exclusao."));
        }

        return null;
    }

    private ResponseEntity<Object> validarPermissaoEdicaoFuncionario(Funcionario funcionario, String categoriaSolicitada, HttpSession session)
    {
        String categoriaLogada = chaveCategoria(obterCategoriaSessao(session));
        if (!"secretaria".equals(categoriaLogada))
        {
            return null;
        }

        String categoriaAlvo = chaveCategoria(funcionario.getCategoria());
        if ("coordenador".equals(categoriaAlvo) || "nutricionista".equals(categoriaAlvo))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Secretarias podem editar apenas cuidadores e outras secretarias."));
        }

        String categoriaNova = chaveCategoria(categoriaSolicitada);
        if ("coordenador".equals(categoriaNova) || "nutricionista".equals(categoriaNova))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Secretarias nao podem atribuir a categoria de coordenador ou nutricionista."));
        }

        return null;
    }

    private ResponseEntity<Object> validarPermissaoCadastro(String categoriaSolicitada, HttpSession session)
    {
        String categoriaLogada = chaveCategoria(obterCategoriaSessao(session));
        String categoriaNova = chaveCategoria(categoriaSolicitada);
        if ("secretaria".equals(categoriaLogada)
                && ("coordenador".equals(categoriaNova) || "nutricionista".equals(categoriaNova)))
        {
            return ResponseEntity.status(403).body(new Error("Erro", "Secretarias podem cadastrar apenas cuidadores e outras secretarias."));
        }
        return null;
    }

    private int obterIdFuncionarioSessao(HttpSession session)
    {
        if (session == null)
        {
            return 0;
        }

        Object valor = session.getAttribute("idFuncionario");
        if (valor instanceof Number)
        {
            return ((Number) valor).intValue();
        }

        try
        {
            return Integer.parseInt(String.valueOf(valor));
        }
        catch (Exception e)
        {
            return 0;
        }
    }

    private String obterCategoriaSessao(HttpSession session)
    {
        if (session == null || session.getAttribute("categoria") == null)
        {
            return "";
        }

        return String.valueOf(session.getAttribute("categoria"));
    }

    private String chaveCategoria(String categoria)
    {
        if (categoria == null)
        {
            return "";
        }

        String texto = Normalizer.normalize(categoria.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        if (texto.contains("coordenador"))
        {
            return "coordenador";
        }
        if (texto.contains("cuidador"))
        {
            return "cuidador";
        }
        if (texto.contains("secret"))
        {
            return "secretaria";
        }
        if (texto.contains("nutricionista"))
        {
            return "nutricionista";
        }

        return "";
    }

    private User criarUsuario(String username, String senha, String categoria, Banco conexao) throws Exception
    {
        String usernameLimpo = username.trim();
        String senhaLimpa = senha.trim();
        User usuario = new User();

        if (usuario.buscarPorNome(usernameLimpo, conexao) != null)
        {
            return null;
        }

        usuario.setName(usernameLimpo);
        usuario.setSenha(passwordEncoder.encode(senhaLimpa));
        usuario.setEmail(usernameLimpo + "@sgav.local");

        if (!usuario.gravar(conexao))
        {
            String detalheErroUsuario = conexao.getMensagemErro();
            if (detalheErroUsuario != null && !detalheErroUsuario.isBlank())
            {
                throw new IllegalArgumentException("Nao foi possivel criar usuario para o funcionario: " + detalheErroUsuario);
            }
            throw new IllegalArgumentException("Nao foi possivel criar usuario para o funcionario");
        }

        return usuario;
    }

    private boolean gravarFuncionarioComCategoriaAlternativa(Funcionario funcionario, Banco conexao) throws Exception
    {
        if (funcionario.gravar(conexao))
        {
            return true;
        }

        String categoriaOriginal = funcionario.getCategoria();
        String categoriaAlternativa = categoriaAlternativa(categoriaOriginal);
        if (categoriaAlternativa == null)
        {
            return false;
        }

        funcionario.setCategoria(categoriaAlternativa);
        if (funcionario.gravar(conexao))
        {
            return true;
        }

        funcionario.setCategoria(categoriaOriginal);
        return false;
    }

    private boolean editarFuncionarioComCategoriaAlternativa(Funcionario funcionario, Banco conexao) throws Exception
    {
        if (funcionario.editar(conexao))
        {
            return true;
        }

        String categoriaOriginal = funcionario.getCategoria();
        String categoriaAlternativa = categoriaAlternativa(categoriaOriginal);
        if (categoriaAlternativa == null)
        {
            return false;
        }

        funcionario.setCategoria(categoriaAlternativa);
        if (funcionario.editar(conexao))
        {
            return true;
        }

        funcionario.setCategoria(categoriaOriginal);
        return false;
    }

    private boolean cpfJaExisteEmOutroFuncionario(Funcionario funcionarioEncontrado, String cpfPadronizado, Banco conexao) throws Exception
    {
        String cpfExistente = limparNumeros(funcionarioEncontrado.getCpf());
        if (cpfExistente.equals(cpfPadronizado))
        {
            return false;
        }

        Funcionario funcionarioCpf = new Funcionario();
        funcionarioCpf.setCpf(cpfPadronizado);
        return funcionarioCpf.buscarCpf(conexao);
    }

    private boolean telefoneJaExisteEmOutroFuncionario(int id, Funcionario funcionarioEncontrado, String telefone, Banco conexao) throws Exception
    {
        String telefoneExistente = funcionarioEncontrado.getTelefone();
        if (telefoneExistente != null && telefoneExistente.equals(telefone))
        {
            return false;
        }

        Funcionario funcionarioTelefone = new Funcionario();
        funcionarioTelefone.setTelefone(telefone);
        return funcionarioTelefone.buscarTelefoneExcluindoId(id, conexao);
    }

    private String padronizarCategoria(String categoria)
    {
        if (categoria == null)
        {
            return null;
        }

        String categoriaLimpa = categoria.trim();
        if ("Coordenador".equalsIgnoreCase(categoriaLimpa))
        {
            return "Coordenador";
        }

        if ("Cuidador".equalsIgnoreCase(categoriaLimpa))
        {
            return "Cuidador";
        }

        if ("Nutricionista".equalsIgnoreCase(categoriaLimpa))
        {
            return "Nutricionista";
        }

        if ("Secretaria".equalsIgnoreCase(categoriaLimpa) || "Secretária".equalsIgnoreCase(categoriaLimpa))
        {
            return "Secretaria";
        }

        return null;
    }

    private String categoriaAlternativa(String categoria)
    {
        if ("Secretaria".equalsIgnoreCase(categoria))
        {
            return "Secretária";
        }

        if ("Secretária".equalsIgnoreCase(categoria))
        {
            return "Secretaria";
        }

        return null;
    }

    private String limparNumeros(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.replaceAll("\\D", "");
    }

    private String padronizarTexto(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.trim();
    }

    private boolean validarCpf(String cpf)
    {
        cpf = limparNumeros(cpf);
        if (cpf.length() != 11 || cpf.matches("(\\d)\\1{10}"))
        {
            return false;
        }

        try
        {
            int soma = 0;
            int peso = 10;

            for (int i = 0; i < 9; i++)
            {
                soma += (cpf.charAt(i) - '0') * peso--;
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
                soma += (cpf.charAt(i) - '0') * peso--;
            }

            int digito2 = 11 - (soma % 11);
            if (digito2 >= 10)
            {
                digito2 = 0;
            }

            return digito1 == (cpf.charAt(9) - '0') && digito2 == (cpf.charAt(10) - '0');
        }
        catch (Exception e)
        {
            return false;
        }
    }

}
