const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.post('/', (req, res) => {
  res.send('Bonjour bright , votre back est pret!');
});

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
