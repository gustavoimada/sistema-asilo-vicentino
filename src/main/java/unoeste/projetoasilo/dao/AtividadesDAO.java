package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Atividades;
import unoeste.projetoasilo.entities.TiposAtividades;

import java.sql.ResultSet;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

public class AtividadesDAO {
    private static volatile boolean estruturaPeriodoVerificada = false;

    private void garantirEstruturaPeriodo(Banco conexao) throws SQLException {
        if (estruturaPeriodoVerificada) {
            return;
        }

        synchronized (AtividadesDAO.class) {
            if (estruturaPeriodoVerificada) {
                return;
            }

            try (PreparedStatement alteracao = conexao.preparar(
                    "ALTER TABLE atividades ADD COLUMN IF NOT EXISTS datafim DATE")) {
                alteracao.execute();
            }
            try (PreparedStatement atualizacao = conexao.preparar(
                    "UPDATE atividades SET datafim = data::date WHERE datafim IS NULL")) {
                atualizacao.executeUpdate();
            }
            estruturaPeriodoVerificada = true;
        }
    }

    private LocalTime lerHora(ResultSet rs, String coluna) throws SQLException {
        String valor = rs.getString(coluna);
        if (valor == null || valor.isBlank()) {
            return null;
        }

        try {
            return LocalTime.parse(valor.trim());
        } catch (DateTimeParseException e) {
            throw new SQLException("Horario invalido na coluna " + coluna + ": " + valor, e);
        }
    }

    private Atividades montarAtividade(ResultSet rs) throws SQLException {
        Atividades atividade = new Atividades();
        TiposAtividades tipoAtividade = new TiposAtividades();
        atividade.setIdatividade(rs.getInt("idatividades"));
        atividade.setNome(rs.getString("nome"));
        atividade.setDescricao(rs.getString("descricao"));
        atividade.setDate(rs.getDate("data").toLocalDate());
        atividade.setDataFim(rs.getDate("datafim") == null
                ? atividade.getDate()
                : rs.getDate("datafim").toLocalDate());
        atividade.setHorainicio(lerHora(rs, "horaini"));
        atividade.setHorafim(lerHora(rs, "horafim"));
        tipoAtividade.setIdtipoatividades(rs.getInt("tipoatividade_idtipoatividade"));
        atividade.setTipoatividades(tipoAtividade);
        return atividade;
    }

    public boolean gravar(Atividades atividade, Banco conexao) throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = """
                INSERT INTO atividades (nome, descricao, data, datafim, horaini, horafim, tipoatividade_idtipoatividade)
                VALUES ('#1', '#2', '#3', '#4', '#5', '#6', #7)
                """;
        sql = sql.replace("#1", atividade.getNome());
        sql = sql.replace("#2", atividade.getDescricao());
        sql = sql.replace("#3", atividade.getDate().toString());
        sql = sql.replace("#4", atividade.getDataFim().toString());
        sql = sql.replace("#5", atividade.getHorainicio().toString());
        sql = sql.replace("#6", atividade.getHorafim().toString());
        sql = sql.replace("#7", String.valueOf(atividade.getTipoatividades().getIdtipoatividades()));

        if (!conexao.manipular(sql)) {
            return false;
        }

        int novoId = conexao.getMaxPK("atividades", "idatividades");
        if (novoId > 0) {
            atividade.setIdatividade(novoId);
        }
        return true;
    }

    public boolean editar(Atividades atividade, Banco conexao) throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = """
                UPDATE atividades
                SET nome = '#1', descricao = '#2', data = '#3', datafim = '#4', horaini = '#5', horafim = '#6',
                    tipoatividade_idtipoatividade = #7
                WHERE idatividades = #8
                """;

        sql = sql.replace("#1", atividade.getNome());
        sql = sql.replace("#2", atividade.getDescricao());
        sql = sql.replace("#3", atividade.getDate().toString());
        sql = sql.replace("#4", atividade.getDataFim().toString());
        sql = sql.replace("#5", atividade.getHorainicio().toString());
        sql = sql.replace("#6", atividade.getHorafim().toString());
        sql = sql.replace("#7", String.valueOf(atividade.getTipoatividades().getIdtipoatividades()));
        sql = sql.replace("#8", String.valueOf(atividade.getIdatividade()));

        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException {
        String sql = "DELETE FROM atividades WHERE idatividades = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean deletarVinculosMoradores(int idAtividade, Banco conexao) throws SQLException {
        String sql = "DELETE FROM atividadesmorador WHERE atividades_idatividades = #1";
        sql = sql.replace("#1", String.valueOf(idAtividade));
        conexao.manipular(sql);
        return true;
    }

    public Atividades buscarPorId(int id, Banco conexao) throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = """
                SELECT idatividades, nome, descricao, data, datafim, horaini, horafim, tipoatividade_idtipoatividade
                FROM atividades
                WHERE idatividades = #1
                """;
        sql = sql.replace("#1", String.valueOf(id));
        ResultSet rs = conexao.consultar(sql);
        Atividades atividade = null;
        if (rs != null && rs.next()) {
            atividade = montarAtividade(rs);
        }
        return atividade;
    }

    public List<Atividades> listar(Banco conexao) throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = """
                SELECT idatividades, nome, descricao, data, datafim, horaini, horafim, tipoatividade_idtipoatividade
                FROM atividades
                WHERE COALESCE(datafim, data::date)::date + horafim::time >= LOCALTIMESTAMP
                ORDER BY data::date, horaini::time, idatividades
                """;
        List<Atividades> atividades = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                atividades.add(montarAtividade(rs));
            }
        }
        return atividades;
    }

    public List<Atividades> listarAntigas(Banco conexao) throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = """
                SELECT idatividades, nome, descricao, data, datafim, horaini, horafim, tipoatividade_idtipoatividade
                FROM atividades
                WHERE COALESCE(datafim, data::date)::date + horafim::time < LOCALTIMESTAMP
                ORDER BY COALESCE(datafim, data::date) DESC, horafim::time DESC, idatividades
                """;
        List<Atividades> atividades = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                atividades.add(montarAtividade(rs));
            }
        }
        return atividades;
    }

    public List<Atividades> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = "SELECT * FROM atividades ORDER BY " + colunaOrdenacao(valor) + " " + direcaoOrdenacao(ordem);
        List<Atividades> atividades = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null) {
            while (rs.next()) {
                atividades.add(montarAtividade(rs));
            }
        }
        return atividades;
    }

    public boolean existeNoMesmoHorario(LocalDate data, LocalDate dataFim, LocalTime horainicio,
                                         LocalTime horafim, Integer idIgnorar, Banco conexao)
            throws SQLException {
        garantirEstruturaPeriodo(conexao);
        String sql = """
                SELECT idatividades
                FROM atividades
                WHERE data::date <= '#3'::date
                  AND COALESCE(datafim, data::date)::date >= '#1'::date
                  AND '#2'::time < horafim::time
                  AND '#4'::time > horaini::time
                """;

        sql = sql.replace("#1", data.toString());
        sql = sql.replace("#2", horainicio.toString());
        sql = sql.replace("#3", dataFim.toString());
        sql = sql.replace("#4", horafim.toString());

        if (idIgnorar != null) {
            sql = sql + " AND idatividades <> " + idIgnorar;
        }
        sql = sql + " LIMIT 1";

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public boolean existeParaTipoAtividade(int idTipoAtividade, Banco conexao) throws SQLException {
        String sql = """
                SELECT 1
                FROM atividades
                WHERE tipoatividade_idtipoatividade = #1
                LIMIT 1
                """;
        sql = sql.replace("#1", String.valueOf(idTipoAtividade));
        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public List<Integer> listarIdsPorTipoAtividade(int idTipoAtividade, Banco conexao) throws SQLException {
        String sql = """
                SELECT idatividades
                FROM atividades
                WHERE tipoatividade_idtipoatividade = #1
                ORDER BY idatividades
                """;
        sql = sql.replace("#1", String.valueOf(idTipoAtividade));
        ResultSet rs = conexao.consultar(sql);
        List<Integer> ids = new ArrayList<>();

        if (rs != null) {
            while (rs.next()) {
                ids.add(rs.getInt("idatividades"));
            }
        }
        return ids;
    }

    private String colunaOrdenacao(String valor) {
        if (valor == null) {
            return "idatividades";
        }
        return switch (valor.toLowerCase()) {
            case "nome" -> "nome";
            case "descricao" -> "descricao";
            case "data", "date" -> "data";
            case "datafim" -> "datafim";
            case "horaini", "horainicio" -> "horaini";
            case "horafim" -> "horafim";
            case "tipoatividade_idtipoatividade", "idtipoatividade" -> "tipoatividade_idtipoatividade";
            default -> "idatividades";
        };
    }

    private String direcaoOrdenacao(String ordem) {
        return "DESC".equalsIgnoreCase(ordem) ? "DESC" : "ASC";
    }
}
