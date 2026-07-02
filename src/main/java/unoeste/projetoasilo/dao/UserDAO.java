package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.User;

import java.util.ArrayList;
import java.util.List;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserDAO
{
    public List<User> listar(Banco conexao) throws SQLException
    {
        List<User> userList = new ArrayList<>();
        String sql = "SELECT id, name, senha, email FROM usuario";
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                User usuario = new User();
                usuario.setIdUser(rs.getInt("id"));
                usuario.setName(rs.getString("name"));
                usuario.setSenha(rs.getString("senha"));
                usuario.setEmail(rs.getString("email"));
                userList.add(usuario);
            }
        }
        return userList;
    }

    public User buscarPorNome(String nome, Banco conexao) throws SQLException
    {
        String sql = "SELECT id, name, senha, email FROM usuario WHERE LOWER(name) = LOWER(?) LIMIT 1";
        try (PreparedStatement statement = conexao.preparar(sql))
        {
            statement.setString(1, nome);
            try (ResultSet rs = statement.executeQuery())
            {
                if (rs.next())
                {
                    return montarUsuario(rs);
                }
            }
        }
        return null;
    }

    public User buscarPorNomeExato(String nome, Banco conexao) throws SQLException
    {
        String sql = "SELECT id, name, senha, email FROM usuario WHERE name = ? LIMIT 1";
        try (PreparedStatement statement = conexao.preparar(sql))
        {
            statement.setString(1, nome);
            try (ResultSet rs = statement.executeQuery())
            {
                if (rs.next())
                {
                    return montarUsuario(rs);
                }
            }
        }
        return null;
    }

    public User buscarPorId(int idUser, Banco conexao) throws SQLException
    {
        String sql = "SELECT id, name, senha, email FROM usuario WHERE id = ? LIMIT 1";
        try (PreparedStatement statement = conexao.preparar(sql))
        {
            statement.setInt(1, idUser);
            try (ResultSet rs = statement.executeQuery())
            {
                if (rs.next())
                {
                    return montarUsuario(rs);
                }
            }
        }
        return null;
    }

    public boolean gravar(User user, Banco conexao) throws SQLException
    {
        String sql = "INSERT INTO usuario (name, senha, email) VALUES (?, ?, ?)";
        try (PreparedStatement statement = conexao.prepararComChaves(sql))
        {
            statement.setString(1, user.getName());
            statement.setString(2, user.getSenha());
            statement.setString(3, user.getEmail());

            if (statement.executeUpdate() <= 0)
            {
                return false;
            }

            try (ResultSet rs = statement.getGeneratedKeys())
            {
                if (rs.next())
                {
                    user.setIdUser(rs.getInt(1));
                }
            }
        }
        return true;
    }

    public boolean atualizarSenha(int idUser, String senha, Banco conexao) throws SQLException
    {
        String sql = "UPDATE usuario SET senha = ? WHERE id = ?";
        try (PreparedStatement statement = conexao.preparar(sql))
        {
            statement.setString(1, senha);
            statement.setInt(2, idUser);
            return statement.executeUpdate() > 0;
        }
    }

    public boolean deletarPorId(int idUser, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM usuario WHERE id = #1";
        sql = sql.replace("#1", String.valueOf(idUser));
        return conexao.manipular(sql);
    }

    private String escaparTextoSql(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.replace("'", "''");
    }

    private User montarUsuario(ResultSet rs) throws SQLException
    {
        User usuario = new User();
        usuario.setIdUser(rs.getInt("id"));
        usuario.setName(rs.getString("name"));
        usuario.setSenha(rs.getString("senha"));
        usuario.setEmail(rs.getString("email"));
        return usuario;
    }
}
