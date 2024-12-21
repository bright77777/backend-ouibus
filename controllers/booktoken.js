const jwt = require('jsonwebtoken');

function bookToken(req, res, next) {
    try {
      // Extraire le token de l'en-tête Authorization
      const authHeader = req.headers['x-booking-authorization'];
      
      // Vérifier si l'en-tête Authorization existe et commence par "Bearer "
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          message: 'Invalid booking token format',
          error: 'Token must be provided in the format: Bearer <token>'
        });
      }
  
      // Extraire le token en supprimant le préfixe "Bearer "
      const token = authHeader.split(' ')[1];

      // Vérifier si le token est vide
      if (!token) {
        return res.status(403).json({ 
          message: 'No token provided',
          error: 'booking token is missing'
        });
      }
  
      // Vérifier le token avec des options supplémentaires
      jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // Spécifier l'algorithme
        maxAge: '20m' // Durée de validité du token
      }, (err, decoded) => {
        if (err) {
          // Gérer différents types d'erreurs de token
          let errorMessage = 'Unauthorized';
          let statusCode = 401;
          switch (err.name) {
            case 'TokenExpiredError':
              errorMessage = 'Token has expired';
              statusCode = 401;
              break;
            case 'JsonWebTokenError':
              errorMessage = 'Invalid token';
              statusCode = 403;
              break;
            case 'NotBeforeError':
              errorMessage = 'Token not yet active';
              statusCode = 403;
              break;
            default:
              errorMessage = 'Authentication failed';
          }
  
          return res.status(statusCode).json({ 
            message: errorMessage,
            error: err.message
          });
        }
        req.booktoken = token;
        // Vérification supplémentaire (optionnel)
        if (decoded.disabled === true) {
          return res.status(403).json({ 
            message: 'Account disabled',
            error: 'Your account has been disabled'
          });
        }
  
        next();
      });
    } catch (error) {
      // Gestion des erreurs inattendues
      console.error('Token verification error:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: 'An unexpected error occurred during authentication'
      });
    }
  }
  module.exports={bookToken};