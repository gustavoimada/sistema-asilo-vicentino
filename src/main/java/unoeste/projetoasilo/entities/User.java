package unoeste.projetoasilo.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import unoeste.projetoasilo.dao.UserDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class User
{
    private int idUser;
    private String name;
    private String senha;
    private String email;

    public User()
    {
    }

    public User(String name, String senha, String email)
    {
        this.name = name;
        this.senha = senha;
        this.email = email;
    }

    public int getIdUser()
    {
        return idUser;
    }

    public void setIdUser(int idUser)
    {
        this.idUser = idUser;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    @JsonIgnore
    public String getSenha()
    {
        return senha;
    }

    public void setSenha(String senha)
    {
        this.senha = senha;
    }

    public String getEmail()
    {
        return email;
    }

    public void setEmail(String email)
    {
        this.email = email;
    }

    public List<User> listar(Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.listar(conexao);
    }

    public User buscarPorNome(String nome, Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.buscarPorNome(nome, conexao);
    }

    public User buscarPorNomeExato(String nome, Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.buscarPorNomeExato(nome, conexao);
    }

    public User buscarPorId(int idUser, Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.buscarPorId(idUser, conexao);
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.gravar(this, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.deletarPorId(this.idUser, conexao);
    }

    public boolean atualizarSenha(String senha, Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.atualizarSenha(this.idUser, senha, conexao);
    }

    public boolean atualizarAcesso(String nome, String senha, Banco conexao) throws SQLException
    {
        UserDAO userDAO = new UserDAO();
        return userDAO.atualizarAcesso(this.idUser, nome, senha, conexao);
    }
}
