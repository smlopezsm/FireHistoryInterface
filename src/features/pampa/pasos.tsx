import type { Step } from 'react-joyride';
import type { Capa, Punto } from '../../api';
import { formatMes } from '../../i18n/formatMes';
import { claseBotonPrincipalGuia } from '../cordoba/PasoGuiado';
import { ANUARIO_2001, CLARIN_DICIEMBRE, CLARIN_ENERO, PASOS_PAMPA } from './caso';

interface DatosPampa {
  es: boolean;
  mes: string | null;
  capa: Capa;
  datoMes?: Punto;
  celdaAbierta: boolean;
  version?: string;
  onChangeCapa: (capa: Capa) => void;
  onOpenMethod?: () => void;
}

export function pasosPampa({ es, mes, capa, datoMes, celdaAbierta, version, onChangeCapa, onOpenMethod }: DatosPampa): Step[] {
  const formato = new Intl.NumberFormat(es ? 'es-AR' : 'en-US', { maximumFractionDigits: 1 });
  const enlace = 'text-[#B8EE68] underline underline-offset-4';
  const mesActivo = mes ? formatMes(mes, !es) : '';
  const pasos: Step[] = [
    {
      target: '#calendario',
      placement: 'left',
      title: es ? 'Los incendios de La Pampa' : 'The La Pampa fires',
      content: <>
        <p>{es ? 'A fines de diciembre de 2000, Clarín informó alrededor de 1,1 millones de hectáreas afectadas. A fines de enero de 2001, publicó una estimación provincial de unas 2,3 millones de hectáreas quemadas hasta ese momento.' : 'In late December 2000, Clarín reported about 1.1 million hectares affected. In late January 2001, it published a provincial estimate of about 2.3 million hectares burned by that point.'}</p>
        <ul className="space-y-1">
          <li><a className={enlace} href={CLARIN_DICIEMBRE} target="_blank" rel="noreferrer">{es ? 'Leer la cobertura de diciembre' : 'Read December coverage'}</a></li>
          <li><a className={enlace} href={CLARIN_ENERO} target="_blank" rel="noreferrer">{es ? 'Leer la cobertura de enero' : 'Read January coverage'}</a></li>
          <li><a className={enlace} href={ANUARIO_2001} target="_blank" rel="noreferrer">{es ? 'Consultar el anuario oficial de 2001 (año completo)' : 'Read the official 2001 report (full year)'}</a></li>
        </ul>
        <p>{es ? 'El calendario muestra focos por mes en toda la provincia. Las noticias y el anuario informan superficie quemada en hectáreas. Elegí un mes para actualizar el mapa.' : 'The calendar shows monthly hot spots for the whole province. The press and the annual report give burned area in hectares. Select a month to update the map.'}</p>
      </>,
    },
    {
      target: '#mapa',
      placement: 'right',
      title: es ? 'Qué registró MODIS' : 'What MODIS recorded',
      content: <>
        {datoMes && <p><strong>{formato.format(datoMes.modis)}</strong> {es ? 'focos MODIS en' : 'MODIS hot spots in'} {mesActivo}.</p>}
        <p>{es ? 'Abrí una celda del mapa o usá «Abrir una celda de ejemplo». El color indica cuántos focos se registraron en cada celda de 5 × 5 km. El mapa muestra celdas con al menos cinco focos y el calendario muestra el total provincial.' : 'Select a map cell or choose “Open an example cell”. Color encodes the count in each 5 × 5 km cell. The map shows cells with at least five hot spots and the calendar gives the provincial total.'}</p>
        {celdaAbierta && <p role="status">{es ? 'Abriste el detalle de una celda.' : 'You opened the details for a cell.'}</p>}
      </>,
    },
    {
      target: capa === 'viirs' ? '#mapa' : '#capa-datos',
      placement: capa === 'viirs' ? 'right' : 'bottom',
      title: es ? 'Por qué VIIRS aparece sin dato' : 'Why VIIRS shows no data',
      content: <>
        {capa !== 'viirs' && <p>{es ? 'Elegí VIIRS en Capa y mirá el mapa con el mismo mes y encuadre.' : 'Select VIIRS in Layer and look at the map with the same month and view.'}</p>}
        {datoMes?.viirs === null && <p>{es ? 'Este período es anterior a las observaciones VIIRS de referencia del proyecto. «Sin dato» indica que no hay observaciones de ese sensor para este mes.' : 'This period predates the project’s reference VIIRS observations. “No data” means this sensor has no observations for the month.'}</p>}
        {capa === 'viirs' && (
          <>
            <p role="status">{es ? 'VIIRS seleccionado. Revisá el aviso en el mapa.' : 'VIIRS selected. Check the message on the map.'}</p>
            <button type="button" className={claseBotonPrincipalGuia} onClick={() => onChangeCapa('modis')}>{es ? 'Volver a MODIS' : 'Back to MODIS'}</button>
          </>
        )}
      </>,
    },
    {
      target: '#mapa',
      placement: 'right',
      title: es ? 'Cómo se ve el armonizado' : 'What the harmonized layer shows',
      content: <>
        <p>{es ? 'El mapa conserva el mes y el encuadre. En este período, el backend estima los focos a escala VIIRS S-NPP a partir de MODIS. El borde punteado identifica celdas con estimación cuando te acercás.' : 'The month and map view stay the same. In this period, the backend estimates hot spots on the VIIRS S-NPP scale from MODIS. The dashed outline identifies estimated cells when you zoom in.'}</p>
        {datoMes?.estado === 'estimado' && (
          <>
            <p><strong>{formato.format(datoMes.armonizado)}</strong> {es ? 'focos estimados en' : 'estimated hot spots in'} {mesActivo}.</p>
            <p>{es ? 'Rango nominal del 80 %' : 'Nominal 80% interval'} · {formato.format(datoMes.minimo)}–{formato.format(datoMes.maximo)}. {es ? 'Confianza' : 'Confidence'} · {es ? datoMes.confianza : ({ baja: 'low', media: 'medium', alta: 'high' }[datoMes.confianza])}.</p>
            {!!datoMes.dias_sin_modis && <p>{es ? 'Días a estimar sin el MODIS requerido' : 'Days to estimate with required MODIS data unavailable'} · {datoMes.dias_sin_modis}.</p>}
          </>
        )}
        {capa !== 'armonizado' && <button type="button" className={claseBotonPrincipalGuia} onClick={() => onChangeCapa('armonizado')}>{es ? 'Activar armonizado' : 'Show harmonized layer'}</button>}
      </>,
    },
    {
      target: '#metodo-armonizacion',
      placement: 'bottom',
      title: es ? 'Cómo se calcula la armonización' : 'How harmonization is calculated',
      content: <>
        <p className="font-semibold text-[#EFF5ED]">{es ? 'Armonizado = focos VIIRS observados + estimación basada en MODIS.' : 'Harmonized = observed VIIRS hot spots + MODIS-based estimate.'}</p>
        <p>{es ? 'La Pampa en enero de 2001 es un ejemplo de estimación completa a partir de MODIS. En la metodología podés ver de dónde salen el ajuste y su rango.' : 'La Pampa in January 2001 is an example of a fully MODIS-based estimate. The methodology explains how the adjustment and its interval are calculated.'}</p>
        {version && <p>{es ? 'Versión de factores' : 'Factor version'} · {version}</p>}
        {onOpenMethod && <button type="button" className={claseBotonPrincipalGuia} onClick={onOpenMethod}>{es ? 'Ver metodología' : 'View methodology'}</button>}
      </>,
    },
  ];

  return pasos.map((paso, i) => ({ ...paso, id: PASOS_PAMPA[i] }));
}
