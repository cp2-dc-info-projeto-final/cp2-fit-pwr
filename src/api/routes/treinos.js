var express = require('express');
var router = express.Router();

const pool = require('../db/config');
const { verifyToken, isAdmin } = require('../middlewares/auth');

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
========================================================
GET /treinos/me
Busca o plano de treino do aluno logado
========================================================
*/

router.get('/me', verifyToken, async function(req, res) {
  try {
    const idUsuario = req.user.id;

    const planos = await pool.query(
      `
      SELECT
        p.id_plano,
        p.nome AS nome_plano,
        p.descricao,
        p.id_professor,
        prof.login AS professor
      FROM plano_treino p
      LEFT JOIN usuario prof
        ON p.id_professor = prof.id
      WHERE p.id_usuario = $1
      ORDER BY p.id_plano
      `,
      [idUsuario]
    );

    const resultado = [];

    for (const plano of planos.rows) {

      const treinos = await pool.query(
        `
        SELECT
          id_treino,
          nome,
          dia_semana
        FROM treino
        WHERE id_plano = $1
        ORDER BY id_treino
        `,
        [plano.id_plano]
      );

      for (const treino of treinos.rows) {

        const exercicios = await pool.query(
          `
          SELECT
            te.id,
            te.series,
            te.repeticoes,
            te.carga,
            te.descanso,
            te.ordem,
            te.observacao,

            e.id_exercicio,
            e.nome AS exercicio,
            e.grupo_muscular,
            e.descricao,
            e.imagem

          FROM treino_exercicio te

          INNER JOIN exercicio e
            ON te.id_exercicio = e.id_exercicio

          WHERE te.id_treino = $1

          ORDER BY te.ordem
          `,
          [treino.id_treino]
        );

        treino.exercicios = exercicios.rows;
      }

      resultado.push({
        ...plano,
        treinos: treinos.rows
      });
    }

    return sendSuccess(
      res,
      200,
      null,
      resultado
    );

  } catch (error) {

    console.error('Erro ao buscar treino do aluno:', error);

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});


/*
========================================================
POST /treinos
Cria um plano de treino para um aluno
Somente professor ou administrador
========================================================
*/

router.post('/', verifyToken, async function(req, res) {
  try {

    if (
      req.user.role !== 'professor' &&
      req.user.role !== 'admin'
    ) {
      return sendError(
        res,
        403,
        'Apenas professores ou administradores podem criar treinos.'
      );
    }

    const {
      id_usuario,
      nome,
      descricao
    } = req.body;

    const errors = [];

    if (!id_usuario) {
      errors.push({
        field: 'id_usuario',
        message: 'Aluno é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!nome || nome.trim() === '') {
      errors.push({
        field: 'nome',
        message: 'Nome do plano é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (errors.length > 0) {
      return sendError(
        res,
        400,
        'Dados inválidos',
        errors
      );
    }

    const aluno = await pool.query(
      `
      SELECT id, login
      FROM usuario
      WHERE id = $1
      AND role = 'user'
      `,
      [id_usuario]
    );

    if (aluno.rows.length === 0) {
      return sendError(
        res,
        404,
        'Aluno não encontrado.'
      );
    }

    const result = await pool.query(
      `
      INSERT INTO plano_treino
      (
        id_usuario,
        id_professor,
        nome,
        descricao
      )
      VALUES ($1, $2, $3, $4)

      RETURNING
        id_plano,
        id_usuario,
        id_professor,
        nome,
        descricao
      `,
      [
        id_usuario,
        req.user.id,
        nome,
        descricao || null
      ]
    );

    return sendSuccess(
      res,
      201,
      'Plano de treino criado com sucesso',
      result.rows[0]
    );

  } catch (error) {

    console.error('Erro ao criar plano de treino:', error);

    return sendError(
      res,
      500,
      'Erro interno do servidor'
    );
  }
});


/*
========================================================
POST /treinos/:id/treinos
Cria um treino dentro de um plano
========================================================
*/

router.post('/:id/treinos', verifyToken, async function(req, res) {

  try {

    if (
      req.user.role !== 'professor' &&
      req.user.role !== 'admin'
    ) {
      return sendError(
        res,
        403,
        'Apenas professores ou administradores podem criar treinos.'
      );
    }

    const { id } = req.params;

    const {
      nome,
      dia_semana
    } = req.body;

    if (!nome || !dia_semana) {
      return sendError(
        res,
        400,
        'Nome e dia da semana são obrigatórios.'
      );
    }

    const plano = await pool.query(
      `
      SELECT *
      FROM plano_treino
      WHERE id_plano = $1
      `,
      [id]
    );

    if (plano.rows.length === 0) {
      return sendError(
        res,
        404,
        'Plano de treino não encontrado.'
      );
    }

    if (
      req.user.role === 'professor' &&
      plano.rows[0].id_professor !== req.user.id
    ) {
      return sendError(
        res,
        403,
        'Você não pode alterar este plano de treino.'
      );
    }

    const result = await pool.query(
      `
      INSERT INTO treino
      (
        id_plano,
        nome,
        dia_semana
      )
      VALUES ($1, $2, $3)

      RETURNING
        id_treino,
        id_plano,
        nome,
        dia_semana
      `,
      [
        id,
        nome,
        dia_semana
      ]
    );

    return sendSuccess(
      res,
      201,
      'Treino criado com sucesso',
      result.rows[0]
    );

  } catch (error) {

    console.error('Erro ao criar treino:', error);

    if (error.code === '23514') {
      return sendError(
        res,
        400,
        'Dia da semana inválido.'
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
========================================================
POST /treinos/:id/exercicios
Adiciona exercício a um treino
========================================================
*/

router.post('/:id/exercicios', verifyToken, async function(req, res) {

  try {

    if (
      req.user.role !== 'professor' &&
      req.user.role !== 'admin'
    ) {
      return sendError(
        res,
        403,
        'Apenas professores ou administradores podem adicionar exercícios.'
      );
    }

    const { id } = req.params;

    const {
      id_exercicio,
      series,
      repeticoes,
      carga,
      descanso = 60,
      ordem,
      observacao
    } = req.body;

    if (
      !id_exercicio ||
      !series ||
      !repeticoes ||
      !ordem
    ) {
      return sendError(
        res,
        400,
        'Exercício, séries, repetições e ordem são obrigatórios.'
      );
    }

    const treino = await pool.query(
      `
      SELECT
        t.id_treino,
        p.id_professor
      FROM treino t

      INNER JOIN plano_treino p
        ON t.id_plano = p.id_plano

      WHERE t.id_treino = $1
      `,
      [id]
    );

    if (treino.rows.length === 0) {
      return sendError(
        res,
        404,
        'Treino não encontrado.'
      );
    }

    if (
      req.user.role === 'professor' &&
      treino.rows[0].id_professor !== req.user.id
    ) {
      return sendError(
        res,
        403,
        'Você não pode alterar este treino.'
      );
    }

    const exercicio = await pool.query(
      `
      SELECT id_exercicio
      FROM exercicio
      WHERE id_exercicio = $1
      `,
      [id_exercicio]
    );

    if (exercicio.rows.length === 0) {
      return sendError(
        res,
        404,
        'Exercício não encontrado.'
      );
    }

    const result = await pool.query(
      `
      INSERT INTO treino_exercicio
      (
        id_treino,
        id_exercicio,
        series,
        repeticoes,
        carga,
        descanso,
        ordem,
        observacao
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)

      RETURNING *
      `,
      [
        id,
        id_exercicio,
        series,
        repeticoes,
        carga || null,
        descanso,
        ordem,
        observacao || null
      ]
    );

    return sendSuccess(
      res,
      201,
      'Exercício adicionado ao treino',
      result.rows[0]
    );

  } catch (error) {

    console.error(
      'Erro ao adicionar exercício:',
      error
    );

    if (error.code === '23505') {
      return sendError(
        res,
        409,
        'Já existe um exercício nessa ordem.'
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
========================================================
GET /treinos/aluno/:id
Professor/Admin visualiza treino de um aluno
========================================================
*/

router.get('/aluno/:id', verifyToken, async function(req, res) {

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

    const { id } = req.params;

    const planos = await pool.query(
      `
      SELECT
        p.id_plano,
        p.id_usuario,
        p.nome AS nome_plano,
        p.descricao,
        p.id_professor,
        prof.login AS professor

      FROM plano_treino p

      LEFT JOIN usuario prof
        ON p.id_professor = prof.id

      WHERE p.id_usuario = $1

      ORDER BY p.id_plano
      `,
      [id]
    );

    return sendSuccess(
      res,
      200,
      null,
      planos.rows
    );

  } catch (error) {

    console.error(
      'Erro ao buscar treino do aluno:',
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
========================================================
DELETE /treinos/exercicios/:id
Remove exercício do treino
========================================================
*/

router.delete(
  '/exercicios/:id',
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
          'Apenas professores ou administradores podem remover exercícios.'
        );
      }

      const { id } = req.params;

      const result = await pool.query(
        `
        DELETE FROM treino_exercicio te

        USING treino t, plano_treino p

        WHERE te.id = $1
        AND te.id_treino = t.id_treino
        AND t.id_plano = p.id_plano

        RETURNING te.id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return sendError(
          res,
          404,
          'Exercício do treino não encontrado.'
        );
      }

      return sendSuccess(
        res,
        200,
        'Exercício removido com sucesso'
      );

    } catch (error) {

      console.error(
        'Erro ao remover exercício:',
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