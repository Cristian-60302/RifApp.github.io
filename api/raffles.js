import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const allowedOrigin = process.env.APP_ORIGIN || 'https://cristian-60302.github.io';

function headers() {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Key',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type': 'application/json'
  };
}
function response(res, status, body) { return res.status(status).setHeader('Access-Control-Allow-Origin', allowedOrigin).json(body); }
function authorized(req) { return Boolean(process.env.APP_ACCESS_KEY) && req.headers['x-app-key'] === process.env.APP_ACCESS_KEY; }

export default async function handler(req, res) {
  Object.entries(headers()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!authorized(req)) return response(res, 401, { error: 'No autorizado' });
  if (!process.env.DATABASE_URL) return response(res, 500, { error: 'DATABASE_URL no está configurada en Vercel' });

  try {
    await sql`CREATE TABLE IF NOT EXISTS rifapp_state (id SMALLINT PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM rifapp_state WHERE id = 1`;
      return response(res, 200, rows[0]?.data || { raffles: [], activeRaffleId: null });
    }
    if (req.method === 'PUT') {
      const data = req.body;
      if (!data || !Array.isArray(data.raffles)) return response(res, 400, { error: 'El cuerpo debe contener raffles como arreglo' });
      await sql`INSERT INTO rifapp_state (id, data) VALUES (1, ${JSON.stringify(data)}::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`;
      return response(res, 200, { saved: true });
    }
    return response(res, 405, { error: 'Método no permitido' });
  } catch (error) {
    console.error(error);
    return response(res, 500, { error: 'Error interno de la API' });
  }
}
