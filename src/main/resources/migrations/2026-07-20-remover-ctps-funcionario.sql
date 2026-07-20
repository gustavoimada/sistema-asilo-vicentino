BEGIN;

ALTER TABLE funcionario
    DROP COLUMN IF EXISTS ctps_numero;

COMMIT;
