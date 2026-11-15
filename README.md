# FireHistoryInterface

Interfaz web del **calendario armonizado de focos de calor de Argentina (2000 → hoy)**, que combina MODIS y VIIRS en una sola escala (NASA Space Apps Challenge 2026: _Harmonization of MODIS and VIIRS Hot Spots_).

El usuario elige una zona en el mapa y un período, y ve:

- **qué meses y qué años tuvieron más fuego**;
- **cómo viene este mes comparado con lo normal**;
- y puede **descargar** los datos.

Consume la API [FireHistoryInterfaceAPI](https://github.com/smlopezsm/FireHistoryInterfaceAPI).

---

## Resumen técnico

| Aspecto            | Decisión                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Framework          | React + TypeScript + Vite                                                                  |
| Mapa               | MapLibre GL JS (mapa base sin API key)                                                     |
| Dibujo de zonas    | Terra Draw (adaptador MapLibre)                                                            |
| Datos remotos      | TanStack Query (caché, reintentos)                                                         |
| Gráficos           | Librería liviana con import modular (a definir en `/speckit.plan`; **no** Plotly completo) |
| Idiomas            | Español (default) e inglés                                                                 |
| Estado compartible | Zona, período y capa viven en la **URL**                                                   |
| Contenedor         | Build multi-stage → **Nginx Alpine** sirviendo estáticos                                   |
| Despliegue         | VPS DonWeb con Dokploy + Traefik (mismo dominio que la API, ruta `/`)                      |

## Documentación

| Documento                                                                            | Contenido                                                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [docs/01-producto.md](docs/01-producto.md)                                           | Qué pide el desafío, usuarios y funcionalidades priorizadas                |
| [docs/02-pantallas-y-componentes.md](docs/02-pantallas-y-componentes.md)             | **Pantallas, componentes, estados y textos**                               |
| [docs/03-consumo-de-api.md](docs/03-consumo-de-api.md)                               | **Qué endpoint usa cada componente, tipos TypeScript y manejo de errores** |
| [docs/04-diseno-visual-y-accesibilidad.md](docs/04-diseno-visual-y-accesibilidad.md) | Colores, calendario, "observado vs. estimado", accesibilidad               |
| [docs/05-despliegue.md](docs/05-despliegue.md)                                       | Dockerfile, Nginx, variables, CI/CD, Dokploy                               |
| [docs/06-pruebas-y-aceptacion.md](docs/06-pruebas-y-aceptacion.md)                   | Pruebas y criterios de aceptación                                          |
| [docs/07-spec-kit.md](docs/07-spec-kit.md)                                           | Cómo trabajamos con GitHub Spec Kit (SDD)                                  |

## Estructura prevista

```text
FireHistoryInterface/
├── src/
│   ├── app/            # Rutas, layout, proveedores (Query, i18n)
│   ├── features/
│   │   ├── zona/       # Selector de provincia, bbox y dibujo de polígono
│   │   ├── mapa/       # MapLibre, capas de celdas e industriales
│   │   ├── calendario/ # Matriz mes × año
│   │   ├── serie/      # Gráfico de líneas mensual/anual
│   │   ├── anomalia/   # Tarjeta "este mes vs. lo normal"
│   │   └── descargas/  # Botones CSV
│   ├── api/            # Cliente HTTP + tipos (docs/03)
│   ├── i18n/           # es.json, en.json
│   └── styles/         # Tokens de color (docs/04)
├── public/
├── nginx/default.conf
├── Dockerfile
├── docs/
└── .github/workflows/build-push.yml
```

## Inicio rápido (local)

```bash
npm ci
VITE_API_BASE_URL=http://66.97.41.70:9000/ npm run dev
# Producción local con Docker
docker build -t firehistory-web .
docker run --rm -p 8080:80 firehistory-web
```
