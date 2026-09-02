-- La API crea esta tabla automáticamente en su primera solicitud.
-- Puedes ejecutarlo manualmente en el editor SQL de Neon si lo prefieres.
CREATE TABLE IF NOT EXISTS rifapp_state (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
