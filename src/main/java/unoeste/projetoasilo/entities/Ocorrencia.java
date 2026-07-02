package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.OcorrenciaDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

public class Ocorrencia
{
    private int idOcorrencia;
    private TipoOcorrencia tipoOcorrencia;
    private String observacoes;
    private Timestamp dtOcorrencia;
    private Funcionario funcionario;
    private Turno turno;
    private List<Morador> moradores;

    public Ocorrencia()
    {
    }

    public int getIdOcorrencia()
    {
        return idOcorrencia;
    }

    public void setIdOcorrencia(int idOcorrencia)
    {
        this.idOcorrencia = idOcorrencia;
    }

    public TipoOcorrencia getTipoOcorrencia()
    {
        return tipoOcorrencia;
    }

    public void setTipoOcorrencia(TipoOcorrencia tipoOcorrencia)
    {
        this.tipoOcorrencia = tipoOcorrencia;
    }

    public String getObservacoes()
    {
        return observacoes;
    }

    public void setObservacoes(String observacoes)
    {
        this.observacoes = observacoes;
    }

    public Timestamp getDtOcorrencia()
    {
        return dtOcorrencia;
    }

    public void setDtOcorrencia(Timestamp dtOcorrencia)
    {
        this.dtOcorrencia = dtOcorrencia;
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

    public List<Morador> getMoradores()
    {
        return moradores;
    }

    public void setMoradores(List<Morador> moradores)
    {
        this.moradores = moradores;
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        validar();
        OcorrenciaDAO dao = new OcorrenciaDAO();
        return dao.gravar(this, conexao);
    }

    public List<Ocorrencia> listar(Banco conexao) throws SQLException
    {
        OcorrenciaDAO dao = new OcorrenciaDAO();
        return dao.listar(conexao);
    }

    public List<Ocorrencia> listarPorTurno(FuncionarioTurnos turno, Banco conexao) throws SQLException
    {
        OcorrenciaDAO dao = new OcorrenciaDAO();
        return dao.listarPorTurno(turno, conexao);
    }

    public Ocorrencia buscarPorId(int idOcorrencia, Banco conexao) throws SQLException
    {
        OcorrenciaDAO dao = new OcorrenciaDAO();
        return dao.buscarPorId(idOcorrencia, conexao);
    }

    public boolean atualizar(Banco conexao) throws SQLException
    {
        validar();
        OcorrenciaDAO dao = new OcorrenciaDAO();
        return dao.atualizar(this, conexao);
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        OcorrenciaDAO dao = new OcorrenciaDAO();
        return dao.deletar(this.idOcorrencia, conexao);
    }

    private void validar()
    {
        if (tipoOcorrencia == null || tipoOcorrencia.getIdOcorrencias() <= 0)
        {
            throw new IllegalArgumentException("Tipo de ocorrencia e obrigatorio.");
        }

        if (funcionario == null || funcionario.getIdFuncionario() <= 0)
        {
            throw new IllegalArgumentException("Funcionario da ocorrencia e obrigatorio.");
        }

        if (turno == null || turno.getIdTurnos() <= 0)
        {
            throw new IllegalArgumentException("Turno da ocorrencia e obrigatorio.");
        }

        observacoes = padronizarObservacoes(observacoes);

        if (observacoes == null || observacoes.isBlank())
        {
            throw new IllegalArgumentException("Descricao da ocorrencia e obrigatoria.");
        }

        if (observacoes.length() > 45)
        {
            throw new IllegalArgumentException("Descricao deve ter no maximo 45 caracteres.");
        }

        if (!observacoes.matches("^[\\p{L} ]+$"))
        {
            throw new IllegalArgumentException("Use apenas letras e espacos na descricao.");
        }

        if (dtOcorrencia == null)
        {
            dtOcorrencia = new Timestamp(System.currentTimeMillis());
        }
    }

    private String padronizarObservacoes(String valor)
    {
        if (valor == null)
        {
            return null;
        }

        return valor.trim().replaceAll("\\s+", " ");
    }
}
