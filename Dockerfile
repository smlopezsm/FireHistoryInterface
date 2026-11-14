# Etapa 1: Build de la aplicación con Vite
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Etapa 2: Servidor web ultraliviano Nginx (< 40 MB)
FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo "ok" > /usr/share/nginx/html/healthz

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
