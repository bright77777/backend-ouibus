const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());
const pool = require('../db/Poolconnect');
const fetch = require('node-fetch'); // Ajout nécessaire

const multer = require('multer');
const path = require('path');
const { executeQuery } = require('../db/executeQuery');
const nodemailer = require('nodemailer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use(express.json());

router.post('/form', upload.array('piece_jointe'), async (req, res) => {
  const { firstname, lastname, email, phone, votre_budget, comment_avez_vous_connu_fotetsa__, message } = req.body;
  const files = req.files;

  if (!firstname || !lastname || !email || !phone || !votre_budget || !comment_avez_vous_connu_fotetsa__ || !message) {
    return res.status(400).json({ success: false, message: 'Tous les champs du formulaire sont obligatoires.' });
  }

  try {
    // Insertion en base de données
    const contactResult = await pool.query(
      'INSERT INTO contacts (firstname, lastname, email, phone, budget, source, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstname, lastname, email, phone, votre_budget, comment_avez_vous_connu_fotetsa__, message]
    );

    const contactId = contactResult.insertId || contactResult[0].insertId;
    
    // Gestion des fichiers
    if (files && files.length > 0) {
      for (const file of files) {
        await executeQuery(
          'INSERT INTO attachments (contact_id, file_name, file_path) VALUES (?, ?, ?)',
          [contactId, file.originalname, file.path]
        );
      }
    }

    // Envoi de l'email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'no-reply@fotetsa.com',
        pass: process.env.SMTP_PASS 
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Confirmation de soumission de formulaire',
      text: `Bonjour ${firstname} ${lastname},\n\nMerci pour votre demande.`
    });

    // Envoi vers Airtable
    const airtableData = {
      fields: {
        "Prénom": firstname,
        "Nom": lastname,
        "Email": email,
        "Téléphone": phone,
        "Budget": votre_budget,
        "Source": comment_avez_vous_connu_fotetsa__,
        "Message": message,
        "Fichiers": files?.map(f => f.originalname).join(', ') || 'Aucun'
      }
    };

    await fetch('https://hooks.airtable.com/workflows/v1/genericWebhook/appFRpfzZcdgqCtFK/wflVdwIXkftYLxRR5/wtrz1unMxT0hjK8VG', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(airtableData)
    });

    res.status(201).json({ 
      success: true, 
      message: 'Données sauvegardées et transférées',
      contactId 
    });

  } catch (error) {
    console.error('Erreur complète:', error);
    
    let errorMessage = 'Erreur serveur';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Email déjà existant';
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;