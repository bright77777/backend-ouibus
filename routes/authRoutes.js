const express = require('express');
const router = express.Router();
const cors = require('cors');
const admin = require('../firebase'); 
const {verifyToken,generateTicketData} = require('../controllers/authController');
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
// Exemple d'utilisation
const companies = ['GENERAL EXPRESS','Finess voyage'];
const cities = ['Yaounde', 'Douala'];
const places = [
  { lieu: 'mvan', position: [3.848, 11.5021] },
  { lieu: 'bastos', position: [3.8676, 11.5145] },
  { lieu: 'mboppi', position: [4.0483, 9.7044] },
  { lieu: 'bonaberi', position: [4.0735, 9.7083] },
];
// Routes d'authentification
router.post('/',(req,res)=>{
  const ticketData = generateTicketData(companies, cities, places);
  res.json({
    success: true,
    count: ticketData.length,
    ticketData: ticketData
  })
;})
// Firebase Authentication Route
router.post('/auth/firebase', async (req, res) => {
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

router.get('/protected', verifyToken, (req, res) => { res.json({ message: 'Ceci est une route protégée', user: req.user }); });

module.exports = router;