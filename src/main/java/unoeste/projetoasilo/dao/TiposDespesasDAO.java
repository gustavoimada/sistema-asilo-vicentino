package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.TiposDespesas;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TiposDespesasDAO {
    private static final String SQL_BASE_SELECT = "SELECT idtipodespesas, tipo, ativo FROM tipodespesas";

    private String escaparSql(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("'", "''");
    }

    public boolean gravar(TiposDespesas tipoDespesa, Banco conexao) throws SQLException {
        String sql = "INSERT INTO tipodespesas (tipo) VALUES ('#1')";
        sql = sql.replace("#1", escaparSql(tipoDespesa.getTipo()));

        if (!conexao.manipular(sql)) {
            return false;
        }

        int novoId = conexao.getMaxPK("tipodespesas", "idtipodespesas");
        if (novoId > 0) {
            tipoDespesa.setIdtiposDespesas(novoId);
        }
        return true;
    }

    public boolean editar(TiposDespesas tipoDespesa, Banco conexao) throws SQLException {
        String sql = """
                UPDATE tipodespesas
                SET tipo = '#1'
                WHERE idtipodespesas = #2
                """;
        sql = sql.replace("#1", escaparSql(tipoDespesa.getTipo()));
        sql = sql.replace("#2", String.valueOf(tipoDespesa.getIdtiposDespesas()));
        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM tipodespesas WHERE idtipodespesas = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean desativar(int id, Banco conexao) throws SQLException {
        String sql = "UPDATE tipodespesas SET ativo = FALSE WHERE idtipodespesas = #1 AND ativo = TRUE";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean possuiDespesaVinculada(int id, Banco conexao) throws SQLException {
        String sql = """
                SELECT 1
                FROM despesas
                WHERE tipodespesas_idtipodespesas = #1
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public TiposDespesas buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " WHERE idtipodespesas = #1";
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            TiposDespesas tipoDespesa = new TiposDespesas();
            tipoDespesa.setIdtiposDespesas(rs.getInt("idtipodespesas"));
            tipoDespesa.setTipo(rs.getString("tipo"));
            tipoDespesa.setAtivo(rs.getBoolean("ativo"));
            return tipoDespesa;
        }
        return null;
    }

    public TiposDespesas buscarPorTipo(String tipo, Banco conexao) throws SQLException {
        String sql = """
                SELECT idtipodespesas, tipo, ativo
                FROM tipodespesas
                WHERE UPPER(tipo) = UPPER('#1')
                  AND ativo = TRUE
                ORDER BY idtipodespesas
                LIMIT 1
                """;
        sql = sql.replace("#1", escaparSql(tipo));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            TiposDespesas tipoDespesa = new TiposDespesas();
            tipoDespesa.setIdtiposDespesas(rs.getInt("idtipodespesas"));
            tipoDespesa.setTipo(rs.getString("tipo"));
            tipoDespesa.setAtivo(rs.getBoolean("ativo"));
            return tipoDespesa;
        }
        return null;
    }

    public List<TiposDespesas> listar(Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " WHERE ativo = TRUE ORDER BY idtipodespesas";
        List<TiposDespesas> tiposDespesas = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                TiposDespesas tipoDespesa = new TiposDespesas();
                tipoDespesa.setIdtiposDespesas(rs.getInt("idtipodespesas"));
                tipoDespesa.setTipo(rs.getString("tipo"));
                tipoDespesa.setAtivo(rs.getBoolean("ativo"));
                tiposDespesas.add(tipoDespesa);
            }
        }
        return tiposDespesas;
    }

    public List<TiposDespesas> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " WHERE ativo = TRUE ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<TiposDespesas> tiposDespesas = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                TiposDespesas tipoDespesa = new TiposDespesas();
                tipoDespesa.setIdtiposDespesas(rs.getInt("idtipodespesas"));
                tipoDespesa.setTipo(rs.getString("tipo"));
                tipoDespesa.setAtivo(rs.getBoolean("ativo"));
                tiposDespesas.add(tipoDespesa);
            }
        }
        return tiposDespesas;
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "idtipodespesas";
        }
        return switch (valor.toLowerCase()) {
            case "idtipodespesas" -> "idtipodespesas";
            case "tipo" -> "tipo";
            default -> "idtipodespesas";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }
}

