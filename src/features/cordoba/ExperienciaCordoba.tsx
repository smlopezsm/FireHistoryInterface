import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Joyride, EVENTS, type Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import type { AnomaliaResponse, Capa, Punto } from '../../api';
import {
  CRONICA_CONAE, FUENTE_SNMF, LEYENDA_CONAE, MES_EPISODIO, MES_ESTIMADO, PASOS_CASO,
  PRODUCTO_CONAE, type PasoCordoba,
} from './caso';
import { PasoGuiado, claseBotonPrincipalGuia } from './PasoGuiado';
import { useDialogA11y } from '../../app/useDialogA11y';

interface Props {
  paso: PasoCordoba | null;
  guideButtonRef: RefObject<HTMLButtonElement>;
  onPaso: (paso: PasoCordoba | null) => void;
  mes: string | null;
  capa: Capa;
  celdaAbierta: boolean;
  datoMes?: Punto;
  anomalia?: AnomaliaResponse;
  mostrarConae: boolean;
  onVerEstimacion: () => void;
}

const INVITACION_VISTA = 'fuegocontinuo-invitacion-cordoba';
const boton = 'inline-flex min-h-10 w-fit items-center rounded-md border border-[#2A3F3A] px-3 py-2 text-sm font-medium text-[#EFF5ED] hover:border-[#B8EE68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8EE68]';
const enlace = 'text-[#B8EE68] underline underline-offset-4 hover:text-[#CBF58C]';

export function ExperienciaCordoba({
  paso, guideButtonRef, onPaso, mes, capa, celdaAbierta, datoMes, anomalia, mostrarConae, onVerEstimacion,
}: Props) {
  const { t, i18n } = useTranslation();
  const es = Boolean(i18n?.language?.startsWith('es'));
  const [invitacion, setInvitacion] = useState(() => {
    try { return localStorage.getItem(INVITACION_VISTA) !== '1'; } catch { return true; }
  });
  const [leyendaDisponible, setLeyendaDisponible] = useState(true);
  const devolverFoco = useRef(false);
  const guardarEleccion = useCallback(() => {
    setInvitacion(false);
    try { localStorage.setItem(INVITACION_VISTA, '1'); } catch { /* El almacenamiento puede estar deshabilitado. */ }
  }, []);
  const cerrarInvitacion = useCallback(() => {
    devolverFoco.current = true;
    guardarEleccion();
  }, [guardarEleccion]);
  const iniciar = () => {
    guardarEleccion();
    onPaso('calendario');
  };
  const salir = useCallback(() => {
    cerrarInvitacion();
    onPaso(null);
  }, [cerrarInvitacion, onPaso]);

  const mostrarDialogo = !paso && invitacion;
  const { containerRef } = useDialogA11y({ isOpen: mostrarDialogo, onClose: cerrarInvitacion });

  useEffect(() => {
    if (paso && invitacion) guardarEleccion();
    if (!paso && !invitacion && devolverFoco.current) {
      guideButtonRef.current?.focus({ preventScroll: true });
      devolverFoco.current = false;
    }
  }, [paso, invitacion, guardarEleccion, guideButtonRef]);

  useEffect(() => {
    if (!paso) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) salir();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [paso, salir]);

  if (!paso) {
    if (!mostrarDialogo || typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#010807]/80 p-4 backdrop-blur-sm">
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invitacion-cordoba"
          aria-describedby="detalle-invitacion-cordoba"
          tabIndex={-1}
          className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-[#34493F] bg-[#0D1816] p-5 text-[#EFF5ED] shadow-2xl sm:p-6"
        >
          <h2 id="invitacion-cordoba" className="font-title text-xl font-semibold">
            {t('cordoba.invitationTitle')}
          </h2>
          <p id="detalle-invitacion-cordoba" className="mt-2 text-sm leading-relaxed text-[#C8D3CE]">
            {t('cordoba.invitationDetail')}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={claseBotonPrincipalGuia} onClick={iniciar}>{t('cordoba.startGuide')}</button>
            <button type="button" className={boton} onClick={cerrarInvitacion}>{t('cordoba.exploreAlone')}</button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const indice = PASOS_CASO.indexOf(paso);
  const formato = new Intl.NumberFormat(es ? 'es-AR' : 'en-US', { maximumFractionDigits: 1 });
  const episodio = mes === MES_EPISODIO && datoMes?.periodo === MES_EPISODIO ? datoMes : undefined;
  const estimado = mes === MES_ESTIMADO && datoMes?.periodo === MES_ESTIMADO ? datoMes : undefined;
  const comparacion = mes === MES_EPISODIO && anomalia?.mes === MES_EPISODIO ? anomalia : undefined;
  const tituloPaso = es
    ? ['Elegí un mes', 'Leé el mapa', 'Compará los sensores', 'Interpretá el dato armonizado', 'Leé la huella histórica']
    : ['Choose a month', 'Read the map', 'Compare the sensors', 'Interpret the harmonized data', 'Read the historical record'];

  const contenido = (id: PasoCordoba) => (
    <div className="space-y-2 text-left text-sm leading-relaxed text-[#C8D3CE]">
        {id === 'calendario' && (
          <>
            <p>{es ? 'En septiembre de 2020, el SNMF registró 23 incendios reportados y 270.451 hectáreas afectadas en toda la provincia de Córdoba. Cuchi Corral fue uno de los incendios destacados del mes.' : 'In September 2020, SNMF recorded 23 reported fires and 270,451 hectares affected across Córdoba Province. Cuchi Corral was one of the major fires that month.'}</p>
            <p className="flex flex-wrap gap-x-5 gap-y-2">
              <a className={enlace} href={CRONICA_CONAE} target="_blank" rel="noreferrer">{es ? 'Ver imágenes de Cuchi Corral (CONAE)' : 'See images of Cuchi Corral (CONAE)'}</a>
              <a className={enlace} href={FUENTE_SNMF} target="_blank" rel="noreferrer">{es ? 'Leer el informe del SNMF' : 'Read the SNMF report'}</a>
            </p>
            <p>{es ? 'Elegí septiembre de 2020 en el calendario. Cada casilla resume los focos de un mes para la zona y la capa activa. Al elegirla, se actualizan el mapa y la comparación histórica.' : 'Choose September 2020 in the calendar. Each square summarizes one month of hot spots for the current area and layer. Selecting it updates the map and historical comparison.'}</p>
            {mes === MES_EPISODIO && <p role="status">{es ? 'Septiembre de 2020 seleccionado.' : 'September 2020 selected.'}</p>}
          </>
        )}
        {id === 'mapa' && (
          <>
            <p>{es ? 'Seleccioná una celda del mapa o usá «Abrir una celda de ejemplo». Cada polígono representa 5 × 5 km. Su color indica cuántos focos se registraron durante el mes. El mapa muestra las celdas con al menos cinco focos en la provincia de Córdoba. El calendario muestra el total mensual de la provincia.' : 'Select a cell on the map or choose “Open an example cell”. Each polygon represents 5 × 5 km. Its color shows the monthly hot spot count. The map displays cells with at least five hot spots in Córdoba Province. The calendar shows the monthly total for the province.'}</p>
            <p>{es ? 'Un foco es una detección de calor. Un mismo incendio puede producir muchas detecciones a lo largo de varios pasos satelitales.' : 'A hot spot is a heat detection. One fire can produce many detections over several satellite passes.'}</p>
            {celdaAbierta && <p role="status">{es ? 'Abriste el detalle de una celda.' : 'You opened a cell’s details.'}</p>}
          </>
        )}
        {id === 'sensores' && (
          <>
            <p>{es ? 'En Capa, cambiá de MODIS a VIIRS. Compará septiembre de 2020 con el mismo encuadre. Cada instrumento tiene distinta resolución y horarios de observación.' : 'In Layer, switch from MODIS to VIIRS. Compare September 2020 with the same map extent. The instruments have different resolutions and observation times.'}</p>
            {episodio && <p>{es ? 'Focos en Córdoba, septiembre de 2020' : 'Hot spots in Córdoba, September 2020'} · MODIS <strong>{formato.format(episodio.modis)}</strong> · VIIRS <strong>{episodio.viirs === null ? (es ? 'sin dato' : 'no data') : formato.format(episodio.viirs)}</strong></p>}
            {capa === 'viirs' && <p role="status">{es ? 'VIIRS seleccionado.' : 'VIIRS selected.'}</p>}
          </>
        )}
        {id === 'armonizacion' && (
          <>
            <p>{es ? 'Armonizado usa el VIIRS de referencia cuando hay observaciones y aplica el método de FuegoContinuo sobre MODIS cuando corresponde. En la comparación histórica, la mediana describe un septiembre típico entre los años usados como referencia.' : 'Harmonized uses the reference VIIRS when observations are available and applies FuegoContinuo’s method to MODIS where applicable. In the historical comparison, the median describes a typical September among reference years.'}</p>
            {comparacion && comparacion.mediana !== null && (
              <p>{es ? 'Septiembre de 2020 en Córdoba' : 'September 2020 in Córdoba Province'} · <strong>{formato.format(comparacion.valor)}</strong> {es ? 'focos armonizados' : 'harmonized hot spots'} · {es ? 'mediana' : 'median'} <strong>{formato.format(comparacion.mediana)}</strong> ({comparacion.anios_usados} {es ? 'años de referencia' : 'reference years'}).</p>
            )}
            <button type="button" className={boton} onClick={onVerEstimacion}>{es ? 'Ver septiembre de 2008' : 'View September 2008'}</button>
            {estimado && estimado.viirs === null && estimado.estado === 'estimado' && (
              <p role="status">{es ? 'En septiembre de 2008 VIIRS figura sin dato. El armonizado es una estimación basada en MODIS, con el rango nominal devuelto por la API' : 'In September 2008 VIIRS has no data. The harmonized count is estimated from MODIS, with the nominal range returned by the API'} · <strong>{formato.format(estimado.armonizado)}</strong> ({formato.format(estimado.minimo)}–{formato.format(estimado.maximo)}).</p>
            )}
          </>
        )}
        {id === 'recurrencia' && (
          <>
            <p>{es ? 'El registro de CONAE resume cuántas veces se cartografió área quemada en cada píxel entre 1986 y 2024. La capa tiene su propia escala. El calendario sigue mostrando los focos del mes seleccionado.' : 'CONAE’s record summarizes how often burned area was mapped per pixel from 1986 to 2024. The layer has its own scale. The calendar still shows hot spots for the selected month.'}</p>
            <p>{es ? 'Activá Área quemada histórica en el mapa para ver la capa y su leyenda.' : 'Enable Historical burned area on the map to see the layer and its legend.'}</p>
            {mostrarConae && leyendaDisponible && <img className="max-w-full rounded bg-white p-2" src={LEYENDA_CONAE} alt={es ? 'Leyenda oficial CONAE de frecuencia de incendios por píxel' : 'Official CONAE legend for fire frequency per pixel'} onError={() => setLeyendaDisponible(false)} />}
            <p><a className={enlace} href={PRODUCTO_CONAE} target="_blank" rel="noreferrer">{es ? 'Consultar producto y metodología de CONAE' : 'Read CONAE’s product and methods'}</a></p>
            <details>
              <summary className="w-fit cursor-pointer text-[#EFF5ED]">{es ? '¿Dónde mirarías cuántas hectáreas fueron afectadas en septiembre de 2020?' : 'Where would you find the hectares affected in September 2020?'}</summary>
              <p className="mt-2">{es ? 'En el informe del SNMF. Las hectáreas describen superficie afectada y los focos del calendario son detecciones térmicas.' : 'In the SNMF report. Hectares measure affected area and hot spots in the calendar are thermal detections.'}</p>
            </details>
          </>
        )}
    </div>
  );

  const objetivos: Record<PasoCordoba, string> = {
    calendario: '#calendario',
    mapa: '#mapa',
    sensores: '#capa-datos',
    armonizacion: '#comparacion-historica',
    recurrencia: '#mapa',
  };

  const pantallaEstrecha = window.matchMedia?.('(max-width: 1023px)').matches;
  const posiciones: Record<PasoCordoba, Step['placement']> = {
    calendario: 'left', mapa: 'right', sensores: 'bottom', armonizacion: 'left', recurrencia: 'right',
  };
  const steps: Step[] = PASOS_CASO.map((id, index) => ({
    id,
    target: objetivos[id],
    placement: pantallaEstrecha ? 'bottom' : posiciones[id],
    title: (
      <span className="block space-y-1 text-left">
        <span className="block text-xs font-normal text-[#C8D3CE]">{es ? 'Caso Córdoba' : 'Córdoba case'} · {index + 1}/{PASOS_CASO.length}</span>
        <span className="font-title text-lg font-semibold">{tituloPaso[index]}</span>
      </span>
    ),
    content: contenido(id),
  }));

  const movimientoReducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <Joyride
      run
      continuous
      initialStepIndex={indice}
      steps={steps}
      options={{
        skipBeacon: true,
        overlayColor: 'rgba(1, 8, 7, 0.82)',
        zIndex: 120,
        dismissKeyAction: false,
        overlayClickAction: false,
        disableFocusTrap: true,
        targetWaitTimeout: 5000,
        scrollDuration: movimientoReducido ? 0 : 220,
        scrollOffset: 126,
        spotlightPadding: 6,
        buttons: ['back', 'primary', 'skip'],
      }}
      locale={es ? {
        back: 'Anterior',
        next: 'Siguiente',
        skip: 'Salir de la guía',
        last: t('cordoba.exploreAlone'),
      } : {
        back: 'Previous',
        next: 'Next',
        skip: 'Leave guide',
        last: t('cordoba.exploreAlone'),
      }}
      floatingOptions={{ shiftOptions: { crossAxis: true, padding: 12 } }}
      tooltipComponent={PasoGuiado}
      styles={{ arrow: { color: '#0D1816' }, spotlight: { stroke: '#B8EE68', strokeWidth: 1.5, opacity: 0.8 } }}
      onEvent={(evento) => {
        if (evento.type === EVENTS.TOUR_END) {
          salir();
        } else if (evento.type === EVENTS.STEP_BEFORE) {
          const siguiente = PASOS_CASO[evento.index];
          if (siguiente && siguiente !== paso) onPaso(siguiente);
        }
      }}
    />
  );
}
