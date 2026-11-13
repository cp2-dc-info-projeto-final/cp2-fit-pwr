var express = require('express');
var router = express.Router();
const pool = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

/* GET - Buscar todos os usuários (com filtro opcional por login) */
router.get('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { login } = req.query;

    let query = 'SELECT id, login, email, role FROM usuario';
    let params = [];

    if (login && login.trim() !== '') {
      query += ' WHERE login ILIKE $1';
      params.push(`%${login}%`);
    }

    query += ' ORDER BY id';

    const result = await pool.query(query, params);

    return sendSuccess(res, 200, null, result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET - Buscar usuário autenticado */
router.get('/me', verifyToken, async function(req, res) {
  try {
    const id = req.user.id;
    const result = await pool.query(
      'SELECT id, login, email, role FROM usuario WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* GET - Buscar usuário por ID */
router.get('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, login, email, role FROM usuario WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    return sendSuccess(res, 200, null, result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Criar novo usuário */
router.post('/', verifyToken, isAdmin, async function(req, res) {
  try {
    const { login, email, senha, role = 'user' } = req.body;

    // Validação básica
    if (!login || !email || !senha) {
      const errors = [];
      if (!login) errors.push({ field: 'login', message: 'Login é obrigatório', code: 'REQUIRED' });
      if (!email) errors.push({ field: 'email', message: 'Email é obrigatório', code: 'REQUIRED' });
      if (!senha) errors.push({ field: 'senha', message: 'Senha é obrigatória', code: 'REQUIRED' });

      return sendError(res, 400, 'Login, email, senha são obrigatórios', errors);
    }

    // Verificar se o login já existe
    const existingUser = await pool.query('SELECT id FROM usuario WHERE login = $1', [login]);
    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        { field: 'login', message: 'Login já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Verificar se o email já existe
    const existingEmail = await pool.query('SELECT id FROM usuario WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        { field: 'email', message: 'Email já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    const result = await pool.query(
  'INSERT INTO usuario (login, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, login, email, role',
  [login, email, hashedPassword, role]
);

// Contas de aluno criadas pelo administrador já entram matriculadas.
if (role === 'user') {
  await pool.query(
    `INSERT INTO matricula
     (id_usuario, valor, status_pagamento, status, data_pagamento)
     VALUES ($1, 80.00, 'aprovado', 'ativa', CURRENT_TIMESTAMP)
     ON CONFLICT (id_usuario) DO NOTHING`,
    [result.rows[0].id]
  );
}

return sendSuccess(res, 201, 'Usuário criado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

router.post('/me', verifyToken, async function(req, res) {
  try {
    const { login, email, senha, role = 'user' } = req.body;

    // Validação básica
    if (!login || !email || !senha) {
      const errors = [];
      if (!login) errors.push({ field: 'login', message: 'Login é obrigatório', code: 'REQUIRED' });
      if (!email) errors.push({ field: 'email', message: 'Email é obrigatório', code: 'REQUIRED' });
      if (!senha) errors.push({ field: 'senha', message: 'Senha é obrigatória', code: 'REQUIRED' });

      return sendError(res, 400, 'Login, email, senha são obrigatórios', errors);
    }

    // Verificar se o login já existe
    const existingUser = await pool.query('SELECT id FROM usuario WHERE login = $1', [login]);
    if (existingUser.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        { field: 'login', message: 'Login já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Verificar se o email já existe
    const existingEmail = await pool.query('SELECT id FROM usuario WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        { field: 'email', message: 'Email já está em uso', code: 'CONFLICT' }
      ]);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    const result = await pool.query(
      'INSERT INTO usuario (login, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, login, email, role',
      [login, email, hashedPassword, role]
    );

    return sendSuccess(res, 201, 'Usuário criado com sucesso', result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    // Verificar se é erro de constraint
    if (error.code === '23514') {
      return sendError(res, 400, 'Dados inválidos. Verifique os campos e tente novamente.');
    }

    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* POST - Cadastro público */
router.post('/register', async function(req, res) {
  const { login, email, senha } = req.body;
  const errors = [];

  if (!login) {
    errors.push({ field: 'login', message: 'Login é obrigatório' });
  }

  if (!email) {
    errors.push({ field: 'email', message: 'Email é obrigatório' });
  }

  if (!senha || senha.length < 6) {
    errors.push({
      field: 'senha',
      message: 'A senha deve ter pelo menos 6 caracteres'
    });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Dados inválidos', errors);
  }

  let client;

  try {
    const loginExists = await pool.query(
      'SELECT id FROM usuario WHERE login = $1',
      [login]
    );

    if (loginExists.rows.length > 0) {
      return sendError(res, 409, 'Login já existe', [
        { field: 'login', message: 'Login já existe' }
      ]);
    }

    const emailExists = await pool.query(
      'SELECT id FROM usuario WHERE email = $1',
      [email]
    );

    if (emailExists.rows.length > 0) {
      return sendError(res, 409, 'Email já existe', [
        { field: 'email', message: 'Email já existe' }
      ]);
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const senhaHash = await bcrypt.hash(senha, 12);

    const userResult = await client.query(
      `INSERT INTO usuario (login, email, senha, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, login, email, role`,
      [login, email, senhaHash]
    );

    const user = userResult.rows[0];

    // Cria uma matrícula pendente para o novo aluno.
    await client.query(
      `INSERT INTO matricula
       (id_usuario, valor, status_pagamento, status)
       VALUES ($1, 80.00, 'pendente', 'pendente')`,
      [user.id]
    );

    await client.query('COMMIT');

    // Token provisório: permite somente finalizar a matrícula.
    const tokenCadastro = jwt.sign(
      {
        id: user.id,
        role: user.role,
        tipo: 'cadastro'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    return sendSuccess(
      res,
      201,
      'Cadastro criado. Finalize a matrícula para ativar sua conta.',
      { user, tokenCadastro }
    );

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro ao desfazer cadastro:', rollbackError);
      }
    }

    console.error('Erro no cadastro:', error);
    return sendError(res, 500, 'Erro interno ao realizar cadastro');

  } finally {
    if (client) client.release();
  }
});

/* POST - Login */
router.post('/login', async function(req, res) {
  try {
    const { login, password } = req.body;

    const result = await pool.query(
      `SELECT id, login, email, senha AS "passwordHash", role
       FROM usuario
       WHERE login = $1`,
      [login]
    );

    if (result.rows.length === 0) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password || '',
      user.passwordHash
    );

    if (!isMatch) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    // Alunos precisam ter matrícula ativa e pagamento aprovado.
    // Professores e administradores continuam entrando normalmente.
    if (user.role === 'user') {
      const matricula = await pool.query(
        `SELECT id_matricula
         FROM matricula
         WHERE id_usuario = $1
           AND status = 'ativa'
           AND status_pagamento = 'aprovado'`,
        [user.id]
      );

      if (matricula.rows.length === 0) {
        return sendError(
          res,
          403,
          'Sua conta ainda não possui matrícula ativa. Finalize a matrícula para entrar.'
        );
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        login: user.login,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return sendSuccess(
      res,
      200,
      'Autenticado com sucesso!',
      { token }
    );

  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

// atualiza usuario ele mesmo
router.put('/me', verifyToken, async function (req, res) {
  try {
    const id = req.user.id;
    console.log(id);
    const { login, email, senha, role } = req.body;

    // Validação
    const errors = [];

    if (!login) {
      errors.push({
        field: 'login',
        message: 'Login é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!role) {
      errors.push({
        field: 'role',
        message: 'Perfil é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Dados inválidos', errors);
    }

    // Verifica se o usuário existe
    const userExists = await pool.query(
      'SELECT id FROM usuario WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    // Verifica login duplicado
    const loginExists = await pool.query(
      'SELECT id FROM usuario WHERE login = $1 AND id <> $2',
      [login, id]
    );

    if (loginExists.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        {
          field: 'login',
          message: 'Login já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    // Verifica email duplicado
    const emailExists = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id <> $2',
      [email, id]
    );

    if (emailExists.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        {
          field: 'email',
          message: 'Email já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    let result;

    // Atualiza com senha nova
    if (senha && senha.trim() !== '') {
      const senhaHash = await bcrypt.hash(senha, 12);

      result = await pool.query(
        `UPDATE usuario
         SET login = $1,
             email = $2,
             senha = $3,
             role = $4
         WHERE id = $5
         RETURNING id, login, email, role`,
        [login, email, senhaHash, role, id]
      );
    } else {
      // Atualiza sem alterar senha
      result = await pool.query(
        `UPDATE usuario
         SET login = $1,
             email = $2,
             role = $3
         WHERE id = $4
         RETURNING id, login, email, role`,
        [login, email, role, id]
      );
    }

    return sendSuccess(
      res,
      200,
      'Usuário atualizado com sucesso',
      result.rows[0]
    );

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


/* PUT - Atualizar usuário */
router.put('/:id', verifyToken, isAdmin, async function (req, res) {
  try {
    const { id } = req.params;
    const { login, email, senha, role } = req.body;

    // Validação
    const errors = [];

    if (!login) {
      errors.push({
        field: 'login',
        message: 'Login é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!role) {
      errors.push({
        field: 'role',
        message: 'Perfil é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Dados inválidos', errors);
    }

    // Verifica se o usuário existe
    const userExists = await pool.query(
      'SELECT id FROM usuario WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    // Verifica login duplicado
    const loginExists = await pool.query(
      'SELECT id FROM usuario WHERE login = $1 AND id <> $2',
      [login, id]
    );

    if (loginExists.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        {
          field: 'login',
          message: 'Login já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    // Verifica email duplicado
    const emailExists = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id <> $2',
      [email, id]
    );

    if (emailExists.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        {
          field: 'email',
          message: 'Email já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    let result;

    // Atualiza com senha nova
    if (senha && senha.trim() !== '') {
      const senhaHash = await bcrypt.hash(senha, 12);

      result = await pool.query(
        `UPDATE usuario
         SET login = $1,
             email = $2,
             senha = $3,
             role = $4
         WHERE id = $5
         RETURNING id, login, email, role`,
        [login, email, senhaHash, role, id]
      );
    } else {
      // Atualiza sem alterar senha
      result = await pool.query(
        `UPDATE usuario
         SET login = $1,
             email = $2,
             role = $3
         WHERE id = $4
         RETURNING id, login, email, role`,
        [login, email, role, id]
      );
    }

    return sendSuccess(
      res,
      200,
      'Usuário atualizado com sucesso',
      result.rows[0]
    );

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});


/* PUT - Atualizar usuário por ele mesmo */
router.put('/:me', verifyToken, async function (req, res) {
  try {

    const { login, email, senha, role } = req.body;

    // Validação
    const errors = [];

    if (!login) {
      errors.push({
        field: 'login',
        message: 'Login é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (!role) {
      errors.push({
        field: 'role',
        message: 'Perfil é obrigatório',
        code: 'REQUIRED'
      });
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Dados inválidos', errors);
    }

    // Verifica login duplicado
    const loginExists = await pool.query(
      'SELECT id FROM usuario WHERE login = $1 AND id <> $2',
      [login, id]
    );

    if (loginExists.rows.length > 0) {
      return sendError(res, 409, 'Login já está em uso', [
        {
          field: 'login',
          message: 'Login já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    // Verifica email duplicado
    const emailExists = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id <> $2',
      [email, id]
    );

    if (emailExists.rows.length > 0) {
      return sendError(res, 409, 'Email já está em uso', [
        {
          field: 'email',
          message: 'Email já está em uso',
          code: 'CONFLICT'
        }
      ]);
    }

    let result;

    // Atualiza com senha nova
    if (senha && senha.trim() !== '') {
      const senhaHash = await bcrypt.hash(senha, 12);

      result = await pool.query(
        `UPDATE usuario
         SET login = $1,
             email = $2,
             senha = $3,
             role = $4
         RETURNING id, login, email, role`,
        [login, email, senhaHash, role]
      );
    } else {
      // Atualiza sem alterar senha
      result = await pool.query(
        `UPDATE usuario
         SET login = $1,
             email = $2,
             role = $3
         RETURNING id, login, email, role`,
        [login, email, role]
      );
    }

    return sendSuccess(
      res,
      200,
      'Usuário atualizado com sucesso',
      result.rows[0]
    );

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

/* DELETE - Remover usuário */
router.delete('/:id', verifyToken, isAdmin, async function(req, res) {
  try {
    const { id } = req.params;

    const userExists = await pool.query(
      'SELECT id FROM usuario WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    await pool.query('DELETE FROM usuario WHERE id = $1', [id]);

    return sendSuccess(res, 200, 'Usuário deletado com sucesso');

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

module.exports = router;