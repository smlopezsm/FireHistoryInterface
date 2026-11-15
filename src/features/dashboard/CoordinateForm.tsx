import React, { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { bboxDePunto, validarBbox, type BBox, type ZonaSeleccionada } from "../../api";

interface CoordinateFormProps {
  isEn: boolean;
  selectedZone: ZonaSeleccionada;
  /** bbox validado; porPunto = vino de "punto y radio". */
  onApply: (bbox: BBox, porPunto: boolean) => void;
}

type Modo = "punto" | "rect";

/** Acepta coma o punto decimal ("-33,3" o "-33.3"). */
const num = (s: string) => (s.trim() === "" ? NaN : Number(s.trim().replace(",", ".")));
const txt = (n: number) => String(Math.round(n * 1e4) / 1e4);

const inputCls =
  "w-full rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1.5 font-mono text-xs text-[#EFF5ED] placeholder-[#475753] focus:border-[#B8EE68] focus:outline-none";

/** Carga manual de zona: punto (lat/lon) con radio, o rectángulo oeste/sur/este/norte. */
export const CoordinateForm: React.FC<CoordinateFormProps> = ({ isEn, selectedZone, onApply }) => {
  const [modo, setModo] = useState<Modo>("punto");
  const [lat, setLat] = useState(txt(selectedZone.center[1]));
  const [lon, setLon] = useState(txt(selectedZone.center[0]));
  const [radio, setRadio] = useState("50");
  const b = selectedZone.bbox;
  const [oeste, setOeste] = useState(b ? txt(b[0]) : "");
  const [sur, setSur] = useState(b ? txt(b[1]) : "");
  const [este, setEste] = useState(b ? txt(b[2]) : "");
  const [norte, setNorte] = useState(b ? txt(b[3]) : "");
  const [error, setError] = useState<string | null>(null);

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    const r =
      modo === "punto"
        ? bboxDePunto(num(lat), num(lon), num(radio), isEn)
        : validarBbox(num(oeste), num(sur), num(este), num(norte), isEn);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    onApply(r.bbox, modo === "punto");
  };

  const campo = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <label htmlFor={id} className="flex flex-col gap-1 text-[#93A39C]">
      <span>{label}</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
        className={inputCls}
      />
    </label>
  );

  return (
    <form
      onSubmit={aplicar}
      aria-label={isEn ? "Enter coordinates" : "Ingresar coordenadas"}
      className="flex flex-col gap-2.5 rounded-md border border-[#21312D] bg-[#07100F] p-3 font-sans text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#EFF5ED]">{isEn ? "Custom area" : "Zona por coordenadas"}</span>
        <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-md border border-[#21312D] bg-[#111E1B] p-1">
          {([
            ["punto", isEn ? "Point + radius" : "Punto y radio"],
            ["rect", isEn ? "Rectangle" : "Rectángulo"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={modo === m}
              onClick={() => {
                setModo(m);
                setError(null);
              }}
              className={`rounded px-2.5 py-1 font-semibold ${modo === m ? "bg-[#B8EE68] text-[#07100F]" : "text-[#93A39C] hover:text-[#EFF5ED]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {modo === "punto" ? (
        <div className="grid grid-cols-3 gap-2">
          {campo("coord-lat", isEn ? "Latitude" : "Latitud", lat, setLat, "-33.30")}
          {campo("coord-lon", isEn ? "Longitude" : "Longitud", lon, setLon, "-66.34")}
          {campo("coord-radio", isEn ? "Radius (km)" : "Radio (km)", radio, setRadio, "50")}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {campo("coord-oeste", isEn ? "West (lon)" : "Oeste (lon)", oeste, setOeste, "-67.4")}
          {campo("coord-sur", isEn ? "South (lat)" : "Sur (lat)", sur, setSur, "-36.0")}
          {campo("coord-este", isEn ? "East (lon)" : "Este (lon)", este, setEste, "-64.9")}
          {campo("coord-norte", isEn ? "North (lat)" : "Norte (lat)", norte, setNorte, "-31.8")}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[#93A39C]">
          {isEn
            ? "Decimal degrees; south and west are negative."
            : "Grados decimales; el sur y el oeste son negativos."}
        </span>
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-md bg-[#B8EE68] px-3 py-1.5 font-bold text-[#07100F] hover:bg-[#cbf58c]"
        >
          <Check className="h-3.5 w-3.5" />
          {isEn ? "Use this area" : "Usar esta zona"}
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-[#FF6759]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </p>
      )}
    </form>
  );
};
