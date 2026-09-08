const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

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
