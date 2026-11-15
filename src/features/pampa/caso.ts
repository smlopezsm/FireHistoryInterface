export const ID_CASO_PAMPA = 'la-pampa';
export const CLAVE_PROVINCIA_PAMPA = 'prov:42';
export const MES_PAMPA = '2001-01';
export const PERIODO_PAMPA = { desde: '2000-11', hasta: MES_PAMPA };
export const PASOS_PAMPA = ['contexto', 'modis', 'viirs', 'armonizado', 'metodo'] as const;
export type PasoPampa = typeof PASOS_PAMPA[number];

export const CLARIN_DICIEMBRE = 'https://www.clarin.com/sociedad/nadie-puede-detener-fuego-campos-pampa_0_BJpW7QKe0Ye.amp.html';
export const CLARIN_ENERO = 'https://www.clarin.com/sociedad/incendios-forestales-rurales-pesadilla-pampa_0_BkW6yFlAKg.html';
export const ANUARIO_2001 = 'https://www.argentina.gob.ar/sites/default/files/2025/07/2001_-_estadistica_de_incendios_forestales.pdf';
