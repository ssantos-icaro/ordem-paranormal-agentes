'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function publicUser(u) {
  return { id: u.id, username: u.username, created_at: u.created_at };
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  pool
    .query(
      `SELECT s.token, s.user_id, u.username, u.created_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = $1`,
      [token],
    )
    .then((r) => {
      const row = r.rows[0];
      if (!row) {
        return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
      }
      req.user = row;
      req.token = token;
      next();
    })
    .catch((err) => {
      console.error('Erro ao validar sessão:', err.message);
      res.status(500).json({ error: 'Erro no servidor.' });
    });
}

function validUsername(u) {
  return /^[a-z0-9_.-]{2,20}$/.test(u);
}

/* ---------------- Auth ---------------- */

app.post('/api/auth/register', async (req, res) => {
  try {
    const username = String((req.body && req.body.username) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');
    if (!validUsername(username)) {
      return res.status(400).json({
        error: 'Usuário deve ter 2 a 20 caracteres (letras, números, _ . -).',
      });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Senha deve ter ao menos 4 caracteres.' });
    }
    const taken = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (taken.rows.length) {
      return res.status(409).json({ error: 'Este usuário já existe.' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const ins = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hash],
    );
    const user = ins.rows[0];
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('INSERT INTO sessions (token, user_id) VALUES ($1, $2)', [
      token,
      user.id,
    ]);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Erro no registro:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = String((req.body && req.body.username) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');
    const found = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = found.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('INSERT INTO sessions (token, user_id) VALUES ($1, $2)', [
      token,
      user.id,
    ]);
    res.json({ token, user: { id: user.id, username: user.username, created_at: user.created_at } });
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.post('/api/auth/logout', authRequired, async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token = $1', [req.token]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro no logout:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

/* ---------------- Personagens ---------------- */

app.get('/api/me', authRequired, async (req, res) => {
  try {
    const rows = await pool.query('SELECT data FROM agents WHERE user_id = $1', [req.user.user_id]);
    res.json({
      user: { id: req.user.user_id, username: req.user.username },
      agents: rows.rows.map((r) => r.data),
    });
  } catch (err) {
    console.error('Erro ao carregar agentes:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.get('/api/agents', authRequired, async (req, res) => {
  try {
    const rows = await pool.query('SELECT data FROM agents WHERE user_id = $1', [req.user.user_id]);
    res.json(rows.rows.map((r) => r.data));
  } catch (err) {
    console.error('Erro ao carregar agentes:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.put('/api/agents/:id', authRequired, async (req, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id) return res.status(400).json({ error: 'Identificador inválido.' });
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    data.id = id;
    await pool.query(
      `INSERT INTO agents (id, user_id, data, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (id, user_id) DO UPDATE SET data = $3, updated_at = now()`,
      [id, req.user.user_id, JSON.stringify(data)],
    );
    res.json(data);
  } catch (err) {
    console.error('Erro ao salvar agente:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.delete('/api/agents/:id', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM agents WHERE id = $1 AND user_id = $2',
      [String(req.params.id || ''), req.user.user_id],
    );
    res.json({ ok: result.rowCount > 0 });
  } catch (err) {
    console.error('Erro ao excluir agente:', err.message);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

/* ---------------- Inicialização ---------------- */

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Ordem Paranormal RPG II - servidor na porta ' + PORT);
    });
  })
  .catch((err) => {
    console.error('Falha ao conectar no banco de dados:', err.message);
    process.exit(1);
  });