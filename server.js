const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'choices.json');
const ADMIN_PASSWORD = 'admin123';

app.use(express.json());
app.use(express.static('public'));

function loadChoices() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) { return {}; }
}

function saveChoices(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/choices', (req, res) => {
  const choices = loadChoices();
  res.json({ taken: Object.keys(choices) });
});

app.post('/api/choose', (req, res) => {
  const { name, email, hex } = req.body;
  if (!name || !email || !hex) return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  const choices = loadChoices();
  if (choices[hex]) return res.status(409).json({ error: 'Cor já escolhida.' });
  choices[hex] = { name, email, time: new Date().toISOString() };
  saveChoices(choices);
  res.json({ ok: true });
});

app.post('/api/admin', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });
  res.json({ choices: loadChoices() });
});

app.post('/api/rese
