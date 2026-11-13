const jwt = require('jsonwebtoken');

// Middleware para verificar se o usuário está autenticado
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token não fornecido',
      errors: []
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Impede que o token provisório acesse as rotas normais.
    if (decoded.tipo === 'cadastro') {
      return res.status(403).json({
        success: false,
        message: 'Finalize sua matrícula antes de acessar esta funcionalidade',
        errors: []
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      errors: []
    });
  }
};

// Middleware exclusivo para finalizar a matrícula.
const verifyRegistrationToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de cadastro não fornecido',
      errors: []
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo !== 'cadastro' || decoded.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido para concluir matrícula',
        errors: []
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token de cadastro inválido ou expirado',
      errors: []
    });
  }
};

// Middleware para verificar se o usuário é admin ou professor.
function isAdminOrProfessor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      errors: []
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'professor') {
    return res.status(403).json({
      success: false,
      message: 'Acesso permitido apenas para administradores e professores',
      errors: []
    });
  }

  next();
}

// Middleware para verificar se o usuário é admin.
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado: requer privilégios de administrador',
      errors: []
    });
  }
};

module.exports = {
  verifyToken,
  verifyRegistrationToken,
  isAdmin,
  isAdminOrProfessor
};