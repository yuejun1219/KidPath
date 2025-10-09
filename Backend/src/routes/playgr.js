const express = require('express');
const router = express.Router();
const { searchPlaygrounds } = require('../services/playgrService');

router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Missing keyword' });

    const results = await searchPlaygrounds(keyword);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
