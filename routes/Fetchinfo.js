const express = require('express');
const router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../controllers/authController');
const pool = require('../db/Poolconnect');
const { bookToken } = require('../controllers/booktoken');
const { executeQuery } = require('../db/executeQuery');

router.use(cors());

router.post('/fetchinfo', verifyToken, bookToken, async (req, res) => {
  const booktoken = req.booktoken;
  const query = `SELECT 
                   count(passenger_id) AS passenger_count, 
                   full_name, 
                   id_document, 
                   birth, 
                   phone, 
                   type, 
                   title 
                 FROM passengers 
                 WHERE passenger_token = ? 
                 GROUP BY full_name, id_document, birth, phone, type, title`;
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
