import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  descargarCsv,
  rangoDelMes,
  type PedidoZona,
  type PeriodoParams,
} from "../../api";

import { formatMes } from "../../i18n/formatMes";

interface DownloadsWidgetProps {
  zonaNombre: string;
  pedido: PedidoZona | null;
  /** Período del calendario (YYYY-MM); vacío = todo el registro. */
  periodo?: Omit<PeriodoParams, "capa">;
  /** Mes que muestra el mapa (YYYY-MM): define el rango de "Focos CSV". */
  mesMapa: string | null;
  fechaMin?: string;
  fechaMax?: string;
}

type Tipo = "calendario" | "focos";

export const DownloadsWidget: React.FC<DownloadsWidgetProps> = ({
  zonaNombre,
  pedido,
  periodo = {},
  mesMapa,
  fechaMin,
  fechaMax,
}) => {
  const { i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith("es"));
  const [downloading, setDownloading] = useState<Tipo | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const rangoFocos = mesMapa ? rangoDelMes(mesMapa, fechaMin, fechaMax) : null;
  const slug = zonaNombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

  const handleDownload = async (tipo: Tipo) => {
    if (!pedido) return;
    if (tipo === "focos" && !rangoFocos) return;
    setDownloading(tipo);
    setMensaje(null);
    try {
      const nombre = await descargarCsv(
        pedido,
        tipo === "calendario"
          ? { tipo, ...periodo }
          : { tipo, desde: rangoFocos!.desde, hasta: rangoFocos!.hasta, sensor: "todos" },
        `${tipo}_${slug}.csv`,
      );
      setMensaje({ ok: true, texto: isEn ? `Downloaded ${nombre}` : `Descargado: ${nombre}` });
    } catch (err) {
      // La API ya devuelve el mensaje en español (p. ej. 413: acotá el período)
      setMensaje({ ok: false, texto: err instanceof Error ? err.message : String(err) });
    } finally {
      setDownloading(null);
    }
  };

  const disabled = downloading !== null || !pedido;
  const titulo = isEn ? "Download CSV" : "Descargar CSV";
  const botonDescarga = "flex min-w-0 items-start gap-2 rounded-md border border-[#2A3F3A] bg-[#111E1B] px-3 py-2 text-left hover:border-[#B8EE68]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8EE68] disabled:opacity-50";

  const mesInicial = periodo.desde ?? fechaMin?.slice(0, 7);
  const mesFinal = periodo.hasta ?? fechaMax?.slice(0, 7);
  const rangoCalendario = mesInicial && mesFinal
    ? `${formatMes(mesInicial, isEn)} – ${formatMes(mesFinal, isEn)}`
    : (isEn ? "Full record" : "Todo el registro");

  return (
    <section aria-labelledby="titulo-descargas" className="grid gap-2 border-t border-[#21312D] pt-3 text-[#EFF5ED] sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
      <h2 id="titulo-descargas" className="text-sm font-medium sm:pt-2.5">{titulo}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleDownload("calendario")}
          disabled={disabled}
          className={botonDescarga}
        >
          {downloading === "calendario" ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" /> : <Download className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="text-sm">
            {isEn ? "Calendar" : "Calendario"}
            <span className="block text-xs text-[#C8D3CE]">{rangoCalendario} · {isEn ? "MODIS, VIIRS and harmonized" : "MODIS, VIIRS y armonizado"}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleDownload("focos")}
          disabled={disabled || !rangoFocos}
          className={botonDescarga}
        >
          {downloading === "focos" ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" /> : <Download className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="text-sm">
            {isEn ? "Hot spots" : "Focos"}
            {mesMapa && (
              <span className="block text-xs text-[#C8D3CE]">
                {formatMes(mesMapa, isEn)} · {isEn ? "All sensors" : "Todos los sensores"}
              </span>
            )}
          </span>
        </button>
      </div>

      {mensaje && (
        <p
          role={mensaje.ok ? "status" : "alert"}
          className={`flex items-start gap-1.5 text-xs sm:col-start-2 ${mensaje.ok ? "text-[#B8EE68]" : "text-[#FF6759]"}`}
        >
          {mensaje.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />}
          <span>{mensaje.texto}</span>
        </p>
      )}
    </section>
  );
};
