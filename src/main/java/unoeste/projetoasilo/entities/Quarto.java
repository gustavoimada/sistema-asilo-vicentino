package unoeste.projetoasilo.entities;


import unoeste.projetoasilo.dao.QuartoDAO;

import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;


public class Quarto {

    public static final int CAPACIDADE_MAXIMA_POR_QUARTO = 2;

    private int idQuartos;
    private String ala;
    private Integer numero;
    private int capacidademax = CAPACIDADE_MAXIMA_POR_QUARTO;
    private int qtndHospedes;
    private String disponibilidade;

    public Quarto() {
    }

    public Quarto(String ala, Integer numero, int qtndHospedes, String disponibilidade) {
        this.ala = ala;
        this.numero = numero;
        this.capacidademax = CAPACIDADE_MAXIMA_POR_QUARTO;
        this.qtndHospedes = qtndHospedes;
        this.disponibilidade = disponibilidade;
    }

    public int getIdQuartos() {
        return idQuartos;
    }

    public void setIdQuartos(int idQuartos) {
        this.idQuartos = idQuartos;
    }

    public String getAla() {
        return ala;
    }

    public void setAla(String ala) {
        this.ala = ala;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public int getCapacidademax() {
        return CAPACIDADE_MAXIMA_POR_QUARTO;
    }

    public void setCapacidademax(int capacidademax) {
        this.capacidademax = CAPACIDADE_MAXIMA_POR_QUARTO;
    }

    public int getQtndHospedes() {
        return qtndHospedes;
    }

    public void setQtndHospedes(int qtndHospedes) {
        this.qtndHospedes = qtndHospedes;
    }

    public String getDisponibilidade() {
        return disponibilidade;
    }

    public void setDisponibilidade(String disponibilidade) {
        this.disponibilidade = disponibilidade;
    }



    public boolean gravar(Banco conexao) throws SQLException
    {
        QuartoDAO quartodao = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartodao.gravar(this, conexao);
    }
    public boolean editar(Banco conexao) throws SQLException
    {
        QuartoDAO quartodao = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartodao.editar(this, conexao);
    }

    public boolean editar(int idOriginal, Banco conexao) throws SQLException
    {
        QuartoDAO quartodao = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartodao.editar(this, idOriginal, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        QuartoDAO quartodao = new QuartoDAO();

        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartodao.deletar(this.idQuartos, conexao);
    }

    public Quarto buscarPorId(int id, Banco conexao) throws SQLException
    {
        QuartoDAO quartodao = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartodao.buscarPorId(id, conexao);
    }

    public List<Quarto> listar(Banco conexao) throws SQLException
    {
        QuartoDAO quartodao = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartodao.listar(conexao);
    }

    public List<Quarto> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException{
        QuartoDAO quartoDAO = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartoDAO.listarOrdenado(valor, ordem, conexao);
    }

    public List<Quarto> listarDisponiveis(Integer quartoAtualId, Banco conexao) throws SQLException
    {
        QuartoDAO quartoDAO = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartoDAO.listarDisponiveis(quartoAtualId, conexao);
    }

    public boolean ocuparVaga(int idQuarto, Banco conexao) throws SQLException
    {
        QuartoDAO quartoDAO = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartoDAO.ocuparVaga(idQuarto, conexao);
    }

    public boolean liberarVaga(int idQuarto, Banco conexao) throws SQLException
    {
        QuartoDAO quartoDAO = new QuartoDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return quartoDAO.liberarVaga(idQuarto, conexao);
    }

}
