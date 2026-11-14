import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SATELLITES, type SatelliteData } from '../../data/satellites';
import { SatelliteModel } from './SatelliteModel';
import { SatelliteSelector } from './SatelliteSelector';
import { SatelliteInfo } from './SatelliteInfo';
import { RotateCw, RefreshCw, AlertTriangle, Eye, Loader2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ModelErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}

const CanvasLoader: React.FC = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 backdrop-blur-sm text-cyan-400 z-10">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
      Cargando modelo 3D oficial...
    </span>
  </div>
);

export const SatelliteViewer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<'terra' | 'aqua' | 'suomi'>('terra');
  const [autoRotate, setAutoRotate] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const satellite: SatelliteData = SATELLITES[selectedId];

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleSelectSatellite = (id: 'terra' | 'aqua' | 'suomi') => {
    setSelectedId(id);
    handleResetCamera();
  };

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-[580px] lg:min-h-[640px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      {/* Barra superior de controles */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Visor 3D de Satélites
              <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-700/50">
                NASA EOS & VIIRS
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Modelos orbitales tridimensionales oficiales de la NASA
            </p>
          </div>
        </div>

        {/* Selector de satélite */}
        <SatelliteSelector selectedId={selectedId} onSelect={handleSelectSatellite} />

        {/* Acciones de cámara y rotación */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            aria-pressed={autoRotate}
            title={autoRotate ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              autoRotate
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin-slow' : ''}`} />
            <span className="hidden sm:inline">Auto-rotar</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Restablecer posición de cámara"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Contenedor principal: Canvas 3D + Panel de información */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Viewport 3D Three.js (7 columnas en desktop) */}
        <div className="relative lg:col-span-7 h-[380px] lg:h-full min-h-[380px] bg-gradient-to-b from-[#040711] via-[#070b18] to-[#040711] select-none">
          <ModelErrorBoundary
            key={`${selectedId}-${retryKey}`}
            fallback={(_error, reset) => (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-10">
                <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
                <h3 className="text-sm font-bold text-white">Error al cargar el modelo 3D</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  No se pudo cargar el archivo GLB desde <code className="text-cyan-300">{satellite.modelPath}</code>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    handleRetry();
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}
          >
            <Suspense fallback={<CanvasLoader />}>
              <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [3, 2, 4], fov: 45 }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              >
                {/* Fondo estrellado espacial */}
                <color attach="background" args={['#050814']} />
                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />

                {/* Iluminación científica calibrada */}
                <ambientLight intensity={0.9} />
                <directionalLight position={[10, 15, 10]} intensity={2.2} castShadow />
                <directionalLight position={[-10, -5, -10]} intensity={0.8} color="#9ec5f4" />
                <pointLight position={[0, -5, 5]} intensity={0.6} color="#ffffff" />
                <pointLight position={[0, 8, 0]} intensity={0.5} color="#e0f2fe" />

                {/* Encuadre automático adaptable a las dimensiones de cada satélite */}
                <Bounds fit clip observe margin={1.25}>
                  <SatelliteModel
                    key={satellite.modelPath}
                    modelPath={satellite.modelPath}
                    autoRotate={autoRotate}
                    rotationSpeed={0.2}
                  />
                </Bounds>

                {/* Controles de órbita e interacción táctil / mouse */}
                <OrbitControls
                  ref={controlsRef}
                  makeDefault
                  enablePan={false}
                  enableZoom={true}
                  minDistance={1.2}
                  maxDistance={12}
                  dampingFactor={0.05}
                  rotateSpeed={0.8}
                  zoomSpeed={0.9}
                />
              </Canvas>
            </Suspense>
          </ModelErrorBoundary>

          {/* Guía de interacción en esquina inferior */}
          <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-slate-950/70 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur-md border border-slate-800 pointer-events-none">
            Arrastrá para rotar · Rueda o pellizco para zoom
          </div>
        </div>

        {/* Panel lateral con información del satélite (5 columnas en desktop) */}
        <div className="lg:col-span-5 p-4 lg:p-6 overflow-y-auto max-h-[400px] lg:max-h-full bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-slate-800">
          <SatelliteInfo satellite={satellite} />
        </div>
      </div>
    </div>
  );
};
