package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.PrescricaoDoseDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

public class PrescricaoDose {

    private Long idPrescricaoDose;

    private Prescricao prescricao;

    private LocalDateTime dataHoraPrevista;

    private boolean aplicado;

    public PrescricaoDose() {
    }

    public PrescricaoDose(Prescricao prescricao, LocalDateTime dataHoraPrevista, boolean aplicado) {
        this.prescricao = prescricao;
        this.dataHoraPrevista = dataHoraPrevista;
        this.aplicado = aplicado;
    }

    public PrescricaoDose(Long idPrescricaoDose, Prescricao prescricao, LocalDateTime dataHoraPrevista, boolean aplicado) {
        this.idPrescricaoDose = idPrescricaoDose;
        this.prescricao = prescricao;
        this.dataHoraPrevista = dataHoraPrevista;
        this.aplicado = aplicado;
    }

    public PrescricaoDose(Prescricao prescricao, LocalDateTime dataHoraPrevista) {
        this.prescricao = prescricao;
        this.dataHoraPrevista = dataHoraPrevista;
    }

    public Long getIdPrescricaoDose() {
        return idPrescricaoDose;
    }

    public void setIdPrescricaoDose(Long idPrescricaoDose) {
        this.idPrescricaoDose = idPrescricaoDose;
    }

    public Prescricao getPrescricao() {
        return prescricao;
    }

    public void setPrescricao(Prescricao prescricao) {
        this.prescricao = prescricao;
    }

    public LocalDateTime getDataHoraPrevista() {
        return dataHoraPrevista;
    }

    public void setDataHoraPrevista(LocalDateTime dataHoraPrevista) {
        this.dataHoraPrevista = dataHoraPrevista;
    }

    public boolean isAplicado() {
        return aplicado;
    }

    public void setAplicado(boolean aplicado) {
        this.aplicado = aplicado;
    }

    public boolean gravar(Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.gravar(this, conexao);
    }

    public List<PrescricaoDose> listar(Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.listar(conexao);
    }

    public List<PrescricaoDose> listarHoje(Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.listarHoje(conexao);
    }

    public List<PrescricaoDose> listarHojeFiltrado(String morador, String horario, boolean somenteAtrasados, Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.listarHojeFiltrado(morador, horario, somenteAtrasados, conexao);
    }

    public List<PrescricaoDose> listarAtrasadasDiasAnteriores(Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.listarAtrasadasDiasAnteriores(conexao);
    }

    public List<PrescricaoDose> listarAtrasadasDiasAnterioresFiltrado(String dia, String morador, Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.listarAtrasadasDiasAnterioresFiltrado(dia, morador, conexao);
    }

    public PrescricaoDose buscarId(Long id, Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.buscarPorId(id, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.deletar(this.idPrescricaoDose, conexao);
    }

    public boolean atualizar(Banco conexao) throws  SQLException{
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.atualizar(this.idPrescricaoDose, conexao);
    }

    public boolean atualizarAplicado(boolean aplicado, Banco conexao) throws SQLException {
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        return prescricaoDoseDAO.atualizarAplicado(this.idPrescricaoDose, aplicado, conexao);
    }
}
