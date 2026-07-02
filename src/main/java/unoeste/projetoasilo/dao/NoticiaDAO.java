package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Noticia;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class NoticiaDAO {

    public boolean gravar(Noticia noticia, Banco conexao) {
        if (existeTitulo(noticia.getTitulo(), -1, conexao)) {
            return false;
        }

        String sql = """
                INSERT INTO noticia(titulo, descricao, nomeimagem, caminhoimagem, categoria)
                VALUES ('#1', '#2', '#3', '#4', '#5')
                """;

        sql = sql.replace("#1", noticia.getTitulo().replace("'", "''"));
        sql = sql.replace("#2", noticia.getDescricao().replace("'", "''"));
        sql = sql.replace("#3", noticia.getNomeImagem().replace("'", "''"));
        sql = sql.replace("#4", noticia.getImagemCaminho().replace("'", "''"));
        sql = sql.replace("#5", noticia.getCategoria().replace("'", "''"));

        if (conexao.manipular(sql)) {
            int novoId = conexao.getMaxPK("noticia", "idnoticia");
            if (novoId > 0) {
                noticia.setIdNoticia(novoId);
                return true;
            }
        }
        return false;
    }

    public boolean editar(Noticia noticia, Banco conexao) {
        if (existeTitulo(noticia.getTitulo(), noticia.getIdNoticia(), conexao)) {
            return false;
        }

        String sql = """
                UPDATE noticia
                SET titulo = '#1', descricao = '#2', nomeimagem = '#3', caminhoimagem = '#4', categoria = '#5'
                WHERE idnoticia = #6
                """;

        sql = sql.replace("#1", noticia.getTitulo().replace("'", "''"));
        sql = sql.replace("#2", noticia.getDescricao().replace("'", "''"));
        sql = sql.replace("#3", noticia.getNomeImagem().replace("'", "''"));
        sql = sql.replace("#4", noticia.getImagemCaminho().replace("'", "''"));
        sql = sql.replace("#5", noticia.getCategoria().replace("'", "''"));
        sql = sql.replace("#6", String.valueOf(noticia.getIdNoticia()));

        return conexao.manipular(sql);
    }

    /** Retorna true se já existe outra notícia com o mesmo título (ignorando a de id=ignorarId, -1 para nenhuma). */
    public boolean existeTitulo(String titulo, int ignorarId, Banco conexao) {
        String tituloSafe = titulo.trim().replace("'", "''");
        String sql = "SELECT 1 FROM noticia WHERE LOWER(titulo) = LOWER('" + tituloSafe + "') AND idnoticia <> " + ignorarId;
        ResultSet rs = conexao.consultar(sql);
        try {
            return rs != null && rs.next();
        } catch (SQLException e) {
            return false;
        }
    }

    public boolean excluir(int id, Banco conexao) {
        return conexao.manipular("DELETE FROM noticia WHERE idnoticia = " + id);
    }

    public Noticia buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = "SELECT * FROM noticia WHERE idnoticia = " + id;
        ResultSet rs = conexao.consultar(sql);

        if (rs != null && rs.next()) {
            return montarNoticia(rs);
        }
        return null;
    }

    public List<Noticia> listar(Banco conexao) throws SQLException {
        String sql = "SELECT * FROM noticia ORDER BY dataupload DESC, idnoticia DESC";
        ResultSet rs = conexao.consultar(sql);
        List<Noticia> noticias = new ArrayList<>();

        if (rs != null) {
            while (rs.next()) {
                noticias.add(montarNoticia(rs));
            }
        }
        return noticias;
    }

    private Noticia montarNoticia(ResultSet rs) throws SQLException {
        Noticia noticia = new Noticia();
        noticia.setIdNoticia(rs.getInt("idnoticia"));
        noticia.setTitulo(rs.getString("titulo"));
        noticia.setDescricao(rs.getString("descricao"));
        noticia.setNomeImagem(rs.getString("nomeimagem"));
        noticia.setImagemCaminho(rs.getString("caminhoimagem"));
        if (rs.getTimestamp("dataupload") != null) {
            noticia.setDataUpload(rs.getTimestamp("dataupload").toLocalDateTime().toLocalDate());
        }
        noticia.setCategoria(rs.getString("categoria"));
        return noticia;
    }
}
