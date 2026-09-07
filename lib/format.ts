// lib/format.ts

/**
 * Format number ke Rupiah (contoh: 150000000 -> Rp 150.000.000)
 */
export function formatRupiah(
  value: number | string | null | undefined,
  withSymbol: boolean = true
): string {
  if (value === null || value === undefined || value === '') return '—';

  const num = typeof value === 'string'
    ? parseInt(value.replace(/[^\d]/g, ''), 10)
    : value;

  if (isNaN(num) || num === 0) return '—';

  const formatted = num.toLocaleString('id-ID');
  return withSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Format compact (Rp 150jt, Rp 1.2M, dll) untuk tabel ringkas
 */
export function formatRupiahCompact(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === '') return '—';

  const num = typeof value === 'string'
    ? parseInt(value.replace(/[^\d]/g, ''), 10)
    : value;

  if (isNaN(num) || num === 0) return '—';

  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(0)}jt`;
  }
  if (num >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${num}`;
}

/**
 * Parse string budget ke number (untuk form input)
 */
export function parseBudget(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
}

/**
 * Format angka dengan prefix "Rp" untuk input field
 * Contoh: 150000000 -> "Rp 150.000.000"
 */
export function formatRupiahInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string'
    ? parseInt(value.replace(/[^\d]/g, ''), 10)
    : value;
  if (isNaN(num) || num === 0) return '';
  return `Rp ${num.toLocaleString('id-ID')}`;
}
