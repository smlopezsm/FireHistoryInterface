import type { BBox, Capa } from '../../api';

export const ID_CASO_CORDOBA = 'sierras-cordoba';
export const CLAVE_PROVINCIA_CORDOBA = 'prov:14';
export const EXTENSION_CONAE: BBox = [-65.54235, -33.364531, -63.49693, -29.500333];
export const PASOS_CASO = ['calendario', 'mapa', 'sensores', 'armonizacion', 'recurrencia'] as const;
export type PasoCordoba = typeof PASOS_CASO[number];

export const MES_EPISODIO = '2020-09';
export const MES_ESTIMADO = '2008-09';
export const PERIODO_EPISODIO = { desde: '2020-08', hasta: '2020-10' };
export const PERIODO_ESTIMADO = { desde: '2008-08', hasta: '2008-10' };

export function seleccionDelPaso(paso: PasoCordoba): { capa: Capa; mes: string } {
  return {
    capa: paso === 'mapa' || paso === 'sensores' ? 'modis' : 'armonizado',
    mes: paso === 'calendario' ? PERIODO_EPISODIO.desde : MES_EPISODIO,
  };
}

export const FUENTE_SNMF = 'https://www.argentina.gob.ar/sites/default/files/ocurrencia_de_incendios_mes_de_septiembre_2020.pdf';
export const CRONICA_CONAE = 'https://www.argentina.gob.ar/noticias/conae-activo-protocolos-nacionales-e-internacionales-ante-los-incendios-en-cordoba';
export const PRODUCTO_CONAE = 'https://documentoside.conae.gov.ar/public/docs/pid/tes/emer/fi/048-CONAE_PID_TES_EMER_FI_19860101_20241231_gESierrasCBA_e01.pdf';

const WMS_CONAE = 'https://geoservicios2.conae.gov.ar/geoserver/Tesis/wms';
export const TESELAS_CONAE = `${WMS_CONAE}?service=WMS&version=1.1.1&request=GetMap&layers=TES_EMER_FI&styles=estilo_TES_EMER_FI&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true`;
export const LEYENDA_CONAE = `${WMS_CONAE}?service=WMS&version=1.1.1&request=GetLegendGraphic&layer=TES_EMER_FI&style=estilo_TES_EMER_FI&format=image/png`;
