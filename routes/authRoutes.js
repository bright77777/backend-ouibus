const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes d'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.verifyToken, (req, res) => {
  res.json({ message: 'Profile accessed', userId: req.userId });
});

module.exports = router;