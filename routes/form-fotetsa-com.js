const express = require('express');
const router = express.Router();
const cors = require('cors');
router.use(cors());
const pool = require('../db/Poolconnect');

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
    // Insertion des données du formulaire dans la table contacts
    const contactResult = await pool.query(
      'INSERT INTO contacts (firstname, lastname, email, phone, budget, source, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstname, lastname, email, phone, votre_budget, comment_avez_vous_connu_fotetsa__, message]
    );

    // Log pour vérifier la requête et les résultats
    console.log('Résultat de l\'insertion dans contacts :', contactResult);

    // Utiliser insertId pour obtenir l'ID du contact inséré
    const contactId = contactResult.insertId || contactResult[0].insertId;
    if (!contactId) {
      throw new Error('ID de contact non récupéré');
    }

    // Insertion des fichiers joints dans la table attachments
    if (files && files.length > 0) {
      for (const file of files) {
        await executeQuery(
          'INSERT INTO attachments (contact_id, file_name, file_path) VALUES (?, ?, ?)',
          [contactId, file.originalname, file.path]
        );
      }
    }

    // Configuration de nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || 465, // ou 587 pour TLS
      secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour les autres ports
      auth: {
        user: process.env.SMTP_USER || 'no-reply@fotetsa.com',
        pass: process.env.SMTP_PASS 
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Options de l'email
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@fotetsa.com',
      to: email,
      subject: 'Confirmation de soumission de formulaire',
      text: `Bonjour ${firstname} ${lastname},\n\nMerci d'avoir soumis votre formulaire. Nous avons bien reçu vos informations et nous vous contacterons sous peu.\n\nCordialement,\nL'équipe Fotetsa`
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    console.log('Email de confirmation envoyé à :', email);

    res.status(201).json({ success: true, message: 'Formulaire soumis avec succès et email de confirmation envoyé.', contactId });
  } catch (error) {
    console.error('Erreur lors de l\'insertion des données :', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: 'Un enregistrement avec cet email existe déjà.' });
    } else {
      res.status(500).json({ success: false, message: 'Une erreur est survenue. Veuillez réessayer.' });
    }
  }
});

module.exports = router;