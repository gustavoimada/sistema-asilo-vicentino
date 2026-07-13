# Backup no Railway

Este projeto usa dois tipos de dado em producao:

- Banco PostgreSQL do Railway.
- Arquivos enviados pelo sistema em `UPLOAD_DIR`, hoje configurado como `/data/uploads` no volume persistente.

## Backup do banco

Use o `DATABASE_URL` publico do PostgreSQL no Railway e rode:

```powershell
.\scripts\backup-railway-postgres.ps1 -DatabaseUrl "postgresql://usuario:senha@host:porta/railway" -PgDumpPath "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
```

O arquivo sera salvo em `backups/` com extensao `.dump`. Essa pasta fica fora do Git.

Frequencia recomendada:

- Antes de qualquer deploy grande.
- Uma vez por semana enquanto o sistema estiver em uso real.
- Sempre antes de alterar estrutura de tabela.

## Backup dos uploads

O coordenador pode baixar os arquivos enviados pelo sistema em:

```text
https://www.asilovicentino.com.br/backup/uploads.zip
```

Esse endpoint exige login de coordenador e gera um ZIP da pasta de uploads do servidor.

## Restauracao

Para restaurar o banco em outro PostgreSQL:

```powershell
pg_restore --no-owner --no-acl --clean --if-exists --dbname "postgresql://usuario:senha@host:porta/banco" "backups\railway-postgres-YYYYMMDD-HHMMSS.dump"
```

Para restaurar uploads, extraia o ZIP dentro da pasta configurada em `UPLOAD_DIR`.

## Observacoes importantes

- Nunca commitar arquivos `.dump`, `.backup`, `.sql.gz` ou a pasta `backups/`.
- Guardar pelo menos uma copia fora do computador local.
- Testar restauracao em banco separado antes de mexer no banco de producao.
