# Banco de dados do SGAV

Este arquivo explica o desenho atual do PostgreSQL do sistema. A ideia e evitar aquela sensacao de "tem tabela demais e ninguem sabe mais o que faz".

## Decisao importante sobre turnos

A tabela antiga `turnos` nao e mais necessaria.

Hoje o sistema usa turnos fixos no codigo:

- `1` = Manha, das 07:00 as 19:00.
- `2` = Noite, das 19:00 as 07:00.

Por isso, o banco guarda apenas o codigo do turno nas tabelas que precisam disso:

- `funcionarioturnos.Turnos_idTurnos`
- `ocorrencias.Turnos_idTurnos`

Essas colunas continuam existindo porque elas indicam em qual turno uma escala ou ocorrencia aconteceu. O que nao existe mais e uma tabela separada so para armazenar "Manha" e "Noite".

## Tabelas que devem continuar

### Base administrativa

- `usuario`: login e senha.
- `funcionario`: dados do funcionario e cargo.
- `quartos`: quartos, ala, capacidade e disponibilidade.
- `morador`: dados do morador e quarto vinculado.
- `composicaofamiliar`: pessoa responsavel/contato do morador.
- `composicaofamiliarmorador`: vinculo entre morador e responsavel.

### Escalas e rotina do cuidador

- `funcionarioturnos`: escala real do cuidador por dia e turno. Nao remover.
- `ocorrencias`: ocorrencias registradas durante um turno.
- `moradorocorrencia`: moradores vinculados a uma ocorrencia.

### Medicamentos e caixinhas

- `medicamento`: cadastro base dos medicamentos.
- `prescricao`: item da caixinha de um morador, com frequencia, dose e periodo.
- `prescricaodose`: doses geradas a partir da caixinha/prescricao.
- `registrarusomedicacao`: registro de aplicacao feita pelo cuidador.

Mesmo com o nome antigo `prescricao`, essa tabela ainda e util. Ela virou a base tecnica da "caixinha": cada linha representa um medicamento dentro da caixinha de um morador.

Na interface, a caixinha e determinada pelo morador. Ou seja: o sistema agrupa todas as linhas de `prescricao` de um mesmo morador e mostra como uma unica caixinha. Ao cadastrar ou editar um medicamento da caixinha, o backend gera as linhas em `prescricaodose`; e essa e a lista que aparece para o cuidador em `registrarUsoMedicacao.html`.

Se um item da caixinha ja tiver uso registrado em `registrarusomedicacao`, o sistema nao deve apagar esse historico automaticamente. Para mudar uma rotina de medicamento em producao, o caminho mais seguro e encerrar/ajustar a rotina antiga com criterio e cadastrar uma nova posologia.

### Financeiro e transparencia

- `tipodespesas`: categorias de despesa.
- `despesas`: despesas cadastradas.
- `doacao`: intencoes/doacoes registradas.
- `transparencia`: PDFs e documentos publicados.

### Atividades e noticias

- `tipoatividade`: categorias de atividades.
- `atividades`: atividades cadastradas.
- `atividadesmorador`: moradores participantes de uma atividade.
- `noticia`: noticias publicadas no site.
- `tiposocorrencias`: tipos/gravidades de ocorrencia.

## Tabelas removidas

- `historicomorador`: modulo antigo removido da interface.
- `turnos`: substituida por turnos fixos no codigo.

O script `src/main/resources/atualizacao-producao.sql` remove essas tabelas em bancos antigos e adiciona regras para aceitar apenas os turnos `1` e `2`.

## Como isso vai para deploy

Para um banco novo em producao:

1. Criar o PostgreSQL no Railway.
2. Rodar `src/main/resources/abrigovicentinodb.sql`.
3. Criar apenas usuarios reais do asilo.
4. Garantir que a senha do primeiro usuario administrativo esteja criptografada com BCrypt.
5. Nao levar dados de teste para producao.

Para um banco que ja existia:

1. Fazer backup antes.
2. Rodar `src/main/resources/atualizacao-producao.sql`.
3. Conferir se nao existem mais `turnos` e `historicomorador`.
4. Conferir se nao sobraram usuarios, moradores, escalas, doacoes ou noticias de teste.

## Observacao sobre uploads

O banco guarda o caminho dos arquivos de `noticia` e `transparencia`, mas os arquivos em si ficam no diretorio `UPLOAD_DIR`. Em producao, esse diretorio precisa estar em volume persistente, por exemplo `/data/uploads` no Railway. Depois de configurar, reinicie o servico e confirme se imagens e PDFs continuam abrindo.
