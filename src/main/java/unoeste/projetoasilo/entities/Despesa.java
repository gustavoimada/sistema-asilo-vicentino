package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.DespesaDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class Despesa {

    private int idDespesa;
    private double valor;
    private String observacoes;
    private LocalDate dtVencimento;
    private LocalDate dtQuitacao;
    private boolean fixa;
    private String periodicidade;
    private TipoDespesa tipoDespesa;

    public Despesa() {
    }

    public Despesa(double valor, String observacoes, LocalDate dtVencimento, LocalDate dtQuitacao, boolean fixa, String periodicidade, TipoDespesa tipoDespesa) {
        this.valor = valor;
        this.observacoes = observacoes;
        this.dtVencimento = dtVencimento;
        this.dtQuitacao = dtQuitacao;
        this.fixa = fixa;
        this.periodicidade = periodicidade;
        this.tipoDespesa = tipoDespesa;
    }

    public int getIdDespesa() {
        return idDespesa;
    }

    public void setIdDespesa(int idDespesa) {
        this.idDespesa = idDespesa;
    }

    public double getValor() {
        return valor;
    }

    public void setValor(double valor) {
        this.valor = valor;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public LocalDate getDtVencimento() {
        return dtVencimento;
    }

    public void setDtVencimento(LocalDate dtVencimento) {
        this.dtVencimento = dtVencimento;
    }

    public LocalDate getDtQuitacao() {
        return dtQuitacao;
    }

    public void setDtQuitacao(LocalDate dtQuitacao) {
        this.dtQuitacao = dtQuitacao;
    }

    public boolean isFixa() {
        return fixa;
    }

    public void setFixa(boolean fixa) {
        this.fixa = fixa;
    }

    public String getPeriodicidade() {
        return periodicidade;
    }

    public void setPeriodicidade(String periodicidade) {
        this.periodicidade = periodicidade;
    }

    public TipoDespesa getTipoDespesa() {
        return tipoDespesa;
    }

    public void setTipoDespesa(TipoDespesa tipoDespesa) {
        this.tipoDespesa = tipoDespesa;
    }


    public boolean gravar(Banco conexao) throws SQLException {
        if (valor > 0
                && observacoes != null
                && dtVencimento != null
                && tipoDespesa != null
                && tipoDespesa.getTipo() != null
                && (!fixa || periodicidade != null)) {
            DespesaDAO dao = new DespesaDAO();
            return dao.gravar(this, conexao);
        }
        return false;
    }

    public boolean deletar(Banco conexao) throws SQLException {
        DespesaDAO dao = new DespesaDAO();
        return dao.deletar(this.idDespesa, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException {
        if (idDespesa > 0 && valor > 0 && observacoes != null && dtVencimento != null && tipoDespesa != null && tipoDespesa.getTipo() != null && (!fixa || periodicidade != null)) {
            DespesaDAO dao = new DespesaDAO();
            return dao.editar(this, conexao);
        }
        return false;
    }

    public Despesa buscarId(int id, Banco conexao) throws SQLException {
        DespesaDAO dao = new DespesaDAO();
        return dao.buscarPorId(id, conexao);
    }

    public List<Despesa> listar(Banco conexao) throws SQLException {
        DespesaDAO dao = new DespesaDAO();
        return dao.listar(conexao);
    }

    public List<Despesa> listar(String ordenacao, String direcao, Banco conexao) throws SQLException
    {
        DespesaDAO dao = new DespesaDAO();
        return dao.listar(ordenacao, direcao, conexao);
    }

    public List<Despesa> filtrar(String tipo, String status, String observacoes, LocalDate dtVencimento, LocalDate dtQuitacao, String fixa, String periodicidade, String ordenacao, String direcao, Banco conexao) throws SQLException
    {
        DespesaDAO dao = new DespesaDAO();
        return dao.filtrar(tipo, status, observacoes, dtVencimento, dtQuitacao, fixa, periodicidade, ordenacao, direcao, conexao);
    }

    public List<TipoDespesa> listarTipos(Banco conexao) throws SQLException
    {
        DespesaDAO dao = new DespesaDAO();
        return dao.listarTipos(conexao);
    }

    public List<Despesa> listarFixasPagasVencidas(Banco conexao) throws SQLException
    {
        DespesaDAO dao = new DespesaDAO();
        return dao.listarFixasPagasVencidas(conexao);
    }

    public boolean atualizarCicloFixo(LocalDate novoVencimento, Banco conexao) throws SQLException
    {
        if (this.idDespesa <= 0)
        {
            return false;
        }
        DespesaDAO dao = new DespesaDAO();
        return dao.atualizarCicloFixo(this.idDespesa, novoVencimento, conexao);
    }

    public boolean estornar(Banco conexao) throws SQLException
    {
        if (this.idDespesa <= 0)
        {
            return false;
        }
        DespesaDAO dao = new DespesaDAO();
        boolean estornou = dao.estornar(this.idDespesa, conexao);
        if (estornou)
        {
            this.dtQuitacao = null;
        }
        return estornou;
    }
}
