package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.TurnoDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.time.LocalTime;

public class Turno
{
    private int idTurnos;
    private LocalTime horaIni;
    private LocalTime horaFim;

    public Turno()
    {
    }

    public int getIdTurnos()
    {
        return idTurnos;
    }

    public void setIdTurnos(int idTurnos)
    {
        this.idTurnos = idTurnos;
    }

    public LocalTime getHoraIni()
    {
        return horaIni;
    }

    public void setHoraIni(LocalTime horaIni)
    {
        this.horaIni = horaIni;
    }

    public LocalTime getHoraFim()
    {
        return horaFim;
    }

    public void setHoraFim(LocalTime horaFim)
    {
        this.horaFim = horaFim;
    }

    public Turno buscarTurnoAtivoPorFuncionario(int idFuncionario, Banco conexao) throws SQLException
    {
        TurnoDAO dao = new TurnoDAO();
        return dao.buscarTurnoAtivoPorFuncionario(idFuncionario, conexao);
    }

    public boolean iniciarTurno(int idFuncionario, String descricao, Banco conexao) throws SQLException
    {
        TurnoDAO dao = new TurnoDAO();
        return dao.iniciarTurno(idFuncionario, descricao, conexao);
    }

    public boolean fecharTurnoAtivo(int idFuncionario, String descricao, Banco conexao) throws SQLException
    {
        TurnoDAO dao = new TurnoDAO();
        return dao.fecharTurnoAtivo(idFuncionario, descricao, conexao);
    }

    public String validarIniciarTurno(int idFuncionario, Banco conexao) throws SQLException
    {
        TurnoDAO dao = new TurnoDAO();
        String categoria = dao.buscarCategoriaFuncionario(idFuncionario, conexao);
        if (categoria == null || categoria.isBlank())
        {
            return "Funcionário não encontrado";
        }

        if (!categoria.equalsIgnoreCase("Cuidador"))
        {
            return "Apenas cuidadores podem iniciar turno";
        }

        Turno escala = dao.buscarEscalaPendenteHoje(idFuncionario, conexao);
        if (escala == null)
        {
            return "Funcionário não está escalado para hoje";
        }

        LocalTime agora = LocalTime.now();
        LocalTime inicio = escala.getHoraIni();
        LocalTime fim = escala.getHoraFim();
        if (inicio == null || fim == null)
        {
            return "OK";
        }

        boolean dentroHorario;
        if (inicio.equals(fim))
        {
            dentroHorario = true;
        }
        else if (inicio.isBefore(fim))
        {
            dentroHorario = !agora.isBefore(inicio) && !agora.isAfter(fim);
        }
        else
        {
            dentroHorario = !agora.isBefore(inicio) || !agora.isAfter(fim);
        }

        if (!dentroHorario)
        {
            return "Fora do horário. Turno: " + escala.getHoraIni() + " até " + escala.getHoraFim();
        }

        return "OK";
    }

    public boolean escalarFuncionarioTurno(int idFuncionario, int idTurno, Banco conexao) throws SQLException
    {
        TurnoDAO dao = new TurnoDAO();
        return dao.escalarFuncionarioTurno(idFuncionario, idTurno, conexao);
    }

}
