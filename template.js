require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const admin = require('./firebase'); 
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 5001;
const {verifyToken,generateTicketData,companies} = require('./controllers/authController');
const { body, validationResult } = require('express-validator');
const GeneratorRoute=require('./routes/GeneratorRoute')
const  db= require('./db/Poolconnect')
const { v4: uuidv4 } = require('uuid');


// Middleware pour la sécurité HTTP headers
app.use(helmet({ 
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } 
}));

// Middleware pour traiter JSON avec body-parser
app.use(bodyParser.json({
  verify: (req, res, buf) => {
      // Limite la taille du payload
      if (buf.length > 1024 * 1024) { // Limite à 1MB
          throw new Error('Payload too large'); // ou ValidationError selon ta gestion d'erreurs
      }
  }
}));

app.use(cors());
// MySQL Database Connection

app.use('/', GeneratorRoute);


const places = [
  { lieu: 'mvan', position: [3.848, 11.5021] },
  { lieu: 'bastos', position: [3.8676, 11.5145] },
  { lieu: 'mboppi', position: [4.0483, 9.7044] },
  { lieu: 'bonaberi', position: [4.0735, 9.7083] },
];

const executeQuery = async (query, params) => {
  try {
      const [results] = await pool.execute(query, params);
      return results;
  } catch (error) {
     throw new Error(`Database query failed: ${error.message}`);  }
};

// Routes d'authentification
app.post('/',verifyToken, (req, res) => {
  // Vérifier que le corps de la requête contient les données nécessaires
  if (!req.body || !req.body.depart || !req.body.destination) {
    res.status(400).send('Requête invalide : données manquantes');
    return;
  }

  // Extraire les noms des villes de départ et de destination
  const cities = [
    req.body.depart.name.split(',')[0],
    req.body.destination.name.split(',')[0]
  ];

  // Générer les données de billet
  const ticketData = generateTicketData(companies, cities, places);

  // Envoyer une réponse avec les données de billet générées
  res.json({
    success: true,
    count: ticketData.length,
    ticketData: ticketData
  });
});


// Firebase Authentication Route
app.post('/auth/firebase', async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log(decodedToken)

    // Generate custom JWT
    const customToken = jwt.sign(
      { 
        uid: decodedToken.uid, 
        email: decodedToken.email,
        phone:decodedToken.phone_number 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user data
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phone: decodedToken.phone_number || null,
      display_name: decodedToken.name || "user",
      profile_picture: decodedToken.picture || null,
    };

    // Upsert user in database
    const userquery = `
      INSERT INTO users 
      (user_id, email, phone_number, full_name, profile_picture,role) 
      VALUES (?, ?, ?, ?, ?,'client') 
      ON DUPLICATE KEY UPDATE 
      email = ?, 
      phone = ?, 
      display_name = ?, 
      profile_picture = ?
    `;
    const users = [
      user.uid, user.email, user.phone, user.display_name, user.profile_picture, 
      user.email, user.phone, user.display_name, user.profile_picture
    ];
    const sessions=[uuidv4(),user.uid, customToken,req.ip,req.get('User-Agent')]
    // Store session with prepared statement
    const sessionQuery = `
        INSERT INTO sessions 
        (session_id, user_id, token, ip_adress, user_agent) 
        VALUES (?, ?, ?, ?, ?)
    `;
    try {
      await executeQuery(userquery, users);
      await executeQuery(sessionQuery, sessions);
      console.log('User added or updated in the database:', result);
      res.json({ 
        token: customToken,
        user: {
          email: user.email,
          phone:user.phone,
          displayName: user.display_name
        }
      });
      
    } catch (error) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
  } catch (error) {
    console.error('Firebase authentication error:', error);
    
    // Improved error handling
    if (error.code === 'auth/invalid-credential') {
      return res.status(400).json({ error: 'Invalid Firebase credentials' });
    } else if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Firebase ID token has expired' });
    } else {
      return res.status(401).json({ error: 'Authentication failed', details: error.message });
    }
  }
});




// Validation middleware pour les détails du passager

// Route pour enregistrer les détails du passager
app.post('/passenger/details', verifyToken, 
  async (req, res) => {
    try {
      // Extraire les données du corps de la requête
      const { 
        title, 
        fullName, 
        ID, 
        dateOfBirth 
      } = req.body.data;

      // Récupérer l'ID utilisateur à partir du token décodé
      const uid = req.user.uid;


      // Requête pour insérer ou mettre à jour les détails du passager
      const query = `
        INSERT INTO users
        (uid, title, full_name, id_passport, date_of_birth, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        title = ?, 
        full_name = ?, 
        id_passport = ?, 
        date_of_birth = ?, 
        updated_at = NOW()
      `;

      const values = [
        uid, 
        title, 
        fullName, 
        ID, 
        dateOfBirth,
        // Valeurs pour la mise à jour
        title, 
        fullName, 
        ID, 
        dateOfBirth
      ];

      // Exécuter la requête
      db.query(query, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          
          // Gestion des erreurs spécifiques de base de données
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
              error: 'Passenger details already exist',
              message: 'A passenger with this ID already exists'
            });
          }

          return res.status(500).json({ 
            error: 'Database error',
            message: 'Failed to save passenger details'
          });
        }

        // Vérifier si l'insertion/mise à jour a réussi
        if (result.affectedRows > 0) {
          return res.status(201).json({ 
            success: true,
            message: 'Passenger details saved successfully',
            passengerId: result.insertId || result.changedRows
          });
        } else {
          return res.status(500).json({ 
            error: 'Operation failed',
            message: 'No rows were affected'
          });
        }
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ 
        error: 'Server error',
        message: 'An unexpected error occurred'
      });
    }
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});