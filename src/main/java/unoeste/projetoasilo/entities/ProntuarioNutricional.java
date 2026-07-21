package unoeste.projetoasilo.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProntuarioNutricional
{
    private int idProntuario;
    private Morador morador;
    private Funcionario nutricionista;
    private boolean acamado;
    private String metodoMedicao;
    private String grupoEquacao;
    private BigDecimal alturaJoelhoCm;
    private BigDecimal circunferenciaBracoCm;
    private BigDecimal pesoKg;
    private BigDecimal alturaCm;
    private BigDecimal imc;
    private boolean pesoEstimado;
    private boolean alturaEstimada;
    private String formulaPeso;
    private String formulaAltura;
    private String diagnosticoInicial;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public int getIdProntuario() { return idProntuario; }
    public void setIdProntuario(int idProntuario) { this.idProntuario = idProntuario; }
    public Morador getMorador() { return morador; }
    public void setMorador(Morador morador) { this.morador = morador; }
    public Funcionario getNutricionista() { return nutricionista; }
    public void setNutricionista(Funcionario nutricionista) { this.nutricionista = nutricionista; }
    public boolean isAcamado() { return acamado; }
    public void setAcamado(boolean acamado) { this.acamado = acamado; }
    public String getMetodoMedicao() { return metodoMedicao; }
    public void setMetodoMedicao(String metodoMedicao) { this.metodoMedicao = metodoMedicao; }
    public String getGrupoEquacao() { return grupoEquacao; }
    public void setGrupoEquacao(String grupoEquacao) { this.grupoEquacao = grupoEquacao; }
    public BigDecimal getAlturaJoelhoCm() { return alturaJoelhoCm; }
    public void setAlturaJoelhoCm(BigDecimal alturaJoelhoCm) { this.alturaJoelhoCm = alturaJoelhoCm; }
    public BigDecimal getCircunferenciaBracoCm() { return circunferenciaBracoCm; }
    public void setCircunferenciaBracoCm(BigDecimal circunferenciaBracoCm) { this.circunferenciaBracoCm = circunferenciaBracoCm; }
    public BigDecimal getPesoKg() { return pesoKg; }
    public void setPesoKg(BigDecimal pesoKg) { this.pesoKg = pesoKg; }
    public BigDecimal getAlturaCm() { return alturaCm; }
    public void setAlturaCm(BigDecimal alturaCm) { this.alturaCm = alturaCm; }
    public BigDecimal getImc() { return imc; }
    public void setImc(BigDecimal imc) { this.imc = imc; }
    public boolean isPesoEstimado() { return pesoEstimado; }
    public void setPesoEstimado(boolean pesoEstimado) { this.pesoEstimado = pesoEstimado; }
    public boolean isAlturaEstimada() { return alturaEstimada; }
    public void setAlturaEstimada(boolean alturaEstimada) { this.alturaEstimada = alturaEstimada; }
    public String getFormulaPeso() { return formulaPeso; }
    public void setFormulaPeso(String formulaPeso) { this.formulaPeso = formulaPeso; }
    public String getFormulaAltura() { return formulaAltura; }
    public void setFormulaAltura(String formulaAltura) { this.formulaAltura = formulaAltura; }
    public String getDiagnosticoInicial() { return diagnosticoInicial; }
    public void setDiagnosticoInicial(String diagnosticoInicial) { this.diagnosticoInicial = diagnosticoInicial; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
