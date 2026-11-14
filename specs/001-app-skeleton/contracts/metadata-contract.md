# Contract: Endpoint `/metadata`

## Definición HTTP

- **Método**: `GET`
- **Ruta**: `/metadata` (relativa a `VITE_API_BASE_URL`, p.ej. `/api/v1/metadata`)
- **Headers**:
  - `Accept: application/json`

## Respuesta Exitosa (`200 OK`)

```json
{
  "schema_version": "1.0.0",
  "data_version": "2026.10.1",
  "factores_version": "v1.2",
  "fecha_min": "2000-11",
  "fecha_max": "2026-10",
  "fecha_ultimo_sp": "2026-10-31",
  "referencia_viirs": [
    {
      "satelite": "Suomi-NPP",
      "desde": "2012-01-20",
      "hasta": null
    }
  ],
  "fuentes": [
    "NASA FIRMS (MODIS y VIIRS)",
    "Instituto Geográfico Nacional (IGN)"
  ]
}
```

## Manejo de Errores

| Código HTTP | Escenario | Comportamiento del Frontend |
|---|---|---|
| `500` / `503` / `504` | Error o mantenimiento en backend | TanStack Query reintenta 3 veces con backoff. El pie de página muestra skeleton con aviso tenue de actualización sin bloquear el resto de la UI. |
| Falla de red / offline | Cliente sin conexión a internet | Se detecta el estado offline y se preservan valores en caché si existían, o texto de cortesía "Sin conexión con la API". |
