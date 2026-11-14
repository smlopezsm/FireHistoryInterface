# 05 · Despliegue (Docker + Nginx + Dokploy)

## 1. Imagen Docker

| Aspecto | Especificación |
|---|---|
| Etapa 1 (build) | `node:22-alpine` → `npm ci` → `npm run build` (Vite) → `/app/dist` |
| Etapa 2 (runtime) | `nginx:1.27-alpine`, solo `dist/` + `nginx/default.conf` |
| Puerto | `80` |
| Usuario | Nginx sin privilegios |
| Tamaño objetivo | < 40 MB |
| Healthcheck | `GET /healthz` (archivo estático) cada 30 s |

### Dockerfile de referencia

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo "ok" > /usr/share/nginx/html/healthz
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
```

### `nginx/default.conf` (puntos clave)

| Regla | Valor |
|---|---|
| SPA | `try_files $uri /index.html;` |
| Archivos con hash (`/assets/*`) | `Cache-Control: public, max-age=31536000, immutable` |
| `index.html` | `Cache-Control: no-cache` |
| Compresión | `gzip on` para JS, CSS y JSON |
| Seguridad | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP que permita el dominio del mapa base |
| `/api` | **No** se proxea acá: lo enruta Traefik directo al contenedor de la API |

## 2. Dokploy

| Configuración | Valor |
|---|---|
| Imagen | `ghcr.io/smlopezsm/firehistory-web:latest` |
| Dominio / ruta | Dominio principal, `PathPrefix(/)` (prioridad menor que `/api`) |
| Puerto interno | `80` |
| Límite de memoria | 256 MB |
| SSL | Let's Encrypt automático (Traefik) |
| Despliegue | Webhook desde GitHub Actions |

## 3. GitHub Actions (`.github/workflows/build-push.yml`)

| Paso | Detalle |
|---|---|
| Disparador | `push` a `main`, tags `v*` |
| Calidad | `npm ci` → `npm run lint` → `npm run typecheck` → `npm test` |
| Tipos de la API | Genera tipos desde el `openapi.json` publicado y falla si difieren de los commiteados |
| Build | Docker multi-stage, con caché |
| Tags | `:latest`, `:<sha-corto>`, `:vX.Y.Z` |
| Registro | `ghcr.io/smlopezsm/firehistory-web` |
| Deploy | `curl -X POST $DOKPLOY_WEBHOOK_URL` |

**Secretos:** `DOKPLOY_WEBHOOK_URL`.

## 4. Rollback

Volver a desplegar la imagen `:<sha>` anterior desde Dokploy.
