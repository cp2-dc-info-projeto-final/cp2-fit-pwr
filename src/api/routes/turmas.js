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

    let query = 'SELECT id_turma, id_professor, id_modalidade, horario FROM turma';
    let params = [];

    if (horario && horario.trim() !== '') {
      query += ' WHERE horario ILIKE $1';
      params.push(`%${horario}%`);
    }

    query += ' ORDER BY id_turma';

    const result = await pool.query(query, params);
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return sendError(res, 500, 'Erro interno do servidor');
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

    const { id_professor, id_modalidade, horario } = req.body;

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
router.put('/:id', verifyToken, isAdminOrProfessor, async function(req, res) {
  try {
    const { id } = req.params;
    const { id_professor, id_modalidade, horario } = req.body;

    // Verificar se existe
    const exists = await pool.query('SELECT id_turma FROM turma WHERE id_turma = $1', [id]);
    if (exists.rows.length === 0) {
      return sendError(res, 404, 'Turma não encontrada');
    }

    const result = await pool.query(
      `UPDATE turma 
       SET id_professor = COALESCE($1, id_professor), 
           id_modalidade = COALESCE($2, id_modalidade), 
           horario = COALESCE($3, horario) 
       WHERE id_turma = $4 
       RETURNING id_turma, id_professor, id_modalidade, horario`,
      [id_professor, id_modalidade, horario, id]
    );

    return sendSuccess(res, 200, 'Turma atualizada com sucesso', result.rows);
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    if (error.code === '23503') {
      return sendError(res, 400, 'O professor ou a modalidade informada não existe.');
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover turma por ID (Admin ou Professor) */
router.delete('/:id', verifyToken, isAdminOrProfessor, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM turma WHERE id_turma = $1 RETURNING id_turma', [id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Turma não encontrada');
    }

    return sendSuccess(res, 200, 'Turma removida com sucesso');
  } catch (error) {
    console.error('Erro ao remover turma:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;
