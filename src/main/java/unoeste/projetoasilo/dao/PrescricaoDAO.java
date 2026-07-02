package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Medicamento;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.Prescricao;
import unoeste.projetoasilo.entities.PrescricaoDose;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PrescricaoDAO {

    public boolean gravar(Prescricao prescricao, Banco conexao) throws SQLException{
        boolean gravou = false;
        String sql = """
                INSERT INTO prescricao(
                	morador_idmorador, medicamento_idmedicamento, qtddose, dtinicio, dtfim, frequenciavalor, frequenciaunidade, primeiradose)
                	VALUES (#1, #2, #3, '#4', '#5', #6, '#7', '#8');
                """;
        sql = sql.replace("#1", String.valueOf(prescricao.getMorador().getIdMorador()));
        sql = sql.replace("#2", String.valueOf(prescricao.getMedicamento().getIdMedicamento()));
        sql = sql.replace("#3", String.valueOf(prescricao.getQtdDose()));
        sql = sql.replace("#4", prescricao.getDtInicio().toString());
        sql = sql.replace("#5", prescricao.getDtFim().toString());
        sql = sql.replace("#6", String.valueOf(prescricao.getFrequenciaValor()));
        sql = sql.replace("#7", prescricao.getFrequenciaUnidade());
        sql = sql.replace("#8", String.valueOf(prescricao.getPrimeiraDose()));

        if (conexao.manipular(sql)) {
            int novoId = conexao.getMaxPK("prescricao", "idprescricao");
            if (novoId > 0) {
                prescricao.setIdPrescricao(novoId);
                gravou = gerarDosesPrescricao(prescricao, conexao);
            }
        }
        return gravou;
    }

    public List<Prescricao> listar(Banco conexao) throws SQLException{
        String sql = """
                SELECT idprescricao, morador_idmorador, medicamento_idmedicamento, qtddose, dtinicio, dtfim, frequenciavalor, frequenciaunidade, primeiradose
                FROM prescricao
                """;
        List<Prescricao> prescricaoList = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if(rs != null){
            while(rs.next()){
                Prescricao prescricao = new Prescricao();
                Medicamento medicamento = new Medicamento();
                Morador morador = new Morador();
                int idmed = (rs.getInt("medicamento_idmedicamento"));
                prescricao.setIdPrescricao(rs.getInt("idprescricao"));
                int idmor = (rs.getInt("morador_idmorador"));
                prescricao.setMorador(morador.buscarId(idmor, conexao));
                prescricao.setMedicamento(medicamento.buscarId(idmed, conexao));
                prescricao.setQtdDose(rs.getObject("qtddose", Integer.class));
                prescricao.setFrequenciaValor(rs.getInt("frequenciavalor"));
                prescricao.setFrequenciaUnidade(rs.getString("frequenciaunidade"));
                prescricao.setDtInicio(rs.getDate("dtinicio").toLocalDate());
                prescricao.setDtFim(rs.getDate("dtfim").toLocalDate());
                prescricao.setPrimeiraDose(rs.getTime("primeiradose").toLocalTime());
                prescricaoList.add(prescricao);
            }
        }
        return prescricaoList;
    }

    public Prescricao bucarPorId(int id, Banco conexao) throws SQLException{
        String sql = """
                SELECT idprescricao, morador_idmorador, medicamento_idmedicamento, qtddose, dtinicio, dtfim, frequenciavalor, frequenciaunidade, primeiradose
                	FROM prescricao WHERE idprescricao = #1;
                """;
        ResultSet rs;
        sql = sql.replace("#1", String.valueOf(id));
        rs = conexao.consultar(sql);

        Prescricao pre = null;
        if (rs != null)
        {
            if (rs.next()) {
                Prescricao prescricao = new Prescricao();
                Medicamento medicamento = new Medicamento();
                Morador morador = new Morador();
                int idmed = (rs.getInt("medicamento_idmedicamento"));
                prescricao.setIdPrescricao(rs.getInt("idprescricao"));
                int idmor = (rs.getInt("morador_idmorador"));
                prescricao.setMorador(morador.buscarId(idmor, conexao));
                prescricao.setMedicamento(medicamento.buscarId(idmed, conexao));
                prescricao.setQtdDose(rs.getObject("qtddose", Integer.class));
                prescricao.setFrequenciaValor(rs.getInt("frequenciavalor"));
                prescricao.setFrequenciaUnidade(rs.getString("frequenciaunidade"));
                prescricao.setDtInicio(rs.getDate("dtinicio").toLocalDate());
                prescricao.setDtFim(rs.getDate("dtfim").toLocalDate());
                prescricao.setPrimeiraDose(rs.getTime("primeiradose").toLocalTime());
                pre = prescricao;
            }
        }
        return pre;
    }

    public boolean deletar(int id, Banco conexao) throws SQLException{
        String sql = "DELETE FROM prescricao WHERE idprescricao = "+id;
        boolean deletou = false;
        if (conexao.manipular(sql))
        {
            deletou = true;
        }
        return deletou;
    }

    public boolean editar(Prescricao prescricao, Banco conexao) throws SQLException{
        String sql = """
                UPDATE prescricao
                SET morador_idmorador = #1,
                    medicamento_idmedicamento = #2,
                    qtddose = #3,
                    dtinicio = '#4',
                    dtfim = '#5',
                    frequenciavalor = #6,
                    frequenciaunidade = '#7',
                    primeiradose = '#8'
                WHERE idprescricao = #9
                """;
        sql = sql.replace("#1", String.valueOf(prescricao.getMorador().getIdMorador()));
        sql = sql.replace("#2", String.valueOf(prescricao.getMedicamento().getIdMedicamento()));
        sql = sql.replace("#3", String.valueOf(prescricao.getQtdDose()));
        sql = sql.replace("#4", prescricao.getDtInicio().toString());
        sql = sql.replace("#5", prescricao.getDtFim().toString());
        sql = sql.replace("#6", String.valueOf(prescricao.getFrequenciaValor()));
        sql = sql.replace("#7", prescricao.getFrequenciaUnidade());
        sql = sql.replace("#8", String.valueOf(prescricao.getPrimeiraDose()));
        sql = sql.replace("#9", String.valueOf(prescricao.getIdPrescricao()));

        if (!conexao.manipular(sql)) {
            return false;
        }

        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        boolean removeuDosesAntigas = prescricaoDoseDAO.deletarPorPrescricao(prescricao.getIdPrescricao(), conexao);
        if (!removeuDosesAntigas) {
            return false;
        }

        return gerarDosesPrescricao(prescricao, conexao);
    }

    public List<Prescricao> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException{
        String sql = "SELECT * FROM prescricao ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<Prescricao> prescricaoList = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if(rs != null){
            while(rs.next()){
                Prescricao prescricao = new Prescricao();
                Medicamento medicamento = new Medicamento();
                Morador morador = new Morador();
                int idmed = (rs.getInt("medicamento_idmedicamento"));
                prescricao.setIdPrescricao(rs.getInt("idprescricao"));
                int idmor = (rs.getInt("morador_idmorador"));
                prescricao.setMorador(morador.buscarId(idmor, conexao));
                prescricao.setMedicamento(medicamento.buscarId(idmed, conexao));
                prescricao.setQtdDose(rs.getObject("qtddose", Integer.class));
                prescricao.setFrequenciaValor(rs.getInt("frequenciavalor"));
                prescricao.setFrequenciaUnidade(rs.getString("frequenciaunidade"));
                prescricao.setDtInicio(rs.getDate("dtinicio").toLocalDate());
                prescricao.setDtFim(rs.getDate("dtfim").toLocalDate());
                prescricao.setPrimeiraDose(rs.getTime("primeiradose").toLocalTime());
                prescricaoList.add(prescricao);
            }
        }
        return prescricaoList;
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "idprescricao";
        }
        return switch (valor.toLowerCase()) {
            case "idprescricao" -> "idprescricao";
            case "morador_idmorador" -> "morador_idmorador";
            case "medicamento_idmedicamento" -> "medicamento_idmedicamento";
            case "qtddose" -> "qtddose";
            case "dtinicio" -> "dtinicio";
            case "dtfim" -> "dtfim";
            case "frequenciavalor" -> "frequenciavalor";
            case "frequenciaunidade" -> "frequenciaunidade";
            case "primeiradose" -> "primeiradose";
            default -> "idprescricao";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }

    private boolean gerarDosesPrescricao(Prescricao prescricao, Banco conexao) throws SQLException {
        LocalDateTime dataHoraAtual = LocalDateTime.of(prescricao.getDtInicio(), prescricao.getPrimeiraDose());
        LocalDateTime dataHoraLimite = prescricao.getDtFim().atTime(23, 59, 59);
        PrescricaoDoseDAO prescricaoDoseDAO = new PrescricaoDoseDAO();
        Prescricao prescricaoRef = new Prescricao();
        prescricaoRef.setIdPrescricao(prescricao.getIdPrescricao());
        long intervaloEmSegundos = calcularIntervaloEmSegundos(
                prescricao.getFrequenciaValor(),
                prescricao.getFrequenciaUnidade()
        );
        boolean gravouTodas = !dataHoraAtual.isAfter(dataHoraLimite);

        while (gravouTodas && !dataHoraAtual.isAfter(dataHoraLimite)) {
            PrescricaoDose prescricaoDose = new PrescricaoDose(prescricaoRef, dataHoraAtual);
            gravouTodas = prescricaoDoseDAO.gravar(prescricaoDose, conexao);
            dataHoraAtual = dataHoraAtual.plusSeconds(intervaloEmSegundos);
        }

        return gravouTodas;
    }

    private long calcularIntervaloEmSegundos(int frequenciaValor, String frequenciaUnidade) {
        long segundosDaUnidade = obterSegundosDaUnidade(frequenciaUnidade);
        return Math.max(1L, Math.round((double) segundosDaUnidade / frequenciaValor));
    }

    private long obterSegundosDaUnidade(String frequenciaUnidade) {
        String unidade = "";
        if (frequenciaUnidade != null) {
            unidade = frequenciaUnidade.trim().toLowerCase();
        }

        if (unidade.startsWith("hora")) {
            return 60L * 60L;
        }
        if (unidade.startsWith("dia")) {
            return 24L * 60L * 60L;
        }
        if (unidade.startsWith("semana")) {
            return 7L * 24L * 60L * 60L;
        }

        return -1L;
    }
}
