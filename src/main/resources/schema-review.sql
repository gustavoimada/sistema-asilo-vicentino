-- Auditoria nao destrutiva do schema em producao.
-- Rode somente depois de backup.
-- Este arquivo nao apaga tabelas nem dados.

-- 1. Conferir tabelas existentes.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Conferir tabelas legadas que nao deveriam ser usadas pelo sistema atual.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('turnos', 'historicomorador');

-- 3. Conferir volume de dados por tabela principal.
SELECT 'usuario' AS tabela, COUNT(*) AS total FROM usuario
UNION ALL SELECT 'funcionario', COUNT(*) FROM funcionario
UNION ALL SELECT 'morador', COUNT(*) FROM morador
UNION ALL SELECT 'quartos', COUNT(*) FROM quartos
UNION ALL SELECT 'prescricao', COUNT(*) FROM prescricao
UNION ALL SELECT 'prescricaodose', COUNT(*) FROM prescricaodose
UNION ALL SELECT 'registrarusomedicacao', COUNT(*) FROM registrarusomedicacao
UNION ALL SELECT 'funcionarioturnos', COUNT(*) FROM funcionarioturnos
UNION ALL SELECT 'ocorrencias', COUNT(*) FROM ocorrencias
UNION ALL SELECT 'doacao', COUNT(*) FROM doacao
UNION ALL SELECT 'despesas', COUNT(*) FROM despesas
UNION ALL SELECT 'transparencia', COUNT(*) FROM transparencia
UNION ALL SELECT 'noticia', COUNT(*) FROM noticia
ORDER BY tabela;

-- 4. Conferir referencias de quarto em moradores.
SELECT m.idmorador, m.nome, m.genero, m.quartos_idquartos, q.ala
FROM morador m
LEFT JOIN quartos q ON q.idquartos = m.quartos_idquartos
WHERE m.quartos_idquartos IS NOT NULL
  AND (q.idquartos IS NULL OR LOWER(m.genero) <> LOWER(q.ala));

-- 5. Conferir usuarios administrativos ativos.
SELECT f.idfuncionario, f.nome, f.categoria, f.ativo, u.name AS usuario
FROM funcionario f
LEFT JOIN usuario u ON u.id = f.user_iduser
ORDER BY f.categoria, f.nome;

-- 6. Se a auditoria confirmar que tabelas legadas estao vazias/sem uso,
-- use atualizacao-producao.sql para a limpeza planejada.
