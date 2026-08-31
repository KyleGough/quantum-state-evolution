export function formatRealFixed(n: number, digits = 2): string {
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${Math.abs(n).toFixed(digits)}`
}
