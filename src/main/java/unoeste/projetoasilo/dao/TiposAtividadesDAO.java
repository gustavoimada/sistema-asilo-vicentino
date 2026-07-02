package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.TiposAtividades;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TiposAtividadesDAO {
    private static final String SQL_BASE_SELECT = """
            SELECT idtipoatividade AS idtipoatividades, tipo, org
            FROM tipoatividade
            """;

    private String escaparSql(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("'", "''");
    }

    public boolean gravar(TiposAtividades tipoAtividade, Banco conexao) throws SQLException {
        String sql = """
                INSERT INTO tipoatividade (tipo, org)
                VALUES ('#1', '#2')
                """;
        sql = sql.replace("#1", escaparSql(tipoAtividade.getTipo()));
        sql = sql.replace("#2", escaparSql(tipoAtividade.getOrg()));

        if (!conexao.manipular(sql)) {
            return false;
        }

        int novoId = conexao.getMaxPK("tipoatividade", "idtipoatividade");
        if (novoId > 0) {
            tipoAtividade.setIdtipoatividades(novoId);
        }
        return true;
    }

    public boolean editar(TiposAtividades tipoAtividade, Banco conexao) throws SQLException {
        String sql = """
                UPDATE tipoatividade
                SET tipo = '#1', org = '#2'
                WHERE idtipoatividade = #3
                """;
        sql = sql.replace("#1", escaparSql(tipoAtividade.getTipo()));
        sql = sql.replace("#2", escaparSql(tipoAtividade.getOrg()));
        sql = sql.replace("#3", String.valueOf(tipoAtividade.getIdtipoatividades()));
        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM tipoatividade WHERE idtipoatividade = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public TiposAtividades buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " WHERE idtipoatividade = #1";
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            TiposAtividades tipoAtividade = new TiposAtividades();
            tipoAtividade.setIdtipoatividades(rs.getInt("idtipoatividades"));
            tipoAtividade.setTipo(rs.getString("tipo"));
            tipoAtividade.setOrg(rs.getString("org"));
            return tipoAtividade;
        }
        return null;
    }

    public List<TiposAtividades> listar(Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " ORDER BY idtipoatividade";
        List<TiposAtividades> tiposAtividades = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                TiposAtividades tipoAtividade = new TiposAtividades();
                tipoAtividade.setIdtipoatividades(rs.getInt("idtipoatividades"));
                tipoAtividade.setTipo(rs.getString("tipo"));
                tipoAtividade.setOrg(rs.getString("org"));
                tiposAtividades.add(tipoAtividade);
            }
        }
        return tiposAtividades;
    }

    public List<TiposAtividades> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        String sql = SQL_BASE_SELECT + " ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<TiposAtividades> tiposAtividades = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                TiposAtividades tipoAtividade = new TiposAtividades();
                tipoAtividade.setIdtipoatividades(rs.getInt("idtipoatividades"));
                tipoAtividade.setTipo(rs.getString("tipo"));
                tipoAtividade.setOrg(rs.getString("org"));
                tiposAtividades.add(tipoAtividade);
            }
        }
        return tiposAtividades;
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "idtipoatividade";
        }
        return switch (valor.toLowerCase()) {
            case "idtipoatividade", "idtipoatividades" -> "idtipoatividade";
            case "tipo" -> "tipo";
            case "org" -> "org";
            default -> "idtipoatividade";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }
}

