// Lógica pura das seções da tela Análise — porta do analytics.tsx do PWA.
// Mantida fora dos componentes pra ser testável sem render (gotcha do RNTL
// com useMutation/render assíncrono neste ambiente).

export type SpendingPace = {
  pctMonthElapsed: number
  pctIncomeSpent: number
  aheadOfPace: boolean
  daysLeft: number
  remaining: number
  dailyBudget: number
  barColor: string
  tone: 'over' | 'ahead' | 'ok'
}

export function spendingPace(
  income: number,
  expenses: number,
  dayOfMonth: number,
  daysInMonth: number,
): SpendingPace {
  const pctMonthElapsed = Math.min(Math.round((dayOfMonth / daysInMonth) * 100), 100)
  const pctIncomeSpent = income > 0 ? Math.min(Math.round((expenses / income) * 100), 999) : 0
  const aheadOfPace = pctIncomeSpent > pctMonthElapsed
  const daysLeft = Math.max(daysInMonth - dayOfMonth, 0)
  const remaining = income - expenses
  const dailyBudget = daysLeft > 0 ? remaining / daysLeft : remaining
  const tone: SpendingPace['tone'] =
    pctIncomeSpent > 100 ? 'over' : aheadOfPace ? 'ahead' : 'ok'
  const barColor = tone === 'over' ? '#ef4444' : tone === 'ahead' ? '#f97316' : '#22c55e'
  return {
    pctMonthElapsed,
    pctIncomeSpent,
    aheadOfPace,
    daysLeft,
    remaining,
    dailyBudget,
    barColor,
    tone,
  }
}

// Cor da barra de orçamento por faixa de % gasto (mesmos limiares do PWA).
export function budgetBarColor(pctClamped: number): string {
  if (pctClamped > 90) return '#ef4444'
  if (pctClamped > 80) return '#f87171'
  if (pctClamped > 60) return '#fb923c'
  if (pctClamped > 30) return '#eab308'
  return '#22c55e'
}

export function pct(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
