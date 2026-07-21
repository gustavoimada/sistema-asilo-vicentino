package unoeste.projetoasilo.entities;

import java.time.LocalDate;

public class ControleFraldas
{
    private int idControleFraldas;
    private int quantidadePacotes;
    private int fraldasPorPacote;
    private int totalFraldas;
    private LocalDate dataRegistro;
    private String observacao;
    private Integer idFuncionario;
    private String funcionarioNome;

    public int getIdControleFraldas() { return idControleFraldas; }
    public void setIdControleFraldas(int idControleFraldas) { this.idControleFraldas = idControleFraldas; }
    public int getQuantidadePacotes() { return quantidadePacotes; }
    public void setQuantidadePacotes(int quantidadePacotes) { this.quantidadePacotes = quantidadePacotes; }
    public int getFraldasPorPacote() { return fraldasPorPacote; }
    public void setFraldasPorPacote(int fraldasPorPacote) { this.fraldasPorPacote = fraldasPorPacote; }
    public int getTotalFraldas() { return totalFraldas; }
    public void setTotalFraldas(int totalFraldas) { this.totalFraldas = totalFraldas; }
    public LocalDate getDataRegistro() { return dataRegistro; }
    public void setDataRegistro(LocalDate dataRegistro) { this.dataRegistro = dataRegistro; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public Integer getIdFuncionario() { return idFuncionario; }
    public void setIdFuncionario(Integer idFuncionario) { this.idFuncionario = idFuncionario; }
    public String getFuncionarioNome() { return funcionarioNome; }
    public void setFuncionarioNome(String funcionarioNome) { this.funcionarioNome = funcionarioNome; }
}
