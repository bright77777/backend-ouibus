require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const admin = require('../firebase'); 
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const {executeQuery}=require('../db/executeQuery')


// Middleware parsing JSON
router.use(bodyParser.json({
  verify: (req, res, buf) => {
      if (buf.length > 1024 * 1024) { // Limite à 1MB
          throw new Error('Payload too large'); 
      }
  }
}));

router.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

router.use( helmet({ crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } }) );



router.post('/auth/firebase', async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Generate custom JWT
    const customToken = jwt.sign(
      { 
        uid: decodedToken.uid, 
        email: decodedToken.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user data with null coalescing
    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phone: decodedToken.phone_number || null,
      display_name: decodedToken.name || "user",
      profile_picture: decodedToken.picture || null,
    };

    // Upsert user in database
    const userQuery = `
      INSERT INTO users 
      (user_id, email, phone_number, full_name, profile_picture, role) 
      VALUES (?, ?, ?, ?, ?, 'client') 
      ON DUPLICATE KEY UPDATE 
      email = VALUES(email), 
      phone_number = VALUES(phone_number), 
      full_name = VALUES(full_name), 
      profile_picture = VALUES(profile_picture)
    `;
    const userParams = [
      user.uid, 
      user.email, 
      user.phone, 
      user.display_name, 
      user.profile_picture
    ];

    // Store session
    const sessionQuery = `
      INSERT INTO sessions 
      (session_id, user_id, token, user_agent, ip_adress, expired_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const sessionParams = [
      uuidv4(), 
      user.uid, 
      customToken, 
      req.get('User-Agent') || '', 
      req.ip || '',
      new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours from now
    ];

    try {
      // Execute both queries
      await executeQuery(userQuery, userParams);
      await executeQuery(sessionQuery, sessionParams);

      res.json({ 
        token: customToken,
        user: {
          email: user.email,
          phone: user.phone,
          displayName: user.display_name
        }
      });
      console.log("login successful")
    } catch (error) {
      console.error('Detailed Database Error:', {
        errorMessage: error.message,
      });
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
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

module.exports = router;
