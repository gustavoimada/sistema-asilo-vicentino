package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.RegistrarUsoMedicacaoDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

public class RegistrarUsoMedicacao {
    private Long idRegistrarUsoMedicacao;

    private PrescricaoDose prescricaoDose;

    private Funcionario funcionario;

    private LocalDateTime dataRegistro;

    public RegistrarUsoMedicacao(PrescricaoDose prescricaoDose, Funcionario funcionario, LocalDateTime dataRegistro) {
        this.prescricaoDose = prescricaoDose;
        this.funcionario = funcionario;
        this.dataRegistro = dataRegistro;
    }

    public RegistrarUsoMedicacao() {
    }

    public Long getIdRegistrarUsoMedicacao() {
        return idRegistrarUsoMedicacao;
    }

    public void setIdRegistrarUsoMedicacao(Long idRegistrarUsoMedicacao) {
        this.idRegistrarUsoMedicacao = idRegistrarUsoMedicacao;
    }

    public PrescricaoDose getPrescricaoDose() {
        return prescricaoDose;
    }

    public void setPrescricaoDose(PrescricaoDose prescricaoDose) {
        this.prescricaoDose = prescricaoDose;
    }


    public Funcionario getFuncionario() {
        return funcionario;
    }

    public void setFuncionario(Funcionario funcionario) {
        this.funcionario = funcionario;
    }

    public LocalDateTime getDataRegistro() {
        return dataRegistro;
    }

    public void setDataRegistro(LocalDateTime dataRegistro) {
        this.dataRegistro = dataRegistro;
    }

    public boolean gravar(Banco conexao) throws SQLException {
        RegistrarUsoMedicacaoDAO registrarUsoMedicacaoDAO = new RegistrarUsoMedicacaoDAO();
        return registrarUsoMedicacaoDAO.gravar(this, conexao);
    }

    public List<RegistrarUsoMedicacao> listar(Banco conexao) throws SQLException {
        RegistrarUsoMedicacaoDAO registrarUsoMedicacaoDAO = new RegistrarUsoMedicacaoDAO();
        return registrarUsoMedicacaoDAO.listar(conexao);
    }

    public List<RegistrarUsoMedicacao> listarHoje(Banco conexao) throws SQLException {
        RegistrarUsoMedicacaoDAO registrarUsoMedicacaoDAO = new RegistrarUsoMedicacaoDAO();
        return registrarUsoMedicacaoDAO.listarHoje(conexao);
    }

    public List<RegistrarUsoMedicacao> listarPorTurno(FuncionarioTurnos turno, Banco conexao) throws SQLException {
        RegistrarUsoMedicacaoDAO registrarUsoMedicacaoDAO = new RegistrarUsoMedicacaoDAO();
        return registrarUsoMedicacaoDAO.listarPorTurno(turno, conexao);
    }

    public RegistrarUsoMedicacao buscarId(Long id, Banco conexao) throws SQLException {
        RegistrarUsoMedicacaoDAO registrarUsoMedicacaoDAO = new RegistrarUsoMedicacaoDAO();
        return registrarUsoMedicacaoDAO.buscarPorId(id, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException{
        RegistrarUsoMedicacaoDAO registrarUsoMedicacaoDAO = new RegistrarUsoMedicacaoDAO();
        return registrarUsoMedicacaoDAO.deletar(this.idRegistrarUsoMedicacao, conexao);
    }
}
