export function formatRealFixed(n: number, digits = 3): string {
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${Math.abs(n).toFixed(digits)}`
}

export function formatPercentFixed(n: number, digits = 1): string {
  return `${n.toFixed(digits).padStart(4 + digits, ' ')}%`
}
