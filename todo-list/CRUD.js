const express = require('express');
const router = express.Router();
const cors = require('cors');
const { executeQuery } = require('../db/executeQuery');

router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// CREATE
router.post('/create', async (req, res) => {
  const { title, description, status } = req.body;
  const query = `
    INSERT INTO todo_list (title, description, status)
    VALUES (?, ?, ?);
  `;
  const params = [title, description, status,];
  try {
    const result = await executeQuery(query, params);
    res.status(201).json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// READ
router.get('/all', async (req, res) => {
  const query = 'SELECT * FROM todo_list ORDER BY id DESC';
  try {
    const result = await executeQuery(query, []);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// UPDATE
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status, creeLe } = req.body;
  const query = `
    UPDATE todo_list
    SET title = ?, description = ?, status = ?
    WHERE id = ?;
  `;
  const params = [title, description, status, id];
  try {
    const result = await executeQuery(query, params);
    res.status(200).json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// DELETE
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM todo_list WHERE id = ?';
  try {
    await executeQuery(query, [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

module.exports = router;