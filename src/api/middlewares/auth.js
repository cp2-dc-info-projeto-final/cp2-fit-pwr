const jwt = require('jsonwebtoken');

// Middleware para verificar se o usuário está autenticado
const verifyToken = (req, res, next) => {
  /* 
    Header do tipo
    Authorization: Bearer <token>
    ...
  */
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
// Middleware para verificar se o usuário é admin ou professor

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

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // http status 403 - Forbidden
    return res.status(403).json({
      success: false,
      message: 'Acesso negado: requer privilégios de administrador',
      errors: []
    });
  }
};

module.exports = { verifyToken, isAdmin, isAdminOrProfessor};