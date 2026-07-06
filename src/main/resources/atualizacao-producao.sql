-- Rodar uma vez em bancos ja existentes antes de usar BCrypt.
ALTER TABLE usuario ALTER COLUMN senha TYPE VARCHAR(255);

-- Modulo antigo removido da interface.
DROP TABLE IF EXISTS historicomorador;

-- Remove a tabela turnos. O sistema usa codigo fixo:
-- 1 = manha (07:00 - 19:00), 2 = noite (19:00 - 07:00).
DO $$
DECLARE
    fk RECORD;
BEGIN
    IF to_regclass('public.turnos') IS NOT NULL THEN
        FOR fk IN
            SELECT conrelid::regclass AS tabela, conname
            FROM pg_constraint
            WHERE contype = 'f'
              AND confrelid = 'public.turnos'::regclass
        LOOP
            EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.tabela, fk.conname);
        END LOOP;

        DROP TABLE IF EXISTS turnos;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_funcionarioturnos_turno_padrao'
    ) THEN
        ALTER TABLE funcionarioturnos
            ADD CONSTRAINT ck_funcionarioturnos_turno_padrao
            CHECK (Turnos_idTurnos IN (1, 2)) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_ocorrencias_turno_padrao'
    ) THEN
        ALTER TABLE ocorrencias
            ADD CONSTRAINT ck_ocorrencias_turno_padrao
            CHECK (Turnos_idTurnos IS NULL OR Turnos_idTurnos IN (1, 2)) NOT VALID;
    END IF;
END $$;
