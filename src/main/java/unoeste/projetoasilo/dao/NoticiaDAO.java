package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Noticia;

import java.sql.PreparedStatement;
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
                VALUES (?, ?, ?, ?, ?)
                """;

        try (PreparedStatement ps = conexao.prepararComChaves(sql)) {
            ps.setString(1, noticia.getTitulo());
            ps.setString(2, noticia.getDescricao());
            ps.setString(3, noticia.getNomeImagem());
            ps.setString(4, noticia.getImagemCaminho());
            ps.setString(5, noticia.getCategoria());

            if (ps.executeUpdate() > 0) {
                try (ResultSet chaves = ps.getGeneratedKeys()) {
                    if (chaves.next()) {
                        noticia.setIdNoticia(chaves.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            return false;
        }

        return false;
    }

    public boolean editar(Noticia noticia, Banco conexao) {
        if (existeTitulo(noticia.getTitulo(), noticia.getIdNoticia(), conexao)) {
            return false;
        }

        String sql = """
                UPDATE noticia
                SET titulo = ?, descricao = ?, nomeimagem = ?, caminhoimagem = ?, categoria = ?
                WHERE idnoticia = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setString(1, noticia.getTitulo());
            ps.setString(2, noticia.getDescricao());
            ps.setString(3, noticia.getNomeImagem());
            ps.setString(4, noticia.getImagemCaminho());
            ps.setString(5, noticia.getCategoria());
            ps.setInt(6, noticia.getIdNoticia());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            return false;
        }
    }

    public boolean existeTitulo(String titulo, int ignorarId, Banco conexao) {
        String sql = "SELECT 1 FROM noticia WHERE LOWER(titulo) = LOWER(?) AND idnoticia <> ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setString(1, titulo == null ? "" : titulo.trim());
            ps.setInt(2, ignorarId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            return false;
        }
    }

    public boolean excluir(int id, Banco conexao) {
        String sql = "DELETE FROM noticia WHERE idnoticia = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            return false;
        }
    }

    public Noticia buscarPorId(int id, Banco conexao) throws SQLException {
        String sql = "SELECT * FROM noticia WHERE idnoticia = ?";

        try (PreparedStatement ps = conexao.preparar(sql)) {
            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return montarNoticia(rs);
                }
            }
        }

        return null;
    }

    public List<Noticia> listar(Banco conexao) throws SQLException {
        String sql = "SELECT * FROM noticia ORDER BY dataupload DESC, idnoticia DESC";
        List<Noticia> noticias = new ArrayList<>();

        try (PreparedStatement ps = conexao.preparar(sql);
             ResultSet rs = ps.executeQuery()) {
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
