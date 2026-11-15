import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  descargarCsv,
  rangoDelMes,
  type Capa,
  type PedidoZona,
  type PeriodoParams,
} from "../../api";

interface DownloadsWidgetProps {
  zonaNombre: string;
  pedido: PedidoZona | null;
  capa: Capa;
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
  capa,
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
          ? { tipo, ...periodo, capa }
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

  return (
    <div role="region" aria-label={t("downloads.title")} className={`flex flex-col gap-2 bg-[#0D1816] p-3 text-[#EFF5ED] ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-[#B8EE68]" />
          <div>
            <span className="font-title text-xs md:text-sm font-bold text-[#EFF5ED]">{t("downloads.title")}</span>
            <p className="text-xs text-[#93A39C]">{t("downloads.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload("calendario")}
            disabled={disabled}
            title={isEn ? "Monthly calendar for the selected zone and period" : "Calendario mensual de la zona y el período elegidos"}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-1.5 font-sans text-xs font-medium text-[#EFF5ED] hover:border-[#B8EE68]/40 hover:bg-[#1A332C]/40 transition-colors disabled:opacity-50"
          >
            {downloading === "calendario" ? <Loader2 className="h-3.5 w-3.5 text-[#B8EE68] animate-spin" /> : <Download className="h-3.5 w-3.5 text-[#B8EE68]" />}
            <span>{t("downloads.calendarBtn")}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload("focos")}
            disabled={disabled || !rangoFocos}
            title={
              rangoFocos
                ? isEn
                  ? `Individual detections from ${rangoFocos.desde} to ${rangoFocos.hasta} (map month)`
                  : `Focos individuales del ${rangoFocos.desde} al ${rangoFocos.hasta} (mes del mapa)`
                : undefined
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-1.5 font-sans text-xs font-medium text-[#EFF5ED] hover:border-[#B8EE68]/40 hover:bg-[#1A332C]/40 transition-colors disabled:opacity-50"
          >
            {downloading === "focos" ? <Loader2 className="h-3.5 w-3.5 text-[#FF9C55] animate-spin" /> : <Download className="h-3.5 w-3.5 text-[#FF9C55]" />}
            <span>
              {t("downloads.spotsBtn")}
              {mesMapa && <span className="ml-1 font-mono text-[#93A39C]">{mesMapa}</span>}
            </span>
          </button>
        </div>
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
    </div>
  );
};
