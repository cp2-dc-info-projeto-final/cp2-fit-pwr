var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const { verifyToken, isAdminOrProfessor } = require('../middlewares/auth');

// Funções utilitárias de resposta mantidas do seu padrão original
function sendSuccess(res, status, message, data) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (typeof data !== 'undefined') payload.data = data;
  return res.status(status).json(payload);
}

function sendError(res, status, message, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}

/* GET - Buscar todas as turmas (com filtro opcional por horário) */
router.get('/', verifyToken, async function(req, res) {
  try {
    const { horario } = req.query;

    let query = `
      SELECT
        t.id_turma,
        t.id_professor,
        t.id_modalidade,
        t.horario,
        m.nome AS nome_modalidade,
        u.login AS professor,
        COUNT(ta.id_aluno)::integer AS quantidade_alunos
      FROM turma t
      INNER JOIN modalidade m
        ON m.id_modalidade = t.id_modalidade
      INNER JOIN usuario u
        ON u.id = t.id_professor
      LEFT JOIN turma_aluno ta
        ON ta.id_turma = t.id_turma
    `;

    const params = [];
    const conditions = [];

    if (req.user.role === 'professor') {
      params.push(req.user.id);
      conditions.push(`t.id_professor = $${params.length}`);
    }

    if (horario && horario.trim() !== '') {
      params.push(`%${horario}%`);
      conditions.push(`t.horario ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY
        t.id_turma,
        t.id_professor,
        t.id_modalidade,
        t.horario,
        m.nome,
        u.login
      ORDER BY t.id_turma
    `;

    const result = await pool.query(query, params);

    return sendSuccess(res, 200, null, result.rows);

  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

router.get('/:id/alunos', verifyToken, isAdminOrProfessor, async function (req, res) {
  const { id } = req.params;

  try {
    const turmaResult = await pool.query(
      `SELECT id_turma, id_professor
       FROM turma
       WHERE id_turma = $1`,
      [id]
    );

    if (turmaResult.rows.length === 0) {
      return sendError(res, 404, 'Turma não encontrada.');
    }

    const turma = turmaResult.rows[0];

    if (
      req.user.role === 'professor' &&
      Number(turma.id_professor) !== Number(req.user.id)
    ) {
      return sendError(
        res,
        403,
        'Você não tem permissão para visualizar os alunos desta turma.'
      );
    }

    const result = await pool.query(
      `SELECT
        u.id,
        u.login,
        u.email
       FROM turma_aluno ta
       INNER JOIN usuario u ON u.id = ta.id_aluno
       WHERE ta.id_turma = $1
       ORDER BY u.login`,
      [id]
    );

    return sendSuccess(
      res,
      200,
      'Alunos encontrados com sucesso.',
      result.rows
    );

  } catch (error) {
    console.error('Erro ao buscar alunos da turma:', error);

    return sendError(
      res,
      500,
      'Erro interno ao buscar alunos.'
    );
  }
});

router.delete('/:id/alunos/:idAluno', verifyToken, isAdminOrProfessor, async function (req, res) {
  const { id, idAluno } = req.params;

  try {
    const turmaResult = await pool.query(
      `SELECT id_turma, id_professor
       FROM turma
       WHERE id_turma = $1`,
      [id]
    );

    if (turmaResult.rows.length === 0) {
      return sendError(res, 404, 'Turma não encontrada.');
    }

    const turma = turmaResult.rows[0];

    if (
      req.user.role === 'professor' &&
      Number(turma.id_professor) !== Number(req.user.id)
    ) {
      return sendError(
        res,
        403,
        'Você não tem permissão para cancelar esta matrícula.'
      );
    }

    const result = await pool.query(
      `DELETE FROM turma_aluno
       WHERE id_turma = $1
       AND id_aluno = $2
       RETURNING id`,
      [id, idAluno]
    );

    if (result.rows.length === 0) {
      return sendError(
        res,
        404,
        'Matrícula não encontrada.'
      );
    }

    return sendSuccess(
      res,
      200,
      'Matrícula cancelada com sucesso.'
    );

  } catch (error) {
    console.error('Erro ao cancelar matrícula:', error);

    return sendError(
      res,
      500,
      'Erro interno ao cancelar matrícula.'
    );
  }
});

/* GET - Buscar turma por ID */
router.get('/:id', verifyToken, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id_turma, id_professor, id_modalidade, horario FROM turma WHERE id_turma = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Turma não encontrada');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar turma:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar nova turma (Apenas Admin) */
router.post('/', verifyToken, isAdminOrProfessor, async function(req, res) {
  console.log('POST /turmas');
  console.log('Usuário:', req.user);
  console.log('Body recebido:', req.body);
  try {

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'professor'
    ) {
      return sendError(
        res,
        403,
        'Apenas professores ou administradores podem criar aulas.'
      );
    }

    let { id_professor, id_modalidade, horario } = req.body;

    if (req.user.role === 'professor') {
  id_professor = req.user.id;
}

    if (!id_professor || !id_modalidade || !horario || horario.trim() === '') {
      const errors = [];

      if (!id_professor) {
        errors.push({
          field: 'id_professor',
          message: 'Professor é obrigatório',
          code: 'REQUIRED'
        });
      }

      if (!id_modalidade) {
        errors.push({
          field: 'id_modalidade',
          message: 'Modalidade é obrigatória',
          code: 'REQUIRED'
        });
      }

      if (!horario || horario.trim() === '') {
        errors.push({
          field: 'horario',
          message: 'Horário é obrigatório',
          code: 'REQUIRED'
        });
      }

      return sendError(
        res,
        400,
        'Campos obrigatórios em falta',
        errors
      );
    }

    const professor = await pool.query(
      `
      SELECT id
      FROM usuario
      WHERE id = $1
      AND role = 'professor'
      `,
      [id_professor]
    );

    if (professor.rows.length === 0) {
      return sendError(
        res,
        404,
        'Professor não encontrado.'
      );
    }

    const modalidade = await pool.query(
      `
      SELECT id_modalidade
      FROM modalidade
      WHERE id_modalidade = $1
      `,
      [id_modalidade]
    );

    if (modalidade.rows.length === 0) {
      return sendError(
        res,
        404,
        'Modalidade não encontrada.'
      );
    }

    const result = await pool.query(
      `
      INSERT INTO turma
      (
        id_professor,
        id_modalidade,
        horario
      )
      VALUES ($1, $2, $3)

      RETURNING
        id_turma,
        id_professor,
        id_modalidade,
        horario
      `,
      [
        id_professor,
        id_modalidade,
        horario
      ]
    );

    return sendSuccess(
      res,
      201,
      'Aula criada com sucesso',
      result.rows[0]
    );

  } catch (error) {

 console.error('=================================');
  console.error('ERRO AO CRIAR AULA');
  console.error('Mensagem:', error.message);
  console.error('Código:', error.code);
  console.error('Detalhes:', error.detail);
  console.error('Stack:', error.stack);
  console.error('=================================');

  return sendError(
    res,
    500,
    'Erro interno do servidor'
  );
}
});

/* PUT - Atualizar turma por ID (Admin ou Professor) */
router.put('/:id', verifyToken, isAdminOrProfessor, async function (req, res) {
  const { id } = req.params;
  let { id_professor, id_modalidade, horario } = req.body;

  try {
    const turmaResult = await pool.query(
      `SELECT id_turma, id_professor
       FROM turma
       WHERE id_turma = $1`,
      [id]
    );

    if (turmaResult.rows.length === 0) {
      return sendError(res, 404, 'Turma não encontrada.');
    }

    const turma = turmaResult.rows[0];

    if (
      req.user.role === 'professor' &&
      Number(turma.id_professor) !== Number(req.user.id)
    ) {
      return sendError(
        res,
        403,
        'Você não tem permissão para editar esta aula.'
      );
    }

    if (req.user.role === 'professor') {
      id_professor = req.user.id;
    }

    if (id_professor !== undefined) {
      const professorResult = await pool.query(
        `SELECT id
         FROM usuario
         WHERE id = $1
           AND role = 'professor'`,
        [id_professor]
      );

      if (professorResult.rows.length === 0) {
        return sendError(res, 400, 'Professor inválido.');
      }
    }

    if (id_modalidade !== undefined) {
      const modalidadeResult = await pool.query(
        `SELECT id_modalidade
         FROM modalidade
         WHERE id_modalidade = $1`,
        [id_modalidade]
      );

      if (modalidadeResult.rows.length === 0) {
        return sendError(res, 400, 'Modalidade inválida.');
      }
    }

    if (horario !== undefined) {
      const horarioValido =
        typeof horario === 'string' &&
        /^\d{2}:\d{2}$/.test(horario);

      if (!horarioValido) {
        return sendError(
          res,
          400,
          'O horário deve estar no formato HH:MM.'
        );
      }
    }

    const result = await pool.query(
      `UPDATE turma
       SET
         id_professor = COALESCE($1, id_professor),
         id_modalidade = COALESCE($2, id_modalidade),
         horario = COALESCE($3, horario)
       WHERE id_turma = $4
       RETURNING id_turma, id_professor, id_modalidade, horario`,
      [
        id_professor ?? null,
        id_modalidade ?? null,
        horario ?? null,
        id
      ]
    );

    return sendSuccess(
      res,
      200,
      'Aula atualizada com sucesso.',
      result.rows[0]
    );

  } catch (error) {
    console.error('Erro ao atualizar turma:', error);

    if (error.code === '23503') {
      return sendError(
        res,
        400,
        'Professor ou modalidade não encontrada.'
      );
    }

    return sendError(
      res,
      500,
      'Erro interno ao atualizar a aula.'
    );
  }
});

/* DELETE - Remover turma por ID (Admin ou Professor) */
router.delete('/:id', verifyToken, isAdminOrProfessor, async function (req, res) {
  const { id } = req.params;

  try {
    const turmaResult = await pool.query(
      `SELECT id_turma, id_professor
       FROM turma
       WHERE id_turma = $1`,
      [id]
    );

    if (turmaResult.rows.length === 0) {
      return sendError(res, 404, 'Aula não encontrada.');
    }

    const turma = turmaResult.rows[0];

    if (
      req.user.role === 'professor' &&
      Number(turma.id_professor) !== Number(req.user.id)
    ) {
      return sendError(
        res,
        403,
        'Você não tem permissão para excluir esta aula.'
      );
    }

    await pool.query(
      `DELETE FROM turma
       WHERE id_turma = $1`,
      [id]
    );

    return sendSuccess(
      res,
      200,
      'Aula excluída com sucesso.'
    );

  } catch (error) {
    console.error('Erro ao excluir aula:', error);

    return sendError(
      res,
      500,
      'Erro interno ao excluir a aula.'
    );
  }
});

module.exports = router;
