package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.FuncionarioTurnosDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class FuncionarioTurnos
{
    private int idFuncionarioTurnos;
    private Funcionario funcionario;
    private Turno turno;
    private String status;
    private String descricao;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private LocalDate dataEscala;

    public FuncionarioTurnos()
    {
    }

    public FuncionarioTurnos(int idFuncionario, int idTurno)
    {
        this.funcionario = criarFuncionarioComId(idFuncionario);
        this.turno = criarTurnoComId(idTurno);
        this.status = "pendente";
        this.dataEscala = LocalDate.now();
    }

    public FuncionarioTurnos(int idFuncionario, int idTurno, String status, String descricao)
    {
        this.funcionario = criarFuncionarioComId(idFuncionario);
        this.turno = criarTurnoComId(idTurno);
        this.status = status;
        this.descricao = descricao;
        this.dataEscala = LocalDate.now();
    }

    public int getIdFuncionarioTurnos()
    {
        return idFuncionarioTurnos;
    }

    public void setIdFuncionarioTurnos(int idFuncionarioTurnos)
    {
        this.idFuncionarioTurnos = idFuncionarioTurnos;
    }

    public Funcionario getFuncionario()
    {
        return funcionario;
    }

    public void setFuncionario(Funcionario funcionario)
    {
        this.funcionario = funcionario;
    }

    public Turno getTurno()
    {
        return turno;
    }

    public void setTurno(Turno turno)
    {
        this.turno = turno;
    }

    public int getIdFuncionario()
    {
        if (funcionario != null)
        {
            return funcionario.getIdFuncionario();
        }
        return 0;
    }

    public void setIdFuncionario(int idFuncionario)
    {
        if (this.funcionario == null)
        {
            this.funcionario = new Funcionario();
        }
        this.funcionario.setIdFuncionario(idFuncionario);
    }

    public int getIdTurno()
    {
        if (turno != null)
        {
            return turno.getIdTurnos();
        }
        return 0;
    }

    public void setIdTurno(int idTurno)
    {
        if (this.turno == null)
        {
            this.turno = new Turno();
        }
        this.turno.setIdTurnos(idTurno);
    }

    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }

    public String getDescricao()
    {
        return descricao;
    }

    public void setDescricao(String descricao)
    {
        this.descricao = descricao;
    }

    public LocalTime getHoraInicio()
    {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio)
    {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFim()
    {
        return horaFim;
    }

    public void setHoraFim(LocalTime horaFim)
    {
        this.horaFim = horaFim;
    }

    public LocalDate getDataEscala()
    {
        return dataEscala;
    }

    public void setDataEscala(LocalDate dataEscala)
    {
        this.dataEscala = dataEscala;
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        validar();
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.inserirEscala(this, conexao);
    }

    public List<FuncionarioTurnos> listar(Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.listarTodas(conexao);
    }

    public List<FuncionarioTurnos> listarPorFuncionario(int idFuncionario, Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.listarPorFuncionario(idFuncionario, conexao);
    }

    public List<FuncionarioTurnos> listarPorStatus(String status, Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.listarPorStatus(status, conexao);
    }

    public List<FuncionarioTurnos> listarPorPeriodo(LocalDate inicio, LocalDate fim, Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.listarPorPeriodo(inicio, fim, conexao);
    }

    public FuncionarioTurnos buscarPorId(int idFuncionarioTurnos, Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.buscarEscala(idFuncionarioTurnos, conexao);
    }

    public boolean atualizarStatus(int idFuncionarioTurnos, String novoStatus, Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.atualizarStatus(idFuncionarioTurnos, novoStatus, conexao);
    }

    public boolean deletar(int idFuncionarioTurnos, Banco conexao) throws SQLException
    {
        FuncionarioTurnosDAO dao = new FuncionarioTurnosDAO();
        return dao.deletarEscala(idFuncionarioTurnos, conexao);
    }

    private void validar()
    {
        if (getIdFuncionario() <= 0)
        {
            throw new IllegalArgumentException("Funcionario da escala e obrigatorio.");
        }

        if (getIdTurno() <= 0)
        {
            throw new IllegalArgumentException("Turno da escala e obrigatorio.");
        }

        if (status == null || status.isBlank())
        {
            status = "pendente";
        }

        if (dataEscala == null)
        {
            dataEscala = LocalDate.now();
        }
    }

    private Funcionario criarFuncionarioComId(int idFuncionario)
    {
        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(idFuncionario);
        return funcionario;
    }

    private Turno criarTurnoComId(int idTurno)
    {
        Turno turno = new Turno();
        turno.setIdTurnos(idTurno);
        return turno;
    }
}
