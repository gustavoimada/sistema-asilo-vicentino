# Deploy no Railway com dominio Registro.br

Este guia resume o caminho recomendado para publicar o sistema em producao usando Railway e o dominio `asilovicentino.com.br`.

## Status atual

- Aplicacao Spring Boot online no Railway.
- Banco PostgreSQL online no Railway.
- Dominio `www.asilovicentino.com.br` validado no Railway.
- Volume persistente criado para uploads do servico web.
- `UPLOAD_DIR=/data/uploads` configurado para salvar noticias e documentos fora do container temporario.
- Imagens de noticias validadas em producao pelo endpoint `/noticia/download/{id}`.
- Ainda falta configurar o dominio raiz `asilovicentino.com.br` para redirecionar para `www.asilovicentino.com.br`.

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
6. Criar um volume persistente para o servico web.
7. Montar o volume em `/data`.

## 4. Variaveis de ambiente

Configure no Railway:

```env
PORT=8080
SESSION_COOKIE_SECURE=true
SESSION_TIMEOUT=2h
UPLOAD_DIR=/data/uploads
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

Esse script cria a estrutura limpa, sem dados de teste. Depois dele, crie apenas usuarios reais do asilo.

Para banco que ja existia antes da criptografia de senha, execute:

```text
src/main/resources/atualizacao-producao.sql
```

Depois, teste o login. Senhas antigas em texto simples sao migradas para BCrypt no primeiro login correto.

### Primeiro usuario administrativo

Em banco novo, o primeiro acesso precisa ser criado com cuidado porque as telas administrativas ja ficam protegidas por login.

1. Criar uma coordenadora ou secretaria real com senha temporaria forte.
2. Garantir que a senha fique criptografada com BCrypt.
3. Testar o login em `https://asilovicentino.com.br/login.html`.
4. Remover qualquer usuario de teste antes de divulgar o site.
5. Guardar o acesso principal com a administracao do asilo.

## 6. Uploads

O sistema salva arquivos de noticias e transparencia no diretorio definido por `UPLOAD_DIR`.

No Railway, `UPLOAD_DIR` deve apontar para o volume persistente, por exemplo `/data/uploads`. Sem volume persistente, arquivos enviados podem sumir quando o servico reiniciar ou for recriado.

Depois do deploy, faca este teste antes de divulgar ou depois de mexer no volume:

1. Enviar uma imagem de noticia.
2. Enviar um PDF de transparencia.
3. Reiniciar o servico no Railway.
4. Conferir se a imagem e o PDF continuam abrindo no site.

Validacao atual: imagens de noticias ja foram testadas pelo dominio oficial `www.asilovicentino.com.br`. Ainda vale repetir o mesmo teste com PDFs da transparencia.

## 7. Dominio customizado

1. No Railway, abrir o servico web.
2. Adicionar o dominio customizado `www.asilovicentino.com.br`.
3. Copiar os registros DNS indicados pelo Railway.
4. Entrar no Registro.br.
5. Configurar os DNS/registros conforme o Railway pediu.
6. Aguardar a propagacao.
7. Testar `https://www.asilovicentino.com.br`.
8. Configurar o dominio raiz `asilovicentino.com.br` para redirecionar para `www.asilovicentino.com.br`.

## 8. Checklist final

- Site publico abre com HTTPS.
- Login administrativo funciona.
- Rotas administrativas bloqueiam usuarios sem permissao.
- `SESSION_COOKIE_SECURE=true` esta configurado.
- `UPLOAD_DIR` aponta para o volume persistente.
- Doacoes, noticias, transparencia e relatorios foram testados.
- Banco esta com backup/export inicial.
- Banco nao tem dados de teste.
- Usuarios reais usam senhas fortes.
- Uploads continuam existindo apos reiniciar o servico.
- Dominio oficial aponta para o Railway.

