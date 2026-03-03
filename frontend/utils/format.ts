/** Format price with thousand separator and KM suffix (e.g. 1.234,56 KM) */
export function formatPrice(value: number): string {
  try {
    const formatted = value.toLocaleString('bs-BA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} KM`;
  } catch {
    const [int, dec] = value.toFixed(2).split('.');
    const withThousands = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withThousands},${dec} KM`;
  }
}
