const express = require('express');
const router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../controllers/authController');
const pool = require('../db/Poolconnect');
const { executeQuery } = require('../db/executeQuery');
const { generateArray } = require('../utils/generateSeat');
const bodyParser = require('body-parser');

router.use(cors());
router.use(bodyParser.json({
    verify: (req, res, buf) => {
        if (buf.length > 1024 * 1024) { // Limite à 1MB
            throw new Error('Payload too large'); 
        }
    }
}));

router.post('/availableseats', async (req, res) => {
    try {
        const { length, totalseats } = req.body.datas;
        console.log(req.body)
        if (!length || !totalseats) {
            return res.status(400).json({ error: 'length and totalseats are required' });
        }

        const generated = generateArray(length, totalseats);
        res.status(200).json(generated);
    } catch (error) {
        console.error('Error generating seats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
