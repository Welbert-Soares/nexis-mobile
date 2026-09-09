import { fmtDayGroup } from '#/lib/format'
import type { Transaction } from '#/schemas/transaction'

export type Section = { title: string; data: Transaction[] }

// Agrupa transações (já ordenadas por data desc pelo backend) em seções por
// dia, com o título "Hoje" / "Ontem" / "qua, 03 set".
export function groupByDay(txs: Transaction[]): Section[] {
  const map = new Map<string, Transaction[]>()
  for (const t of txs) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const bucket = map.get(key)
    if (bucket) bucket.push(t)
    else map.set(key, [t])
  }
  return Array.from(map.values()).map((data) => ({
    title: fmtDayGroup(new Date(data[0].date)),
    data,
  }))
}
