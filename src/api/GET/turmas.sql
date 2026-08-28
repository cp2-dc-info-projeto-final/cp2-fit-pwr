SELECT
    t.id_turma,
    t.horario,
    m.nome AS nome_modalidade,
    u.id AS id_professor,
    u.login AS professor,
    CASE
        WHEN ta.id IS NOT NULL THEN true
        ELSE false
    END AS inscrito
FROM turma t
INNER JOIN modalidade m
    ON t.id_modalidade = m.id_modalidade
INNER JOIN usuario u
    ON t.id_professor = u.id
LEFT JOIN turma_aluno ta
    ON ta.id_turma = t.id_turma
    AND ta.id_aluno = $1
ORDER BY t.horario, m.nome;