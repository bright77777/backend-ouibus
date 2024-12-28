const express = require('express');
const router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../controllers/authController');
const pool = require('../db/Poolconnect');
const { bookToken } = require('../controllers/booktoken');
const { executeQuery } = require('../db/executeQuery');

router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

router.post('/fetchinfo', verifyToken, bookToken, async (req, res) => {
  const booktoken = req.booktoken;
  const query = `SELECT 
                 COUNT(p.passenger_id) AS passenger_count,
                 b.seats,
                 p.full_name, 
                 p.id_document, 
                 p.phone, 
                 p.type, 
                 p.title 
               FROM passengers p
               JOIN booking b ON p.passenger_id = b.passenger_id
               WHERE p.passenger_token = ?
               GROUP BY b.seats, p.full_name, p.id_document, p.birth, p.phone, p.type, p.title`;
const params = [booktoken];
  try {
    const result = await executeQuery(query, params);
    res.status(200).json(result);
  } catch (error) {
    console.error('Detailed Database Error:', {
      errorMessage: error.message,
    });
    return res.status(500).json({
      error: 'Database error',
      details: error.message,
    });
  }
});

module.exports = router;
