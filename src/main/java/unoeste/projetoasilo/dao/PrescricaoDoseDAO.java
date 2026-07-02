package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Prescricao;
import unoeste.projetoasilo.entities.PrescricaoDose;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

public class PrescricaoDoseDAO {

    public boolean gravar(PrescricaoDose prescricaoDose, Banco conexao) throws SQLException {
        boolean gravou = false;
        String sql = """
                INSERT INTO prescricaodose(
                	prescricao_idprescricao, datahoraprevista)
                	VALUES (#1, '#2');
                """;

        sql = sql.replace("#1", String.valueOf(prescricaoDose.getPrescricao().getIdPrescricao()));
        sql = sql.replace("#2", String.valueOf(prescricaoDose.getDataHoraPrevista()));

        if (conexao.manipular(sql)) {
            int novoId = conexao.getMaxPK("prescricaodose", "idprescricaodose");
            if (novoId > 0) {
                prescricaoDose.setIdPrescricaoDose(Long.valueOf(novoId));
                gravou = true;
            }
        }
        return gravou;
    }

    public List<PrescricaoDose> listar(Banco conexao) throws SQLException {
        boolean usarColunaAplicado = colunaAplicadoExiste(conexao);
        List<PrescricaoDose> prescricaoDoseList = new ArrayList<>();
        String sqlBase = """
                SELECT idprescricaodose, prescricao_idprescricao, datahoraprevista, aplicado
                FROM prescricaodose
                ORDER BY datahoraprevista
                """;
        String sql;
        if (usarColunaAplicado) {
            sql = sqlBase;
        } else {
            sql = """
                SELECT pd.idprescricaodose,
                       pd.prescricao_idprescricao,
                       pd.datahoraprevista,
                       CASE
                           WHEN EXISTS (
                               SELECT 1
                               FROM registrarusomedicacao rum
                               WHERE rum.prescricaodose_idprescricaodose = pd.idprescricaodose
                           )
                           THEN TRUE
                           ELSE FALSE
                       END AS aplicado
                FROM prescricaodose pd
                ORDER BY pd.datahoraprevista
                """;
        }
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                PrescricaoDose prescricaoDose = new PrescricaoDose();
                Prescricao prescricao = new Prescricao();
                Timestamp dataHoraPrevista = rs.getTimestamp("datahoraprevista");

                prescricaoDose.setIdPrescricaoDose(rs.getLong("idprescricaodose"));
                prescricaoDose.setAplicado(rs.getBoolean("aplicado"));
                prescricaoDose.setPrescricao(prescricao.buscarId(rs.getInt("prescricao_idprescricao"), conexao));
                if (dataHoraPrevista != null) {
                    prescricaoDose.setDataHoraPrevista(dataHoraPrevista.toLocalDateTime());
                }
                prescricaoDoseList.add(prescricaoDose);
            }
        }
        return prescricaoDoseList;
    }

    public List<PrescricaoDose> listarHoje(Banco conexao) throws SQLException {
        return listarHojeFiltrado("", "", false, conexao);
    }

    public List<PrescricaoDose> listarAtrasadasDiasAnteriores(Banco conexao) throws SQLException {
        return listarAtrasadasDiasAnterioresFiltrado("", "", conexao);
    }

    public List<PrescricaoDose> listarHojeFiltrado(String morador, String horario, boolean somenteAtrasados, Banco conexao) throws SQLException {
        boolean usarColunaAplicado = colunaAplicadoExiste(conexao);
        String selectAplicado;
        if (usarColunaAplicado) {
            selectAplicado = "pd.aplicado";
        } else {
            selectAplicado = """
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM registrarusomedicacao rum
                        WHERE rum.prescricaodose_idprescricaodose = pd.idprescricaodose
                    )
                    THEN TRUE
                    ELSE FALSE
                END AS aplicado
                """;
        }

        String sql = """
                SELECT pd.idprescricaodose, pd.prescricao_idprescricao, pd.datahoraprevista, #APLICADO
                FROM prescricaodose pd
                INNER JOIN prescricao p ON p.idprescricao = pd.prescricao_idprescricao
                INNER JOIN morador m ON m.idmorador = p.morador_idmorador
                WHERE pd.datahoraprevista >= CURRENT_DATE
                  AND pd.datahoraprevista < CURRENT_DATE + INTERVAL '1 day'
                """;
        sql = sql.replace("#APLICADO", selectAplicado);

        if (usarColunaAplicado) {
            sql += " AND pd.aplicado IS FALSE";
        } else {
            sql += """
                 AND NOT EXISTS (
                     SELECT 1
                     FROM registrarusomedicacao rum
                     WHERE rum.prescricaodose_idprescricaodose = pd.idprescricaodose
                 )
                """;
        }

        String moradorFiltro = padronizarTextoFiltro(morador);
        if (!moradorFiltro.isEmpty()) {
            String moradorEscapado = escapeSqlLiteral(moradorFiltro.toLowerCase());
            sql += " AND LOWER(m.nome) LIKE '%" + moradorEscapado + "%'";
        }

        String horarioFiltro = padronizarTextoFiltro(horario);
        if (!horarioFiltro.isEmpty()) {
            String horarioEscapado = escapeSqlLiteral(horarioFiltro);
            sql += " AND TO_CHAR(pd.datahoraprevista, 'HH24:MI') = '" + horarioEscapado + "'";
        }

        if (somenteAtrasados) {
            sql += " AND pd.datahoraprevista < CURRENT_TIMESTAMP";
        }

        sql += " ORDER BY pd.datahoraprevista";
        return listarPorSql(sql, conexao);
    }

    public List<PrescricaoDose> listarAtrasadasDiasAnterioresFiltrado(String dia, String morador, Banco conexao) throws SQLException {
        boolean usarColunaAplicado = colunaAplicadoExiste(conexao);
        String selectAplicado;
        if (usarColunaAplicado) {
            selectAplicado = "pd.aplicado";
        } else {
            selectAplicado = """
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM registrarusomedicacao rum
                        WHERE rum.prescricaodose_idprescricaodose = pd.idprescricaodose
                    )
                    THEN TRUE
                    ELSE FALSE
                END AS aplicado
                """;
        }

        String sql = """
                SELECT pd.idprescricaodose, pd.prescricao_idprescricao, pd.datahoraprevista, #APLICADO
                FROM prescricaodose pd
                INNER JOIN prescricao p ON p.idprescricao = pd.prescricao_idprescricao
                INNER JOIN morador m ON m.idmorador = p.morador_idmorador
                WHERE pd.datahoraprevista < CURRENT_DATE
                """;
        sql = sql.replace("#APLICADO", selectAplicado);

        if (usarColunaAplicado) {
            sql += " AND pd.aplicado IS FALSE";
        } else {
            sql += """
                 AND NOT EXISTS (
                     SELECT 1
                     FROM registrarusomedicacao rum
                     WHERE rum.prescricaodose_idprescricaodose = pd.idprescricaodose
                 )
                """;
        }

        String diaFiltro = padronizarTextoFiltro(dia);
        LocalDate dataFiltro = converterDataFiltro(diaFiltro);
        if (dataFiltro != null) {
            sql += " AND CAST(pd.datahoraprevista AS DATE) = '" + dataFiltro + "'";
        }

        String moradorFiltro = padronizarTextoFiltro(morador);
        if (!moradorFiltro.isEmpty()) {
            String moradorEscapado = escapeSqlLiteral(moradorFiltro.toLowerCase());
            sql += " AND LOWER(m.nome) LIKE '%" + moradorEscapado + "%'";
        }

        sql += " ORDER BY pd.datahoraprevista";
        return listarPorSql(sql, conexao);
    }

    private List<PrescricaoDose> listarPorSql(String sql, Banco conexao) throws SQLException {
        List<PrescricaoDose> prescricaoDoseList = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                PrescricaoDose prescricaoDose = new PrescricaoDose();
                Prescricao prescricao = new Prescricao();
                Timestamp dataHoraPrevista = rs.getTimestamp("datahoraprevista");

                prescricaoDose.setAplicado(rs.getBoolean("aplicado"));
                prescricaoDose.setIdPrescricaoDose(rs.getLong("idprescricaodose"));
                prescricaoDose.setPrescricao(prescricao.buscarId(rs.getInt("prescricao_idprescricao"), conexao));
                if (dataHoraPrevista != null) {
                    prescricaoDose.setDataHoraPrevista(dataHoraPrevista.toLocalDateTime());
                }
                prescricaoDoseList.add(prescricaoDose);
            }
        }
        return prescricaoDoseList;
    }

    private String padronizarTextoFiltro(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.trim();
    }

    private String escapeSqlLiteral(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("'", "''");
    }

    private LocalDate converterDataFiltro(String dia) {
        if (dia == null) {
            return null;
        }
        if (dia.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dia);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    public PrescricaoDose buscarPorId(Long id, Banco conexao) throws SQLException {
        boolean usarColunaAplicado = colunaAplicadoExiste(conexao);
        String sql;
        if (usarColunaAplicado) {
            sql = """
                SELECT idprescricaodose, prescricao_idprescricao, datahoraprevista, aplicado
                FROM prescricaodose
                WHERE idprescricaodose = #1
                """;
        } else {
            sql = """
                SELECT pd.idprescricaodose,
                       pd.prescricao_idprescricao,
                       pd.datahoraprevista,
                       CASE
                           WHEN EXISTS (
                               SELECT 1
                               FROM registrarusomedicacao rum
                               WHERE rum.prescricaodose_idprescricaodose = pd.idprescricaodose
                           )
                           THEN TRUE
                           ELSE FALSE
                       END AS aplicado
                FROM prescricaodose pd
                WHERE pd.idprescricaodose = #1
                """;
        }
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);

        PrescricaoDose dose = null;
        if (rs != null) {
            if (rs.next()) {
                Prescricao prescricao = new Prescricao();
                Timestamp dataHoraPrevista = rs.getTimestamp("datahoraprevista");

                dose = new PrescricaoDose();
                dose.setAplicado(rs.getBoolean("aplicado"));
                dose.setIdPrescricaoDose(rs.getLong("idprescricaodose"));
                dose.setPrescricao(prescricao.buscarId(rs.getInt("prescricao_idprescricao"), conexao));
                if (dataHoraPrevista != null) {
                    dose.setDataHoraPrevista(dataHoraPrevista.toLocalDateTime());
                }
            }
        }
        return dose;
    }

    public boolean deletar(Long id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM prescricaodose WHERE idprescricaodose = " + id;
        boolean deletou = false;
        if(conexao.manipular(sql))
        {
            deletou = true;
        }
        return deletou;
    }

    public boolean deletarPorPrescricao(int idPrescricao, Banco conexao) throws SQLException {
        if (!deletarRegistrosUsoPorPrescricao(idPrescricao, conexao)) {
            return false;
        }

        if (!existeDosePorPrescricao(idPrescricao, conexao)) {
            return true;
        }

        String sql = "DELETE FROM prescricaodose WHERE prescricao_idprescricao = " + idPrescricao;
        return conexao.manipular(sql);
    }

    public boolean atualizar(Long id, Banco conexao) throws SQLException{
        return atualizarAplicado(id, true, conexao);
    }

    public boolean atualizarAplicado(Long id, boolean aplicado, Banco conexao) throws SQLException {
        if (!colunaAplicadoExiste(conexao)) {
            return true;
        }

        String valorAplicado = "FALSE";
        if (aplicado) {
            valorAplicado = "TRUE";
        }
        String sql = "UPDATE prescricaodose SET aplicado = " + valorAplicado + " WHERE idprescricaodose = " + id;
        boolean atualizou = false;
        if(conexao.manipular(sql)){
            atualizou = true;
        }
        return atualizou;
    }

    private boolean deletarRegistrosUsoPorPrescricao(int idPrescricao, Banco conexao) throws SQLException {
        if (!existeRegistroUsoPorPrescricao(idPrescricao, conexao)) {
            return true;
        }

        String sql = """
                DELETE FROM registrarusomedicacao
                WHERE prescricaodose_idprescricaodose IN (
                    SELECT idprescricaodose
                    FROM prescricaodose
                    WHERE prescricao_idprescricao = #1
                )
                """;
        sql = sql.replace("#1", String.valueOf(idPrescricao));
        return conexao.manipular(sql);
    }

    private boolean existeDosePorPrescricao(int idPrescricao, Banco conexao) throws SQLException {
        String sql = """
                SELECT 1
                FROM prescricaodose
                WHERE prescricao_idprescricao = #1
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idPrescricao));
        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    private boolean existeRegistroUsoPorPrescricao(int idPrescricao, Banco conexao) throws SQLException {
        String sql = """
                SELECT 1
                FROM registrarusomedicacao rum
                INNER JOIN prescricaodose pd ON pd.idprescricaodose = rum.prescricaodose_idprescricaodose
                WHERE pd.prescricao_idprescricao = #1
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idPrescricao));
        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    private boolean colunaAplicadoExiste(Banco conexao) throws SQLException {
        String sql = """
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'prescricaodose'
                  AND column_name = 'aplicado'
                LIMIT 1
                """;
        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }
}
