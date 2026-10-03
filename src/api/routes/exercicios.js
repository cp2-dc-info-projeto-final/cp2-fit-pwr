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

/* GET - Buscar todos os exercícios (com filtro opcional por nome) */
router.get('/', verifyToken, async function(req, res) {
  try {
    const { nome } = req.query;

    let query = 'SELECT id_exercicio, nome, grupo_muscular, descricao, imagem FROM exercicio';
    let params = [];

    if (nome && nome.trim() !== '') {
      query += ' WHERE nome ILIKE \$1';
      params.push(`%${nome}%`);
    }

    query += ' ORDER BY grupo_muscular, nome';

    const result = await pool.query(query, params);
    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar exercícios:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET - Buscar exercício por ID */
router.get('/:id', verifyToken, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id_exercicio, nome, grupo_muscular, descricao, imagem FROM exercicio WHERE id_exercicio = \$1',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Exercício não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar exercício:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar novo exercício (Apenas Admin) */
router.post('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { nome, grupo_muscular, descricao, imagem } = req.body;
    const errors = [];
    
    // Validação de campos obrigatórios (NOT NULL no banco)
    if (!nome || nome.trim() === '') {
      errors.push({ field: 'nome', message: 'Nome é obrigatório', code: 'REQUIRED' });
    }
    if (!grupo_muscular || grupo_muscular.trim() === '') {
      errors.push({ field: 'grupo_muscular', message: 'Grupo muscular é obrigatório', code: 'REQUIRED' });
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Campos obrigatórios em falta', errors);
    }
    
    // Verificar constraint uk_exercicio_nome (UNIQUE)
    const existingExercicio = await pool.query('SELECT id_exercicio FROM exercicio WHERE nome = \$1', [nome]);
    if (existingExercicio.rows.length > 0) {
      return sendError(res, 409, 'Este exercício já está registado', [
        { field: 'nome', message: 'Nome já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Tratamento para strings vazias irem como NULL para o banco
    const descParam = descricao && descricao.trim() !== '' ? descricao : null;
    const imgParam = imagem && imagem.trim() !== '' ? imagem : null;

    const result = await pool.query(
      `INSERT INTO exercicio (nome, grupo_muscular, descricao, imagem) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_exercicio, nome, grupo_muscular, descricao, imagem`,
      [nome, grupo_muscular, descParam, imgParam]
    );

    return sendSuccess(res, 201, 'Exercício criado com sucesso', result.rows);
  } catch (error) {
    console.error('Erro ao criar exercício:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* PUT - Atualizar exercício por ID (Apenas Admin) */
router.put('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;
    const { nome, grupo_muscular, descricao, imagem } = req.body;
    const errors = [];

    // Validação de campos obrigatórios
    if (!nome || nome.trim() === '') {
      errors.push({ field: 'nome', message: 'Nome é obrigatório para atualização', code: 'REQUIRED' });
    }
    if (!grupo_muscular || grupo_muscular.trim() === '') {
      errors.push({ field: 'grupo_muscular', message: 'Grupo muscular é obrigatório para atualização', code: 'REQUIRED' });
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Erro de validação nos campos', errors);
    }

    // Verificar se o exercício com o ID fornecido existe
    const exists = await pool.query('SELECT id_exercicio FROM exercicio WHERE id_exercicio = \$1', [id]);
    if (exists.rows.length === 0) {
      return sendError(res, 404, 'Exercício não encontrado');
    }

    // Verificar se o novo nome entra em conflito com OUTRO exercício existente (uk_exercicio_nome)
    const nameCheck = await pool.query(
      'SELECT id_exercicio FROM exercicio WHERE nome = \$1 AND id_exercicio <> \$2',
      [nome, id]
    );
    if (nameCheck.rows.length > 0) {
      return sendError(res, 409, 'Já existe outro exercício cadastrado com este nome', [
        { field: 'nome', message: 'Nome já está em uso', code: 'CONFLICT' }
      ]);
    }

    const descParam = descricao && descricao.trim() !== '' ? descricao : null;
    const imgParam = imagem && imagem.trim() !== '' ? imagem : null;

    const result = await pool.query(
      `UPDATE exercicio 
       SET nome = $1, grupo_muscular = $2, descricao = $3, imagem = $4 
       WHERE id_exercicio = $5 
       RETURNING id_exercicio, nome, grupo_muscular, descricao, imagem`,
      [nome, grupo_muscular, descParam, imgParam, id]
    );

    return sendSuccess(res, 200, 'Exercício atualizado com sucesso', result.rows);
  } catch (error) {
    console.error('Erro ao atualizar exercício:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover exercício por ID (Apenas Admin) */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM exercicio WHERE id_exercicio = \$1 RETURNING id_exercicio', [id]);

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Exercício não encontrado');
    }

    return sendSuccess(res, 200, 'Exercício removido com sucesso');
  } catch (error) {
    console.error('Erro ao remover exercício:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;
