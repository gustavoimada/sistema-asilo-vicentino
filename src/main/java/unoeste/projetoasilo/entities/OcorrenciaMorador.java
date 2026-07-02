package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.OcorrenciaMoradorDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class OcorrenciaMorador
{
    private int idMoradorOcorrencia;
    private Morador morador;
    private Ocorrencia ocorrencia;

    public OcorrenciaMorador()
    {
    }

    public int getIdMoradorOcorrencia()
    {
        return idMoradorOcorrencia;
    }

    public void setIdMoradorOcorrencia(int idMoradorOcorrencia)
    {
        this.idMoradorOcorrencia = idMoradorOcorrencia;
    }

    public Morador getMorador()
    {
        return morador;
    }

    public void setMorador(Morador morador)
    {
        this.morador = morador;
    }

    public Ocorrencia getOcorrencia()
    {
        return ocorrencia;
    }

    public void setOcorrencia(Ocorrencia ocorrencia)
    {
        this.ocorrencia = ocorrencia;
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        if (morador == null || morador.getIdMorador() <= 0)
        {
            throw new IllegalArgumentException("Morador da ocorrencia e obrigatorio.");
        }

        if (ocorrencia == null || ocorrencia.getIdOcorrencia() <= 0)
        {
            throw new IllegalArgumentException("Ocorrencia de referencia e obrigatoria.");
        }

        OcorrenciaMoradorDAO dao = new OcorrenciaMoradorDAO();
        return dao.gravar(this, conexao);
    }

    public List<Morador> listarMoradoresPorOcorrencia(int idOcorrencia, Banco conexao) throws SQLException
    {
        OcorrenciaMoradorDAO dao = new OcorrenciaMoradorDAO();
        return dao.listarMoradoresPorOcorrencia(idOcorrencia, conexao);
    }

    public boolean deletarPorOcorrencia(int idOcorrencia, Banco conexao) throws SQLException
    {
        OcorrenciaMoradorDAO dao = new OcorrenciaMoradorDAO();
        return dao.deletarPorOcorrencia(idOcorrencia, conexao);
    }
}
