package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Despesa;
import unoeste.projetoasilo.entities.TipoDespesa;

import java.sql.PreparedStatement;
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
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    RETURNING iddespesas
                    """;

            try (PreparedStatement comando = conexao.preparar(sql)) {
                preencherDespesa(comando, despesa, idTipo);
                try (ResultSet rs = comando.executeQuery()) {
                    if (rs.next()) {
                        despesa.setIdDespesa(rs.getInt("iddespesas"));
                        gravou = true;
                    }
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
        StringBuilder sql = new StringBuilder(sqlBase()).append(" WHERE 1=1");
        List<Object> parametros = new ArrayList<>();

        if (tipo != null && !tipo.isBlank()) {
            sql.append(" AND LOWER(t.tipo) = LOWER(?)");
            parametros.add(tipo);
        }

        if (status != null && !status.isBlank()) {
            if (status.equalsIgnoreCase("pago"))
                sql.append(" AND d.dtquitacao IS NOT NULL");
            else if (status.equalsIgnoreCase("pendente"))
                sql.append(" AND d.dtquitacao IS NULL AND d.dtvencimento::date >= CURRENT_DATE");
            else if (status.equalsIgnoreCase("vencido"))
                sql.append(" AND d.dtquitacao IS NULL AND d.dtvencimento::date < CURRENT_DATE");

        }

        if (observacoes != null && !observacoes.isBlank()) {
            sql.append(" AND LOWER(COALESCE(d.observacoes, '')) LIKE LOWER(?)");
            parametros.add("%" + observacoes + "%");
        }

        if (dtVencimentoInicio != null) {
            sql.append(" AND d.dtvencimento::date >= ?");
            parametros.add(dtVencimentoInicio);
        }

        if (dtVencimentoFim != null) {
            sql.append(" AND d.dtvencimento::date <= ?");
            parametros.add(dtVencimentoFim);
        }

        if (dtQuitacaoInicio != null) {
            sql.append(" AND d.dtquitacao::date >= ?");
            parametros.add(dtQuitacaoInicio);
        }

        if (dtQuitacaoFim != null) {
            sql.append(" AND d.dtquitacao::date <= ?");
            parametros.add(dtQuitacaoFim);
        }

        if (fixa != null && !fixa.isBlank()) {
            if (fixa.equalsIgnoreCase("true"))
                sql.append(" AND d.fixa = true");
            else if (fixa.equalsIgnoreCase("false"))
                sql.append(" AND d.fixa = false");
        }

        if (periodicidade != null && !periodicidade.isBlank()) {
            sql.append(" AND LOWER(COALESCE(d.periodicidade, '')) = LOWER(?)");
            parametros.add(periodicidade);
        }

        sql.append(montarOrdenacao(ordenacao, direcao));

        try (PreparedStatement comando = conexao.preparar(sql.toString())) {
            for (int i = 0; i < parametros.size(); i++) {
                comando.setObject(i + 1, parametros.get(i));
            }
            try (ResultSet rs = comando.executeQuery()) {
                return listarPorResultSet(rs);
            }
        }
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
                    SET valor = ?, observacoes = ?, dtvencimento = ?, dtquitacao = ?, fixa = ?, periodicidade = ?, tipodespesas_idtipodespesas = ?
                    WHERE iddespesas = ?
                    """;

            try (PreparedStatement comando = conexao.preparar(sql)) {
                preencherDespesa(comando, despesa, idTipo);
                comando.setInt(8, despesa.getIdDespesa());
                editou = comando.executeUpdate() > 0;
            }
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
        ResultSet rs = conexao.consultar(sql);
        return listarPorResultSet(rs);
    }

    private List<Despesa> listarPorResultSet(ResultSet rs) throws SQLException {
        List<Despesa> despesas = new ArrayList<>();

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
        String sqlBusca = "SELECT idtipodespesas FROM tipodespesas WHERE tipo = ? AND ativo = TRUE ORDER BY idtipodespesas LIMIT 1";
        try (PreparedStatement comando = conexao.preparar(sqlBusca)) {
            comando.setString(1, tipo);
            try (ResultSet rs = comando.executeQuery()) {
                if (rs.next()) {
                    idTipo = rs.getInt("idtipodespesas");
                }
            }
        }

        return idTipo;
    }

    private void preencherDespesa(PreparedStatement comando, Despesa despesa, int idTipo) throws SQLException {
        comando.setDouble(1, despesa.getValor());
        comando.setString(2, despesa.getObservacoes());
        comando.setObject(3, despesa.getDtVencimento());
        comando.setObject(4, despesa.getDtQuitacao());
        comando.setBoolean(5, despesa.isFixa());
        comando.setString(6, despesa.getPeriodicidade());
        comando.setInt(7, idTipo);
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

}
