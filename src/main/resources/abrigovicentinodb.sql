-- Script inicial para um banco vazio.
-- Nao coloque comandos DROP TABLE neste arquivo em producao.

-- =========================================
-- quartos
-- =========================================
CREATE TABLE quartos (
                         idQuartos SERIAL PRIMARY KEY,
                         ala VARCHAR(2),
                         qntdHospedes INTEGER,
                         disponibilidade VARCHAR(1),
                         capacidadeMax INTEGER NOT NULL DEFAULT 2 CHECK (capacidadeMax = 2)
);

-- =========================================
-- morador
-- =========================================
CREATE TABLE morador (
                         idMorador SERIAL PRIMARY KEY,
                         cpf VARCHAR(14),
                         nome VARCHAR(45),
                         genero VARCHAR(1),
                         endereco VARCHAR(45),
                         numero INTEGER,
                         dtNasc TIMESTAMP,
                         cidade VARCHAR(45),
                         estado VARCHAR(45),
                         cep VARCHAR(9),
                         Quartos_idQuartos INTEGER,
                         FOREIGN KEY (Quartos_idQuartos)
                             REFERENCES quartos(idQuartos)
);

-- =========================================
-- composicaofamiliar
-- =========================================
CREATE TABLE composicaofamiliar (
                                    idComposicaoFamiliar SERIAL PRIMARY KEY,
                                    nome VARCHAR(45),
                                    telefone VARCHAR(15),
                                    cpf VARCHAR(45)
);

-- =========================================
-- composicaofamiliarmorador
-- =========================================
CREATE TABLE composicaofamiliarmorador (
                                           Morador_idMorador INTEGER,
                                           vinculo VARCHAR(45),
                                           ComposicaoFamiliar_idComposicaoFamiliar INTEGER,
                                           PRIMARY KEY (Morador_idMorador, ComposicaoFamiliar_idComposicaoFamiliar),
                                           FOREIGN KEY (Morador_idMorador)
                                               REFERENCES morador(idMorador),
                                           FOREIGN KEY (ComposicaoFamiliar_idComposicaoFamiliar)
                                               REFERENCES composicaofamiliar(idComposicaoFamiliar)
);

-- =========================================
-- usuario
-- =========================================
CREATE TABLE usuario (
                         id SERIAL PRIMARY KEY,
                         name VARCHAR(45) NOT NULL,
                         senha VARCHAR(255) NOT NULL,
                         email VARCHAR(80)
);

-- =========================================
-- funcionario
-- =========================================
CREATE TABLE funcionario (
                             idFuncionario SERIAL PRIMARY KEY,
                             cpf VARCHAR(14),
                             nome VARCHAR(45),
                             telefone VARCHAR(15),
                             categoria VARCHAR(45),
                             ativo BOOLEAN NOT NULL DEFAULT TRUE,
                             User_idUser INTEGER NOT NULL UNIQUE,
                             CONSTRAINT fk_funcionario_user
                                 FOREIGN KEY (User_idUser)
                                     REFERENCES usuario(id)
                                     ON DELETE RESTRICT
                                     ON UPDATE CASCADE
);

-- =========================================
-- tiposocorrencias
-- =========================================
CREATE TABLE tiposocorrencias (
                                  idOcorrencias SERIAL PRIMARY KEY,
                                  descricao VARCHAR(45),
                                  gravidade INTEGER,
                                  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================
-- ocorrencias
-- =========================================
CREATE TABLE ocorrencias (
                             idOcorrencia SERIAL PRIMARY KEY,
                             Ocorrencias_idOcorrencias INTEGER,
                             Funcionario_idFuncionario INTEGER,
                             observacoes VARCHAR(45),
                             dtOcorrencia TIMESTAMP,
                             Turnos_idTurnos INTEGER,
                             FOREIGN KEY (Ocorrencias_idOcorrencias)
                                 REFERENCES tiposocorrencias(idOcorrencias),
                             FOREIGN KEY (Funcionario_idFuncionario)
                                 REFERENCES funcionario(idFuncionario),
                             CONSTRAINT ck_ocorrencias_turno_padrao
                                 CHECK (Turnos_idTurnos IS NULL OR Turnos_idTurnos IN (1, 2))
);

-- =========================================
-- moradorocorrencia
-- =========================================
CREATE TABLE moradorocorrencia (
                                   idMoradorOcorrencia SERIAL PRIMARY KEY,
                                   Morador_idMorador INTEGER,
                                   MoradorOcorrencias_idOcorrencia INTEGER,
                                   FOREIGN KEY (Morador_idMorador)
                                       REFERENCES morador(idMorador),
                                   FOREIGN KEY (MoradorOcorrencias_idOcorrencia)
                                       REFERENCES ocorrencias(idOcorrencia)
);

-- =========================================
-- funcionarioturnos
-- =========================================
CREATE TABLE funcionarioturnos (
                                   idFuncionarioTurnos SERIAL PRIMARY KEY,
                                   Funcionario_idFuncionario INTEGER NOT NULL,
                                   Turnos_idTurnos INTEGER NOT NULL,
                                   dataEscala DATE NOT NULL,
                                   descricao VARCHAR(300),
                                   horaInicio VARCHAR(45),
                                   horaFim VARCHAR(45),
                                   status VARCHAR(20) DEFAULT 'pendente',
                                   CONSTRAINT fk_funcionarioturnos_funcionario
                                       FOREIGN KEY (Funcionario_idFuncionario)
                                           REFERENCES funcionario(idFuncionario),
                                   CONSTRAINT ck_funcionarioturnos_turno_padrao
                                       CHECK (Turnos_idTurnos IN (1, 2)),
                                   CONSTRAINT uq_funcionarioturnos_escala
                                       UNIQUE (Funcionario_idFuncionario, Turnos_idTurnos, dataEscala)
);

-- =========================================
-- medicamento
-- =========================================
CREATE TABLE medicamento (
                             idmedicamento SERIAL PRIMARY KEY,
                             nome VARCHAR(45),
                             tipomedicamento VARCHAR(45),
                             dosagemvalor INTEGER,
                             dosagemunidade VARCHAR(10)
);

-- =========================================
-- prescricao
-- =========================================
CREATE TABLE prescricao (
                            idprescricao SERIAL PRIMARY KEY,
                            morador_idmorador INTEGER,
                            medicamento_idmedicamento INTEGER,
                            qtddose INTEGER,
                            dtinicio DATE,
                            dtfim DATE,
                            frequenciavalor INTEGER,
                            frequenciaunidade VARCHAR(10),
                            primeiradose TIME,
                            ativo BOOLEAN NOT NULL DEFAULT TRUE,
                            FOREIGN KEY (morador_idmorador)
                                REFERENCES morador(idMorador),
                            FOREIGN KEY (medicamento_idmedicamento)
                                REFERENCES medicamento(idMedicamento)
);

-- =========================================
-- prescricaodose
-- =========================================
CREATE TABLE prescricaodose (
                                idprescricaodose SERIAL PRIMARY KEY,
                                prescricao_idprescricao INTEGER NOT NULL,
                                datahoraprevista TIMESTAMP NOT NULL,
                                aplicado BOOLEAN NOT NULL DEFAULT FALSE,

                                CONSTRAINT fk_prescricaodose_prescricao
                                    FOREIGN KEY (prescricao_idprescricao)
                                        REFERENCES prescricao(idprescricao)
                                        ON DELETE CASCADE,

                                CONSTRAINT uq_prescricaodose_unica
                                    UNIQUE (prescricao_idprescricao, datahoraprevista)
);

-- =========================================
-- registrarusomedicacao
-- =========================================
CREATE TABLE registrarusomedicacao (
                                       idRegistrarUsoMedicacao SERIAL PRIMARY KEY,
                                       prescricaodose_idprescricaodose INTEGER NOT NULL,
                                       funcionario_idfuncionario INTEGER,
                                       dataregistro TIMESTAMP,

                                       CONSTRAINT fk_registrouso_prescricaodose
                                           FOREIGN KEY (prescricaodose_idprescricaodose)
                                               REFERENCES prescricaodose(idprescricaodose),

                                       CONSTRAINT fk_registrouso_funcionario
                                           FOREIGN KEY (funcionario_idfuncionario)
                                               REFERENCES funcionario(idFuncionario),

                                       CONSTRAINT uq_registrouso_dose
                                           UNIQUE (prescricaodose_idprescricaodose)
);

-- =========================================
-- tipodespesas
-- =========================================
CREATE TABLE tipodespesas (
                              idTipoDespesas SERIAL PRIMARY KEY,
                              tipo VARCHAR(45),
                              ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================
-- despesas
-- =========================================
CREATE TABLE despesas (
                          idDespesas SERIAL PRIMARY KEY,
                          valor DOUBLE PRECISION,
                          observacoes VARCHAR(45),
                          dtVencimento TIMESTAMP,
                          dtQuitacao TIMESTAMP,
                          fixa BOOLEAN DEFAULT FALSE,
                          periodicidade VARCHAR(20),
                          TipoDespesas_idTipoDespesas INTEGER,
                          FOREIGN KEY (TipoDespesas_idTipoDespesas)
                              REFERENCES tipodespesas(idTipoDespesas)
);

-- =========================================
-- doacao
-- =========================================
CREATE TABLE doacao (
                        idDoacao SERIAL PRIMARY KEY,
                        valor DOUBLE PRECISION NOT NULL,
                        observacoes VARCHAR(45),
                        nomeDoador VARCHAR(45),
                        cpfDoador VARCHAR(45),
                        dtDoacao TIMESTAMP NOT NULL,
                        tipo VARCHAR(45) NOT NULL,
                        status VARCHAR(45) NOT NULL,
                        txid VARCHAR(45),
                        pag_nome VARCHAR(45),
                        pag_email VARCHAR(45)

);

-- =========================================
-- tipoatividade
-- =========================================
CREATE TABLE tipoatividade (
                               idtipoatividade SERIAL PRIMARY KEY,
                               tipo VARCHAR(45) NOT NULL,
                               org VARCHAR(45) NOT NULL,
                               ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================
-- atividades
-- =========================================
CREATE TABLE atividades (
                            idAtividades SERIAL PRIMARY KEY,
                            nome VARCHAR(45),
                            descricao VARCHAR(45),
                            TipoAtividade_idTipoAtividade INTEGER,
                            data TIMESTAMP,
                            dataFim DATE,
                            horaIni VARCHAR(45),
                            horaFim VARCHAR(45),
                            FOREIGN KEY (TipoAtividade_idTipoAtividade)
                                REFERENCES tipoatividade(idtipoatividade)
);

-- =========================================
-- atividadesmorador
-- =========================================
CREATE TABLE atividadesmorador (
                                   Atividades_idAtividades INTEGER,
                                   Morador_idMorador INTEGER,
                                   observacao VARCHAR(500),
                                   PRIMARY KEY (Atividades_idAtividades, Morador_idMorador),
                                   FOREIGN KEY (Atividades_idAtividades)
                                       REFERENCES atividades(idAtividades),
                                   FOREIGN KEY (Morador_idMorador)
                                       REFERENCES morador(idMorador)
);

-- =========================================
-- transparencia
-- =========================================
CREATE TABLE transparencia (
                               idtransparencia SERIAL PRIMARY KEY,
                               nomearquivo VARCHAR(255) NOT NULL,
                               caminhoarquivo VARCHAR(500) NOT NULL,
                               datareferencia DATE NOT NULL DEFAULT CURRENT_DATE,
                               observacao VARCHAR(500),
                               dataupload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               ano INTEGER NOT NULL,
                               mes INTEGER NOT NULL,
                               evento VARCHAR(80) NOT NULL DEFAULT 'Outros',
                               Funcionario_idFuncionario INTEGER NOT NULL,

                               CONSTRAINT ck_transparencia_mes
                                   CHECK (mes BETWEEN 1 AND 12),

                               CONSTRAINT fk_transparencia_funcionario
                                   FOREIGN KEY (Funcionario_idFuncionario)
                                       REFERENCES funcionario(idFuncionario)
);

-- =========================================
-- noticia
-- =========================================
CREATE TABLE noticia (
                         idnoticia SERIAL PRIMARY KEY,
                         nomeimagem VARCHAR(255) NOT NULL,
                         caminhoimagem VARCHAR(500) NOT NULL,
                         dataupload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         titulo VARCHAR(64) NOT NULL,
                         descricao VARCHAR(500) NOT NULL,
                         categoria VARCHAR(45) NOT NULL
);
