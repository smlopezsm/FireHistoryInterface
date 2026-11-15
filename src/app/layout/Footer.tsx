import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadata } from '../../api/useMetadata';
import { Info, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { data: metadata, isLoading, isError } = useMetadata();

  return (
    <footer className="mt-auto border-t border-[#21312D] bg-[#07100F] px-4 py-5 text-xs text-[#93A39C] md:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Atribución de fuentes y límites */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-[#EFF5ED]">{t('footer.sources')}</span>
            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#68D9D0] hover:underline underline-offset-2"
            >
              {t('footer.nasa')}
            </a>
            <span className="text-[#93A39C]/60">·</span>
            <a
              href="https://www.ign.gob.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#93A39C] hover:text-[#EFF5ED] hover:underline underline-offset-2"
            >
              {t('footer.ign')}
            </a>
          </div>
          <p className="text-xs text-[#93A39C]">
            {t('footer.methodNotice')}
          </p>
        </div>

        {/* Versión de datos y estado de API */}
        <div className="flex shrink-0 items-center gap-2 self-start rounded-md border border-[#21312D] bg-[#0D1816] px-3 py-1.5 sm:self-center">
          <Database className="h-3.5 w-3.5 text-[#B8EE68]" aria-hidden="true" />
          <span className="font-medium text-[#EFF5ED]">{t('footer.dataVersion')}</span>

          {isLoading ? (
            <span
              data-testid="metadata-loading"
              className="inline-block h-3.5 w-16 animate-pulse rounded bg-[#111E1B]"
              title={t('footer.loading')}
            />
          ) : isError || !metadata?.data_version ? (
            <span
              data-testid="metadata-error"
              className="flex items-center gap-1 text-xs text-[#FF9C55]"
              title={t('footer.error')}
            >
              <Info className="h-3 w-3" />
              <span>{t('footer.error')}</span>
            </span>
          ) : (
            <span
              data-testid="metadata-version"
              className="font-mono text-xs font-semibold text-[#B8EE68]"
            >
              {metadata.data_version}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
