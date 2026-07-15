package unoeste.projetoasilo.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TurnosPadraoTest
{
    @Test
    void reconheceTurnoNoturnoNaMadrugadaComoEscalaDoDiaAnterior()
    {
        LocalDate hoje = LocalDate.of(2026, 7, 15);

        assertEquals(TurnosPadrao.NOITE, TurnosPadrao.turnoEm(LocalTime.of(2, 30)));
        assertEquals(LocalDate.of(2026, 7, 14), TurnosPadrao.dataEscalaEm(hoje, LocalTime.of(2, 30)));
    }

    @Test
    void reconheceManhaEDiaAtualDuranteExpedienteDiurno()
    {
        LocalDate hoje = LocalDate.of(2026, 7, 15);

        assertEquals(TurnosPadrao.MANHA, TurnosPadrao.turnoEm(LocalTime.of(16, 40)));
        assertEquals(hoje, TurnosPadrao.dataEscalaEm(hoje, LocalTime.of(16, 40)));
    }

    @Test
    void reconheceNoiteComoEscalaDoMesmoDiaAposDezenoveHoras()
    {
        LocalDate hoje = LocalDate.of(2026, 7, 15);

        assertEquals(TurnosPadrao.NOITE, TurnosPadrao.turnoEm(LocalTime.of(19, 0)));
        assertEquals(hoje, TurnosPadrao.dataEscalaEm(hoje, LocalTime.of(19, 0)));
    }
}
