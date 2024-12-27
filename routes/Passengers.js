const express = require('express');
const router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../controllers/authController');
router.use(cors());
const pool = require('../db/Poolconnect');
const crypto = require('crypto');
const bookToken=require('../controllers/booktoken')
const jwt = require('jsonwebtoken');

// Fonction pour générer un identifiant unique court
const generateUniqueId = () => {
  return crypto.randomBytes(4).toString('hex'); // Génère un ID de 8 caractères
};

router.post('/passenger/details', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const passengers = req.body.client; // Extraction du tableau de passagers

    // Récupérer l'ID utilisateur à partir du token décodé
    const uid = req.user.uid;
    const customToken = jwt.sign(
      { 
        uid: uid, 
        passengers: passengers 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // Requête pour insérer ou mettre à jour les détails du passager
    const query = `
      INSERT INTO passengers (passenger_id, user_id, full_name, id_document, birth, phone, type, title,passenger_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
      ON DUPLICATE KEY UPDATE
      full_name = VALUES(full_name), id_document = VALUES(id_document), birth = VALUES(birth), phone = VALUES(phone),
      type = VALUES(type), title = VALUES(title), updated_at = CURRENT_TIMESTAMP;
    `;
    const bookquery=`INSERT INTO booking (book_id, passenger_id, seats) VALUES (?,?,?)`
    
    await connection.beginTransaction();

    // Exécution de la requête pour chaque passager
    for (const passenger of passengers) {
      const passengerId = generateUniqueId();
      const bookid=generateUniqueId(); 
      const { fullName, ID, dateOfBirth, title, phone, type,seats } = passenger;
      const values = [passengerId, uid, fullName, ID, dateOfBirth, phone, type, title,customToken];
      const bookvalues=[bookid,passengerId,seats]

      try {
        await connection.execute(query, values);
        try {
            await connection.execute(bookquery, bookvalues);
        } catch (err) {
          console.error('Database error:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            await connection.rollback();
            return res.status(409).json({ error: 'book already exist', message: 'A book with this ID already exists' });
          }
          await connection.rollback();
          return res.status(500).json({ error: 'Database error', message: 'Failed to save book details' });
        }
      } catch (err) {
        console.error('Database error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          await connection.rollback();
          return res.status(409).json({ error: 'Passenger details already exist', message: 'A passenger with this ID already exists' });
        }
        await connection.rollback();
        return res.status(500).json({ error: 'Database error', message: 'Failed to save passenger details' });
      }
    }

    await connection.commit();
    return res.status(201).json({ token: customToken,success: true, message: 'All passenger details saved successfully' });

  } catch  (error) {
    await connection.rollback();
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Server error', message: 'An unexpected error occurred' });
  } finally {
    connection.release();
  }
});

module.exports = router;
