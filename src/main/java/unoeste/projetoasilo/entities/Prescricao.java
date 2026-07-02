package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.PrescricaoDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class Prescricao {
    private int idPrescricao;

    private Morador morador;

    private Medicamento medicamento;

    private Integer qtdDose;

    private LocalDate dtInicio;

    private LocalDate dtFim;

    private LocalTime primeiraDose;

    private int frequenciaValor;

    private String frequenciaUnidade;

    public Prescricao() {
    }

    public Prescricao(Morador morador, Medicamento medicamento, Integer qtdDose, LocalDate dtInicio, LocalDate dtFim, LocalTime primeiraDose, int frequenciaValor, String frequenciaUnidade) {
        this.morador = morador;
        this.medicamento = medicamento;
        this.qtdDose = qtdDose;
        this.dtInicio = dtInicio;
        this.dtFim = dtFim;
        this.primeiraDose = primeiraDose;
        this.frequenciaValor = frequenciaValor;
        this.frequenciaUnidade = frequenciaUnidade;
    }

    public int getIdPrescricao() {
        return idPrescricao;
    }

    public void setIdPrescricao(int idPrescricao) {
        this.idPrescricao = idPrescricao;
    }

    public Morador getMorador() {
        return morador;
    }

    public void setMorador(Morador morador) {
        this.morador = morador;
    }

    public Medicamento getMedicamento() {
        return medicamento;
    }

    public void setMedicamento(Medicamento medicamento) {
        this.medicamento = medicamento;
    }

    public LocalTime getPrimeiraDose() {
        return primeiraDose;
    }

    public void setPrimeiraDose(LocalTime primeiraDose) {
        this.primeiraDose = primeiraDose;
    }

    public int getFrequenciaValor() {
        return frequenciaValor;
    }

    public void setFrequenciaValor(int frequenciaValor) {
        this.frequenciaValor = frequenciaValor;
    }

    public String getFrequenciaUnidade() {
        return frequenciaUnidade;
    }

    public void setFrequenciaUnidade(String frequenciaUnidade) {
        this.frequenciaUnidade = frequenciaUnidade;
    }

    public Integer getQtdDose() {
        return qtdDose;
    }

    public void setQtdDose(Integer qtdDose) {
        this.qtdDose = qtdDose;
    }

    public LocalDate getDtInicio() {
        return dtInicio;
    }

    public void setDtInicio(LocalDate dtInicio) {
        this.dtInicio = dtInicio;
    }

    public LocalDate getDtFim() {
        return dtFim;
    }

    public void setDtFim(LocalDate dtFim) {
        this.dtFim = dtFim;
    }

    public boolean gravar(Banco conexao) throws SQLException {
        PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
        return prescricaoDAO.gravar(this, conexao);
    }

    public List<Prescricao> listar(Banco conexao) throws SQLException {
        PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
        return prescricaoDAO.listar(conexao);
    }

    public Prescricao buscarId(int id, Banco conexao) throws SQLException {
        PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
        return prescricaoDAO.bucarPorId(id, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException{
        PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
        return prescricaoDAO.deletar(this.idPrescricao, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException{
        PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
        return prescricaoDAO.editar(this, conexao);
    }

    public List<Prescricao> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException{
        PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
        return prescricaoDAO.listarOrdenado(valor, ordem, conexao);
    }
}
