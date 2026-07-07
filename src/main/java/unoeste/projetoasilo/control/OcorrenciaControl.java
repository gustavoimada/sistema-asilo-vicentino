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
import unoeste.projetoasilo.dao.TurnoDAO;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.FuncionarioTurnos;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Ocorrencia;
import unoeste.projetoasilo.entities.OcorrenciaMorador;
import unoeste.projetoasilo.entities.TipoOcorrencia;
import unoeste.projetoasilo.entities.Turno;

import jakarta.servlet.http.HttpSession;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("ocorrencia")
public class OcorrenciaControl
{
    // ====================== CRUD ===========================

    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarOcorrencia(@RequestParam int idTipoOcorrencia, @RequestParam String observacoes, @RequestParam(required = false) String idsMoradores, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            // busco o tipo com o id recebido do front
            TipoOcorrencia tipo = new TipoOcorrencia().buscarPorId(idTipoOcorrencia, conexao);
            if (tipo == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia nao encontrado"));
            }
            if (!tipo.isAtivo())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia inativo para novos registros"));
            }

            // busco o funcionario com o id recebido do front
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado para o usuario logado"));
            }

            // busco o turno desse momento pelo funcionario
            Turno turnoAtivo = new Turno().buscarTurnoAtivoPorFuncionario(funcionario.getIdFuncionario(), conexao);
            if (turnoAtivo == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nenhum turno ativo encontrado para o funcionario"));
            }

            // monta alista de moradores
            // uma lista de moradores que foram selecionados nessa ocorrencia (pode ser 0 ou N)
            List<Morador> moradoresSelecionados = buscarMoradores(conexao, idsMoradores);

            // preencho esse objeto ocorrencia com todos esses dados acima
            Ocorrencia ocorrencia = new Ocorrencia();
            ocorrencia.setTipoOcorrencia(tipo);
            ocorrencia.setObservacoes(padronizarObservacoes(observacoes));
            ocorrencia.setDtOcorrencia(new Timestamp(System.currentTimeMillis()));
            ocorrencia.setFuncionario(funcionario);
            ocorrencia.setTurno(turnoAtivo);

            // grava a ocorrencia
            if (!ocorrencia.gravar(conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel registrar a ocorrencia"));
            }

            // passa a lista de moradores dessa ocorrencia e salva na tabela
            if (!salvarMoradoresOcorrencia(conexao, ocorrencia, moradoresSelecionados))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Ocorrencia criada, mas nao foi possivel vincular todos os moradores"));
            }

            return ResponseEntity.ok(ocorrencia);
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

    @PutMapping("editar")
    public ResponseEntity<Object> editarOcorrencia(@RequestParam int idOcorrencia, @RequestParam int idTipoOcorrencia, @RequestParam String observacoes, @RequestParam(required = false) String idsMoradores, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado para o usuario logado"));
            }

            Ocorrencia ocorrenciaExistente = new Ocorrencia().buscarPorId(idOcorrencia, conexao);
            if (ocorrenciaExistente == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Ocorrencia nao encontrada"));
            }

            if (ocorrenciaExistente.getFuncionario() == null || ocorrenciaExistente.getFuncionario().getIdFuncionario() != funcionario.getIdFuncionario())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Voce nao pode editar esta ocorrencia"));
            }

            TipoOcorrencia tipo = new TipoOcorrencia().buscarPorId(idTipoOcorrencia, conexao);
            if (tipo == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia nao encontrado"));
            }
            if (!tipo.isAtivo())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia inativo para novos registros"));
            }

            List<Morador> moradoresSelecionados = buscarMoradores(conexao, idsMoradores);

            ocorrenciaExistente.setTipoOcorrencia(tipo);
            ocorrenciaExistente.setObservacoes(padronizarObservacoes(observacoes));

            if (!ocorrenciaExistente.atualizar(conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel atualizar a ocorrencia"));
            }

            OcorrenciaMorador ocorrenciaMorador = new OcorrenciaMorador();
            ocorrenciaMorador.deletarPorOcorrencia(ocorrenciaExistente.getIdOcorrencia(), conexao);
            if (!salvarMoradoresOcorrencia(conexao, ocorrenciaExistente, moradoresSelecionados))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Ocorrencia atualizada, mas nao foi possivel vincular todos os moradores"));
            }

            return ResponseEntity.ok(ocorrenciaExistente);
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

    @DeleteMapping("deletar")
    public ResponseEntity<Object> deletarOcorrencia(@RequestParam int idOcorrencia, HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            boolean ehCoordenador = funcionario != null && funcionario.getCategoria() != null && funcionario.getCategoria().equalsIgnoreCase("Coordenador");

            if (funcionario == null && !ehCoordenador)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Funcionario nao encontrado para o usuario logado"));
            }

            Ocorrencia ocorrencia = new Ocorrencia().buscarPorId(idOcorrencia, conexao);
            if (ocorrencia == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Ocorrencia nao encontrada"));
            }

            if (!ehCoordenador && (ocorrencia.getFuncionario() == null || funcionario == null || ocorrencia.getFuncionario().getIdFuncionario() != funcionario.getIdFuncionario()))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Voce nao pode excluir esta ocorrencia"));
            }

            OcorrenciaMorador ocorrenciaMorador = new OcorrenciaMorador();
            ocorrenciaMorador.deletarPorOcorrencia(idOcorrencia, conexao);
            if (!ocorrencia.deletar(conexao))
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir a ocorrencia"));
            }

            return ResponseEntity.ok("Ocorrencia excluida com sucesso");
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

    @GetMapping("tipos")
    public ResponseEntity<Object> listarTiposOcorrenciaRegistro()
    {
        Banco conexao = Banco.getConnection();
        try
        {
            return ResponseEntity.ok(new TipoOcorrencia().listar(conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar tipos de ocorrencia"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("moradores")
    public ResponseEntity<Object> listarMoradoresRegistro()
    {
        Banco conexao = Banco.getConnection();
        try
        {
            return ResponseEntity.ok(new Morador().listar(conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar moradores"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("moradores/{idOcorrencia}")
    public ResponseEntity<Object> listarMoradoresDaOcorrencia(@PathVariable int idOcorrencia)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            OcorrenciaMorador ocorrenciaMorador = new OcorrenciaMorador();
            return ResponseEntity.ok(ocorrenciaMorador.listarMoradoresPorOcorrencia(idOcorrencia, conexao));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar moradores da ocorrencia"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    @GetMapping("listar")
    public ResponseEntity<Object> listarOcorrencias()
    {
        Banco conexao = Banco.getConnection();

        try
        {
            List<Ocorrencia> ocorrencias = new Ocorrencia().listar(conexao);
            return ResponseEntity.ok(ocorrencias);
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

    @GetMapping("turno")
    public ResponseEntity<Object> listarOcorrenciasPorTurno(@RequestParam int idFuncionarioTurnos)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            FuncionarioTurnos turno = new TurnoDAO().buscarDetalhesTurno(idFuncionarioTurnos, conexao);
            if (turno == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Turno nao encontrado"));
            }

            return ResponseEntity.ok(new Ocorrencia().listarPorTurno(turno, conexao));
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

    private List<Morador> buscarMoradores(Banco conexao, String idsMoradores) throws Exception
    {
        List<Morador> moradores = new ArrayList<>();

        // se tiver vazio ja vaza
        if (idsMoradores == null || idsMoradores.isBlank())
        {
            return moradores;
        }

        // os ids vieram por uma string com sepradores de , então arruma isso e bota num vetor
        String[] ids = idsMoradores.split(",");

        // comeca a percorrer toda o vetor
        for (String valor : ids)
        {
            String limpo;

            if (valor == null)
            {
                limpo = "";
            }
            else
            {
                limpo = valor.trim();
            }

            if (!limpo.isBlank())
            {
                int idMorador;
                try
                {
                    idMorador = Integer.parseInt(limpo);
                }
                catch (NumberFormatException e)
                {
                    throw new IllegalArgumentException("Lista de moradores invalida");
                }

                Morador morador = new Morador().buscarId(idMorador, conexao);
                if (morador == null)
                {
                    throw new IllegalArgumentException("Morador nao encontrado: " + idMorador);
                }
                moradores.add(morador);
            }
        }

        return moradores;
    }

    // serve para tirar espaços do começo e do fim, dar uma padronizada antes de salvar
    // para não ter que ficar obrigando o usuario a digitar certinho
    private String padronizarObservacoes(String observacoes)
    {
        if (observacoes == null)
        {
            return null;
        }
        String texto = observacoes.trim().replaceAll("\\s+", " ");
        if (texto.isBlank())
        {
            return null;
        }
        return texto;
    }

    // salva esses moradores que o usuario selecionou na tabela de OcorrenciasMorador
    private boolean salvarMoradoresOcorrencia(Banco conexao, Ocorrencia ocorrencia, List<Morador> moradoresSelecionados) throws Exception
    {
        for (Morador morador : moradoresSelecionados)
        {
            OcorrenciaMorador ocorrenciaMorador = new OcorrenciaMorador();
            ocorrenciaMorador.setOcorrencia(ocorrencia);
            ocorrenciaMorador.setMorador(morador);
            if (!ocorrenciaMorador.gravar(conexao))
            {
                return false;
            }
        }
        return true;
    }

    // front usa essa funcao para poder preencher uns dados tipo do cabeçalho do funcionario
    @GetMapping("funcionario-contexto")
    public ResponseEntity<Object> funcionarioContexto(HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario != null)
            {
                return ResponseEntity.ok(funcionario);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new Error("Erro", "Funcionario nao encontrado"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar funcionario"));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // O front usa essa funcao para saber se tem um turno ativo ou não, ou seja, valida
    @GetMapping("turno-ativo")
    public ResponseEntity<Object> turnoAtivo(HttpSession session)
    {
        Banco conexao = Banco.getConnection();
        try
        {
            Funcionario funcionario = buscarFuncionarioDaSessao(session, conexao);
            if (funcionario == null)
            {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new Error("Erro", "Funcionario nao encontrado"));
            }

            Turno turnoAtivo = new Turno().buscarTurnoAtivoPorFuncionario(funcionario.getIdFuncionario(), conexao);
            if (turnoAtivo != null)
            {
                return ResponseEntity.ok(turnoAtivo);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new Error("Erro", "Nenhum turno ativo encontrado"));
        }
        catch (Exception e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao carregar turno ativo"));
        }
        finally
        {
        	conexao.fechar();
        }
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
