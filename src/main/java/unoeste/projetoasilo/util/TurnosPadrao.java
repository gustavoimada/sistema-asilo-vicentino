package unoeste.projetoasilo.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

public final class TurnosPadrao
{
    public static final int MANHA = 1;
    public static final int NOITE = 2;
    public static final ZoneId FUSO_HORARIO_ASILO = ZoneId.of("America/Sao_Paulo");

    private TurnosPadrao()
    {
    }

    public static LocalTime horaInicio(int idTurno)
    {
        return idTurno == NOITE ? LocalTime.of(19, 0) : LocalTime.of(7, 0);
    }

    public static LocalTime horaFim(int idTurno)
    {
        return idTurno == NOITE ? LocalTime.of(7, 0) : LocalTime.of(19, 0);
    }

    public static boolean idValido(int idTurno)
    {
        return idTurno == MANHA || idTurno == NOITE;
    }

    public static int turnoAtual()
    {
        return turnoEm(LocalTime.now(FUSO_HORARIO_ASILO));
    }

    static int turnoEm(LocalTime agora)
    {
        return !agora.isBefore(horaInicio(MANHA)) && agora.isBefore(horaInicio(NOITE))
                ? MANHA
                : NOITE;
    }

    public static LocalDate dataEscalaAtual()
    {
        LocalDate hoje = LocalDate.now(FUSO_HORARIO_ASILO);
        LocalTime agora = LocalTime.now(FUSO_HORARIO_ASILO);
        return dataEscalaEm(hoje, agora);
    }

    static LocalDate dataEscalaEm(LocalDate hoje, LocalTime agora)
    {
        return agora.isBefore(horaInicio(MANHA)) ? hoje.minusDays(1) : hoje;
    }

    public static String nome(int idTurno)
    {
        return idTurno == NOITE ? "Noite" : "Manhã";
    }
}
