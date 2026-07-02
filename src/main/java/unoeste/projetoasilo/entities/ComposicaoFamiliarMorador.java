package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.ComposicaoFamiliarDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.io.Serializable;
import java.sql.SQLException;

public class ComposicaoFamiliarMorador implements Serializable {


    private Morador morador;
    private ComposicaoFamiliar composicaoFamiliar;
    private String vinculo;

    public ComposicaoFamiliarMorador() {
    }

    public ComposicaoFamiliarMorador(int moradorId, int composicaoFamiliarId, String vinculo) {
        this.morador = new Morador();
        this.morador.setIdMorador(moradorId);
        this.composicaoFamiliar = new ComposicaoFamiliar();
        this.composicaoFamiliar.setIdComposicaoFamiliar(composicaoFamiliarId);
        this.vinculo = vinculo;
    }

    public Morador getMorador() {
        return morador;
    }

    public void setMorador(Morador morador) {
        this.morador = morador;
    }

    public ComposicaoFamiliar getComposicaoFamiliar() {
        return composicaoFamiliar;
    }

    public void setComposicaoFamiliar(ComposicaoFamiliar composicaoFamiliar) {
        this.composicaoFamiliar = composicaoFamiliar;
    }

    public String getVinculo() {
        return vinculo;
    }

    public void setVinculo(String vinculo) {
        this.vinculo = vinculo;
    }

    public boolean vincular(Banco conexao) throws SQLException
    {
        if (morador != null && morador.getIdMorador() > 0
                && composicaoFamiliar != null && composicaoFamiliar.getIdComposicaoFamiliar() > 0
                && vinculo != null) {
            ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
            return dao.vincular(this, conexao);
        }
        return false;
    }

    public boolean atualizarVinculo(Banco conexao)
    {
        if (morador != null && morador.getIdMorador() > 0
                && composicaoFamiliar != null && composicaoFamiliar.getIdComposicaoFamiliar() > 0
                && vinculo != null) {
            ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
            return dao.atualizarVinculo(this, conexao);
        }
        return false;
    }

    public boolean desvincular(Banco conexao)
    {
        if (morador != null && morador.getIdMorador() > 0
                && composicaoFamiliar != null && composicaoFamiliar.getIdComposicaoFamiliar() > 0) {
            ComposicaoFamiliarDAO dao = new ComposicaoFamiliarDAO();
            return dao.desvincular(this, conexao);
        }
        return false;
    }
}
