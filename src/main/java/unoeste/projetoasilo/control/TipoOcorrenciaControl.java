package unoeste.projetoasilo.control;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Error;
import unoeste.projetoasilo.entities.TipoOcorrencia;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("tipoocorrencia")
public class TipoOcorrenciaControl
{
    // ====================== CRUD ===========================

    // Cadastra um novo tipo de ocorrencia.
    @PostMapping("cadastrar")
    public ResponseEntity<Object> cadastrarTipoOcorrencia(@RequestParam String descricao, @RequestParam int gravidade)
    {
        TipoOcorrencia tipoOcorrencia = new TipoOcorrencia(descricao, gravidade);
        Banco conexao = Banco.getConnection();
        try
        {
            if (tipoOcorrencia.gravar(conexao))
            {
                return ResponseEntity.ok(tipoOcorrencia);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel cadastrar o tipo de ocorrencia"));
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Edita um tipo de ocorrencia que ja existe.
    @PutMapping("{id}")
    public ResponseEntity<Object> editarTipoOcorrencia(@RequestParam int id, @RequestParam String descricao, @RequestParam int gravidade)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            TipoOcorrencia tipoEncontrado = new TipoOcorrencia().buscarPorId(id, conexao);
            if (tipoEncontrado == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia nao encontrado"));
            }
            if (!tipoEncontrado.isAtivo())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia inativo"));
            }

            tipoEncontrado.setDescricao(descricao);
            tipoEncontrado.setGravidade(gravidade);
            if (tipoEncontrado.editar(conexao))
            {
                return ResponseEntity.ok(tipoEncontrado);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel editar o tipo de ocorrencia"));
        }
        catch (SQLException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", "Falha ao acessar banco de dados"));
        }
        catch (IllegalArgumentException e)
        {
            return ResponseEntity.badRequest().body(new Error("Erro", e.getMessage()));
        }
        finally
        {
        	conexao.fechar();
        }
    }

    // Deleta um tipo de ocorrencia pelo id.
    @DeleteMapping("{id}")
    public ResponseEntity<Object> deletarTipoOcorrencia(@RequestParam int id)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            TipoOcorrencia tipoEncontrado = new TipoOcorrencia().buscarPorId(id, conexao);
            if (tipoEncontrado == null)
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia nao encontrado"));
            }
            if (!tipoEncontrado.isAtivo())
            {
                return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia ja esta inativo"));
            }

            if (tipoEncontrado.possuiOcorrenciaVinculada(conexao))
            {
                if (tipoEncontrado.desativar(conexao))
                {
                    return ResponseEntity.ok(tipoEncontrado);
                }
                return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel desativar o tipo de ocorrencia"));
            }

            if (tipoEncontrado.deletar(conexao))
            {
                return ResponseEntity.ok(tipoEncontrado);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel excluir o tipo de ocorrencia"));
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

    // ====================== FUNCOES AUXILIARES ===========================

    // Lista todos os tipos de ocorrencia cadastrados.
    @GetMapping("listar")
    public ResponseEntity<Object> listarTiposOcorrencia()
    {
        Banco conexao = Banco.getConnection();

        try
        {
            List<TipoOcorrencia> tiposOcorrencia = new TipoOcorrencia().listar(conexao);
            if (tiposOcorrencia != null)
            {
                return ResponseEntity.ok(tiposOcorrencia);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Nao foi possivel listar os tipos de ocorrencia"));
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

    // Busca um tipo de ocorrencia especifico pelo id.
    @GetMapping("buscar")
    public ResponseEntity<Object> buscarTipoOcorrenciaPorId(@RequestParam int id)
    {
        Banco conexao = Banco.getConnection();

        try
        {
            TipoOcorrencia tipoEncontrado = new TipoOcorrencia().buscarPorId(id, conexao);
            if (tipoEncontrado != null)
            {
                return ResponseEntity.ok(tipoEncontrado);
            }
            return ResponseEntity.badRequest().body(new Error("Erro", "Tipo de ocorrencia nao encontrado"));
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
}
