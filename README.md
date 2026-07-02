# Sistema Asilo Vicentino

Sistema web para apoio as rotinas publicas e administrativas do Asilo Vicentino.

## Visao geral

O projeto possui uma area publica para visitantes e doadores, alem de uma area administrativa usada pela equipe interna. A aplicacao foi criada com Spring Boot, Java, PostgreSQL e paginas estaticas em HTML, CSS e JavaScript.

## Funcionalidades principais

- Site publico com informacoes institucionais, noticias, transparencia e doacoes.
- Login administrativo com sessoes de usuario.
- Cadastro e acompanhamento de moradores, funcionarios, quartos, medicamentos, prescricoes e ocorrencias.
- Relatorios administrativos de doacoes, despesas, funcionarios e ocorrencias.
- Upload de arquivos para noticias e documentos de transparencia.

## Tecnologias

- Java 21
- Spring Boot 4
- Maven Wrapper
- PostgreSQL
- HTML, CSS e JavaScript

## Configuracao local

1. Copie o arquivo de exemplo de ambiente:

```powershell
Copy-Item .env.example .env
```

2. Ajuste as variaveis no `.env`:

```env
DB_URL=jdbc:postgresql://localhost:5432/abrigovicentinodb
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_local
PORT=8080
SESSION_COOKIE_SECURE=false
UPLOAD_DIR=uploads
```

3. Crie o banco PostgreSQL e execute o script inicial:

```text
src/main/resources/abrigovicentinodb.sql
```

4. Rode a aplicacao:

```powershell
.\mvnw.cmd spring-boot:run
```

5. Acesse:

```text
http://localhost:8080
```

## Producao

Antes de colocar em producao:

- Nao versionar `.env`, arquivos de upload, `target/` ou configuracoes pessoais da IDE.
- Configurar as variaveis de ambiente diretamente no provedor de hospedagem.
- Usar banco PostgreSQL gerenciado.
- Manter `SESSION_COOKIE_SECURE=true` quando o site estiver com HTTPS.
- Garantir que `UPLOAD_DIR` aponte para armazenamento persistente.

O guia pratico de deploy esta em `DEPLOY_RAILWAY.md`.

## Validacao

```powershell
.\mvnw.cmd test
```

