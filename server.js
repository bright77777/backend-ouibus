require('dotenv').config();
const express = require('express');
//const mysql = require('mysql2');
const bodyParser = require('body-parser');
//const jwt = require('jsonwebtoken');
//const admin = require('./firebase'); 
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 5001;
//const {verifyToken,generateTicketData,companies} = require('./controllers/authController');
//const { body, validationResult } = require('express-validator');
//const GeneratorRoute=require('./routes/GeneratorRoute');
//const { v4: uuidv4 } = require('uuid');
//const  db_pool= require('./db/Poolconnect');
//const Passengers=require('./routes/Passengers')
//const MobilePayement=require('./routes/MobilePayement')
//Const {executeQuery}=require('./db/executeQuery')
//const fetchinfo=require('./routes/Fetchinfo')
//Const generateSeat=require('./routes/Availableseat')
//const authRoute=require('./routes/authRoutes')
//Const formulaire=require('./routes/form-fotetsa-com')
const CRUD=require('./todo-list/CRUD')

// Middleware parsing JSON
app.use(bodyParser.json({
  verify: (req, res, buf) => {
      if (buf.length > 1024 * 1024) { // Limite à 1MB
          throw new Error('Payload too large'); 
      }
  }
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use( helmet({ crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } }) );



// const places = [
//   { lieu: 'mvan', position: [3.848, 11.5021] },
//   { lieu: 'bastos', position: [3.8676, 11.5145] },
//   { lieu: 'mboppi', position: [4.0483, 9.7044] },
//   { lieu: 'bonaberi', position: [4.0735, 9.7083] },
// ];

app.get('/', (req,res)=>{
  res.status(202).send('hellow worldddd')
})
app.use('/api/v1/todo-list', CRUD);
//app.use('/', GeneratorRoute);
//app.use('/', Passengers);
//app.use('/', MobilePayement);
//app.use('/', fetchinfo);
//app.use('/', generateSeat);
//app.use('/', authRoute);
//app.use('/', formulaire);



// app.post('/',verifyToken, (req, res) => {
//   // Vérifier que le corps de la requête contient les données nécessaires
//   if (!req.body || !req.body.depart || !req.body.destination) {
//     res.status(400).send('Requête invalide : données manquantes');
//     return;
//   }

//   // Extraire les noms des villes de départ et de destination
//   const cities = [
//     req.body.depart.name.split(',')[0],
//     req.body.destination.name.split(',')[0]
//   ];

//   // Générer les données de billet
//   const ticketData = generateTicketData(companies, cities, places);

//   // Envoyer une réponse avec les données de billet générées
//   res.json({
//     success: true,
//     count: ticketData.length,
//     ticketData: ticketData
//   });
// });


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});