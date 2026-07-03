# Sistema Asilo Vicentino

![Java](https://img.shields.io/badge/Java-21-red)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Maven](https://img.shields.io/badge/Maven-Wrapper-orange)
![Status](https://img.shields.io/badge/status-production%20preparation-yellow)

O Sistema Asilo Vicentino e uma aplicacao web full stack desenvolvida para apoiar a presenca digital e a rotina administrativa de uma instituicao de acolhimento. O projeto combina uma area publica institucional com uma area interna protegida por login, reunindo cadastros, relatorios, controle de turnos, transparencia, noticias e recursos de apoio operacional.

Este projeto tambem esta sendo preparado para deploy real em producao, com banco PostgreSQL, variaveis de ambiente, dominio proprio e hospedagem em nuvem. Essa etapa faz parte da evolucao do sistema de um projeto local para uma aplicacao publicada, acessivel e mais proxima de um ambiente profissional.

## Objetivo

A proposta do sistema e organizar processos essenciais do Asilo Vicentino em uma plataforma unica. A parte publica apresenta informacoes institucionais, noticias, documentos de transparencia e canal de doacoes. A parte administrativa permite que a equipe interna gerencie moradores, funcionarios, atividades, medicamentos, caixinhas de medicamentos, ocorrencias, turnos, despesas e relatorios.

O projeto foi estruturado para demonstrar dominio de desenvolvimento web completo com Java, Spring Boot, PostgreSQL, controle de acesso, uploads de arquivos, integracao com banco relacional e preparacao para deploy em servidor real.

## Funcionalidades

- Site publico com pagina inicial institucional.
- Publicacao e exibicao de noticias.
- Area de transparencia com upload e download de documentos.
- Registro publico de doacoes.
- Login administrativo com sessao de usuario.
- Controle de permissao por perfil de funcionario.
- Painel de secretaria para cadastros administrativos.
- Painel de coordenador para acompanhamento e relatorios.
- Painel de cuidador para registros operacionais.
- Cadastro, edicao, listagem e exclusao de funcionarios.
- Cadastro e acompanhamento de moradores com contato responsavel.
- Controle de quartos e disponibilidade.
- Cadastro simplificado de contato responsavel vinculado ao morador.
- Cadastro de medicamentos e caixinhas por morador.
- Registro de uso de medicacao.
- Cadastro de tipos de ocorrencia.
- Registro e consulta de ocorrencias.
- Controle de escalas e turnos.
- Cadastro e acompanhamento de atividades.
- Controle de despesas e tipos de despesas.
- Relatorios de doacoes, despesas, funcionarios e ocorrencias.
- Upload persistente de imagens e arquivos.
- Configuracao por variaveis de ambiente.
- Preparacao para deploy com Railway, PostgreSQL gerenciado e dominio proprio.

## Tecnologias Utilizadas

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Security Crypto
- Maven Wrapper
- PostgreSQL
- JDBC
- Dotenv Java
- HTML
- CSS
- JavaScript
- Bootstrap
- Tailwind CDN
- ApexCharts
- jsPDF
- pgAdmin

## Arquitetura

O sistema segue uma arquitetura em camadas, separando controllers, entidades, DAOs, configuracao de banco, filtro de acesso e arquivos estaticos.

```text
src/
  main/
    java/
      unoeste/
        projetoasilo/
          control/
          dao/
          db/
            util/
          entities/
          security/
          ProjetoAsiloApplication.java
    resources/
      static/
        assets/
        css/
        js/
        *.html
      application.properties
      abrigovicentinodb.sql
      atualizacao-producao.sql
```

## Areas do Sistema

### Area Publica

- Pagina inicial institucional.
- Noticias publicadas pela equipe.
- Documentos de transparencia.
- Canal de doacao.

### Area Administrativa

- Secretaria: cadastros, moradores, funcionarios, quartos, medicamentos, doacoes, despesas e atividades.
- Coordenador: escalas, transparencia, relatorios e acompanhamento geral.
- Cuidador: turno, ocorrencias e registro de uso de medicacao.

## Principais Endpoints

### Login

- `POST /login/entrar` autentica usuario.
- `GET /login/sessao` retorna os dados da sessao atual.
- `GET /login/sair` encerra a sessao.

### Noticias

- `GET /noticia/listar` lista noticias publicas.
- `GET /noticia/download/{id}` baixa a imagem da noticia.
- `POST /noticia/upload` cria noticia com imagem.
- `PUT /noticia/{id}` edita noticia.
- `DELETE /noticia/deletar/{id}` remove noticia.

### Transparencia

- `GET /transparencia/listar` lista documentos publicos.
- `GET /transparencia/download/{id}` baixa documento.
- `POST /transparencia/upload` envia documento.
- `DELETE /transparencia/{id}` remove documento.

### Funcionarios

- `POST /funcionario/cadastrar` cadastra funcionario e usuario.
- `GET /funcionario/listar` lista funcionarios.
- `GET /funcionario/listarCuidadores` lista cuidadores.
- `GET /funcionario/buscar` busca funcionario.
- `PUT /funcionario/{id}` edita funcionario.
- `DELETE /funcionario/{id}` remove funcionario e usuario vinculado.

### Moradores e Contato Responsavel

- `GET /morador/listar` lista moradores.
- `POST /morador/cadastrar` cadastra morador.
- `POST /morador/cadastrarCompleto` cadastra morador com dados completos.
- `PUT /morador/editarCompleto/{id}` edita morador e contato responsavel.
- `DELETE /morador/{id}` remove morador e desvincula o contato responsavel.
- `GET /composicaoFamiliar/listar` recupera o contato vinculado ao morador.

### Medicamentos e Caixinhas

- `GET /medicamentos/listar` lista medicamentos.
- `POST /medicamentos/cadastrar` cadastra medicamento.
- `GET /caixinha/listar` lista medicamentos organizados nas caixinhas dos moradores.
- `POST /caixinha/cadastrar` adiciona medicamento a caixinha de um morador.
- `GET /caixinhadose/listarHoje` lista doses programadas do dia.
- `GET /registrarusomedicacao/listar` lista registros de uso.

As rotas antigas de prescricao foram mantidas como compatibilidade interna para bancos ja existentes, mas o fluxo administrativo atual usa caixinhas de medicamentos.

### Ocorrencias e Turnos

- `GET /ocorrencia/listar` lista ocorrencias.
- `POST /ocorrencia/cadastrar` registra ocorrencia.
- `GET /ocorrencia/moradores/{idOcorrencia}` lista moradores envolvidos.
- `GET /turno/historico` lista historico de turnos.
- `POST /turno/iniciar` inicia turno.
- `POST /turno/fechar` fecha turno.
- `POST /turno/escalar` escala funcionario.

### Financeiro e Relatorios

- `GET /doacao/listar` lista doacoes.
- `POST /doacao/cadastrar` registra doacao.
- `GET /despesa/listar` lista despesas.
- `POST /despesa/cadastrar` cadastra despesa.
- Relatorios administrativos sao renderizados nas telas:
  - `relatorioDoacoes.html`
  - `relatorioDespesas.html`
  - `relatorioFuncionarios.html`
  - `relatorioOcorrencias.html`

## Destaques Tecnicos

- Backend em Java com Spring Boot.
- Persistencia em PostgreSQL usando JDBC.
- Organizacao por controllers, DAOs e entidades.
- Controle de acesso com filtro por perfil de usuario.
- Login com sessao HTTP.
- Criptografia de senhas com BCrypt.
- Migracao gradual de senhas antigas em texto simples.
- Prepared Statements em pontos criticos de autenticacao.
- Whitelist para campos de ordenacao dinamica.
- Upload de imagens e PDFs em diretorio configuravel.
- Configuracao externa via `.env` e variaveis de ambiente.
- Script SQL inicial para criacao do banco.
- Script de atualizacao para bancos existentes antes de producao.
- Maven Wrapper versionado para facilitar build em qualquer maquina.

## Deploy em Producao

Este projeto esta sendo preparado para sair do ambiente local e rodar em producao. O plano de publicacao inclui:

- Repositorio GitHub limpo e organizado.
- Hospedagem da aplicacao no Railway.
- Banco PostgreSQL gerenciado.
- Variaveis de ambiente configuradas no provedor.
- Dominio proprio pelo Registro.br.
- Possivel dominio `asilovicentino.com.br`.
- HTTPS em producao.
- Persistencia de uploads em volume/diretorio apropriado.

Essa sera a primeira experiencia completa de deploy do projeto, cobrindo desde preparacao de codigo e seguranca ate publicacao em servidor e configuracao de dominio. O passo a passo pratico esta documentado em `DEPLOY_RAILWAY.md`.

## Configuracao Local

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

4. Se o banco ja existia antes da criptografia de senhas, execute:

```text
src/main/resources/atualizacao-producao.sql
```

5. Rode a aplicacao:

```powershell
.\mvnw.cmd spring-boot:run
```

6. Acesse:

```text
http://localhost:8080
```

## Validacao

```powershell
.\mvnw.cmd test
```

## Higiene do Repositorio

O repositorio foi preparado para nao versionar arquivos sensiveis ou gerados automaticamente.

Arquivos ignorados:

- `.env`
- `.env.local`
- `.idea/`
- `.vscode/`
- `target/`
- `build/`
- `uploads/`
- logs
- arquivos temporarios

O arquivo `.env.example` permanece versionado apenas como modelo de configuracao, sem senhas reais.

## Status

O sistema esta em fase de ajustes finais, testes gerais e preparacao para deploy. A base ja possui configuracao de ambiente, seguranca inicial, documentacao de deploy e repositorio pronto para evolucao continua.
