-- O campo categoria e textual no esquema atual; esta migration documenta e normaliza o novo cargo.
UPDATE funcionario
SET categoria = 'Nutricionista'
WHERE LOWER(TRIM(categoria)) = 'nutricionista';
