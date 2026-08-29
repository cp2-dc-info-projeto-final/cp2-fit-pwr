var express = require('express');
var router = express.Router();

const pool = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  verifyToken,
  isAdmin
} = require('../middlewares/auth');


// ========================================================
// FUNÇÕES DE RESPOSTA
// ========================================================

function sendSuccess(res, status, message, data) {
  const payload = {
    success: true
  };

  if (message) {
    payload.message = message;
  }

  if (typeof data !== 'undefined') {
    payload.data = data;
  }

  return res.status(status).json(payload);
}


function sendError(res, status, message, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}


// ========================================================
// GET /users
// Buscar todos os usuários
// APENAS ADMIN
// ========================================================

router.get(
  '/',
  verifyToken,
  isAdmin,
  async function(req, res) {

    try {

      const { login } = req.query;

      let query = `
        SELECT
          id,
          login,
          email,
          horario,
          role
        FROM usuario
      `;

      const params = [];

      if (login && login.trim() !== '') {

        query += `
          WHERE login ILIKE $1
        `;

        params.push(`%${login}%`);
      }

      query += `
        ORDER BY id
      `;

      const result = await pool.query(
        query,
        params
      );

      return sendSuccess(
        res,
        200,
        null,
        result.rows
      );

    } catch (error) {

      console.error(
        'Erro ao buscar usuários:',
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


// ========================================================
// GET /users/me
// Buscar usuário logado
// ========================================================

router.get(
  '/me',
  verifyToken,
  async function(req, res) {

    try {

      const id = req.user.id;

      const result = await pool.query(
        `
        SELECT
          id,
          login,
          email,
          horario,
          role
        FROM usuario
        WHERE id = $1
        `,
        [id]
      );

      if (result.rows.length === 0) {

        return sendError(
          res,
          404,
          'Usuário não encontrado'
        );
      }

      return sendSuccess(
        res,
        200,
        null,
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Erro ao buscar usuário:',
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


// ========================================================
// GET /users/professores
// Buscar professores
// ADMIN OU PROFESSOR
// ========================================================

router.get(
  '/professores',
  verifyToken,
  async function(req, res) {

    try {

      if (
        req.user.role !== 'admin' &&
        req.user.role !== 'professor'
      ) {

        return sendError(
          res,
          403,
          'Acesso negado'
        );
      }

      const result = await pool.query(
        `
        SELECT
          id,
          login
        FROM usuario
        WHERE role = 'professor'
        ORDER BY login
        `
      );

      return sendSuccess(
        res,
        200,
        null,
        result.rows
      );

    } catch (error) {

      console.error(
        'Erro ao buscar professores:',
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


// ========================================================
// GET /users/:id
// Buscar usuário por ID
// APENAS ADMIN
// ========================================================

router.get(
  '/:id',
  verifyToken,
  isAdmin,
  async function(req, res) {

    try {

      const { id } = req.params;

      const result = await pool.query(
        `
        SELECT
          id,
          login,
          email,
          horario,
          role
        FROM usuario
        WHERE id = $1
        `,
        [id]
      );

      if (result.rows.length === 0) {

        return sendError(
          res,
          404,
          'Usuário não encontrado'
        );
      }

      return sendSuccess(
        res,
        200,
        null,
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Erro ao buscar usuário:',
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


// ========================================================
// POST /users
// Criar usuário
// APENAS ADMIN
// ========================================================

router.post(
  '/',
  verifyToken,
  isAdmin,
  async function(req, res) {

    try {

      const {
        login,
        email,
        senha,
        horario,
        role = 'user'
      } = req.body;

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

      if (!senha) {
        errors.push({
          field: 'senha',
          message: 'Senha é obrigatória',
          code: 'REQUIRED'
        });
      }

      if (!horario) {
        errors.push({
          field: 'horario',
          message: 'Horário é obrigatório',
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


      // Verificar login
      const existingUser = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE login = $1
        `,
        [login]
      );

      if (existingUser.rows.length > 0) {

        return sendError(
          res,
          409,
          'Login já está em uso'
        );
      }


      // Verificar email
      const existingEmail = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE email = $1
        `,
        [email]
      );

      if (existingEmail.rows.length > 0) {

        return sendError(
          res,
          409,
          'Email já está em uso'
        );
      }


      // Criptografar senha
      const hashedPassword =
        await bcrypt.hash(senha, 12);


      const result = await pool.query(
        `
        INSERT INTO usuario
        (
          login,
          email,
          senha,
          horario,
          role
        )
        VALUES
        ($1, $2, $3, $4, $5)

        RETURNING
          id,
          login,
          email,
          horario,
          role
        `,
        [
          login,
          email,
          hashedPassword,
          horario,
          role
        ]
      );


      return sendSuccess(
        res,
        201,
        'Usuário criado com sucesso',
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Erro ao criar usuário:',
        error
      );

      if (error.code === '23514') {

        return sendError(
          res,
          400,
          'Dados inválidos. Verifique os campos.'
        );
      }

      return sendError(
        res,
        500,
        'Erro interno do servidor'
      );
    }
  }
);


// ========================================================
// POST /users/register
// Cadastro público
// ========================================================

router.post(
  '/register',
  async function(req, res) {

    try {

      const {
        login,
        email,
        senha,
        horario
      } = req.body;

      const errors = [];

      if (!login) {
        errors.push({
          field: 'login',
          message: 'Login é obrigatório'
        });
      }

      if (!email) {
        errors.push({
          field: 'email',
          message: 'Email é obrigatório'
        });
      }

      if (!senha) {
        errors.push({
          field: 'senha',
          message: 'Senha é obrigatória'
        });
      }

      if (!horario) {
        errors.push({
          field: 'horario',
          message: 'Horário é obrigatório'
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


      const loginExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE login = $1
        `,
        [login]
      );

      if (loginExists.rows.length > 0) {

        return sendError(
          res,
          409,
          'Login já existe'
        );
      }


      const emailExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE email = $1
        `,
        [email]
      );

      if (emailExists.rows.length > 0) {

        return sendError(
          res,
          409,
          'Email já existe'
        );
      }


      const senhaHash =
        await bcrypt.hash(senha, 12);


      const result = await pool.query(
        `
        INSERT INTO usuario
        (
          login,
          email,
          senha,
          horario,
          role
        )
        VALUES
        ($1, $2, $3, $4, 'user')

        RETURNING
          id,
          login,
          email,
          horario,
          role
        `,
        [
          login,
          email,
          senhaHash,
          horario
        ]
      );


      return sendSuccess(
        res,
        201,
        'Usuário cadastrado com sucesso',
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Erro no cadastro:',
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


// ========================================================
// POST /users/login
// Login
// ========================================================

router.post(
  '/login',
  async function(req, res) {

    try {

      const {
        login,
        password
      } = req.body;


      const result = await pool.query(
        `
        SELECT
          id,
          login,
          email,
          senha AS "passwordHash",
          horario,
          role
        FROM usuario
        WHERE login = $1
        `,
        [login]
      );


      if (result.rows.length === 0) {

        return sendError(
          res,
          401,
          'Credenciais inválidas'
        );
      }


      const user = result.rows[0];


      const isMatch =
        await bcrypt.compare(
          password,
          user.passwordHash
        );


      if (!isMatch) {

        return sendError(
          res,
          401,
          'Credenciais inválidas'
        );
      }


      const token = jwt.sign(
        {
          id: user.id,
          login: user.login,
          email: user.email,
          horario: user.horario,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1h'
        }
      );


      return sendSuccess(
        res,
        200,
        'Autenticado com sucesso!',
        {
          token
        }
      );

    } catch (error) {

      console.error(
        'Erro ao autenticar usuário:',
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


// ========================================================
// PUT /users/me
// Usuário atualiza os próprios dados
// ========================================================

router.put(
  '/me',
  verifyToken,
  async function(req, res) {

    try {

      const id = req.user.id;

      const {
        login,
        email,
        senha,
        horario
      } = req.body;


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


      if (!horario) {

        errors.push({
          field: 'horario',
          message: 'Horário é obrigatório',
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


      const userExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE id = $1
        `,
        [id]
      );


      if (userExists.rows.length === 0) {

        return sendError(
          res,
          404,
          'Usuário não encontrado'
        );
      }


      // Login duplicado
      const loginExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE login = $1
        AND id <> $2
        `,
        [
          login,
          id
        ]
      );


      if (loginExists.rows.length > 0) {

        return sendError(
          res,
          409,
          'Login já está em uso'
        );
      }


      // Email duplicado
      const emailExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE email = $1
        AND id <> $2
        `,
        [
          email,
          id
        ]
      );


      if (emailExists.rows.length > 0) {

        return sendError(
          res,
          409,
          'Email já está em uso'
        );
      }


      let result;


      // Se informou senha, altera senha
      if (
        senha &&
        senha.trim() !== ''
      ) {

        const senhaHash =
          await bcrypt.hash(
            senha,
            12
          );


        result = await pool.query(
          `
          UPDATE usuario

          SET
            login = $1,
            email = $2,
            senha = $3,
            horario = $4

          WHERE id = $5

          RETURNING
            id,
            login,
            email,
            horario,
            role
          `,
          [
            login,
            email,
            senhaHash,
            horario,
            id
          ]
        );

      } else {

        // Sem alterar senha
        result = await pool.query(
          `
          UPDATE usuario

          SET
            login = $1,
            email = $2,
            horario = $3

          WHERE id = $4

          RETURNING
            id,
            login,
            email,
            horario,
            role
          `,
          [
            login,
            email,
            horario,
            id
          ]
        );
      }


      return sendSuccess(
        res,
        200,
        'Usuário atualizado com sucesso',
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Erro ao atualizar próprio usuário:',
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


// ========================================================
// PUT /users/:id
// Admin atualiza usuário
// ========================================================

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  async function(req, res) {

    try {

      const { id } = req.params;

      const {
        login,
        email,
        senha,
        horario,
        role
      } = req.body;


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


      if (!horario) {

        errors.push({
          field: 'horario',
          message: 'Horário é obrigatório',
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

        return sendError(
          res,
          400,
          'Dados inválidos',
          errors
        );
      }


      // Verificar usuário
      const userExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE id = $1
        `,
        [id]
      );


      if (userExists.rows.length === 0) {

        return sendError(
          res,
          404,
          'Usuário não encontrado'
        );
      }


      // Login duplicado
      const loginExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE login = $1
        AND id <> $2
        `,
        [
          login,
          id
        ]
      );


      if (loginExists.rows.length > 0) {

        return sendError(
          res,
          409,
          'Login já está em uso'
        );
      }


      // Email duplicado
      const emailExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE email = $1
        AND id <> $2
        `,
        [
          email,
          id
        ]
      );


      if (emailExists.rows.length > 0) {

        return sendError(
          res,
          409,
          'Email já está em uso'
        );
      }


      let result;


      if (
        senha &&
        senha.trim() !== ''
      ) {

        const senhaHash =
          await bcrypt.hash(
            senha,
            12
          );


        result = await pool.query(
          `
          UPDATE usuario

          SET
            login = $1,
            email = $2,
            senha = $3,
            horario = $4,
            role = $5

          WHERE id = $6

          RETURNING
            id,
            login,
            email,
            horario,
            role
          `,
          [
            login,
            email,
            senhaHash,
            horario,
            role,
            id
          ]
        );

      } else {

        result = await pool.query(
          `
          UPDATE usuario

          SET
            login = $1,
            email = $2,
            horario = $3,
            role = $4

          WHERE id = $5

          RETURNING
            id,
            login,
            email,
            horario,
            role
          `,
          [
            login,
            email,
            horario,
            role,
            id
          ]
        );
      }


      return sendSuccess(
        res,
        200,
        'Usuário atualizado com sucesso',
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Erro ao atualizar usuário:',
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


// ========================================================
// DELETE /users/:id
// Remover usuário
// APENAS ADMIN
// ========================================================

router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  async function(req, res) {

    try {

      const { id } = req.params;


      const userExists = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE id = $1
        `,
        [id]
      );


      if (userExists.rows.length === 0) {

        return sendError(
          res,
          404,
          'Usuário não encontrado'
        );
      }


      await pool.query(
        `
        DELETE FROM usuario
        WHERE id = $1
        `,
        [id]
      );


      return sendSuccess(
        res,
        200,
        'Usuário deletado com sucesso'
      );

    } catch (error) {

      console.error(
        'Erro ao deletar usuário:',
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