'use strict';

const { Pool } = require('pg');

/* Banco PostgreSQL. A URL de conexão vem da variável de ambiente
   DATABASE_URL (Neon / Supabase / etc.) injetada no Render. */
function cleanUrl(url) {
  if (!url) return url;
  // o parâmetro channel_binding=require pode quebrar o driver `pg`
  return url
    .replace(/[?&]channel_binding=[^&]+/, '')
    .replace(/[?&]channel_binding=[^&]+$/, '');
}

const rawUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/op2';
const pool = new Pool({
  connectionString: cleanUrl(rawUrl),
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
  `);
}

module.exports = { pool, initDb };