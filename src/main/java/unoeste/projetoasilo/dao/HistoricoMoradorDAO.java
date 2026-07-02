package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.HistoricoMorador;
import unoeste.projetoasilo.entities.Morador;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class HistoricoMoradorDAO {

    public boolean gravar(HistoricoMorador historico, Banco conexao) throws SQLException {
        boolean gravou = false;

        String sql = """
                INSERT INTO historicomorador(dtentrada, dtsaida, morador_idmorador)
                VALUES (#1, #2, #3)
                """;

        sql = sql.replace("#1", formatDateValue(historico.getDtEntrada()));
        sql = sql.replace("#2", formatDateValue(historico.getDtSaida()));
        sql = sql.replace("#3", String.valueOf(historico.getMorador().getIdMorador()));

        if (conexao.manipular(sql)) {
            int novoId = conexao.getMaxPK("historicomorador", "idhistoricomorador");
            if (novoId > 0) {
                historico.setIdHistoricoMorador(novoId);
                gravou = true;
            }
        }

        return gravou;
    }

    public List<HistoricoMorador> listar(Banco conexao) throws SQLException {
        return listarPorSql("SELECT * FROM historicomorador", conexao);
    }

    public boolean editar(HistoricoMorador historico, Banco conexao) {
        String sql = """
                UPDATE historicomorador
                SET dtentrada = #1, dtsaida = #2, morador_idmorador = #3
                WHERE idhistoricomorador = #4
                """;

        sql = sql.replace("#1", formatDateValue(historico.getDtEntrada()));
        sql = sql.replace("#2", formatDateValue(historico.getDtSaida()));
        sql = sql.replace("#3", String.valueOf(historico.getMorador().getIdMorador()));
        sql = sql.replace("#4", String.valueOf(historico.getIdHistoricoMorador()));

        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) {
        return conexao.manipular("DELETE FROM historicomorador WHERE idhistoricomorador = " + id);
    }

    public HistoricoMorador buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = "SELECT * FROM historicomorador WHERE idhistoricomorador = " + id;
        ResultSet rs = conexao.consultar(sql);

        if (rs != null && rs.next())
            return montarHistorico(rs, conexao);
        else
            return null;
    }


    public boolean existeEntradaEmAndamento(int idMorador, int excluirId, Banco conexao) throws SQLException {
        String sql = "SELECT idhistoricomorador FROM historicomorador" +
                " WHERE morador_idmorador = " + idMorador +
                " AND dtsaida IS NULL";
        if (excluirId > 0) {
            sql += " AND idhistoricomorador <> " + excluirId;
        }
        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }


    public boolean existeSobreposicaoDatas(int idMorador, LocalDate novaEntrada, LocalDate novaSaida, int excluirId, Banco conexao) throws SQLException {
        String novoFimSql = novaSaida != null ? "'" + novaSaida + "'" : "'" + novaEntrada + "'";

        String sql = "SELECT idhistoricomorador FROM historicomorador" +
                " WHERE morador_idmorador = " + idMorador +
                " AND '" + novaEntrada + "' <= COALESCE(dtsaida, '9999-12-31')" +
                " AND " + novoFimSql + " >= dtentrada";

        if (excluirId > 0) {
            sql += " AND idhistoricomorador <> " + excluirId;
        }

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    private List<HistoricoMorador> listarPorSql(String sql, Banco conexao) throws SQLException {
        List<HistoricoMorador> historicos = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                historicos.add(montarHistorico(rs, conexao));
            }
        }

        return historicos;
    }

    private HistoricoMorador montarHistorico(ResultSet rs, Banco conexao) throws SQLException {
        HistoricoMorador historico = new HistoricoMorador();
        MoradorDAO moradorDAO = new MoradorDAO();

        int idMorador = rs.getInt("morador_idmorador");
        Morador morador = moradorDAO.buscarPorId(idMorador, conexao);

        historico.setIdHistoricoMorador(rs.getInt("idhistoricomorador"));
        historico.setDtEntrada(rs.getDate("dtentrada").toLocalDate());

        if (rs.getDate("dtsaida") != null)
            historico.setDtSaida(rs.getDate("dtsaida").toLocalDate());
        else
            historico.setDtSaida(null);

        historico.setMorador(morador);

        return historico;
    }

    private String formatDateValue(java.time.LocalDate data) {
        if (data == null)
            return "null";
        else
            return "'" + data + "'";
    }
}
