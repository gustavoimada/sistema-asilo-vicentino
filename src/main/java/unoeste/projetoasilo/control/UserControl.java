package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.User;

import jakarta.servlet.http.HttpSession;
import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("login")
public class UserControl
{
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ====================== CRUD ===========================

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarUsuario(@RequestParam String username, @RequestParam String senha)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            String usernameLimpo = padronizarTexto(username);
            String senhaLimpa = padronizarTexto(senha);

            if (usernameLimpo.isEmpty())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Usuario obrigatorio"));
            }

            if (senhaLimpa.isEmpty())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Senha obrigatoria"));
            }

            User usuario = new User();
            if (usuario.buscarPorNome(usernameLimpo, conexao) != null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Usuario ja existe"));
            }

            usuario.setName(usernameLimpo);
            usuario.setSenha(passwordEncoder.encode(senhaLimpa));
            usuario.setEmail(usernameLimpo + "@sgav.local");

            if (usuario.gravar(conexao))
            {
                return ResponseEntity.ok().body(usuario);
            }

            String detalheErro = conexao.getMensagemErro();
            if (detalheErro != null && !detalheErro.isBlank())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel criar usuario: " + detalheErro));
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel criar usuario"));
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

    // ====================== FUNCOES AUXILIARES ===========================

    @PostMapping("entrar")
    public ResponseEntity<Object> autenticar(@RequestParam String username, @RequestParam String password, HttpSession session)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            String usernameLimpo = padronizarTexto(username);
            String senhaLimpa = padronizarTexto(password);
            User usuario = new User().buscarPorNomeExato(usernameLimpo, conexao);
            if (usuario == null || !senhaConfere(senhaLimpa, usuario.getSenha()))
            {
                return ResponseEntity.status(401).body(new Error("Erro", "Usuario ou senha invalidos"));
            }

            if (!senhaCriptografada(usuario.getSenha()))
            {
                usuario.atualizarSenha(passwordEncoder.encode(senhaLimpa), conexao);
            }

            Funcionario funcionario = new Funcionario().buscarPorUsuario(usuario.getIdUser(), conexao);
            if (funcionario == null)
            {
                funcionario = new Funcionario().buscarPorNome(usuario.getName(), conexao);
            }

            session.setAttribute("idUser", usuario.getIdUser());
            session.setAttribute("usuarioNome", usuario.getName());
            if (funcionario != null)
            {
                session.setAttribute("idFuncionario", funcionario.getIdFuncionario());
                session.setAttribute("funcionarioNome", funcionario.getNome());
                session.setAttribute("categoria", funcionario.getCategoria());
            }

            return ResponseEntity.ok().body(usuario);
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

    @GetMapping("sair")
    public ResponseEntity<Object> sair(HttpSession session)
    {
        session.invalidate();
        return ResponseEntity.ok().build();
    }

    @GetMapping("sessao")
    public ResponseEntity<Object> sessao(HttpSession session)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null)
            {
                return ResponseEntity.status(401).body(new Error("Erro", "Sessao invalida"));
            }
            return ResponseEntity.ok(funcionario);
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar sessao"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("funcionario/{idUser}")
    public ResponseEntity<Object> buscarFuncionarioPorUsuario(@PathVariable int idUser, @RequestParam(required = false) String nomeUsuario, HttpSession session)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            Funcionario encontrado = buscarFuncionarioDaSessao(session, conexao);
            if (encontrado != null)
            {
                return ResponseEntity.ok(encontrado);
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

    @GetMapping("listar")
    public ResponseEntity<Object> listar()
    {
        Banco conexao = Banco.getConnection();

        try
        {
            List<User> usuarios = new User().listar(conexao);
            if (!usuarios.isEmpty())
            {
                return ResponseEntity.ok().body(usuarios);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Usuario nao encontrado"));
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

    private String padronizarTexto(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.trim();
    }

    private boolean senhaConfere(String senhaDigitada, String senhaArmazenada)
    {
        if (senhaDigitada == null || senhaArmazenada == null)
        {
            return false;
        }

        if (senhaCriptografada(senhaArmazenada))
        {
            try
            {
                return passwordEncoder.matches(senhaDigitada, senhaArmazenada);
            }
            catch (IllegalArgumentException e)
            {
                return false;
            }
        }

        return senhaArmazenada.equals(senhaDigitada);
    }

    private boolean senhaCriptografada(String senha)
    {
        return senha != null
                && (senha.startsWith("$2a$") || senha.startsWith("$2b$") || senha.startsWith("$2y$"));
    }

    private Funcionario buscarFuncionarioDaSessao(HttpSession session, Banco conexao) throws SQLException
    {
        if (session == null)
        {
            return null;
        }

        Object idFuncionarioSessao = session.getAttribute("idFuncionario");
        if (idFuncionarioSessao != null)
        {
            int idFuncionario = Integer.parseInt(String.valueOf(idFuncionarioSessao));
            if (idFuncionario > 0)
            {
                Funcionario funcionario = new Funcionario().buscarId(idFuncionario, conexao);
                if (funcionario != null)
                {
                    return funcionario;
                }
            }
        }

        Object idUserSessao = session.getAttribute("idUser");
        if (idUserSessao != null)
        {
            int idUser = Integer.parseInt(String.valueOf(idUserSessao));
            if (idUser > 0)
            {
                return new Funcionario().buscarPorUsuario(idUser, conexao);
            }
        }

        return null;
    }
}
