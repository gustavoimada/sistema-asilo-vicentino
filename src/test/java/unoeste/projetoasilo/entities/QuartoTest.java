package unoeste.projetoasilo.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class QuartoTest
{
    @Test
    void alwaysUsesTwoResidentCapacity()
    {
        Quarto quarto = new Quarto("F", 12, 0, "S");

        quarto.setCapacidademax(5);

        assertEquals(2, quarto.getCapacidademax());
        assertEquals(Quarto.CAPACIDADE_MAXIMA_POR_QUARTO, quarto.getCapacidademax());
    }
}
