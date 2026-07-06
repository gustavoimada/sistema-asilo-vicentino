package unoeste.projetoasilo.util;

import java.time.LocalTime;

public final class TurnosPadrao
{
    public static final int MANHA = 1;
    public static final int NOITE = 2;

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

    public static String nome(int idTurno)
    {
        return idTurno == NOITE ? "Noite" : "Manha";
    }
}
