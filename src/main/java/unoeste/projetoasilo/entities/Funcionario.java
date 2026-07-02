package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.FuncionarioDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class Funcionario
{
    private int idFuncionario;
    private User user;
    private String nome;
    private String cpf;
    private String ctps;
    private String telefone;
    private String categoria;

    public Funcionario()
    {
    }

    public Funcionario(String nome, String cpf, String ctps, String telefone, String categoria)
    {
        this.nome = nome;
        this.cpf = cpf;
        this.ctps = ctps;
        this.telefone = telefone;
        this.categoria = categoria;
    }

    public int getIdFuncionario()
    {
        return idFuncionario;
    }

    public void setIdFuncionario(int idFuncionario)
    {
        this.idFuncionario = idFuncionario;
    }

    public User getUser()
    {
        return user;
    }

    public void setUser(User user)
    {
        this.user = user;
    }

    public int getIdUser()
    {
        if (user != null)
        {
            return user.getIdUser();
        }
        return 0;
    }

    public void setIdUser(int idUser)
    {
        if (this.user == null)
        {
            this.user = new User();
        }

        this.user.setIdUser(idUser);
    }

    public String getNome()
    {
        return nome;
    }

    public String getCpf()
    {
        return cpf;
    }

    public String getCtps()
    {
        return ctps;
    }

    public String getTelefone()
    {
        return telefone;
    }

    public String getCategoria()
    {
        return categoria;
    }

    public void setNome(String nome)
    {
        this.nome = nome;
    }

    public void setCpf(String cpf)
    {
        this.cpf = cpf;
    }

    public void setCtps(String ctps)
    {
        this.ctps = ctps;
    }

    public void setTelefone(String telefone)
    {
        this.telefone = telefone;
    }

    public void setCategoria(String categoria)
    {
        this.categoria = categoria;
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.gravar(this, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.editar(this, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.deletar(this.idFuncionario, conexao);
    }

    public Funcionario buscarId(int id, Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorId(id, conexao);
    }

    public List<Funcionario> listar(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.listar(conexao);
    }

    public List<Funcionario> listarPorCategoria(String categoria, Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.listarPorCategoria(categoria, conexao);
    }

    public Funcionario buscarPorNome(String nome, Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorNome(nome, conexao);
    }

    public boolean buscarCpf(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorCpf(this.cpf, conexao);
    }

    public boolean buscarCtps(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorCtps(this.ctps, conexao);
    }

    public boolean buscarCtpsExcluindoId(int id, Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorCtpsExcluindoId(this.ctps, id, conexao);
    }

    public boolean buscarTelefone(Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorTelefone(this.telefone, conexao);
    }

    public boolean buscarTelefoneExcluindoId(int id, Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorTelefoneExcluindoId(this.telefone, id, conexao);
    }

    public Funcionario buscarPorUsuario(int idUser, Banco conexao) throws SQLException
    {
        FuncionarioDAO dao = new FuncionarioDAO();
        return dao.buscarPorUsuarioId(idUser, conexao);
    }
}
