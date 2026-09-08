var express = require('express');
var router = express.Router();

const pool = require('../db/config');
const { verifyToken } = require('../middlewares/auth');

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


/*
 * GET - Buscar aulas coletivas
 *
 * Retorna:
 * - id da turma
 * - nome da modalidade
 * - horário
 * - professor
 * - se o aluno logado está inscrito
 */
router.get('/', verifyToken, async function(req, res) {
  try {
    const idAluno = req.user.id;

    const result = await pool.query(`
      SELECT
        t.id_turma,
        t.horario,
        m.nome AS nome_modalidade,
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

      ORDER BY t.id_turma
    `, [idAluno]);

    return sendSuccess(
      res,
      200,
      null,
      result.rows
    );

  } catch (error) {
    console.error('Erro ao buscar aulas coletivas:', error);

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});


/*
 * POST - Inscrever o aluno logado em uma aula
 */
router.post('/:id/inscricao', verifyToken, async function(req, res) {
  try {
    const idTurma = req.params.id;
    const idAluno = req.user.id;

    // Verifica se a turma existe
    const turma = await pool.query(
      `
      SELECT id_turma
      FROM turma
      WHERE id_turma = $1
      `,
      [idTurma]
    );

    if (turma.rows.length === 0) {
      return sendError(
        res,
        404,
        'Aula não encontrada'
      );
    }

    // Verifica se o aluno já está inscrito
    const inscricao = await pool.query(
      `
      SELECT id
      FROM turma_aluno
      WHERE id_turma = $1
      AND id_aluno = $2
      `,
      [idTurma, idAluno]
    );

    if (inscricao.rows.length > 0) {
      return sendError(
        res,
        409,
        'Você já está inscrito nesta aula'
      );
    }

    // Realiza a inscrição
    await pool.query(
      `
      INSERT INTO turma_aluno
      (id_turma, id_aluno)
      VALUES ($1, $2)
      `,
      [idTurma, idAluno]
    );

    return sendSuccess(
      res,
      201,
      'Inscrição realizada com sucesso'
    );

  } catch (error) {
    console.error('Erro ao realizar inscrição:', error);

    // Violação da constraint UNIQUE
    if (error.code === '23505') {
      return sendError(
        res,
        409,
        'Você já está inscrito nesta aula'
      );
    }

    // Violação de chave estrangeira
    if (error.code === '23503') {
      return sendError(
        res,
        400,
        'Aula ou usuário inválido'
      );
    }

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});


/*
 * DELETE - Desmatricular o aluno logado de uma aula
 */
router.delete('/:id/inscricao', verifyToken, async function(req, res) {
  try {
    const idTurma = req.params.id;
    const idAluno = req.user.id;

    const result = await pool.query(
      `
      DELETE FROM turma_aluno
      WHERE id_turma = $1
      AND id_aluno = $2
      RETURNING id
      `,
      [idTurma, idAluno]
    );

    if (result.rows.length === 0) {
      return sendError(
        res,
        404,
        'Você não está inscrito nesta aula'
      );
    }

    return sendSuccess(
      res,
      200,
      'Desmatrícula realizada com sucesso'
    );

  } catch (error) {
    console.error('Erro ao realizar desmatrícula:', error);

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});

/*
 * GET - Buscar aulas do professor logado
 *
 * Retorna somente as aulas em que
 * o professor logado é responsável.
 */
router.get('/professor', verifyToken, async function(req, res) {
  try {
    if (
      req.user.role !== 'professor' &&
      req.user.role !== 'admin'
    ) {
      return sendError(
        res,
        403,
        'Apenas professores ou administradores podem acessar este recurso.'
      );
    }

    const idProfessor = req.user.id;

    const result = await pool.query(
      `
      SELECT
        t.id_turma,
        t.horario,
        m.nome AS nome_modalidade,
        u.login AS professor,
        COUNT(ta.id)::INTEGER AS quantidade_alunos

      FROM turma t

      INNER JOIN modalidade m
        ON t.id_modalidade = m.id_modalidade

      INNER JOIN usuario u
        ON t.id_professor = u.id

      LEFT JOIN turma_aluno ta
        ON ta.id_turma = t.id_turma

      WHERE t.id_professor = $1

      GROUP BY
        t.id_turma,
        t.horario,
        m.nome,
        u.login

      ORDER BY t.horario
      `,
      [idProfessor]
    );

    return sendSuccess(
      res,
      200,
      null,
      result.rows
    );

  } catch (error) {
    console.error(
      'Erro ao buscar aulas do professor:',
      error
    );

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});

/*
 * GET - Buscar alunos matriculados em uma aula
 *
 * O professor só pode visualizar alunos
 * das próprias aulas.
 */
router.get('/:id/alunos', verifyToken, async function(req, res) {
  try {
    if (
      req.user.role !== 'professor' &&
      req.user.role !== 'admin'
    ) {
      return sendError(
        res,
        403,
        'Apenas professores ou administradores podem acessar este recurso.'
      );
    }

    const idTurma = req.params.id;
    const idProfessor = req.user.id;

    const turma = await pool.query(
      `
      SELECT id_turma
      FROM turma
      WHERE id_turma = $1
      AND id_professor = $2
      `,
      [idTurma, idProfessor]
    );

    if (turma.rows.length === 0) {
      return sendError(
        res,
        404,
        'Aula não encontrada ou você não é o professor desta aula.'
      );
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.login,
        u.email

      FROM turma_aluno ta

      INNER JOIN usuario u
        ON ta.id_aluno = u.id

      WHERE ta.id_turma = $1

      ORDER BY u.login
      `,
      [idTurma]
    );

    return sendSuccess(
      res,
      200,
      null,
      result.rows
    );

  } catch (error) {
    console.error(
      'Erro ao buscar alunos da aula:',
      error
    );

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});

/*
 * DELETE - Cancelar matrícula de um aluno em uma aula
 *
 * Somente o professor responsável pela aula
 * ou um administrador pode realizar a operação.
 */
router.delete(
  '/:id/alunos/:idAluno',
  verifyToken,
  async function(req, res) {

    try {

      if (
        req.user.role !== 'professor' &&
        req.user.role !== 'admin'
      ) {
        return sendError(
          res,
          403,
          'Apenas professores ou administradores podem cancelar matrículas.'
        );
      }

      const idTurma = req.params.id;
      const idAluno = req.params.idAluno;
      const idProfessor = req.user.id;

      const turma = await pool.query(
        `
        SELECT id_turma
        FROM turma
        WHERE id_turma = $1
        AND id_professor = $2
        `,
        [idTurma, idProfessor]
      );

      if (turma.rows.length === 0) {
        return sendError(
          res,
          404,
          'Aula não encontrada ou você não é o professor desta aula.'
        );
      }

      const result = await pool.query(
        `
        DELETE FROM turma_aluno
        WHERE id_turma = $1
        AND id_aluno = $2
        RETURNING id
        `,
        [idTurma, idAluno]
      );

      if (result.rows.length === 0) {
        return sendError(
          res,
          404,
          'Aluno não está matriculado nesta aula.'
        );
      }

      return sendSuccess(
        res,
        200,
        'Matrícula cancelada com sucesso.'
      );

    } catch (error) {

      console.error(
        'Erro ao cancelar matrícula:',
        error
      );

      return sendError(
        res,
        500,
        'Erro interno do servidor'
      );
    }
  }
);



module.exports = router;