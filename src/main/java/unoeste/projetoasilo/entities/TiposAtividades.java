package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.TiposAtividadesDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class TiposAtividades {
    private int idtipoatividades;
    private String tipo;
    private String org;
    private boolean ativo = true;

    public TiposAtividades() {

    }

    public TiposAtividades(int idtipoatividades, String tipo, String org) {
        this.idtipoatividades = idtipoatividades;
        this.tipo = tipo;
        this.org = org;
    }

    public int getIdtipoatividades() {
        return idtipoatividades;
    }

    public void setIdtipoatividades(int idtipoatividades) {
        this.idtipoatividades = idtipoatividades;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getOrg() {
        return org;
    }

    public void setOrg(String org) {
        this.org = org;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposAtividadesDAO.gravar(this, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException
    {
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposAtividadesDAO.editar(this, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposAtividadesDAO.deletar(this.idtipoatividades, conexao);
    }

    public boolean desativar(Banco conexao) throws SQLException
    {
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        boolean desativou = tiposAtividadesDAO.desativar(this.idtipoatividades, conexao);
        if (desativou)
        {
            this.ativo = false;
        }
        return desativou;
    }

    public TiposAtividades buscarPorId(int id, Banco conexao) throws SQLException
    {
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposAtividadesDAO.buscarPorId(id, conexao);
    }

    public List<TiposAtividades> listar(Banco conexao) throws SQLException
    {
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposAtividadesDAO.listar(conexao);
    }

    public List<TiposAtividades> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException{
        TiposAtividadesDAO tiposAtividadesDAO = new TiposAtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposAtividadesDAO.listarOrdenado(valor, ordem, conexao);
    }

}
