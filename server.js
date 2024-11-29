require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const admin = require('./firebase'); 
const cors = require('cors');
const helmet = require('helmet');
const { compare } = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware for parsing JSON
app.use(bodyParser.json());
app.use(cors());
app.use( helmet({ crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } }) );
// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to the database.');
});
app.get('/',(req,res)=>{
  res.send('Hello World!')
})
// Firebase Authentication Route
app.post('/auth/firebase', async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded token:', decodedToken);

    // Generate custom JWT
    const customToken = jwt.sign(
      { 
        uid: decodedToken.uid, 
        email: decodedToken.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
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
    const query = `
      INSERT INTO users 
      (uid, email, phone, display_name, profile_picture) 
      VALUES (?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      email = ?, 
      phone = ?, 
      display_name = ?, 
      profile_picture = ?
    `;
    const values = [
      user.uid, user.email, user.phone, user.display_name, user.profile_picture, 
      user.email, user.phone, user.display_name, user.profile_picture
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('User added or updated in the database:', result);
      res.json({ 
        token: customToken,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.display_name
        }
      });
    });

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});