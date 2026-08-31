export interface Complex {
  re: number
  im: number
}

export const C = {
  zero: (): Complex => ({ re: 0, im: 0 }),
  one: (): Complex => ({ re: 1, im: 0 }),
  from: (re: number, im = 0): Complex => ({ re, im }),
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s }),
  conj: (a: Complex): Complex => ({ re: a.re, im: -a.im }),
  abs2: (a: Complex): number => a.re * a.re + a.im * a.im,
  abs: (a: Complex): number => Math.sqrt(C.abs2(a)),
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
}
