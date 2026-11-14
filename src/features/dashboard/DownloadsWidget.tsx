import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, Check } from "lucide-react";

interface DownloadsWidgetProps {
  zonaNombre: string;
  capa: string;
  className?: string;
}

export const DownloadsWidget: React.FC<DownloadsWidgetProps> = ({ zonaNombre, capa, className = '' }) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (tipo: "calendario" | "focos") => {
    setDownloading(tipo);

    // Generar archivo CSV en memoria con metadatos de procedencia (docs/03 y docs/07)
    const timestamp = new Date().toISOString().slice(0, 10);
    const headers =
      tipo === "calendario"
        ? "# FuegoContinuo · NASA Space Apps Challenge 2026\n# Source: NASA FIRMS (MODIS & VIIRS) | Boundaries: IGN\n# Filters: Zone=" +
          zonaNombre +
          " | Layer=" +
          capa +
          " | Date=" +
          timestamp +
          "\nyear,month,harmonized_spots,modis_count,viirs_count,status,estimated_frac,confidence\n"
        : "# FuegoContinuo · NASA Space Apps Challenge 2026\n# Active Thermal Hot Spots | VIIRS S-NPP Scale\n# Zone=" +
          zonaNombre +
          " | Layer=" +
          capa +
          "\nlatitude,longitude,date,utc_time,satellite,instrument,brightness_kelvin,power_mw,confidence\n";

    const sampleRow =
      tipo === "calendario"
        ? "2020,08,4812,1720,4600,observed,0.0,high\n2006,08,359,120,null,estimated,1.0,medium\n"
        : "-31.42,-64.18,2024-09-15,17:35,Suomi-NPP,VIIRS,342.5,48.2,high\n-31.55,-64.32,2024-09-15,14:10,Aqua,MODIS,328.0,32.0,nominal\n";

    const blob = new Blob([headers + sampleRow], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `fuego-continuo-${tipo}-${zonaNombre.toLowerCase().replace(/\s+/g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  };

  return (
    <div
      role="region"
      aria-label={t("downloads.title")}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D1816] p-3 text-[#EFF5ED] ${className}`}
    >
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-[#B8EE68]" />
        <div>
          <span className="font-title text-xs md:text-sm font-bold text-[#EFF5ED]">
            {t("downloads.title")}
          </span>
          <p className="text-xs text-[#93A39C]">{t("downloads.subtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleDownload("calendario")}
          disabled={downloading !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-1.5 font-sans text-xs font-medium text-[#EFF5ED] hover:border-[#B8EE68]/40 hover:bg-[#1A332C]/40 transition-colors"
        >
          {downloading === "calendario" ? (
            <Check className="h-3.5 w-3.5 text-[#B8EE68]" />
          ) : (
            <Download className="h-3.5 w-3.5 text-[#B8EE68]" />
          )}
          <span>{t("downloads.calendarBtn")}</span>
        </button>

        <button
          type="button"
          onClick={() => handleDownload("focos")}
          disabled={downloading !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-1.5 font-sans text-xs font-medium text-[#EFF5ED] hover:border-[#B8EE68]/40 hover:bg-[#1A332C]/40 transition-colors"
        >
          {downloading === "focos" ? (
            <Check className="h-3.5 w-3.5 text-[#FF9C55]" />
          ) : (
            <Download className="h-3.5 w-3.5 text-[#FF9C55]" />
          )}
          <span>{t("downloads.spotsBtn")}</span>
        </button>
      </div>
    </div>
  );
};
