package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.HistoricoMoradorDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class HistoricoMorador {

    private int idHistoricoMorador;
    private LocalDate dtEntrada;
    private LocalDate dtSaida;
    private Morador morador;

    public HistoricoMorador() {
    }

    public HistoricoMorador(LocalDate dtEntrada, LocalDate dtSaida, Morador morador) {
        this.dtEntrada = dtEntrada;
        this.dtSaida = dtSaida;
        this.morador = morador;
    }

    public HistoricoMorador(Morador morador) {
        this.morador = morador;
    }

    public int getIdHistoricoMorador() {
        return idHistoricoMorador;
    }

    public void setIdHistoricoMorador(int idHistoricoMorador) {
        this.idHistoricoMorador = idHistoricoMorador;
    }

    public LocalDate getDtEntrada() {
        return dtEntrada;
    }

    public void setDtEntrada(LocalDate dtEntrada) {
        this.dtEntrada = dtEntrada;
    }

    public LocalDate getDtSaida() {
        return dtSaida;
    }

    public void setDtSaida(LocalDate dtSaida) {
        this.dtSaida = dtSaida;
    }

    public Morador getMorador() {
        return morador;
    }

    public void setMorador(Morador morador) {
        this.morador = morador;
    }

    public boolean gravar(Banco conexao) throws SQLException {
        HistoricoMoradorDAO dao = new HistoricoMoradorDAO();
        return dao.gravar(this, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException {
        HistoricoMoradorDAO dao = new HistoricoMoradorDAO();
        return dao.editar(this, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException {
        HistoricoMoradorDAO dao = new HistoricoMoradorDAO();
        return dao.deletar(this.idHistoricoMorador, conexao);
    }

    public HistoricoMorador buscarId(int id, Banco conexao) throws SQLException {
        HistoricoMoradorDAO dao = new HistoricoMoradorDAO();
        return dao.buscarPorId(id, conexao);
    }

    public List<HistoricoMorador> listar(Banco conexao) throws SQLException {
        HistoricoMoradorDAO dao = new HistoricoMoradorDAO();
        return dao.listar(conexao);
    }
}
