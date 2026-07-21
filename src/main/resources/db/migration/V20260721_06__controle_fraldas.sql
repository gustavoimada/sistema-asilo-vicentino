CREATE TABLE IF NOT EXISTS controle_fraldas (
    idcontrolefraldas SERIAL PRIMARY KEY,
    quantidade_pacotes INTEGER NOT NULL CHECK (quantidade_pacotes > 0),
    fraldas_por_pacote INTEGER NOT NULL CHECK (fraldas_por_pacote > 0),
    total_fraldas INTEGER NOT NULL CHECK (total_fraldas > 0),
    data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    observacao VARCHAR(300),
    funcionario_idfuncionario INTEGER REFERENCES funcionario(idfuncionario) ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
