// firebase.js
const admin = require('firebase-admin');
require('dotenv').config();

// Parse the service account key from environment variable or file
let serviceAccount;
try {
  // Option 1: From environment variable (recommended for production)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (envError) {
  try {
    // Option 2: From local JSON file (good for development)
    serviceAccount = require('./obus-test-firebase-adminsdk-fpefr-62d6bc2514.json');
  } catch (fileError) {
    console.error('Error loading Firebase service account:', {
      envError,
      fileError
    });
    throw new Error('Unable to load Firebase service account credentials');
  }
}

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Optionally add project ID if needed
    // projectId: process.env.FIREBASE_PROJECT_ID
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

module.exports = admin;