package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.AtividadesMoradorDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class AtividadesMorador {
    private Atividades idatividade;
    private Morador idmorador;
    private String observacao;

    public AtividadesMorador(Atividades idatividade, Morador idmorador) {
        this.idatividade = idatividade;
        this.idmorador = idmorador;
    }

    public AtividadesMorador() {
    }

    public Morador getIdmorador() {
        return idmorador;
    }

    public void setIdmorador(Morador idmorador) {
        this.idmorador = idmorador;
    }

    public Atividades getIdatividade() {
        return idatividade;
    }

    public void setIdatividade(Atividades idatividade) {
        this.idatividade = idatividade;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public boolean gravar(Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.gravar(this, conexao);
    }

    public AtividadesMorador buscarPorIds(int idAtividade, int idMorador, Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.buscarPorIds(idAtividade, idMorador, conexao);
    }

    public boolean editar(int idAtividadeAnterior, int idMoradorAnterior, Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.editar(this, idAtividadeAnterior, idMoradorAnterior, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.deletar(this.idatividade.getIdatividade(), this.idmorador.getIdMorador(), conexao);
    }

    public List<AtividadesMorador> listarPorAtividade(int idAtividade, Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.listarPorAtividade(idAtividade, conexao);
    }

    public boolean deletarPorAtividade(int idAtividade, Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.deletarPorAtividade(idAtividade, conexao);
    }

    public boolean deletarPorMorador(int idMorador, Banco conexao) throws SQLException {
        AtividadesMoradorDAO atividadesMoradorDAO = new AtividadesMoradorDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesMoradorDAO.deletarPorMorador(idMorador, conexao);
    }

}
