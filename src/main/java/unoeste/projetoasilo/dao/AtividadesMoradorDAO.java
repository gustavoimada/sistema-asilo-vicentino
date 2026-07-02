package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Atividades;
import unoeste.projetoasilo.entities.AtividadesMorador;
import unoeste.projetoasilo.entities.Morador;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class AtividadesMoradorDAO {
    public boolean gravar(AtividadesMorador atividadeMorador, Banco conexao) throws SQLException {
        String sql = """
                INSERT INTO atividadesmorador (atividades_idatividades, morador_idmorador)
                VALUES (#1, #2)
                """;
        sql = sql.replace("#1", String.valueOf(atividadeMorador.getIdatividade().getIdatividade()));
        sql = sql.replace("#2", String.valueOf(atividadeMorador.getIdmorador().getIdMorador()));
        return conexao.manipular(sql);
    }

    public AtividadesMorador buscarPorIds(int idAtividade, int idMorador, Banco conexao) throws SQLException {
        String sql = """
                SELECT atividades_idatividades, morador_idmorador
                FROM atividadesmorador
                WHERE atividades_idatividades = #1 AND morador_idmorador = #2
                """;
        sql = sql.replace("#1", String.valueOf(idAtividade));
        sql = sql.replace("#2", String.valueOf(idMorador));
        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next()) {
            return montarAtividadeMorador(rs);
        }
        return null;
    }

    public boolean editar(AtividadesMorador atividadeMorador, int idAtividadeAnterior, int idMoradorAnterior, Banco conexao)
            throws SQLException {
        String sql = """
                UPDATE atividadesmorador
                SET atividades_idatividades = #1, morador_idmorador = #2
                WHERE atividades_idatividades = #3 AND morador_idmorador = #4
                """;
        sql = sql.replace("#1", String.valueOf(atividadeMorador.getIdatividade().getIdatividade()));
        sql = sql.replace("#2", String.valueOf(atividadeMorador.getIdmorador().getIdMorador()));
        sql = sql.replace("#3", String.valueOf(idAtividadeAnterior));
        sql = sql.replace("#4", String.valueOf(idMoradorAnterior));
        return conexao.manipular(sql);
    }

    public boolean deletar(int idAtividade, int idMorador, Banco conexao) throws SQLException {
        String sql = """
                DELETE FROM atividadesmorador
                WHERE atividades_idatividades = #1 AND morador_idmorador = #2
                """;
        sql = sql.replace("#1", String.valueOf(idAtividade));
        sql = sql.replace("#2", String.valueOf(idMorador));
        return conexao.manipular(sql);
    }

    public boolean deletarPorAtividade(int idAtividade, Banco conexao) throws SQLException {
        String sql = "DELETE FROM atividadesmorador WHERE atividades_idatividades = #1";
        sql = sql.replace("#1", String.valueOf(idAtividade));
        return conexao.manipular(sql);
    }

    public boolean deletarPorMorador(int idMorador, Banco conexao) throws SQLException {
        String sql = "DELETE FROM atividadesmorador WHERE morador_idmorador = #1";
        sql = sql.replace("#1", String.valueOf(idMorador));
        return conexao.manipular(sql);
    }

    public List<AtividadesMorador> listarPorAtividade(int idAtividade, Banco conexao) throws SQLException {
        String sql = """
                SELECT atividades_idatividades, morador_idmorador
                FROM atividadesmorador
                WHERE atividades_idatividades = #1
                ORDER BY morador_idmorador
                """;
        sql = sql.replace("#1", String.valueOf(idAtividade));
        ResultSet rs = conexao.consultar(sql);
        List<AtividadesMorador> lista = new ArrayList<>();

        if (rs != null) {
            while (rs.next()) {
                lista.add(montarAtividadeMorador(rs));
            }
        }
        return lista;
    }

    private AtividadesMorador montarAtividadeMorador(ResultSet rs) throws SQLException {
        AtividadesMorador atividadesMorador = new AtividadesMorador();
        Atividades atividade = new Atividades();
        Morador morador = new Morador();

        atividade.setIdatividade(rs.getInt("atividades_idatividades"));
        morador.setIdMorador(rs.getInt("morador_idmorador"));

        atividadesMorador.setIdatividade(atividade);
        atividadesMorador.setIdmorador(morador);
        return atividadesMorador;
    }
}

