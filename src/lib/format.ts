import type { TextStyle } from 'react-native'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

// Tabelas fixas em vez de Intl com `weekday`/`month: 'short'` — a pontuação do
// ICU pt-BR ("qua.", "set.") diverge entre Node (jest) e Hermes (device).
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Números monetários com largura de dígito fixa — evita o "pulo" da tipografia
 * quando o valor muda (refresh, digitação). Espelha o `tabular-nums` que o PWA
 * usa em todo valor em R$. Aplicar via `style` porque o utilitário do Tailwind
 * v4 não é mapeado pelo react-native-css.
 */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] }

// ICU emits a narrow/no-break space between the symbol and the number
// (U+00A0 or U+202F depending on the runtime). Normalize to a plain space so
// output is identical under Node (jest) and Hermes (device).
function normalizeSpaces(value: string): string {
  return value.replace(/[  ]/g, ' ')
}

export function fmtBRL(value: number): string {
  return normalizeSpaces(brl.format(value))
}

export function fmtDate(date: Date): string {
  return normalizeSpaces(dateFmt.format(date))
}

/** `'YYYY-MM-DD'` no fuso local — o que o backend espera no campo `date`. */
export function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Rótulo de grupo por dia: `Hoje`, `Ontem` ou `qua, 06 set`. */
export function fmtDayGroup(date: Date): string {
  const now = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  const wd = WEEKDAYS_SHORT[date.getDay()]
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = MONTHS_SHORT[date.getMonth()]
  return `${wd}, ${dd} ${mm}`
}
