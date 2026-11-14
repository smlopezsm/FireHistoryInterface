import React, { useState } from 'react';
import {
  Layers,
  Compass,
  Cpu,
  Zap,
  Radio,
  ExternalLink,
  Flame,
  Thermometer,
  Shield,
  Box,
} from 'lucide-react';

export type InstrumentMode = 'modis' | 'viirs';

interface SatelliteSchematicProps {
  onOpen3D?: () => void;
}

interface SubsystemInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  specs: string;
  description: string;
}

const SUBSYSTEMS: SubsystemInfo[] = [
  {
    id: 'payload',
    name: 'Carga Útil (Sensor Óptico)',
    icon: <Cpu className="h-4 w-4 text-[#B8EE68]" />,
    specs: 'MODIS: 36 bandas (1 km) · VIIRS: 22 bandas (375 m)',
    description:
      'Radiómetro electro-óptico con detector infrarrojo criogénico y espejo escáner para medir radiancia térmica y detectar puntos calientes activos.',
  },
  {
    id: 'solar',
    name: 'Generación Solar y Baterías',
    icon: <Zap className="h-4 w-4 text-[#68D9D0]" />,
    specs: 'Panel articulado de GaAs · ~2.5 - 3.0 kW',
    description:
      'Alas solares articuladas orientables que siguen al sol durante la fase diurna y recargan baterías de Ni-H2 / Li-Ion para los eclipses orbitales.',
  },
  {
    id: 'thermal',
    name: 'Control Térmico (MLI & Radiador)',
    icon: <Thermometer className="h-4 w-4 text-[#FF9C55]" />,
    specs: 'Mantas doradas MLI · Enfriador pasivo < 85 K',
    description:
      'Aislamiento multicapa (MLI) de Kapton aluminizado y radiadores de aletas que disipan el calor al espacio profundo para enfriar los detectores infrarrojos.',
  },
  {
    id: 'comms',
    name: 'Comunicaciones y Telemetría',
    icon: <Radio className="h-4 w-4 text-[#68D9D0]" />,
    specs: 'Antena parabólica banda X & S · Enlace TDRSS',
    description:
      'Transmisión continua de paquetes de telemetría científica y comandos directos a estaciones terrenas y satélites de retransmisión.',
  },
  {
    id: 'aocs',
    name: 'Actitud y Navegación (AOCS)',
    icon: <Compass className="h-4 w-4 text-[#B8EE68]" />,
    specs: 'Star Trackers dobles · Ruedas de inercia de 3 ejes',
    description:
      'Sensores estelares y giroscopios que mantienen el apuntamiento nadir de los instrumentos hacia la superficie terrestre con precisión milimétrica.',
  },
  {
    id: 'propulsion',
    name: 'Propulsión Orbital',
    icon: <Shield className="h-4 w-4 text-[#FF6759]" />,
    specs: 'Propulsores de hidracina (Monopropelente)',
    description:
      'Motores de control de órbita utilizados para compensar el frenado atmosférico y conservar la hora solar de cruce ecuatorial (10:30 AM / 13:30 PM).',
  },
];

export const SatelliteSchematic: React.FC<SatelliteSchematicProps> = ({ onOpen3D }) => {
  const [isExploded, setIsExploded] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentMode>('modis');
  const [activeCallout, setActiveCallout] = useState<string | null>(null);

  const isModis = instrument === 'modis';

  // Microdatos orbitales del sensor activo (MODIS vs VIIRS)
  const telemetry = isModis
    ? {
        altitude: '705 km',
        orbitType: 'Heliosincrónica (98.2°)',
        passTime: '10:30 AM (Terra) / 13:30 PM (Aqua)',
        swath: '2.330 km (±55° transversal)',
        resolution: '1.000 m (Bandas térmicas 21/22)',
        revisit: '1 a 2 días (Cobertura global)',
      }
    : {
        altitude: '824 km',
        orbitType: 'Heliosincrónica (98.7°)',
        passTime: '13:30 PM (Suomi-NPP / NOAA-20)',
        swath: '3.040 km (Sin huecos inter-órbita)',
        resolution: '375 m (Banda térmica I4 a 3.9 µm)',
        revisit: '12 h (Día + Noche combinados)',
      };

  return (
    <section
      id="la-mision"
      aria-label="Anatomía orbital de satélites e instrumentos de observación terrestre"
      className="relative w-full rounded-2xl border border-[#21312D] bg-[#07100F] p-4 md:p-8 shadow-2xl overflow-hidden scroll-mt-20"
    >
      {/* Encabezado de la lámina técnica */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#21312D] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#B8EE68] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#B8EE68]">
              Lámina de Misión · Arquitectura Orbital
            </span>
            <span className="rounded border border-[#21312D] bg-[#0D1816] px-2 py-0.5 font-mono text-[10px] text-[#93A39C]">
              NASA EOS & JPSS
            </span>
          </div>
          <h2 className="mt-1 font-title text-xl md:text-2xl font-bold tracking-tight text-[#EFF5ED]">
            Anatomía del Instrumento y Plataforma Satelital
          </h2>
          <p className="mt-0.5 text-xs text-[#93A39C]">
            Explorá cómo la instrumentación orbital detecta anomalías térmicas y armoniza 24 años de historia.
          </p>
        </div>

        {/* Controles de visualización (Desarmar / Rearmar + Selector de Instrumento + Visor 3D) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Instrumento */}
          <div
            role="radiogroup"
            aria-label="Selector de sensor"
            className="flex rounded-lg border border-[#21312D] bg-[#0D1816] p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={isModis}
              onClick={() => setInstrument('modis')}
              className={`rounded px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                isModis
                  ? 'bg-[#68D9D0]/20 text-[#68D9D0] border border-[#68D9D0]/40 shadow-sm'
                  : 'text-[#93A39C] hover:text-[#EFF5ED]'
              }`}
            >
              MODIS · Terra / Aqua
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!isModis}
              onClick={() => setInstrument('viirs')}
              className={`rounded px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                !isModis
                  ? 'bg-[#FF9C55]/20 text-[#FF9C55] border border-[#FF9C55]/40 shadow-sm'
                  : 'text-[#93A39C] hover:text-[#EFF5ED]'
              }`}
            >
              VIIRS · Suomi-NPP
            </button>
          </div>

          {/* Conmutador Desarmar / Rearmar */}
          <button
            type="button"
            onClick={() => setIsExploded((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-mono font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B8EE68] ${
              isExploded
                ? 'border-[#B8EE68] bg-[#B8EE68]/20 text-[#B8EE68] shadow-md'
                : 'border-[#21312D] bg-[#0D1816] text-[#EFF5ED] hover:border-[#B8EE68]/50 hover:bg-[#111E1B]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isExploded ? 'Rearmar Nave' : 'Desarmar Subsistemas'}</span>
          </button>

          {/* Acción directa al Visor 3D NASA Three.js */}
          {onOpen3D && (
            <button
              type="button"
              onClick={onOpen3D}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8EE68]/50 bg-[#B8EE68]/15 px-3.5 py-1.5 text-xs font-mono font-bold text-[#B8EE68] hover:bg-[#B8EE68]/25 hover:border-[#B8EE68] focus:outline-none focus:ring-2 focus:ring-[#B8EE68] transition-all"
              title="Abrir Visor 3D Oficial de Satélites NASA con Three.js"
            >
              <Box className="h-3.5 w-3.5" />
              <span>Inspeccionar 3D NASA</span>
            </button>
          )}
        </div>
      </div>

      {/* Franja de Microdatos de Telemetría Orbital */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="rounded-lg border border-[#21312D] bg-[#0D1816] p-2.5">
          <span className="block text-[10px] uppercase text-[#93A39C]">Altitud Orbital</span>
          <span className="font-bold text-[#EFF5ED] text-sm">{telemetry.altitude}</span>
          <span className="block text-[10px] text-[#93A39C] truncate">{telemetry.orbitType}</span>
        </div>
        <div className="rounded-lg border border-[#21312D] bg-[#0D1816] p-2.5">
          <span className="block text-[10px] uppercase text-[#93A39C]">Hora de Paso</span>
          <span className="font-bold text-[#EFF5ED] text-sm">{telemetry.passTime.split('(')[0]}</span>
          <span className="block text-[10px] text-[#93A39C] truncate">{telemetry.passTime}</span>
        </div>
        <div className="rounded-lg border border-[#21312D] bg-[#0D1816] p-2.5">
          <span className="block text-[10px] uppercase text-[#93A39C]">Ancho de Barrido</span>
          <span className="font-bold text-[#EFF5ED] text-sm">{telemetry.swath.split('(')[0]}</span>
          <span className="block text-[10px] text-[#93A39C] truncate">{telemetry.swath}</span>
        </div>
        <div className="rounded-lg border border-[#21312D] bg-[#0D1816] p-2.5">
          <span className="block text-[10px] uppercase text-[#93A39C]">Resolución de Detección</span>
          <span
            className="font-bold text-sm"
            style={{ color: isModis ? '#68D9D0' : '#FF9C55' }}
          >
            {telemetry.resolution.split('(')[0]}
          </span>
          <span className="block text-[10px] text-[#93A39C] truncate">{telemetry.resolution}</span>
        </div>
      </div>

      {/* Escena Vectorial Principal: Espacio profundo, horizonte terrestre y satélite en perspectiva */}
      <div className="relative mt-6 h-[440px] md:h-[520px] w-full rounded-xl border border-[#21312D] bg-gradient-to-b from-[#030706] via-[#050C0B] to-[#0A1614] overflow-hidden select-none">
        {/* Atmósfera curvada y horizonte de la Tierra al fondo */}
        <div className="pointer-events-none absolute -bottom-[420px] left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-[50%] bg-gradient-to-t from-[#0e2722] via-[#08302b] to-[#124d45] opacity-50 blur-[2px]" />
        <div className="pointer-events-none absolute -bottom-[422px] left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-[50%] border-t-2 border-[#68D9D0]/40 shadow-[0_-8px_30px_rgba(104,217,208,0.25)]" />

        {/* Estrellas discretas en el fondo */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute top-10 left-[15%] h-1 w-1 rounded-full bg-white/70" />
          <div className="absolute top-28 left-[35%] h-0.5 w-0.5 rounded-full bg-white/50" />
          <div className="absolute top-8 left-[65%] h-1 w-1 rounded-full bg-white/60" />
          <div className="absolute top-24 left-[85%] h-0.5 w-0.5 rounded-full bg-white/40" />
          <div className="absolute top-44 left-[10%] h-0.5 w-0.5 rounded-full bg-white/50" />
          <div className="absolute top-52 left-[50%] h-1 w-1 rounded-full bg-white/80" />
          <div className="absolute top-36 left-[75%] h-0.5 w-0.5 rounded-full bg-white/40" />
        </div>

        {/* Cono de barrido térmico hacia la Tierra (Thermal Scan Swath) */}
        <div
          className={`pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 w-[340px] h-[220px] opacity-25 transition-opacity duration-700 ${
            isExploded ? 'opacity-0' : 'opacity-25'
          }`}
          style={{
            background: isModis
              ? 'conic-gradient(from 180deg at 50% 0%, transparent 65deg, rgba(104,217,208,0.4) 85deg, rgba(104,217,208,0.6) 90deg, rgba(104,217,208,0.4) 95deg, transparent 115deg)'
              : 'conic-gradient(from 180deg at 50% 0%, transparent 68deg, rgba(255,156,85,0.4) 86deg, rgba(255,156,85,0.7) 90deg, rgba(255,156,85,0.4) 94deg, transparent 112deg)',
          }}
        />

        {/* SVG Ilustración en perspectiva oblicua y despiece animado */}
        <svg
          viewBox="0 0 960 520"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Ilustración esquemática del instrumento ${isModis ? 'MODIS' : 'VIIRS'} y plataforma orbital`}
        >
          <defs>
            {/* Gradientes metálicos y dorados de mantas térmicas (MLI) */}
            <linearGradient id="mliGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E5A642" />
              <stop offset="35%" stopColor="#C48220" />
              <stop offset="70%" stopColor="#F5C065" />
              <stop offset="100%" stopColor="#966012" />
            </linearGradient>

            <linearGradient id="metalBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#233531" />
              <stop offset="50%" stopColor="#364E48" />
              <stop offset="100%" stopColor="#1B2B27" />
            </linearGradient>

            <linearGradient id="solarCell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#142C44" />
              <stop offset="50%" stopColor="#0B1A2C" />
              <stop offset="100%" stopColor="#1E3E5C" />
            </linearGradient>

            <linearGradient id="lensGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#051B22" />
              <stop offset="50%" stopColor="#1D4A57" />
              <stop offset="100%" stopColor="#07191E" />
            </linearGradient>

            {/* Filtro de sombra sutil */}
            <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ========================================================
              GRUPO 1: PANEL SOLAR ARTICULADO (Se mueve hacia la izquierda)
              ======================================================== */}
          <g
            className="transition-transform duration-700 ease-out cursor-pointer"
            style={{
              transform: isExploded ? 'translate(-120px, -25px)' : 'translate(0px, 0px)',
            }}
            onClick={() => setActiveCallout('solar')}
          >
            {/* Brazo estructural del panel */}
            <line x1="330" y1="230" x2="250" y2="215" stroke="#718B84" strokeWidth="4" />
            <circle cx="250" cy="215" r="4" fill="#B8EE68" />

            {/* Secciones de celdas solares (Ala articulada) */}
            <g transform="translate(40, 100)">
              {/* Marco del ala */}
              <polygon
                points="30,40 210,10 200,230 20,260"
                fill="url(#solarCell)"
                stroke="#3D6359"
                strokeWidth="2"
              />
              {/* Cuadrícula de celdas fotovoltaicas */}
              <line x1="85" y1="30" x2="75" y2="250" stroke="#2B463F" strokeWidth="1.5" />
              <line x1="145" y1="20" x2="135" y2="240" stroke="#2B463F" strokeWidth="1.5" />
              <line x1="28" y1="95" x2="202" y2="65" stroke="#2B463F" strokeWidth="1.5" />
              <line x1="24" y1="150" x2="198" y2="120" stroke="#2B463F" strokeWidth="1.5" />
              <line x1="22" y1="205" x2="196" y2="175" stroke="#2B463F" strokeWidth="1.5" />

              {/* Reflejo azul en celdas */}
              <polygon points="50,55 190,30 180,80 45,100" fill="#68D9D0" opacity="0.1" />
            </g>
          </g>

          {/* ========================================================
              GRUPO 2: PLATAFORMA CENTRAL / BUS (Estructura y Manta Dorada MLI)
              ======================================================== */}
          <g
            className="transition-transform duration-700 ease-out"
            style={{
              transform: isExploded ? 'translate(0px, 0px)' : 'translate(0px, 0px)',
            }}
            onClick={() => setActiveCallout('thermal')}
          >
            {/* Cuerpo principal en perspectiva isométrica */}
            {/* Cara superior */}
            <polygon
              points="420,130 550,110 590,160 460,185"
              fill="#263E38"
              stroke="#43625A"
              strokeWidth="2"
            />
            {/* Cara lateral izquierda (dorada MLI) */}
            <polygon
              points="420,130 460,185 460,320 420,250"
              fill="url(#mliGold)"
              stroke="#B37C22"
              strokeWidth="1.5"
            />
            {/* Cara frontal (dorada MLI + radiador) */}
            <polygon
              points="460,185 590,160 590,290 460,320"
              fill="url(#mliGold)"
              stroke="#B37C22"
              strokeWidth="1.5"
            />

            {/* Aletas de radiador térmico sobre cara frontal */}
            <g opacity="0.85">
              <line x1="475" y1="200" x2="575" y2="180" stroke="#EFF5ED" strokeWidth="1.5" />
              <line x1="475" y1="215" x2="575" y2="195" stroke="#EFF5ED" strokeWidth="1.5" />
              <line x1="475" y1="230" x2="575" y2="210" stroke="#EFF5ED" strokeWidth="1.5" />
              <line x1="475" y1="245" x2="575" y2="225" stroke="#EFF5ED" strokeWidth="1.5" />
              <line x1="475" y1="260" x2="575" y2="240" stroke="#EFF5ED" strokeWidth="1.5" />
            </g>

            {/* Cableado y arneses térmicos discretos */}
            <path
              d="M 435,170 Q 450,195 440,240"
              fill="none"
              stroke="#E5A642"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          </g>

          {/* ========================================================
              GRUPO 3: ANTENA PARABÓLICA Y COMUNICACIONES (Se mueve hacia arriba/derecha)
              ======================================================== */}
          <g
            className="transition-transform duration-700 ease-out cursor-pointer"
            style={{
              transform: isExploded ? 'translate(95px, -70px)' : 'translate(0px, 0px)',
            }}
            onClick={() => setActiveCallout('comms')}
          >
            {/* Mástil y junta articulada */}
            <line x1="560" y1="130" x2="620" y2="80" stroke="#87A39B" strokeWidth="3" />
            <circle cx="620" cy="80" r="3.5" fill="#B8EE68" />

            {/* Plato parabólico */}
            <ellipse
              cx="670"
              cy="65"
              rx="45"
              ry="26"
              fill="#D4DFDC"
              stroke="#527068"
              strokeWidth="2"
              transform="rotate(-25, 670, 65)"
            />
            {/* Feed horn en el foco */}
            <line x1="670" y1="65" x2="650" y2="40" stroke="#21312D" strokeWidth="2" />
            <circle cx="650" cy="40" r="3" fill="#68D9D0" />
          </g>

          {/* ========================================================
              GRUPO 4: CARGA ÚTIL — SENSOR ÓPTICO (MODIS o VIIRS)
              (Se mueve hacia abajo en modo desarmado)
              ======================================================== */}
          <g
            className="transition-transform duration-700 ease-out cursor-pointer"
            style={{
              transform: isExploded ? 'translate(0px, 95px)' : 'translate(0px, 0px)',
            }}
            onClick={() => setActiveCallout('payload')}
          >
            {/* Guías mecánicas de montaje a la plataforma */}
            {isExploded && (
              <g stroke="#B8EE68" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6">
                <line x1="490" y1="315" x2="490" y2="400" />
                <line x1="560" y1="285" x2="560" y2="370" />
              </g>
            )}

            {isModis ? (
              /* INSTRUMENTO MODIS: Barril óptico rectangular con espejo de barrido transversal */
              <g id="modis-payload">
                {/* Carcasa del instrumento */}
                <polygon
                  points="475,310 575,290 585,360 485,385"
                  fill="url(#metalBody)"
                  stroke="#68D9D0"
                  strokeWidth="2"
                />
                {/* Apertura del escáner transversal de 1 km */}
                <ellipse cx="530" cy="345" rx="22" ry="14" fill="url(#lensGlass)" stroke="#68D9D0" strokeWidth="2" />
                {/* Espejo de escaneo rotativo */}
                <line x1="518" y1="345" x2="542" y2="345" stroke="#EFF5ED" strokeWidth="2" />
                {/* Badge técnico en el chasis */}
                <text x="495" y="325" fill="#68D9D0" fontSize="9" fontFamily="DM Mono" fontWeight="bold">
                  MODIS · 36B
                </text>
              </g>
            ) : (
              /* INSTRUMENTO VIIRS: Mayor apertura óptica y cabeza rotativa cilíndrica de 375m */
              <g id="viirs-payload">
                {/* Carcasa agrandada con mayor telescopio */}
                <polygon
                  points="465,305 585,280 600,370 475,400"
                  fill="url(#metalBody)"
                  stroke="#FF9C55"
                  strokeWidth="2.5"
                />
                {/* Gran apertura óptica circular para bandas I y M */}
                <ellipse cx="535" cy="350" rx="30" ry="18" fill="url(#lensGlass)" stroke="#FF9C55" strokeWidth="2.5" />
                <ellipse cx="535" cy="350" rx="16" ry="10" fill="#0D1816" stroke="#FF6759" strokeWidth="1.5" />
                {/* Conjunto de calibrador solar integrado */}
                <rect x="565" y="300" width="16" height="22" fill="#E5A642" stroke="#875710" strokeWidth="1" />
                {/* Badge técnico en el chasis */}
                <text x="485" y="322" fill="#FF9C55" fontSize="9" fontFamily="DM Mono" fontWeight="bold">
                  VIIRS · 375m I-Band
                </text>
              </g>
            )}
          </g>

          {/* ========================================================
              GRUPO 5: SUBSISTEMAS AUXILIARES (Star Tracker & Propulsión)
              ======================================================== */}
          {/* Rastreador de estrellas (Star Tracker / AOCS) */}
          <g
            className="transition-transform duration-700 ease-out cursor-pointer"
            style={{
              transform: isExploded ? 'translate(65px, -15px)' : 'translate(0px, 0px)',
            }}
            onClick={() => setActiveCallout('aocs')}
          >
            <polygon points="575,170 605,160 610,185 580,195" fill="#1B2B27" stroke="#718B84" strokeWidth="1.5" />
            <circle cx="595" cy="175" r="4.5" fill="#07191E" stroke="#B8EE68" strokeWidth="1.5" />
          </g>

          {/* Toberas de propulsión orbital trasera */}
          <g
            className="transition-transform duration-700 ease-out cursor-pointer"
            style={{
              transform: isExploded ? 'translate(45px, 35px)' : 'translate(0px, 0px)',
            }}
            onClick={() => setActiveCallout('propulsion')}
          >
            <polygon points="585,260 610,250 612,270 587,278" fill="#FF6759" opacity="0.85" />
          </g>

          {/* ========================================================
              LÍNEAS DE LLAMADA Y ETIQUETAS TÉCNICAS (Visibles al Desarmar)
              ======================================================== */}
          {isExploded && (
            <g className="transition-opacity duration-500 ease-in opacity-100 font-mono text-[11px]">
              {/* Etiqueta 1: Panel Solar */}
              <g>
                <line x1="160" y1="180" x2="90" y2="130" stroke="#B8EE68" strokeWidth="1.5" />
                <circle cx="160" cy="180" r="3" fill="#B8EE68" />
                <rect x="15" y="105" width="135" height="42" rx="4" fill="#0D1816" stroke="#21312D" />
                <text x="25" y="123" fill="#B8EE68" fontWeight="bold">
                  Panel Solar GaAs
                </text>
                <text x="25" y="138" fill="#93A39C" fontSize="9">
                  3.0 kW · 1 Ala orientable
                </text>
              </g>

              {/* Etiqueta 2: Antena de Telemetría */}
              <g>
                <line x1="740" y1="75" x2="800" y2="75" stroke="#68D9D0" strokeWidth="1.5" />
                <circle cx="740" cy="75" r="3" fill="#68D9D0" />
                <rect x="800" y="55" width="145" height="42" rx="4" fill="#0D1816" stroke="#21312D" />
                <text x="810" y="73" fill="#68D9D0" fontWeight="bold">
                  Antena Banda X / S
                </text>
                <text x="810" y="88" fill="#93A39C" fontSize="9">
                  Enlace FIRMS / TDRSS
                </text>
              </g>

              {/* Etiqueta 3: Plataforma y MLI */}
              <g>
                <line x1="430" y1="210" x2="330" y2="150" stroke="#FF9C55" strokeWidth="1.5" />
                <circle cx="430" cy="210" r="3" fill="#FF9C55" />
                <rect x="235" y="125" width="150" height="42" rx="4" fill="#0D1816" stroke="#21312D" />
                <text x="245" y="143" fill="#FF9C55" fontWeight="bold">
                  Bus & Mantas MLI
                </text>
                <text x="245" y="158" fill="#93A39C" fontSize="9">
                  Aislamiento térmico Kapton
                </text>
              </g>

              {/* Etiqueta 4: Carga Útil (MODIS o VIIRS) */}
              <g>
                <line x1="535" y1="440" x2="535" y2="475" stroke="#B8EE68" strokeWidth="1.5" />
                <circle cx="535" cy="440" r="3" fill="#B8EE68" />
                <rect x="420" y="465" width="230" height="44" rx="4" fill="#0D1816" stroke="#B8EE68" />
                <text x="430" y="483" fill="#B8EE68" fontWeight="bold">
                  {isModis ? 'Sensor MODIS (36 bandas)' : 'Sensor VIIRS (22 bandas)'}
                </text>
                <text x="430" y="498" fill="#EFF5ED" fontSize="10">
                  {isModis ? 'Resolución fuego: ~1 km nominal' : 'Resolución I-band: 375 m en nadir'}
                </text>
              </g>

              {/* Etiqueta 5: Control de Actitud (Star Tracker) */}
              <g>
                <line x1="660" y1="175" x2="740" y2="175" stroke="#EFF5ED" strokeWidth="1.5" />
                <circle cx="660" cy="175" r="3" fill="#EFF5ED" />
                <rect x="740" y="155" width="150" height="42" rx="4" fill="#0D1816" stroke="#21312D" />
                <text x="750" y="173" fill="#EFF5ED" fontWeight="bold">
                  AOCS (Star Trackers)
                </text>
                <text x="750" y="188" fill="#93A39C" fontSize="9">
                  Apuntamiento nadir 3 ejes
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Badge flotante en la esquina inferior izquierda */}
        <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-[#21312D] bg-[#07100F]/90 px-3 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-[#B8EE68]" />
            <span className="font-mono font-semibold text-[#EFF5ED]">
              {isModis ? 'Instrumento MODIS (Terra/Aqua)' : 'Instrumento VIIRS (Suomi-NPP)'}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-[#93A39C]">
            {isModis
              ? 'Escaneo transversal ±55° · 36 bandas · Registro 2000–hoy'
              : 'Escaneo rotativo bilateral · Bandas térmicas I4/I5 a 375m · Registro 2012–hoy'}
          </p>
        </div>

        {/* Indicador de modo interactivo */}
        <div className="absolute top-3 right-3 z-10 rounded-lg border border-[#21312D] bg-[#07100F]/80 px-2.5 py-1 text-[11px] font-mono text-[#93A39C]">
          {isExploded ? 'Vista: Despiece Técnico' : 'Vista: Ensamblado Orbital'}
        </div>
      </div>

      {/* Fila limpia de subsistemas explicados (7 subsistemas de misión) */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUBSYSTEMS.map((sub) => {
          const isActive = activeCallout === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => setActiveCallout(isActive ? null : sub.id)}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-[#B8EE68] bg-[#111E1B] shadow-md'
                  : 'border-[#21312D] bg-[#0D1816] hover:border-[#2A3F3A] hover:bg-[#111E1B]/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sub.icon}
                    <h3 className="text-xs font-bold text-[#EFF5ED]">{sub.name}</h3>
                  </div>
                </div>
                <div className="mt-1 font-mono text-[10px] text-[#93A39C]">{sub.specs}</div>
                <p className="mt-2 text-xs leading-relaxed text-[#93A39C]">{sub.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlaces a fuentes científicas primarias */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#21312D] pt-4 text-xs text-[#93A39C]">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Flame className="h-3.5 w-3.5 text-[#FF6759]" />
          <span>NASA Space Apps Challenge 2026: Harmonization of MODIS and VIIRS Hot Spots</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <a
            href="https://modis.gsfc.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#68D9D0] hover:underline"
          >
            <span>NASA MODIS Science</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms/viirs-i-band-375-m-active-fire-data"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#FF9C55] hover:underline"
          >
            <span>NOAA/NASA VIIRS FIRMS</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
};
