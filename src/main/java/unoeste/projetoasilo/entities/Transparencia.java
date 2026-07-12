package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.TransparenciaDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

public class Transparencia
{
    private int idTransparencia;
    private String nomeArquivo;
    private String caminhoArquivo;
    private String evento;
    private Timestamp dataUpload;
    private int ano;
    private int mes;
    private Funcionario funcionario;

    public int getIdTransparencia()
    {
        return idTransparencia;
    }

    public void setIdTransparencia(int idTransparencia)
    {
        this.idTransparencia = idTransparencia;
    }

    public String getNomeArquivo()
    {
        return nomeArquivo;
    }

    public void setNomeArquivo(String nomeArquivo)
    {
        this.nomeArquivo = nomeArquivo;
    }

    public String getCaminhoArquivo()
    {
        return caminhoArquivo;
    }

    public void setCaminhoArquivo(String caminhoArquivo)
    {
        this.caminhoArquivo = caminhoArquivo;
    }

    public String getEvento()
    {
        return evento;
    }

    public void setEvento(String evento)
    {
        this.evento = evento;
    }

    public Timestamp getDataUpload()
    {
        return dataUpload;
    }

    public void setDataUpload(Timestamp dataUpload)
    {
        this.dataUpload = dataUpload;
    }

    public int getAno()
    {
        return ano;
    }

    public void setAno(int ano)
    {
        this.ano = ano;
    }

    public int getMes()
    {
        return mes;
    }

    public void setMes(int mes)
    {
        this.mes = mes;
    }

    public Funcionario getFuncionario()
    {
        return funcionario;
    }

    public void setFuncionario(Funcionario funcionario)
    {
        this.funcionario = funcionario;
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        validar();
        TransparenciaDAO dao = new TransparenciaDAO();
        return dao.gravar(this, conexao);
    }

    public Transparencia buscarPorId(int id, Banco conexao) throws SQLException
    {
        TransparenciaDAO dao = new TransparenciaDAO();
        return dao.buscarPorId(id, conexao);
    }

    public List<Transparencia> listar(Banco conexao) throws SQLException
    {
        TransparenciaDAO dao = new TransparenciaDAO();
        return dao.listar(conexao);
    }

    public boolean excluir(int id, Banco conexao) throws SQLException
    {
        TransparenciaDAO dao = new TransparenciaDAO();
        return dao.deletar(id, conexao);
    }

    private void validar()
    {
        nomeArquivo = padronizarTexto(nomeArquivo);
        caminhoArquivo = padronizarTexto(caminhoArquivo);
        evento = padronizarTexto(evento);

        if (nomeArquivo == null || nomeArquivo.isBlank())
        {
            throw new IllegalArgumentException("Nome do arquivo e obrigatorio.");
        }

        if (!nomeArquivo.toLowerCase().endsWith(".pdf"))
        {
            throw new IllegalArgumentException("Somente arquivos PDF sao permitidos.");
        }

        if (caminhoArquivo == null || caminhoArquivo.isBlank())
        {
            throw new IllegalArgumentException("Caminho do arquivo e obrigatorio.");
        }

        if (ano < 2000 || ano > 2100)
        {
            throw new IllegalArgumentException("Ano invalido.");
        }

        if (mes < 1 || mes > 12)
        {
            throw new IllegalArgumentException("Mes invalido.");
        }

        if (evento == null || evento.isBlank())
        {
            throw new IllegalArgumentException("Evento e obrigatorio.");
        }

        if (funcionario == null || funcionario.getIdFuncionario() <= 0)
        {
            throw new IllegalArgumentException("Funcionario responsavel e obrigatorio.");
        }

        if (dataUpload == null)
        {
            dataUpload = new Timestamp(System.currentTimeMillis());
        }
    }

    private String padronizarTexto(String valor)
    {
        if (valor == null)
        {
            return null;
        }
        String texto = valor.trim().replaceAll("\\s+", " ");
        if (texto.isBlank())
        {
            return null;
        }
        return texto;
    }
}
