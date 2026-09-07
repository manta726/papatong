// lib/format.ts

/**
 * Format number ke Rupiah (contoh: 150000000 -> Rp 150.000.000)
 * @param value - number atau string angka
 * @param withSymbol - tampilkan "Rp" di depan (default: true)
 */
export function formatRupiah(
  value: number | string | null | undefined,
  withSymbol: boolean = true
): string {
  if (value === null || value === undefined || value === '') return '—';

  // Convert ke number, hapus karakter non-digit
  const num = typeof value === 'string'
    ? parseInt(value.replace(/[^\d]/g, ''), 10)
    : value;

  if (isNaN(num) || num === 0) return '—';

  // Format dengan titik sebagai pemisah ribuan
  const formatted = num.toLocaleString('id-ID');

  return withSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Format compact (untuk tampilan ringkas): 150000000 -> Rp 150jt
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
 * Parse string budget ke number (untuk input form)
 */
export function parseBudget(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}
