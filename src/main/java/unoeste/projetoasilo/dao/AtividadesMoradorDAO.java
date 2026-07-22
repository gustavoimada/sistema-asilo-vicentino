package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Atividades;
import unoeste.projetoasilo.entities.AtividadesMorador;
import unoeste.projetoasilo.entities.Morador;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class AtividadesMoradorDAO {
    private static volatile boolean estruturaObservacaoVerificada = false;

    private void garantirEstruturaObservacao(Banco conexao) throws SQLException {
        if (estruturaObservacaoVerificada) {
            return;
        }

        synchronized (AtividadesMoradorDAO.class) {
            if (estruturaObservacaoVerificada) {
                return;
            }

            try (PreparedStatement alteracao = conexao.preparar(
                    "ALTER TABLE atividadesmorador ADD COLUMN IF NOT EXISTS observacao VARCHAR(500)")) {
                alteracao.execute();
            }
            estruturaObservacaoVerificada = true;
        }
    }

    public boolean gravar(AtividadesMorador atividadeMorador, Banco conexao) throws SQLException {
        garantirEstruturaObservacao(conexao);
        String sql = """
                INSERT INTO atividadesmorador (atividades_idatividades, morador_idmorador, observacao)
                VALUES (#1, #2, '#3')
                """;
        sql = sql.replace("#1", String.valueOf(atividadeMorador.getIdatividade().getIdatividade()));
        sql = sql.replace("#2", String.valueOf(atividadeMorador.getIdmorador().getIdMorador()));
        sql = sql.replace("#3", escaparSql(atividadeMorador.getObservacao()));
        return conexao.manipular(sql);
    }

    public AtividadesMorador buscarPorIds(int idAtividade, int idMorador, Banco conexao) throws SQLException {
        garantirEstruturaObservacao(conexao);
        String sql = """
                SELECT atividades_idatividades, morador_idmorador, observacao
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
        garantirEstruturaObservacao(conexao);
        String sql = """
                UPDATE atividadesmorador
                SET atividades_idatividades = #1, morador_idmorador = #2, observacao = '#3'
                WHERE atividades_idatividades = #4 AND morador_idmorador = #5
                """;
        sql = sql.replace("#1", String.valueOf(atividadeMorador.getIdatividade().getIdatividade()));
        sql = sql.replace("#2", String.valueOf(atividadeMorador.getIdmorador().getIdMorador()));
        sql = sql.replace("#3", escaparSql(atividadeMorador.getObservacao()));
        sql = sql.replace("#4", String.valueOf(idAtividadeAnterior));
        sql = sql.replace("#5", String.valueOf(idMoradorAnterior));
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
        garantirEstruturaObservacao(conexao);
        String sql = """
                SELECT atividades_idatividades, morador_idmorador, observacao
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
        atividadesMorador.setObservacao(rs.getString("observacao"));
        return atividadesMorador;
    }

    private String escaparSql(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("'", "''");
    }
}
