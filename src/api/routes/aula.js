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


module.exports = router;