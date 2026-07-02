# Deploy no Railway com dominio Registro.br

Este guia resume o caminho recomendado para publicar o sistema em producao usando Railway e o dominio `asilovicentino.com.br`.

## 1. Preparar o GitHub

1. Criar um repositorio novo no GitHub.
2. Subir este projeto para o repositorio novo.
3. Confirmar que `.env`, `target/`, `.idea/` e `uploads/` nao foram enviados.
4. Manter o repositorio privado ate a primeira publicacao estar validada.

## 2. Comprar o dominio

1. Acessar `https://registro.br`.
2. Pesquisar `asilovicentino.com.br`.
3. Registrar o dominio por 1 ano.
4. Usar uma conta/e-mail institucional do asilo sempre que possivel.
5. Guardar o acesso do Registro.br com a administracao do asilo.

## 3. Criar o projeto no Railway

1. Criar conta em `https://railway.com`.
2. Assinar o plano Hobby.
3. Criar um novo projeto.
4. Adicionar um banco PostgreSQL.
5. Adicionar um servico conectado ao repositorio do GitHub.

## 4. Variaveis de ambiente

Configure no Railway:

```env
PORT=8080
SESSION_COOKIE_SECURE=true
UPLOAD_DIR=/app/uploads
```

Configure tambem a conexao com o PostgreSQL. Se o Railway fornecer `DATABASE_URL`, o sistema consegue converter a URL para JDBC automaticamente. Se preferir configurar manualmente:

```env
DB_URL=jdbc:postgresql://host:porta/banco
DB_USERNAME=usuario
DB_PASSWORD=senha
```

## 5. Banco de dados

Para banco novo, execute:

```text
src/main/resources/abrigovicentinodb.sql
```

Para banco que ja existia antes da criptografia de senha, execute:

```text
src/main/resources/atualizacao-producao.sql
```

Depois, teste o login. Senhas antigas em texto simples sao migradas para BCrypt no primeiro login correto.

## 6. Uploads

O sistema salva arquivos de noticias e transparencia no diretorio definido por `UPLOAD_DIR`.

No Railway, confirme se o projeto tera armazenamento persistente. Sem volume persistente, arquivos enviados podem sumir quando o servico reiniciar ou for recriado.

## 7. Dominio customizado

1. No Railway, abrir o servico web.
2. Adicionar o dominio customizado `asilovicentino.com.br`.
3. Copiar os registros DNS indicados pelo Railway.
4. Entrar no Registro.br.
5. Configurar os DNS/registros conforme o Railway pediu.
6. Aguardar a propagacao.
7. Testar `https://asilovicentino.com.br`.

## 8. Checklist final

- Site publico abre com HTTPS.
- Login administrativo funciona.
- Rotas administrativas bloqueiam usuarios sem permissao.
- Doacoes, noticias, transparencia e relatorios foram testados.
- Banco esta com backup/export inicial.
- Uploads continuam existindo apos reiniciar o servico.
- Dominio oficial aponta para o Railway.

