package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.AtividadesDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class Atividades {
    private int idatividade;
    private String nome;
    private String descricao;
    private LocalDate date;
    private LocalTime horainicio;
    private LocalTime horafim;
    private TiposAtividades tipoatividades;

    public Atividades() {
    }

    public Atividades(String nome, LocalDate date, String descricao, LocalTime horafim, LocalTime horainicio, TiposAtividades tipoatividades) {
        this.nome = nome;
        this.date = date;
        this.descricao = descricao;
        this.horafim = horafim;
        this.horainicio = horainicio;
        this.tipoatividades = tipoatividades;
    }

    public int getIdatividade() {
        return idatividade;
    }

    public void setIdatividade(int idatividade) {
        this.idatividade = idatividade;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getHorainicio() {
        return horainicio;
    }

    public void setHorainicio(LocalTime horainicio) {
        this.horainicio = horainicio;
    }

    public LocalTime getHorafim() {
        return horafim;
    }

    public void setHorafim(LocalTime horafim) {
        this.horafim = horafim;
    }

    public TiposAtividades getTipoatividades() {
        return tipoatividades;
    }

    public void setTipoatividades(TiposAtividades tipoatividades) {
        this.tipoatividades = tipoatividades;
    }

    public boolean gravar(Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.gravar(this, conexao);
    }

    public List<Atividades> listar(Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.listar(conexao);
    }

    public List<Atividades> listarAntigas(Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.listarAntigas(conexao);
    }

    public Atividades buscarPorId(int id, Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.buscarPorId(id, conexao);
    }

    public boolean existeNoMesmoHorario(LocalDate data, LocalTime horainicio, LocalTime horafim, Integer idIgnorar, Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.existeNoMesmoHorario(data, horainicio, horafim, idIgnorar, conexao);
    }

    public boolean existeParaTipoAtividade(int idTipoAtividade, Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.existeParaTipoAtividade(idTipoAtividade, conexao);
    }

    public List<Integer> listarIdsPorTipoAtividade(int idTipoAtividade, Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.listarIdsPorTipoAtividade(idTipoAtividade, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.deletar(this.idatividade, conexao);
    }

    public boolean editar(Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.editar(this, conexao);
    }

    public List<Atividades> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException {
        AtividadesDAO atividadesDAO = new AtividadesDAO();
        if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return atividadesDAO.listarOrdenado(valor, ordem, conexao);
    }

}
