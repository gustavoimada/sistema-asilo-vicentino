-- Rodar uma vez em bancos ja existentes antes de usar BCrypt.
ALTER TABLE usuario ALTER COLUMN senha TYPE VARCHAR(255);
