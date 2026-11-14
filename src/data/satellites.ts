export interface SatelliteData {
  id: 'terra' | 'aqua' | 'suomi';
  name: string;
  fullName: string;
  instrument: 'MODIS' | 'VIIRS';
  instrumentFullName: string;
  modelPath: string;
  launchYear: number;
  status: string;
  orbitType: string;
  altitude: string;
  equatorCrossing: string;
  summary: string;
  hotspotsRole: string;
  agency: string;
  officialUrl: string;
  tags: string[];
}

export const SATELLITES: Record<'terra' | 'aqua' | 'suomi', SatelliteData> = {
  terra: {
    id: 'terra',
    name: 'Terra',
    fullName: 'Terra (EOS AM-1)',
    instrument: 'MODIS',
    instrumentFullName: 'Moderate Resolution Imaging Spectroradiometer',
    modelPath: '/models/terra.glb',
    launchYear: 1999,
    status: 'Operativo',
    orbitType: 'Polar heliosincrónica (descendente)',
    altitude: '705 km',
    equatorCrossing: '10:30 AM (hora solar local)',
    summary:
      'Satélite insignia del programa Earth Observing System (EOS) de la NASA, diseñado para monitorear el estado global de la atmósfera, tierra y océanos.',
    hotspotsRole:
      'Proporciona la detección matutina de focos de calor a través de MODIS (bandas 21/22 y 31). Es la base del registro histórico 2000–hoy en Argentina, registrando anomalías térmicas en incendios forestales y quemas de pastizales.',
    agency: 'NASA / Goddard Space Flight Center',
    officialUrl: 'https://science.nasa.gov/3d-resources/terra/',
    tags: ['MODIS', 'EOS AM-1', 'Matutino', '1 km res.'],
  },
  aqua: {
    id: 'aqua',
    name: 'Aqua',
    fullName: 'Aqua (EOS PM-1)',
    instrument: 'MODIS',
    instrumentFullName: 'Moderate Resolution Imaging Spectroradiometer',
    modelPath: '/models/aqua.glb',
    launchYear: 2002,
    status: 'Operativo',
    orbitType: 'Polar heliosincrónica (ascendente)',
    altitude: '705 km',
    equatorCrossing: '1:30 PM (hora solar local)',
    summary:
      'Segunda nave insignia de la flota EOS de la NASA, dedicada al estudio del ciclo global del agua, evaporación, humedad y temperatura superficial.',
    hotspotsRole:
      'Complementa a Terra con sobrevuelo vespertino (13:30 hs), momento del día de máxima temperatura y menor humedad relativa en el que se produce la mayor propagación de incendios en el Cono Sur.',
    agency: 'NASA / Goddard Space Flight Center',
    officialUrl: 'https://science.nasa.gov/3d-resources/aqua-b/',
    tags: ['MODIS', 'EOS PM-1', 'Vespertino', '1 km res.'],
  },
  suomi: {
    id: 'suomi',
    name: 'Suomi NPP',
    fullName: 'Suomi National Polar-orbiting Partnership',
    instrument: 'VIIRS',
    instrumentFullName: 'Visible Infrared Imaging Radiometer Suite',
    modelPath: '/models/suomi.glb',
    launchYear: 2011,
    status: 'Operativo',
    orbitType: 'Polar heliosincrónica (ascendente)',
    altitude: '824 km',
    equatorCrossing: '1:30 PM (hora solar local)',
    summary:
      'Misión conjunta entre la NASA y la NOAA que sirve de puente entre el sistema EOS y la constelación JPSS de última generación.',
    hotspotsRole:
      'Equipado con el sensor VIIRS de 375 m de resolución espacial en bandas I (I4 e I5). Detecta focos de calor sustancialmente más pequeños que MODIS y con delimitación perimetral superior, siendo la escala de referencia armonizada del desafío.',
    agency: 'NASA / NOAA',
    officialUrl:
      'https://science.nasa.gov/3d-resources/suomi-national-polar-orbiting-partnership-suomi-npp/',
    tags: ['VIIRS', '375m res.', 'NASA / NOAA', 'Alta fidelidad'],
  },
};

export const SATELLITE_LIST: SatelliteData[] = [
  SATELLITES.terra,
  SATELLITES.aqua,
  SATELLITES.suomi,
];
