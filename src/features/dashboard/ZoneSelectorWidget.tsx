import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useProvincias,
  regionesDe,
  zonaDeRegion,
  esZonaRegion,
  zoomParaBbox,
  zonaDeBbox,
  ZONA_ARGENTINA,
  type Capa,
  type ZonaSeleccionada,
} from "../../api";
import { CoordinateForm } from "./CoordinateForm";
import { PeriodRangePicker, type Periodo } from "./PeriodRangePicker";

/** @deprecated usar ZonaSeleccionada */
export type ZoneItem = ZonaSeleccionada;
export type { Periodo };

interface ZoneSelectorWidgetProps {
  selectedZone: ZonaSeleccionada;
  onSelectZone: (zone: ZonaSeleccionada) => void;
  capa: Capa;
  onChangeCapa: (capa: Capa) => void;
  escalaFija: boolean;
  onChangeEscala: (fija: boolean) => void;
  periodo: Periodo;
  onChangePeriodo: (periodo: Periodo) => void;
  mesMin?: string;
  mesMax?: string;
  metadataError?: boolean;
}

const selectClass = "min-h-10 w-full rounded-md border border-[#2A3F3A] bg-[#111E1B] px-3 text-sm text-[#EFF5ED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8EE68]";
const COORDENADAS = "coordenadas";

export const ZoneSelectorWidget: React.FC<ZoneSelectorWidgetProps> = ({
  selectedZone, onSelectZone, capa, onChangeCapa, escalaFija, onChangeEscala,
  periodo, onChangePeriodo, mesMin, mesMax, metadataError,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !i18n?.language?.startsWith("es");
  const [showCoordinates, setShowCoordinates] = useState(false);
  const zoneRef = useRef<HTMLSelectElement>(null);
  const { data: provincias = [], error } = useProvincias();
  const regiones = regionesDe(provincias);
  const provinciasOrdenadas = [...provincias].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const zonaPropia = selectedZone.id !== ZONA_ARGENTINA.id && !selectedZone.provincia_id && !esZonaRegion(selectedZone);

  const elegirZona = (id: string) => {
    setShowCoordinates(id === COORDENADAS);
    if (id === COORDENADAS) return;
    if (id === ZONA_ARGENTINA.id) {
      onSelectZone(ZONA_ARGENTINA);
      return;
    }
    if (id.startsWith("region-")) {
      onSelectZone(zonaDeRegion(provincias, id.slice("region-".length)));
      return;
    }
    const p = provincias.find((item) => item.provincia_id === id);
    if (!p) return;
    const [oeste, sur, este, norte] = p.bbox;
    onSelectZone({
      id, provincia_id: id, nombre: p.nombre, region: p.region,
      center: [(oeste + este) / 2, (sur + norte) / 2],
      zoom: zoomParaBbox(p.bbox), bbox: p.bbox,
    });
  };

  const cerrarCoordenadas = () => {
    setShowCoordinates(false);
    zoneRef.current?.focus();
  };

  return (
    <div role="region" aria-label={t("zone.title")} className="min-w-0 text-[#EFF5ED]">
      <div className="grid items-start gap-3 min-[420px]:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <label htmlFor="zone-select" className="block text-sm font-medium">{isEn ? "Area" : "Zona"}</label>
          <select
            ref={zoneRef}
            id="zone-select"
            value={showCoordinates ? COORDENADAS : selectedZone.id}
            onChange={(e) => elegirZona(e.target.value)}
            className={selectClass}
          >
            <option value={ZONA_ARGENTINA.id}>{t("zone.allCountry")}</option>
            {regiones.length > 0 && (
              <optgroup label={isEn ? "Regions" : "Regiones"}>
                {regiones.map((region) => <option key={region} value={`region-${region}`}>{region}</option>)}
              </optgroup>
            )}
            {provinciasOrdenadas.length > 0 && (
              <optgroup label={isEn ? "Provinces" : "Provincias"}>
                {provinciasOrdenadas.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}
              </optgroup>
            )}
            {zonaPropia && <option value={selectedZone.id}>{selectedZone.geometria ? selectedZone.nombre : (isEn ? "Coordinates applied" : "Coordenadas aplicadas")}</option>}
            <option value={COORDENADAS}>{isEn ? "By coordinates" : "Por coordenadas"}</option>
          </select>
          {error && <p role="alert" className="text-xs text-[#FF9C55]">{error.message}</p>}
        </div>
        <PeriodRangePicker periodo={periodo} onChangePeriodo={onChangePeriodo} mesMin={mesMin} mesMax={mesMax} metadataError={metadataError} isEn={isEn} />
        <div className="min-w-0 space-y-1.5">
          <label htmlFor="capa-datos" className="block text-sm font-medium">{isEn ? "Layer" : "Capa"}</label>
          <select id="capa-datos" className={selectClass} value={capa} onChange={(e) => onChangeCapa(e.target.value as Capa)}>
            <option value="armonizado">{t("zone.harmonized")}</option>
            <option value="modis">MODIS</option>
            <option value="viirs">VIIRS</option>
          </select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <label htmlFor="escala-calendario" className="block text-sm font-medium">{isEn ? "Calendar color scale" : "Escala de color del calendario"}</label>
          <select id="escala-calendario" className={selectClass} value={escalaFija ? "fija" : "relativa"} onChange={(e) => onChangeEscala(e.target.value === "fija")}>
            <option value="relativa">{isEn ? "For this area and period" : "Para esta zona y período"}</option>
            <option value="fija">{isEn ? "Fixed to compare areas" : "Fija para comparar zonas"}</option>
          </select>
        </div>
      </div>
      {showCoordinates && (
        <div className="mt-3">
          <CoordinateForm
            isEn={isEn}
            selectedZone={selectedZone}
            editingRectangle={zonaPropia && Boolean(selectedZone.bbox)}
            onCancel={cerrarCoordenadas}
            onApply={(bbox) => {
              onSelectZone(zonaDeBbox(bbox, t("zone.coordinates"), "lat/lon"));
              cerrarCoordenadas();
            }}
          />
        </div>
      )}
    </div>
  );
};
