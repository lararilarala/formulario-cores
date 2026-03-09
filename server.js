const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'admin123';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBSaVYiDyEpmtfLzKLCpPQpzZ-C4Sg2jYCxG1nvQlWWXUL1YDKrQqjulj7kK7V0OjO/exec';

app.use(express.json());
app.use(express.static('public'));

async function callScript(params) {
  const url = new URL(SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  return res.json();
}

app.get('/api/choices', async (req, res) => {
  try {
    const data = await callScript({ action: 'getChoices' });
    res.json({ taken: data.taken || [] });
  } catch (e) {
    res.json({ taken: [] });
  }
});

app.post('/api/choose', async (req, res) => {
  const { name, email, hex } = req.body;
  if (!name || !email || !hex) return res.status(400).json({ error: 'Campos obrigatorios ausentes.' });
  try {
    const data = await callScript({ action: 'choose', hex, nome: name, email });
    if (data.error === 'taken') return res.status(409).json({ error: 'Cor ja escolhida.' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao conectar com o banco de dados.' });
  }
});

app.post('/api/admin', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });
  try {
    const data = await callScript({ action: 'getChoices' });
    const choices = {};
    (data.entries || []).forEach(e => {
      choices[e.hex] = { name: e.nome, email: e.email, time: e.horario };
    });
    res.json({ choices });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao conectar.' });
  }
});

app.post('/api/reset', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });
  res.status(403).json({ error: 'Reset deve ser feito diretamente no Google Sheets.' });
});

app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
