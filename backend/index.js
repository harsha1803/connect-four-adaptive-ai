const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.post('/api/game/move', async (req, res) => {
  try {
    const { board, player } = req.body;
    const aiResponse = await axios.post('http://localhost:5001/ai/move', {
      board,
      player
    });
    res.json(aiResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'AI engine not available' });
  }
});

app.post('/api/game/reset', (req, res) => {
  res.json({ message: 'Game reset', board: Array(6).fill(Array(7).fill(0)) });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});