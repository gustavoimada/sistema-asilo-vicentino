package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Despesa;
import unoeste.projetoasilo.entities.TipoDespesa;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DespesaDAO {

    public boolean gravar(Despesa despesa, Banco conexao) throws SQLException {
        boolean gravou = false;
        int idTipo = garantirTipoDespesa(despesa.getTipoDespesa(), conexao);

        if (idTipo > 0) {
            despesa.getTipoDespesa().setIdTipoDespesa(idTipo);

            String sql = """
                    INSERT INTO despesas(valor, observacoes, dtvencimento, dtquitacao, fixa, periodicidade, tipodespesas_idtipodespesas)
                        VALUES (#1, '#2', #3, #4, #5, #6, #7);
                    """;
            sql = sql.replace("#1", String.valueOf(despesa.getValor()));
            sql = sql.replace("#2", despesa.getObservacoes());
            sql = sql.replace("#3", formatDateValue(despesa.getDtVencimento()));
            sql = sql.replace("#4", formatDateValue(despesa.getDtQuitacao()));
            sql = sql.replace("#5", formatBooleanValue(despesa.isFixa()));
            sql = sql.replace("#6", formatStringValue(despesa.getPeriodicidade()));
            sql = sql.replace("#7", String.valueOf(idTipo));

            if (conexao.manipular(sql)) {
                int novoId = conexao.getMaxPK("despesas", "iddespesas");
                if (novoId > 0) {
                    despesa.setIdDespesa(novoId);
                    gravou = true;
                }
            }
        }

        return gravou;
    }

    public List<Despesa> listar(Banco conexao) throws SQLException {
        return listar(null, null, conexao);
    }

    public List<Despesa> listar(String ordenacao, String direcao, Banco conexao) throws SQLException {
        return listarPorSql(sqlBase() + montarOrdenacao(ordenacao, direcao), conexao);
    }

    public List<Despesa> filtrar(String tipo, String status, String observacoes, LocalDate dtVencimento, LocalDate dtQuitacao, String fixa, String periodicidade, String ordenacao, String direcao, Banco conexao) throws SQLException {
        return filtrar(tipo, status, observacoes, dtVencimento, dtVencimento, dtQuitacao, dtQuitacao, fixa, periodicidade, ordenacao, direcao, conexao);
    }

    public List<Despesa> filtrar(String tipo, String status, String observacoes, LocalDate dtVencimentoInicio, LocalDate dtVencimentoFim, LocalDate dtQuitacaoInicio, LocalDate dtQuitacaoFim, String fixa, String periodicidade, String ordenacao, String direcao, Banco conexao) throws SQLException {
        String sql = sqlBase() + " WHERE 1=1";

        if (tipo != null) {
            sql += " AND LOWER(t.tipo) = '" + tipo.toLowerCase() + "'";
        }

        if (status != null && !status.isBlank()) {
            if (status.equalsIgnoreCase("pago"))
                sql += " AND d.dtquitacao IS NOT NULL";
            else if (status.equalsIgnoreCase("pendente"))
                sql += " AND d.dtquitacao IS NULL AND d.dtvencimento::date >= CURRENT_DATE";
            else if (status.equalsIgnoreCase("vencido"))
                sql += " AND d.dtquitacao IS NULL AND d.dtvencimento::date < CURRENT_DATE";

        }

        if (observacoes != null)
            sql += " AND LOWER(d.observacoes) LIKE '%" + observacoes.toLowerCase() + "%'";


        if (dtVencimentoInicio != null)
            sql += " AND d.dtvencimento::date >= '" + dtVencimentoInicio + "'";

        if (dtVencimentoFim != null)
            sql += " AND d.dtvencimento::date <= '" + dtVencimentoFim + "'";

        if (dtQuitacaoInicio != null)
            sql += " AND d.dtquitacao::date >= '" + dtQuitacaoInicio + "'";

        if (dtQuitacaoFim != null)
            sql += " AND d.dtquitacao::date <= '" + dtQuitacaoFim + "'";

        if (fixa != null && !fixa.isBlank()) {
            if (fixa.equalsIgnoreCase("true"))
                sql += " AND d.fixa = true";
            else if (fixa.equalsIgnoreCase("false"))
                sql += " AND d.fixa = false";
        }

        if (periodicidade != null && !periodicidade.isBlank())
            sql += " AND LOWER(COALESCE(d.periodicidade, '')) = '" + periodicidade.toLowerCase() + "'";

        sql += montarOrdenacao(ordenacao, direcao);

        return listarPorSql(sql, conexao);
    }

    public boolean deletar(int id, Banco conexao) {
        return conexao.manipular("DELETE FROM despesas WHERE iddespesas = " + id);
    }

    public boolean estornar(int id, Banco conexao) {
        return conexao.manipular("UPDATE despesas SET dtquitacao = null WHERE iddespesas = " + id);
    }

    public boolean editar(Despesa despesa, Banco conexao) throws SQLException {
        boolean editou = false;
        int idTipo = garantirTipoDespesa(despesa.getTipoDespesa(), conexao);

        if (idTipo > 0) {
            despesa.getTipoDespesa().setIdTipoDespesa(idTipo);

            String sql = """
                    UPDATE despesas
                    SET valor = #1, observacoes = '#2', dtvencimento = #3, dtquitacao = #4, fixa = #5, periodicidade = #6, tipodespesas_idtipodespesas = #7
                    WHERE iddespesas = #8
                    """;
            sql = sql.replace("#1", String.valueOf(despesa.getValor()));
            sql = sql.replace("#2", despesa.getObservacoes());
            sql = sql.replace("#3", formatDateValue(despesa.getDtVencimento()));
            sql = sql.replace("#4", formatDateValue(despesa.getDtQuitacao()));
            sql = sql.replace("#5", formatBooleanValue(despesa.isFixa()));
            sql = sql.replace("#6", formatStringValue(despesa.getPeriodicidade()));
            sql = sql.replace("#7", String.valueOf(idTipo));
            sql = sql.replace("#8", String.valueOf(despesa.getIdDespesa()));

            editou = conexao.manipular(sql);
        }

        return editou;
    }

    public List<Despesa> listarFixasPagasVencidas(Banco conexao) throws SQLException {
        String sql = sqlBase() + """
                 WHERE d.fixa = true
                   AND d.dtquitacao IS NOT NULL
                   AND d.dtvencimento::date < CURRENT_DATE
                   AND COALESCE(d.periodicidade, '') <> ''
                ORDER BY d.iddespesas
                """;

        return listarPorSql(sql, conexao);
    }

    public boolean atualizarCicloFixo(int idDespesa, LocalDate novoVencimento, Banco conexao) {
        String sql = """
                UPDATE despesas
                SET dtvencimento = #1, dtquitacao = null
                WHERE iddespesas = #2
                """;
        sql = sql.replace("#1", formatDateValue(novoVencimento));
        sql = sql.replace("#2", String.valueOf(idDespesa));

        return conexao.manipular(sql);
    }

    public List<TipoDespesa> listarTipos(Banco conexao) throws SQLException {
        List<TipoDespesa> tipos = new ArrayList<>();
        ResultSet rs = conexao.consultar("SELECT idtipodespesas, tipo FROM tipodespesas WHERE ativo = TRUE ORDER BY tipo");

        if (rs != null) {
            while (rs.next()) {
                TipoDespesa tipoDespesa = new TipoDespesa();
                tipoDespesa.setIdTipoDespesa(rs.getInt("idtipodespesas"));
                tipoDespesa.setTipo(rs.getString("tipo"));
                tipos.add(tipoDespesa);
            }
        }
        return tipos;
    }

    public Despesa buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = sqlBase() + " WHERE d.iddespesas = " + id;
        ResultSet rs = conexao.consultar(sql);
        Despesa despesa = null;

        if (rs != null && rs.next()) {
            despesa = new Despesa();
            despesa.setIdDespesa(rs.getInt("iddespesas"));
            despesa.setValor(rs.getDouble("valor"));
            despesa.setObservacoes(rs.getString("observacoes"));

            if (rs.getDate("dtvencimento") != null)
                despesa.setDtVencimento(rs.getDate("dtvencimento").toLocalDate());

            if (rs.getDate("dtquitacao") != null)
                despesa.setDtQuitacao(rs.getDate("dtquitacao").toLocalDate());

            despesa.setFixa(rs.getBoolean("fixa"));
            despesa.setPeriodicidade(rs.getString("periodicidade"));

            TipoDespesa tipoDespesa = new TipoDespesa();
            tipoDespesa.setIdTipoDespesa(rs.getInt("idtipodespesas"));
            tipoDespesa.setTipo(rs.getString("tipo"));
            despesa.setTipoDespesa(tipoDespesa);
        }

        return despesa;
    }

    private List<Despesa> listarPorSql(String sql, Banco conexao) throws SQLException {
        List<Despesa> despesas = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {

            while (rs.next()) {
                Despesa despesa = new Despesa();
                despesa.setIdDespesa(rs.getInt("iddespesas"));
                despesa.setValor(rs.getDouble("valor"));
                despesa.setObservacoes(rs.getString("observacoes"));

                if (rs.getDate("dtvencimento") != null)
                    despesa.setDtVencimento(rs.getDate("dtvencimento").toLocalDate());

                if (rs.getDate("dtquitacao") != null)
                    despesa.setDtQuitacao(rs.getDate("dtquitacao").toLocalDate());

                despesa.setFixa(rs.getBoolean("fixa"));
                despesa.setPeriodicidade(rs.getString("periodicidade"));

                TipoDespesa tipoDespesa = new TipoDespesa();
                tipoDespesa.setIdTipoDespesa(rs.getInt("idtipodespesas"));
                tipoDespesa.setTipo(rs.getString("tipo"));
                despesa.setTipoDespesa(tipoDespesa);

                despesas.add(despesa);
            }

        }
        return despesas;
    }

    private int garantirTipoDespesa(TipoDespesa tipoDespesa, Banco conexao) throws SQLException {
        int idTipo = -1;
        String tipo = tipoDespesa.getTipo();
        String sqlBusca = "SELECT idtipodespesas FROM tipodespesas WHERE tipo = '" + tipo + "' AND ativo = TRUE ORDER BY idtipodespesas LIMIT 1";
        ResultSet rs = conexao.consultar(sqlBusca);

        if (rs != null && rs.next())
            idTipo = rs.getInt("idtipodespesas");

        return idTipo;
    }

    private String sqlBase() {
        return """
                SELECT d.iddespesas, d.valor, d.observacoes, d.dtvencimento, d.dtquitacao, t.idtipodespesas, t.tipo
                , d.fixa, d.periodicidade
                FROM despesas d
                JOIN tipodespesas t ON t.idtipodespesas = d.tipodespesas_idtipodespesas
                """;
    }

    private String montarOrdenacao(String ordenacao, String direcao) {
        String sql = " ORDER BY d.iddespesas";
        String direcaoFinal;

        if (direcao != null && direcao.equalsIgnoreCase("desc"))
            direcaoFinal = "DESC";
        else
            direcaoFinal= "ASC";

        if (ordenacao != null && ordenacao.equalsIgnoreCase("tipo"))
            sql = " ORDER BY t.tipo " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("status"))
            sql = " ORDER BY CASE WHEN d.dtquitacao IS NULL THEN 0 ELSE 1 END " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("valor"))
            sql = " ORDER BY d.valor " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("dtVencimento"))
            sql = " ORDER BY d.dtvencimento " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("dtQuitacao"))
            sql = " ORDER BY d.dtquitacao " + direcaoFinal;
        else if (ordenacao != null && ordenacao.equalsIgnoreCase("observacoes"))
            sql = " ORDER BY d.observacoes " + direcaoFinal;
        else
            sql = " ORDER BY d.iddespesas " + direcaoFinal;


        return sql;
    }

    private String formatDateValue(LocalDate data) {
        String valor;

        if (data == null)
            valor = "null";
        else
            valor = "'" + data.toString() + "'";


        return valor;
    }

    private String formatBooleanValue(boolean valor) {
        return String.valueOf(valor);
    }

    private String formatStringValue(String valor) {
        if (valor == null || valor.isBlank())
            return "null";
        else
            return "'" + valor + "'";
    }
}
