package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.ComposicaoFamiliarDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.io.Serializable;
import java.sql.SQLException;
import java.util.List;

public class ComposicaoFamiliar implements Serializable
{
    private int idComposicaoFamiliar;
    private String nome;
    private String telefone;
    private String cpf;

    public ComposicaoFamiliar()
    {
    }

    public ComposicaoFamiliar(String nome, String telefone, String cpf)
    {
        this.nome = nome;
        this.telefone = telefone;
        this.cpf = cpf;
    }

    public int getIdComposicaoFamiliar() {
        return idComposicaoFamiliar;
    }

    public void setIdComposicaoFamiliar(int idComposicaoFamiliar) {
        this.idComposicaoFamiliar = idComposicaoFamiliar;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public boolean validarCpf() {
        if (cpf == null)
            return false;
        else {
            String valor = cpf.replaceAll("\\D", "");

            if (valor.length() != 11)
                return false;
            else if (valor.matches("(\\d)\\1{10}"))
                return false;
            else {
                int soma = 0;
                int peso = 10;

                for (int i = 0; i < 9; i++) {
                    soma += Character.getNumericValue(valor.charAt(i)) * peso;
                    peso--;
                }

                int digito1 = 11 - (soma % 11);
                if (digito1 >= 10)
                    digito1 = 0;

                soma = 0;
                peso = 11;

                for (int i = 0; i < 10; i++) {
                    soma += Character.getNumericValue(valor.charAt(i)) * peso;
                    peso--;
                }

                int digito2 = 11 - (soma % 11);
                if (digito2 >= 10)
                    digito2 = 0;

                if (digito1 != Character.getNumericValue(valor.charAt(9)))
                    return false;
                else if (digito2 != Character.getNumericValue(valor.charAt(10)))
                    return false;
                else
                    return true;
            }
        }
    }

    public boolean gravar(Banco conexao) throws SQLException
    {
        if (nome != null && telefone != null && cpf != null && validarCpf()) {
            ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
            return dao.gravar(this, conexao);
        }
        return false;
    }

    public boolean deletar(Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.deletar(this.idComposicaoFamiliar, conexao);
    }

    public ComposicaoFamiliar buscarPorId(int id, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.buscarPorId(id, conexao);
    }

    public ComposicaoFamiliar buscarPorCpf(String cpf, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.buscarPorCpf(cpf, conexao);
    }

    public int contarVinculos(int familiarId, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.contarVinculos(familiarId, conexao);
    }

    public List<ComposicaoFamiliar> listarTodos(String ordenacao, String direcao, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.listarTodos(ordenacao, direcao, conexao);
    }

    public List<ComposicaoFamiliarMorador> listarPorMorador(int moradorId, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.listarPorMorador(moradorId, conexao);
    }

    public List<ComposicaoFamiliarMorador> listarTodosVinculos(String ordenacao, String direcao, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.listarTodosVinculos(ordenacao, direcao, conexao);
    }

    public ComposicaoFamiliarMorador buscarVinculo(int moradorId, int familiarId, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.buscarVinculo(moradorId, familiarId, conexao);
    }

    public boolean desvincularTodosPorMorador(int moradorId, Banco conexao) throws SQLException
    {
        ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
        return dao.desvincularTodosPorMorador(moradorId, conexao);
    }
}
