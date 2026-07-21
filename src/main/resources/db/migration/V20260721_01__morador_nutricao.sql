ALTER TABLE morador ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE morador ADD COLUMN IF NOT EXISTS peso_atual_kg NUMERIC(6,2);
ALTER TABLE morador ADD COLUMN IF NOT EXISTS altura_atual_cm NUMERIC(6,2);
ALTER TABLE morador ADD COLUMN IF NOT EXISTS dados_antropometricos_atualizados_em TIMESTAMP;
ALTER TABLE morador ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS prontuario_nutricional (
    idprontuario SERIAL PRIMARY KEY,
    morador_id INTEGER NOT NULL UNIQUE REFERENCES morador(idmorador) ON DELETE RESTRICT,
    nutricionista_id INTEGER NOT NULL REFERENCES funcionario(idfuncionario) ON DELETE RESTRICT,
    acamado BOOLEAN NOT NULL,
    metodo_medicao VARCHAR(30) NOT NULL,
    grupo_equacao VARCHAR(10),
    altura_joelho_cm NUMERIC(6,2),
    circunferencia_braco_cm NUMERIC(6,2),
    peso_kg NUMERIC(6,2) NOT NULL,
    altura_cm NUMERIC(6,2) NOT NULL,
    peso_estimado BOOLEAN NOT NULL DEFAULT FALSE,
    altura_estimada BOOLEAN NOT NULL DEFAULT FALSE,
    formula_peso VARCHAR(255),
    formula_altura VARCHAR(255),
    diagnostico_inicial TEXT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_nutricao_metodo CHECK (metodo_medicao IN ('AFERIDO', 'ESTIMADO', 'MANUAL_REVISADO')),
    CONSTRAINT ck_nutricao_grupo CHECK (grupo_equacao IS NULL OR grupo_equacao IN ('BRANCA', 'NEGRA')),
    CONSTRAINT ck_nutricao_medidas CHECK (peso_kg > 0 AND altura_cm > 0)
);

CREATE TABLE IF NOT EXISTS evolucao_nutricional (
    idevolucao SERIAL PRIMARY KEY,
    prontuario_id INTEGER NOT NULL REFERENCES prontuario_nutricional(idprontuario) ON DELETE RESTRICT,
    nutricionista_id INTEGER NOT NULL REFERENCES funcionario(idfuncionario) ON DELETE RESTRICT,
    evolucao TEXT NOT NULL,
    peso_kg NUMERIC(6,2),
    altura_cm NUMERIC(6,2),
    metodo_medicao VARCHAR(30),
    observacoes TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_evolucao_metodo CHECK (metodo_medicao IS NULL OR metodo_medicao IN ('AFERIDO', 'ESTIMADO', 'MANUAL_REVISADO'))
);

CREATE INDEX IF NOT EXISTS idx_evolucao_nutricional_prontuario_data
    ON evolucao_nutricional(prontuario_id, criado_em DESC);
