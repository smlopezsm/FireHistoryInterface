import { CLAVE_PROVINCIA_CORDOBA, PERIODO_EPISODIO, seleccionDelPaso, type PasoCordoba } from './cordoba/caso';
import { CLAVE_PROVINCIA_PAMPA, MES_PAMPA, PERIODO_PAMPA, type PasoPampa } from './pampa/caso';
import type { Capa } from '../api';

export type GuiaActiva =
  | { caso: 'sierras-cordoba'; paso: PasoCordoba }
  | { caso: 'la-pampa'; paso: PasoPampa };

export function seleccionDeGuia(guia: GuiaActiva): { zona: string; periodo: { desde: string; hasta: string }; capa: Capa; mes: string } {
  if (guia.caso === 'sierras-cordoba') {
    return { zona: CLAVE_PROVINCIA_CORDOBA, periodo: PERIODO_EPISODIO, ...seleccionDelPaso(guia.paso) };
  }
  const capa = guia.paso === 'viirs' || guia.paso === 'modis' || guia.paso === 'contexto' ? 'modis' : 'armonizado';
  return { zona: CLAVE_PROVINCIA_PAMPA, periodo: PERIODO_PAMPA, mes: MES_PAMPA, capa };
}
