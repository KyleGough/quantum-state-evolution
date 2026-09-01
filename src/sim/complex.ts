export interface Complex {
  re: number
  im: number
}

export const C = {
  zero: (): Complex => ({ re: 0, im: 0 }),
  one: (): Complex => ({ re: 1, im: 0 }),
  negone: (): Complex => ({ re: -1, im: 0 }),
  i: (): Complex => ({ re: 0, im: 1 }),
  negi: (): Complex => ({ re: 0, im: -1 }),
  from: (re: number, im = 0): Complex => ({ re, im }),
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s }),
  conj: (a: Complex): Complex => ({ re: a.re, im: -a.im }),
  abs2: (a: Complex): number => a.re * a.re + a.im * a.im,
  exp: (iPhase: number): Complex => ({
    re: Math.cos(iPhase),
    im: Math.sin(iPhase),
  }),
  /** Fixed-width complex string for stable UI layout */
  formatFixed: (a: Complex, digits = 2): string => {
    const reSign = a.re >= 0 ? '+' : '-'
    const imSign = a.im >= 0 ? '+' : '-'
    const re = Math.abs(a.re).toFixed(digits)
    const im = Math.abs(a.im).toFixed(digits)
    return `${reSign}${re}${imSign}${im}i`
  },
  /** Simplest string representation */
  formatFixedSimple: (a: Complex, digits = 2): string => {
    const re = Math.abs(a.re).toFixed(digits)
    const im = Math.abs(a.im).toFixed(digits)
    const imSign = a.im >= 0 ? '' : '-'
    const reSign = a.re >= 0 ? '' : '-'
    if (a.im === 0) return `${reSign}${re}`
    if (a.re === 0) return `${imSign}${im}i`
    return `${reSign}${re}${a.im >= 0 ? '+' : '-'}${im}i`
  },
}
