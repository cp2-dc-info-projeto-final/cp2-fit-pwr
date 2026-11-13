const express = require('express');
const router = express.Router();
const pool = require('../db/config');
const { verifyRegistrationToken } = require('../middlewares/auth');

function sendSuccess(res, status, message, data) {
  const payload = { success: true };

  if (message) payload.message = message;
  if (typeof data !== 'undefined') payload.data = data;

  return res.status(status).json(payload);
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
    errors: []
  });
}

/*
 * POST /matricula/confirmar
 * Confirma um pagamento demonstrativo e ativa a matrícula.
 * Nenhum dado de cartão é recebido ou armazenado pelo backend.
 */
router.post('/confirmar', verifyRegistrationToken, async function(req, res) {
  const { titular, metodo } = req.body;

  if (!titular || !titular.trim()) {
    return sendError(res, 400, 'Informe o nome do titular para continuar.');
  }

  if (metodo !== 'cartao_simulado') {
    return sendError(res, 400, 'Método de pagamento demonstrativo inválido.');
  }

  try {
    const result = await pool.query(
      `UPDATE matricula
       SET status_pagamento = 'aprovado',
           status = 'ativa',
           data_pagamento = CURRENT_TIMESTAMP
       WHERE id_usuario = $1
         AND status = 'pendente'
       RETURNING id_matricula, id_usuario, valor,
                 status_pagamento, status, data_pagamento`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Matrícula pendente não encontrada.');
    }

    return sendSuccess(
      res,
      200,
      'Pagamento simulado aprovado! Sua matrícula está ativa.',
      result.rows[0]
    );
  } catch (error) {
    console.error('Erro ao confirmar matrícula:', error);
    return sendError(res, 500, 'Não foi possível concluir a matrícula.');
  }
});

module.exports = router;