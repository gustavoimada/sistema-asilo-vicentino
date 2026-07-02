package unoeste.projetoasilo.entities;

import java.io.Serializable;

public class TipoDespesa implements Serializable {


    private int idTipoDespesa;
    private String tipo;

    public TipoDespesa() {
    }

    public TipoDespesa(String tipo) {
        this.tipo = tipo;
    }

    public int getIdTipoDespesa() {
        return idTipoDespesa;
    }

    public void setIdTipoDespesa(int idTipoDespesa) {
        this.idTipoDespesa = idTipoDespesa;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
}
