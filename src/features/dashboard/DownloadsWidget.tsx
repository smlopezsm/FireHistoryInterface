import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check } from 'lucide-react';

interface DownloadsWidgetProps {
  zonaNombre: string;
  capa: string;
}

export const DownloadsWidget: React.FC<DownloadsWidgetProps> = ({ zonaNombre, capa }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (tipo: 'calendario' | 'focos') => {
    setDownloading(tipo);

    // Generar archivo CSV en memoria con metadatos de procedencia (docs/03 y docs/07)
    const timestamp = new Date().toISOString().slice(0, 10);
    const headers =
      tipo === 'calendario'
        ? '# FuegoContinuo · NASA Space Apps Challenge 2026\n# Fuente: NASA FIRMS (MODIS & VIIRS) | Limites: IGN\n# Filtros: Zona=' +
          zonaNombre +
          ' | Capa=' +
          capa +
          ' | Fecha=' +
          timestamp +
          '\nanio,mes,focos_armonizados,modis_conteo,viirs_conteo,estado,frac_estimada,confianza\n'
        : '# FuegoContinuo · NASA Space Apps Challenge 2026\n# Puntos Calientes Activos (Hot Spots) | Escala VIIRS S-NPP\n# Zona=' +
          zonaNombre +
          ' | Capa=' +
          capa +
          '\nlatitud,longitud,fecha,hora_utc,satelite,instrumento,brillo_kelvin,potencia_mw,confianza\n';

    const sampleRow =
      tipo === 'calendario'
        ? '2020,08,4812,1720,4600,observado,0.0,alta\n2006,08,359,120,null,estimado,1.0,media\n'
        : '-31.42,-64.18,2024-09-15,17:35,Suomi-NPP,VIIRS,342.5,48.2,alta\n-31.55,-64.32,2024-09-15,14:10,Aqua,MODIS,328.0,32.0,nominal\n';

    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fuego-continuo-${tipo}-${zonaNombre.toLowerCase().replace(/\s+/g, '-')}.csv`);
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
      aria-label="Descarga de datos tabulares"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#21312D] bg-[#0D1816] p-3 text-[#EFF5ED]"
    >
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-[#B8EE68]" />
        <div>
          <span className="font-mono text-xs font-bold text-[#EFF5ED]">Exportación de Datos</span>
          <p className="text-[10px] text-[#93A39C]">CSV estructurado con procedencia y metadatos</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleDownload('calendario')}
          disabled={downloading !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#21312D] bg-[#111E1B] px-3 py-1.5 font-mono text-xs font-semibold text-[#EFF5ED] hover:border-[#B8EE68]/40 hover:bg-[#1A332C]/40 transition-colors"
        >
          {downloading === 'calendario' ? (
            <Check className="h-3.5 w-3.5 text-[#B8EE68]" />
          ) : (
            <Download className="h-3.5 w-3.5 text-[#B8EE68]" />
          )}
          <span>Calendario CSV</span>
        </button>

        <button
          type="button"
          onClick={() => handleDownload('focos')}
          disabled={downloading !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#21312D] bg-[#111E1B] px-3 py-1.5 font-mono text-xs font-semibold text-[#EFF5ED] hover:border-[#B8EE68]/40 hover:bg-[#1A332C]/40 transition-colors"
        >
          {downloading === 'focos' ? (
            <Check className="h-3.5 w-3.5 text-[#FF9C55]" />
          ) : (
            <Download className="h-3.5 w-3.5 text-[#FF9C55]" />
          )}
          <span>Focos CSV</span>
        </button>
      </div>
    </div>
  );
};
