import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Por defecto en entorno de test, el token de Mapbox inicia vacío para probar los flujos con prompt
vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');

