const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db/Poolconnect');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { verifyToken } = require('../controllers/authController');
const bodyParser = require('body-parser');
const helmet = require('helmet');


router.use(bodyParser.json({
  verify: (req, res, buf) => {
      // Limite la taille du payload
      if (buf.length > 1024 * 1024) { // Limite à 1MB
          throw new Error('Payload too large'); // ou ValidationError selon ta gestion d'erreurs
      }
  }
}));
router.use( helmet({ crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } }) );
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
// Configuration des API
const mtnConfig = {
  apiUser: process.env.MTN_API_USER,
  apiKey: process.env.MTN_API_KEY,
  baseUrl: 'https://sandbox.momodeveloper.mtn.com'
};

const orangeConfig = {
  apiUser: process.env.ORANGE_API_USER,
  apiKey: process.env.ORANGE_API_KEY,
  baseUrl: 'https://sandbox.orange.com'
};

// Fonction pour initier une demande de paiement (MTN MoMo)
const initiateMtnPayment = async (number, amount, currency, transactionId) => {
  const url = `${mtnConfig.baseUrl}/collection/v1_0/requesttopay`;
  const headers = {
    'Ocp-Apim-Subscription-Key': mtnConfig.apiKey,
    'X-Reference-Id': transactionId,
    'X-Target-Environment': 'sandbox',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mtnConfig.apiUser}`
  };

  const body = {
    amount: amount.toString(),
    currency: currency,
    externalId: transactionId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: number
    },
    payerMessage: 'Payment Request',
    payeeNote: 'Purchase'
  };

  try {
    await axios.post(url, body, { headers });
  } catch (error) {
    throw new Error('Failed to initiate MTN payment');
  }
};

// Fonction pour vérifier le statut du paiement (MTN MoMo)
const checkMtnPaymentStatus = async (transactionId) => {
  const url = `${mtnConfig.baseUrl}/collection/v1_0/requesttopay/${transactionId}`;
  const headers = {
    'Ocp-Apim-Subscription-Key': mtnConfig.apiKey,
    'X-Target-Environment': 'sandbox',
    'Authorization': `Bearer ${mtnConfig.apiUser}`
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error('Failed to check MTN payment status');
  }
};

// Fonction pour initier une demande de paiement (Orange Money)
const initiateOrangePayment = async (number, amount, currency, transactionId) => {
  const url = `${orangeConfig.baseUrl}/payment/v1_0/requesttopay`;
  const headers = {
    'Ocp-Apim-Subscription-Key': orangeConfig.apiKey,
    'X-Reference-Id': transactionId,
    'X-Target-Environment': 'sandbox',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${orangeConfig.apiUser}`
  };

  const body = {
    amount: amount.toString(),
    currency: currency,
    externalId: transactionId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: number
    },
    payerMessage: 'Payment Request',
    payeeNote: 'Purchase'
  };

  try {
    await axios.post(url, body, { headers });
  } catch (error) {
    throw new Error('Failed to initiate Orange payment');
  }
};

// Fonction pour vérifier le statut du paiement (Orange Money)
const checkOrangePaymentStatus = async (transactionId) => {
  const url = `${orangeConfig.baseUrl}/payment/v1_0/requesttopay/${transactionId}`;
  const headers = {
    'Ocp-Apim-Subscription-Key': orangeConfig.apiKey,
    'X-Target-Environment': 'sandbox',
    'Authorization': `Bearer ${orangeConfig.apiUser}`
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error('Failed to check Orange payment status');
  }
};

router.post('/pay', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { number, name, bookId, amount, currency, method } = req.body;

    // Générer un identifiant unique pour la transaction
    const transactionId = uuidv4();

    // Démarrer la transaction
    await connection.beginTransaction();

    // Initier la demande de paiement en fonction du moyen de paiement
    if (method === 'MTN') {
      await initiateMtnPayment(number, amount, currency, transactionId);
    } else if (method === 'Orange') {
      await initiateOrangePayment(number, amount, currency, transactionId);
    } else {
      throw new Error('Invalid payment method');
    }

    // Insérer les détails de la transaction dans la base de données
    const insertQuery = `
      INSERT INTO transactions (transaction_id, book_id, amount, method, payment_status, ref_number, momo_status, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'PENDING', ?, 'PENDING', ?, NOW(), NOW())
    `;
    await connection.execute(insertQuery, [transactionId, bookId, amount, method, number, currency]);

    // Attendre et vérifier le statut plusieurs fois
    const maxAttempts = 4; // Nombre maximum de tentatives
    const delayBetweenAttempts = 10000; // Délai entre les tentatives (10 secondes)
    let paymentStatus = 'PENDING';
    let paymentMessage = 'Payment is pending';
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Attendre un délai
      await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));

      // Vérifier le statut du paiement en fonction du moyen de paiement
      let statusResponse;
      if (method === 'MTN') {
        statusResponse = await checkMtnPaymentStatus(transactionId);
      } else if (method === 'Orange') {
        statusResponse = await checkOrangePaymentStatus(transactionId);
      }
      paymentStatus = statusResponse.status;
      paymentMessage = statusResponse.reason || 'Payment processed';

      // Si le paiement est réussi ou a échoué, sortir de la boucle
      if (paymentStatus === 'SUCCESSFUL' || paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
        break;
      }
    }

    // Mettre à jour le statut de la transaction dans la base de données
    const updateQuery = `
      UPDATE transactions
      SET payment_status = ?, momo_status = ?, terminate_at = NOW(), payment_message = ?
      WHERE transaction_id = ?
    `;
    await connection.execute(updateQuery, [paymentStatus, paymentStatus, paymentMessage, transactionId]);

    // Valider la transaction
    await connection.commit();

    // Retourner le résultat au frontend
    return res.status(200).json({ success: true, message: paymentMessage, status: paymentStatus });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Payment processing failed', message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
