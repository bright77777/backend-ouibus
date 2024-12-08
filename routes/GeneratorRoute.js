const express = require('express');
const generateTicketPDF=require('../utils/GenenratePass')
const fs = require('fs');
const path = require('path');

const router = express.Router();
const options = {
    qrCodePath: './assets/qr-code.png',
    pdfPath: './assets/mockup.pdf',
    outputFilePath: './assets/output.pdf',
    logoPath: './assets/General.png'
};

const details = {
    companies: 'assets/General.png',
    Agency: 'General Express Mboppi,',
    AgencyAdress: ['+237 676-490-223', '1293', 'Dla'],
    departureRegion: 'Littoral',
    arrivalRegion: 'Center',
    departure: 'DLA',
    arrival: 'YDE',
    date: '12, dec 2024',
    departureTime: '06:00 AM',
    arrivalTime: '07:30 AM',
    passengerName: ['Mr', 'Bright NGUELIFACK'],
    id: ['P', 'A088892'],
    phoneNumber: '+237 655-447-137',
    ticketNumber: '5729 - 776 - 90 - 3 - B',
    seatNo: [45, 9],
    data:{url: 'https://obus-test.web.app'} // Optionnel, pour le QR code
};

const params = { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'promo2024' };
details.data = `${details.data.url}?${new URLSearchParams(params).toString()}`;
router.post('/generate-ticket', async (req, res) => {
    try {
        // Récupérer les détails du ticket depuis le corps de la requête
        // Générer le PDF
        await generateTicketPDF(details, options);

        // Envoyer le fichier PDF comme réponse
        res.download(options.outputFilePath, 'ticket.pdf', async (err) => {
            if (err) {
                console.error('Erreur lors de l\'envoi du fichier:', err);
                res.status(500).json({ error: 'Erreur lors de la génération du ticket' });
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