/**
 * Format number to Indonesian Rupiah (IDR)
 * @param amount - Number to format
 * @param showSymbol - Show "Rp" symbol (default: true)
 * @returns Formatted string
 */
export function formatCurrency(amount: number | string, showSymbol = true): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return showSymbol ? 'Rp 0' : '0';
  }

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);

  return formatted;
}

/**
 * Format number to IDR without symbol
 */
export function formatCurrencyNumber(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Convert text input to number (remove Rp and dots)
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[Rp\s.]/g, '').trim();
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
