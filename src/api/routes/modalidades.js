var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const { verifyToken, isAdmin } = require('../middlewares/auth');

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

/* GET - Buscar todas as modalidades (com filtro opcional por nome) */
router.get('/', verifyToken, async function(req, res) {
  try {
    const { nome } = req.query;

    let query = 'SELECT id_modalidade, nome FROM modalidade';
    let params = [];

    if (nome && nome.trim() !== '') {
      query += ' WHERE nome ILIKE $1';
      params.push(`%${nome}%`);
    }

    query += ' ORDER BY nome';

    const result = await pool.query(query, params);
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET - Buscar modalidade por ID */
router.get('/:id', verifyToken, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id_modalidade, nome FROM modalidade WHERE id_modalidade = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Modalidade não encontrada');
    }

    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar modalidade:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar nova modalidade (Apenas Admin) */
router.post('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { nome } = req.body;
    
    // Validação básica
    if (!nome || nome.trim() === '') {
      return sendError(res, 400, 'Campos obrigatórios em falta', [
        { field: 'nome', message: 'Nome é obrigatório', code: 'REQUIRED' }
      ]);
    }
    
    // Verificar duplicados
    const existingModalidade = await pool.query('SELECT id_modalidade FROM modalidade WHERE nome = $1', [nome]);
    if (existingModalidade.rows.length > 0) {
      return sendError(res, 409, 'Esta modalidade já está registada', [
        { field: 'nome', message: 'Nome já está em uso', code: 'CONFLICT' }
      ]);
    }

    const result = await pool.query(
      'INSERT INTO modalidade (nome) VALUES ($1) RETURNING id_modalidade, nome',
      [nome]
    );

    return sendSuccess(res, 201, 'Modalidade criada com sucesso', result.rows);
  } catch (error) {
    console.error('Erro ao criar modalidade:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* PUT - Atualizar modalidade por ID (Apenas Admin) */
router.put('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || nome.trim() === '') {
      return sendError(res, 400, 'Nome é obrigatório para atualização');
    }

    // Verificar se existe
    const exists = await pool.query('SELECT id_modalidade FROM modalidade WHERE id_modalidade = $1', [id]);
    if (exists.rows.length === 0) {
      return sendError(res, 404, 'Modalidade não encontrada');
    }

    const result = await pool.query(
      `UPDATE modalidade 
       SET nome = $1 
       WHERE id_modalidade = $2 
       RETURNING id_modalidade, nome`,
      [nome, id]
    );

    return sendSuccess(res, 200, 'Modalidade atualizada com sucesso', result.rows);
  } catch (error) {
    console.error('Erro ao atualizar modalidade:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover modalidade por ID (Apenas Admin) */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM modalidade WHERE id_modalidade = $1 RETURNING id_modalidade', [id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Modalidade não encontrada');
    }

    return sendSuccess(res, 200, 'Modalidade removida com sucesso');
  } catch (error) {
    console.error('Erro ao remover modalidade:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;