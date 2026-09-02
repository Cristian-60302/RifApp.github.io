-- Estructura de referencia para una implementación persistente de RifApp.
CREATE TABLE rifa (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR(120) NOT NULL,
  fecha_sorteo TIMESTAMP NOT NULL,
  loteria_referencia VARCHAR(120) NOT NULL,
  responsable_nombre VARCHAR(120) NOT NULL,
  responsable_telefono VARCHAR(30) NOT NULL,
  valor_boleta DECIMAL(12,2) NOT NULL CHECK (valor_boleta >= 0),
  resultado_oficial CHAR(4),
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boleta (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  rifa_id BIGINT NOT NULL REFERENCES rifa(id),
  numero SMALLINT NOT NULL CHECK (numero BETWEEN 0 AND 99),
  cliente_id BIGINT REFERENCES cliente(id),
  monto_pagado DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
  UNIQUE (rifa_id, numero)
);

CREATE TABLE premio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  rifa_id BIGINT NOT NULL REFERENCES rifa(id),
  nombre VARCHAR(120) NOT NULL,
  regla VARCHAR(20) NOT NULL,
  valor DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
  numero_ganador SMALLINT CHECK (numero_ganador BETWEEN 0 AND 99),
  UNIQUE (rifa_id, nombre)
);

CREATE TABLE abono (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  boleta_id BIGINT NOT NULL REFERENCES boleta(id),
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacion VARCHAR(250)
);

-- Estado recomendado: DISPONIBLE si no existe boleta; PENDIENTE si monto_pagado < valor_boleta;
-- PAGADO si monto_pagado >= valor_boleta. El saldo es valor_boleta - monto_pagado.
