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
  className?: string;
}

type Tipo = "calendario" | "focos";

export const DownloadsWidget: React.FC<DownloadsWidgetProps> = ({
  zonaNombre,
  pedido,
  periodo = {},
  mesMapa,
  fechaMin,
  fechaMax,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
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

  const mesInicial = periodo.desde ?? fechaMin?.slice(0, 7);
  const mesFinal = periodo.hasta ?? fechaMax?.slice(0, 7);
  const rangoCalendario = mesInicial && mesFinal
    ? `${formatMes(mesInicial, isEn)} – ${formatMes(mesFinal, isEn)}`
    : (isEn ? "Full record" : "Todo el registro");

  return (
    <details aria-label={t("downloads.title")} className={`text-[#EFF5ED] ${className}`}>
      <summary className="min-h-10 cursor-pointer rounded-md px-2 py-2 text-sm text-[#C8D3CE] hover:text-[#EFF5ED]">
        {isEn ? "Download CSV" : "Descargar CSV"}
      </summary>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => handleDownload("calendario")}
          disabled={disabled}
          className="flex items-start gap-2 rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-2 text-left hover:border-[#B8EE68]/40 disabled:opacity-50"
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
          className="flex items-start gap-2 rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-2 text-left hover:border-[#B8EE68]/40 disabled:opacity-50"
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
          className={`flex items-start gap-1.5 text-xs ${mensaje.ok ? "text-[#B8EE68]" : "text-[#FF6759]"}`}
        >
          {mensaje.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />}
          <span>{mensaje.texto}</span>
        </p>
      )}
    </details>
  );
};
