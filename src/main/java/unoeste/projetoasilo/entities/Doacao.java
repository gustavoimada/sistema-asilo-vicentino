package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.DoacaoDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

public class Doacao
{
    private int idDoacao;
    private double valor;
    private String observacoes;
    private String cpfDoador;
    private String nomeDoador;
    private Timestamp dtDoacao;
    private String tipo;
    private String status;
    private String txid;
    private String pag_nome;
    private String pag_email;

    public Doacao()
    {
    }

    public Doacao(double valor, String observacoes, String cpfDoador, String nomeDoador, Timestamp dtDoacao, String tipo)
    {
        this.valor = valor;
        this.observacoes = observacoes;
        this.cpfDoador = cpfDoador;
        this.nomeDoador = nomeDoador;
        this.dtDoacao = dtDoacao;
        this.tipo = tipo;
    }

    public int getIdDoacao() { return idDoacao; }
    public void setIdDoacao(int idDoacao) { this.idDoacao = idDoacao; }
    public double getValor() { return valor; }
    public void setValor(double valor) { this.valor = valor; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public String getCpfDoador() { return cpfDoador; }
    public void setCpfDoador(String cpfDoador) { this.cpfDoador = cpfDoador; }
    public String getNomeDoador() { return nomeDoador; }
    public void setNomeDoador(String nomeDoador) { this.nomeDoador = nomeDoador; }
    public Timestamp getDtDoacao() { return dtDoacao; }
    public void setDtDoacao(Timestamp dtDoacao) { this.dtDoacao = dtDoacao; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTxid() { return txid; }
    public void setTxid(String txid) { this.txid = txid; }
    public String getPag_nome() { return pag_nome; }
    public void setPag_nome(String pag_nome) { this.pag_nome = pag_nome; }
    public String getPag_email() { return pag_email; }
    public void setPag_email(String pag_email) { this.pag_email = pag_email; }

    public boolean gravar(Banco conexao) throws SQLException
    {
        return new DoacaoDAO().gravar(this, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException
    {
        return new DoacaoDAO().editar(this, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        return new DoacaoDAO().deletar(this.idDoacao, conexao);
    }

    public boolean concluirAnalise(Banco conexao) throws SQLException
    {
        return new DoacaoDAO().atualizarStatus(this.idDoacao, "Concluida", conexao);
    }

    public boolean retornarAnalise(Banco conexao) throws SQLException
    {
        return new DoacaoDAO().atualizarStatus(this.idDoacao, "Em_Analise", conexao);
    }

    public Doacao buscarId(int id, Banco conexao) throws SQLException
    {
        return new DoacaoDAO().buscarPorId(id, conexao);
    }

    public List<Doacao> listar(Banco conexao) throws SQLException
    {
        return new DoacaoDAO().listar(conexao);
    }

    public List<Doacao> listarOrdenado(String valor, String ordem, String tipo, String dataInicio, String dataFim, Banco conexao) throws SQLException
    {
        return new DoacaoDAO().listarOrdenado(valor, ordem, tipo, dataInicio, dataFim, conexao);
    }

}
