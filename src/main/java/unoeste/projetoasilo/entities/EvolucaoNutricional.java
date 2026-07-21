package unoeste.projetoasilo.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EvolucaoNutricional
{
    private int idEvolucao;
    private int prontuarioId;
    private Funcionario nutricionista;
    private String evolucao;
    private BigDecimal pesoKg;
    private BigDecimal alturaCm;
    private BigDecimal imc;
    private String metodoMedicao;
    private String observacoes;
    private LocalDateTime criadoEm;

    public int getIdEvolucao() { return idEvolucao; }
    public void setIdEvolucao(int idEvolucao) { this.idEvolucao = idEvolucao; }
    public int getProntuarioId() { return prontuarioId; }
    public void setProntuarioId(int prontuarioId) { this.prontuarioId = prontuarioId; }
    public Funcionario getNutricionista() { return nutricionista; }
    public void setNutricionista(Funcionario nutricionista) { this.nutricionista = nutricionista; }
    public String getEvolucao() { return evolucao; }
    public void setEvolucao(String evolucao) { this.evolucao = evolucao; }
    public BigDecimal getPesoKg() { return pesoKg; }
    public void setPesoKg(BigDecimal pesoKg) { this.pesoKg = pesoKg; }
    public BigDecimal getAlturaCm() { return alturaCm; }
    public void setAlturaCm(BigDecimal alturaCm) { this.alturaCm = alturaCm; }
    public BigDecimal getImc() { return imc; }
    public void setImc(BigDecimal imc) { this.imc = imc; }
    public String getMetodoMedicao() { return metodoMedicao; }
    public void setMetodoMedicao(String metodoMedicao) { this.metodoMedicao = metodoMedicao; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
