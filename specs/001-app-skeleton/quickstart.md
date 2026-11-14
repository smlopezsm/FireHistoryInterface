# Quickstart & Validation Guide: Esqueleto de Aplicación (W1)

Esta guía documenta los pasos para verificar localmente la correcta inicialización, compilación y empaquetado del esqueleto de la aplicación.

## 1. Requisitos Previos
- Node.js 20+ o 22 LTS
- Docker (opcional, para verificación de contenedor)

## 2. Inicialización y Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:5173
npm run dev

# Ejecutar verificación de tipos TypeScript
npm run typecheck

# Ejecutar linter
npm run lint

# Ejecutar pruebas unitarias
npm test
```

## 3. Escenarios de Validación

### Escenario A: Renderizado del Layout Responsive (Escritorio vs Móvil)
1. Abrir `http://localhost:5173` en un navegador de escritorio (ancho ≥ 1024 px).
2. Comprobar que la vista está organizada en dos paneles: panel izquierdo 40% y panel derecho 60%.
3. Redimensionar la ventana a < 768 px (modo móvil) y comprobar que los paneles se apilan verticalmente sin scroll horizontal.

### Escenario B: Conmutación de Idioma (i18n)
1. Observar los textos del encabezado ("Calendario de Actividad de Fuego...") en Español por defecto.
2. Hacer clic en el conmutador de idioma `EN`.
3. Verificar que los textos se actualizan de inmediato a Inglés sin recargar la página.

### Escenario C: Integración con Metadatos (`/metadata`)
1. Inspeccionar la consola de red del navegador (`DevTools` -> `Network`).
2. Verificar la llamada hacia `/api/v1/metadata`.
3. Comprobar que en el pie de página se muestra la versión de datos y los créditos correspondientes.

### Escenario D: Construcción y Empaquetado Docker
```bash
# Construir imagen Docker local
docker build -t firehistory-web:test .

# Verificar tamaño de la imagen (< 40 MB)
docker images firehistory-web:test

# Levantar contenedor en puerto 8080
docker run --rm -p 8080:80 firehistory-web:test

# Comprobar endpoint de salud
curl -i http://localhost:8080/healthz
```
Resultado esperado en `healthz`: `HTTP/1.1 200 OK`, cuerpo `ok`.
