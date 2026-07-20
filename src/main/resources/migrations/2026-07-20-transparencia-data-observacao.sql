BEGIN;

ALTER TABLE transparencia
    ADD COLUMN IF NOT EXISTS datareferencia DATE;

ALTER TABLE transparencia
    ADD COLUMN IF NOT EXISTS observacao VARCHAR(500);

UPDATE transparencia
SET datareferencia = MAKE_DATE(ano, mes, 1)
WHERE datareferencia IS NULL
  AND ano BETWEEN 2000 AND 2100
  AND mes BETWEEN 1 AND 12;

UPDATE transparencia
SET datareferencia = CURRENT_DATE
WHERE datareferencia IS NULL;

ALTER TABLE transparencia
    ALTER COLUMN datareferencia SET DEFAULT CURRENT_DATE;

ALTER TABLE transparencia
    ALTER COLUMN datareferencia SET NOT NULL;

COMMIT;
