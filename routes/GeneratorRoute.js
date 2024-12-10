const express = require('express');
const generateTicketPDF=require('../utils/GenenratePass')
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


const options = {
    qrCodePath: './assets/qr-code.png',
    pdfPath: './assets/mockup.pdf',
    outputFilePath: './assets/output.pdf',
    logoPath: './assets/General.png'
};

router.post('/generate-ticket', async (req, res) => {
    try {
        // Récupérer les détails du ticket depuis le corps de la requête
        const details = req.body;

        // Générer le PDF
        await generateTicketPDF(details, options);

        // Attendre que le fichier soit complètement généré
        const filePath = path.resolve(options.outputFilePath);
        
        // Vérifier si le fichier existe et l'envoyer
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Erreur lors de l\'accès au fichier:', err);
                res.status(500).json({ error: 'Fichier non trouvé après génération' });
            } else {
                // Envoyer le fichier PDF comme réponse
                res.sendFile(filePath, (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'envoi du fichier:', err);
                        res.status(500).json({ error: 'Erreur lors de l\'envoi du fichier' });
                    }
                });
            }
        });

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        res.status(500).json({ 
            error: 'Impossible de générer le ticket PDF',
            details: error.message 
        });
    }
});

module.exports = router;
