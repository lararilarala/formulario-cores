const express = require('express');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'admin123';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBSaVYiDyEpmtfLzKLCpPQpzZ-C4Sg2jYCxG1nvQlWWXUL1YDKrQqjulj7kK7V0OjO/exec';

app.use(express.json());
app.use(express.static('public'));

function callScript(params) {
  return new Promise((resolve, reject) => {
    const query = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const makeRequest = (url) => {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          makeRequest(res.headers.location);
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
      }).on('error', reject);
    };
    makeRequest(`${SCRIPT_URL}?${query}`);
  });
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

app.post('/api/reset', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });
  res.status(403).json({ error: 'Reset deve ser feito diretamente no Google Sheets.' });
});

app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
