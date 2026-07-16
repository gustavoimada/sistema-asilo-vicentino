package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.FuncionarioTurnos;
import unoeste.projetoasilo.entities.Medicamento;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Prescricao;
import unoeste.projetoasilo.entities.PrescricaoDose;
import unoeste.projetoasilo.entities.RegistrarUsoMedicacao;
import unoeste.projetoasilo.util.TurnosPadrao;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class RegistrarUsoMedicacaoDAO {
    public boolean gravar(RegistrarUsoMedicacao registrarUsoMedicacao, Banco conexao) throws SQLException{
        boolean gravou = false;
        String sql = """
                INSERT INTO registrarusomedicacao(
                	prescricaodose_idprescricaodose, funcionario_idfuncionario, dataregistro)
                	VALUES ('#1', '#2', '#3');
                """;
        sql = sql.replace("#1", String.valueOf(registrarUsoMedicacao.getPrescricaoDose().getIdPrescricaoDose()));
        sql = sql.replace("#2", String.valueOf(registrarUsoMedicacao.getFuncionario().getIdFuncionario()));
        sql = sql.replace("#3", String.valueOf(registrarUsoMedicacao.getDataRegistro()));

        if(conexao.manipular(sql)){
            int novoId = conexao.getMaxPK("registrarusomedicacao", "idregistrarusomedicacao");
            if(novoId > 0){
                registrarUsoMedicacao.setIdRegistrarUsoMedicacao(Long.valueOf(novoId));
                gravou = true;
            }
        }
        return gravou;
    }

    public List<RegistrarUsoMedicacao> listar(Banco conexao) throws SQLException {
        List<RegistrarUsoMedicacao> registrarUsoMedicacaoList = new ArrayList<>();
        String sql = """
                SELECT idregistrarusomedicacao, prescricaodose_idprescricaodose, funcionario_idfuncionario, dataregistro
                FROM registrarusomedicacao
                ORDER BY dataregistro DESC
                """;
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
                Funcionario funcionario = new Funcionario();
                PrescricaoDose prescricaoDose = new PrescricaoDose();

                long idPrescricaoDose = rs.getLong("prescricaodose_idprescricaodose");
                int idFuncionario = rs.getInt("funcionario_idfuncionario");
                Timestamp dataRegistro = rs.getTimestamp("dataregistro");

                registrarUsoMedicacao.setIdRegistrarUsoMedicacao(rs.getLong("idregistrarusomedicacao"));
                registrarUsoMedicacao.setPrescricaoDose(prescricaoDose.buscarId(idPrescricaoDose, conexao));
                registrarUsoMedicacao.setFuncionario(funcionario.buscarId(idFuncionario, conexao));
                if (dataRegistro != null) {
                    registrarUsoMedicacao.setDataRegistro(dataRegistro.toLocalDateTime());
                }

                registrarUsoMedicacaoList.add(registrarUsoMedicacao);
            }
        }

        return registrarUsoMedicacaoList;
    }

    public List<RegistrarUsoMedicacao> listarHoje(Banco conexao) throws SQLException {
        List<RegistrarUsoMedicacao> registrarUsoMedicacaoList = new ArrayList<>();
        String sql = """
                SELECT idregistrarusomedicacao, prescricaodose_idprescricaodose, funcionario_idfuncionario, dataregistro
                FROM registrarusomedicacao
                WHERE dataregistro >= CURRENT_DATE
                  AND dataregistro < CURRENT_DATE + INTERVAL '1 day'
                ORDER BY dataregistro DESC
                """;
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                RegistrarUsoMedicacao registrarUsoMedicacao = new RegistrarUsoMedicacao();
                Funcionario funcionario = new Funcionario();
                PrescricaoDose prescricaoDose = new PrescricaoDose();

                long idPrescricaoDose = rs.getLong("prescricaodose_idprescricaodose");
                int idFuncionario = rs.getInt("funcionario_idfuncionario");
                Timestamp dataRegistro = rs.getTimestamp("dataregistro");

                registrarUsoMedicacao.setIdRegistrarUsoMedicacao(rs.getLong("idregistrarusomedicacao"));
                registrarUsoMedicacao.setPrescricaoDose(prescricaoDose.buscarId(idPrescricaoDose, conexao));
                registrarUsoMedicacao.setFuncionario(funcionario.buscarId(idFuncionario, conexao));
                if (dataRegistro != null) {
                    registrarUsoMedicacao.setDataRegistro(dataRegistro.toLocalDateTime());
                }

                registrarUsoMedicacaoList.add(registrarUsoMedicacao);
            }
        }

        return registrarUsoMedicacaoList;
    }

    public List<RegistrarUsoMedicacao> listarPorTurno(FuncionarioTurnos turno, Banco conexao) throws SQLException {
        String inicio = montarDataHora(turno);
        String fim = montarFimDataHora(turno);
        if (inicio == null || inicio.isBlank()) {
            return new ArrayList<>();
        }

        List<RegistrarUsoMedicacao> registrarUsoMedicacaoList = new ArrayList<>();
        String sql = """
                SELECT rum.idregistrarusomedicacao,
                       rum.dataregistro,
                       pd.idprescricaodose,
                       p.idprescricao,
                       med.idmedicamento,
                       med.nome AS medicamento,
                       mor.idmorador,
                       mor.nome AS morador,
                       f.idfuncionario,
                       f.nome AS funcionario
                FROM registrarusomedicacao rum
                INNER JOIN prescricaodose pd ON pd.idprescricaodose = rum.prescricaodose_idprescricaodose
                INNER JOIN prescricao p ON p.idprescricao = pd.prescricao_idprescricao
                INNER JOIN medicamento med ON med.idmedicamento = p.medicamento_idmedicamento
                INNER JOIN morador mor ON mor.idMorador = p.morador_idmorador
                INNER JOIN funcionario f ON f.idfuncionario = rum.funcionario_idfuncionario
                WHERE rum.funcionario_idfuncionario = #1
                AND rum.dataregistro >= '#2'
                AND rum.dataregistro <= '#3'
                ORDER BY rum.dataregistro
                """;
        sql = sql.replace("#1", String.valueOf(turno.getIdFuncionario()));
        sql = sql.replace("#2", inicio);
        sql = sql.replace("#3", fim);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null) {
            while (rs.next()) {
                registrarUsoMedicacaoList.add(popularRegistroCompleto(rs));
            }
        }

        return registrarUsoMedicacaoList;
    }

    public RegistrarUsoMedicacao buscarPorId(Long id, Banco conexao) throws SQLException {
        String sql = """
                SELECT idregistrarusomedicacao, prescricaodose_idprescricaodose, funcionario_idfuncionario, dataregistro
                FROM registrarusomedicacao
                WHERE idregistrarusomedicacao = #1
                """;
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);

        RegistrarUsoMedicacao registro = null;
        if (rs != null) {
            if (rs.next()) {
                Funcionario funcionario = new Funcionario();
                PrescricaoDose prescricaoDose = new PrescricaoDose();
                Timestamp dataRegistro = rs.getTimestamp("dataregistro");

                registro = new RegistrarUsoMedicacao();
                registro.setIdRegistrarUsoMedicacao(rs.getLong("idregistrarusomedicacao"));
                registro.setPrescricaoDose(prescricaoDose.buscarId(rs.getLong("prescricaodose_idprescricaodose"), conexao));
                registro.setFuncionario(funcionario.buscarId(rs.getInt("funcionario_idfuncionario"), conexao));
                if (dataRegistro != null) {
                    registro.setDataRegistro(dataRegistro.toLocalDateTime());
                }
            }
        }

        return registro;
    }

    public boolean deletar(Long id, Banco conexao) throws SQLException{
        String sql= "DELETE FROM registrarusomedicacao WHERE idregistrarusomedicacao = " + id;
        boolean deletou = false;
        if (conexao.manipular(sql))
        {
            deletou = true;
        }
        return deletou;
    }

    private RegistrarUsoMedicacao popularRegistroCompleto(ResultSet rs) throws SQLException {
        Medicamento medicamento = new Medicamento();
        medicamento.setIdMedicamento(rs.getInt("idmedicamento"));
        medicamento.setNome(rs.getString("medicamento"));

        Morador morador = new Morador();
        morador.setIdMorador(rs.getInt("idmorador"));
        morador.setNome(rs.getString("morador"));

        Prescricao prescricao = new Prescricao();
        prescricao.setIdPrescricao(rs.getInt("idprescricao"));
        prescricao.setMedicamento(medicamento);
        prescricao.setMorador(morador);

        PrescricaoDose prescricaoDose = new PrescricaoDose();
        prescricaoDose.setIdPrescricaoDose(rs.getLong("idprescricaodose"));
        prescricaoDose.setPrescricao(prescricao);

        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(rs.getInt("idfuncionario"));
        funcionario.setNome(rs.getString("funcionario"));

        RegistrarUsoMedicacao registro = new RegistrarUsoMedicacao();
        registro.setIdRegistrarUsoMedicacao(rs.getLong("idregistrarusomedicacao"));
        registro.setPrescricaoDose(prescricaoDose);
        registro.setFuncionario(funcionario);

        Timestamp dataRegistro = rs.getTimestamp("dataregistro");
        if (dataRegistro != null) {
            registro.setDataRegistro(dataRegistro.toLocalDateTime());
        }

        return registro;
    }

    private String montarDataHora(FuncionarioTurnos turno)
    {
        if (turno == null || turno.getDataEscala() == null || turno.getHoraInicio() == null)
        {
            return null;
        }
        return turno.getDataEscala() + " " + padronizarHora(turno.getHoraInicio());
    }

    private String montarFimDataHora(FuncionarioTurnos turno)
    {
        if (turno == null || turno.getDataEscala() == null)
        {
            return null;
        }

        if (turno.getHoraFim() == null)
        {
            return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Timestamp(System.currentTimeMillis()));
        }

        LocalDate dataBase = turno.getDataEscala();
        LocalTime horaInicio = turno.getHoraInicio() != null
                ? turno.getHoraInicio()
                : TurnosPadrao.horaInicio(turno.getIdTurno());
        if (horaInicio != null && !turno.getHoraFim().isAfter(horaInicio))
        {
            dataBase = dataBase.plusDays(1);
        }
        return dataBase + " " + padronizarHora(turno.getHoraFim());
    }

    private String padronizarHora(LocalTime hora)
    {
        if (hora == null)
        {
            return "00:00:00";
        }
        String texto = hora.toString();
        if (texto.length() == 5)
        {
            return texto + ":00";
        }
        return texto;
    }
}
