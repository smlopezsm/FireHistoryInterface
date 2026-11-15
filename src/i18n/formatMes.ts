export function formatMes(mes: string, isEn: boolean): string {
  return new Intl.DateTimeFormat(isEn ? 'en-US' : 'es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${mes}-01T00:00:00Z`));
}
