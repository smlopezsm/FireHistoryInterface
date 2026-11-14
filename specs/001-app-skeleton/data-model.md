# Data Model: Esqueleto de Aplicación (W1)

## Entidades Principales

### 1. Metadata (Metadatos de la API)
Representa la información del sistema, versiones y límites temporales devueltos por el endpoint `/metadata`.

| Campo | Tipo | Requerido | Descripción | Restricciones / Formato |
|---|---|---|---|---|
| `schema_version` | `string` | Sí | Versión del esquema del contrato API | SemVer, p.ej. `"1.0.0"` |
| `data_version` | `string` | Sí | Versión de los datos procesados | String identificador, p.ej. `"2026.10.1"` |
| `factores_version` | `string` | Sí | Versión de factores de calibración/armonización | String |
| `fecha_min` | `string` | Sí | Inicio absoluto de la serie temporal disponible | Formato ISO mes: `"YYYY-MM"` (p.ej. `"2000-11"`) |
| `fecha_max` | `string` | Sí | Fin de la serie temporal disponible | Formato ISO mes: `"YYYY-MM"` (p.ej. `"2026-10"`) |
| `fecha_ultimo_sp` | `string` | Sí | Fecha de la última corrida de procesamiento satelital | Formato ISO fecha: `"YYYY-MM-DD"` |
| `referencia_viirs` | `ReferenciaViirs[]` | Sí | Catálogo de sensores VIIRS con su ventana de operación | Lista de referencias |
| `fuentes` | `string[]` | Sí | Atribución de fuentes científicas e institucionales | Lista de nombres oficiales |

#### Sub-entidad: ReferenciaViirs
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `satelite` | `string` | Sí | Identificador del satélite (p.ej. `"Suomi-NPP"`, `"NOAA-20"`) |
| `desde` | `string` | Sí | Fecha inicio de operación (`"YYYY-MM-DD"`) |
| `hasta` | `string \| null` | Sí | Fecha fin o `null` si sigue activo |

---

### 2. AppShellState (Estado del Esqueleto en Frontend)
Gestiona la configuración visual y operativa del shell de la aplicación.

| Atributo | Tipo | Valores posibles | Default | Persistencia |
|---|---|---|---|---|
| `lang` | `Language` | `'es' \| 'en'` | `'es'` | Sincronizado en URL (`?lang=es`) y `localStorage` |
| `isOnline` | `boolean` | `true \| false` | `navigator.onLine` | Eventos `online` / `offline` del navegador |
| `activeTabMobile` | `string` | `'mapa' \| 'datos'` | `'mapa'` | Solo en viewport < 768 px |
