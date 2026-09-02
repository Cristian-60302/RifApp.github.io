# Persistencia en Neon mediante Vercel

GitHub Pages solo sirve archivos estáticos. La conexión segura queda separada así:

`GitHub Pages (frontend) -> Vercel /api/raffles -> Neon Postgres`

## 1. Crear la base Neon

1. Crea un proyecto en Neon.
2. Copia la cadena `DATABASE_URL` desde **Connect**.
3. Ejecuta `neon-cloud-schema.sql` en el SQL Editor de Neon, o deja que la API cree la tabla automáticamente.

No guardes la cadena en este repositorio.

## 2. Desplegar la API en Vercel

Desde la raíz del proyecto:

```bash
npx vercel login
npx vercel
```

Cuando Vercel pregunte, selecciona tu cuenta y confirma este directorio como proyecto. Luego configura las variables en **Project Settings > Environment Variables**:

- `DATABASE_URL`: cadena de conexión de Neon.
- `APP_ACCESS_KEY`: actualiza esta variable en Vercel con la nueva clave que hayas elegido.
- `APP_ORIGIN`: `https://cristian-60302.github.io`

Después despliega a producción:

```bash
npx vercel --prod
```

La API quedará en:

```text
https://TU-PROYECTO.vercel.app/api/raffles
```

Para este proyecto, la URL configurada actualmente en el frontend es:

```text
https://rif-app-github-io-ixxu.vercel.app/api/raffles
```

## Importante

No pongas `DATABASE_URL` en `index.html`, `app.js`, GitHub Actions ni variables públicas del frontend. GitHub Pages no debe conectarse directamente a Neon. El endpoint requiere `X-App-Key`; el frontend solicita esa clave en el navegador y la guarda en el `localStorage` del dispositivo.

Después de actualizar `app.js`, publica la versión del frontend en GitHub Pages:

```bash
git add app.js CLOUD_SETUP.md
git commit -m "Conectar RifApp con API cloud"
git push
```
