import { spendingPace, budgetBarColor, pct } from './analytics-calcs'

describe('spendingPace', () => {
  it('dentro do ritmo → verde, tone ok', () => {
    const p = spendingPace(1000, 500, 15, 30)
    expect(p.pctMonthElapsed).toBe(50)
    expect(p.pctIncomeSpent).toBe(50)
    expect(p.aheadOfPace).toBe(false)
    expect(p.tone).toBe('ok')
    expect(p.barColor).toBe('#22c55e')
    expect(p.daysLeft).toBe(15)
    expect(p.dailyBudget).toBeCloseTo(33.33, 1)
  })

  it('gastou mais que recebeu → vermelho, tone over', () => {
    const p = spendingPace(1000, 1200, 10, 30)
    expect(p.pctIncomeSpent).toBe(120)
    expect(p.tone).toBe('over')
    expect(p.barColor).toBe('#ef4444')
  })

  it('acima do ritmo do mês → laranja, tone ahead', () => {
    const p = spendingPace(1000, 800, 10, 30)
    expect(p.aheadOfPace).toBe(true)
    expect(p.tone).toBe('ahead')
    expect(p.barColor).toBe('#f97316')
  })

  it('sem receita não divide por zero', () => {
    const p = spendingPace(0, 100, 10, 30)
    expect(p.pctIncomeSpent).toBe(0)
    expect(p.remaining).toBe(-100)
    expect(p.tone).toBe('ok')
  })

  it('clampa pctIncomeSpent em 999', () => {
    expect(spendingPace(1, 100000, 1, 30).pctIncomeSpent).toBe(999)
  })
})

describe('budgetBarColor', () => {
  it.each([
    [95, '#ef4444'],
    [85, '#f87171'],
    [70, '#fb923c'],
    [40, '#eab308'],
    [10, '#22c55e'],
    [90, '#f87171'], // fronteira: 90 não é > 90
  ])('%i%% → %s', (p, color) => {
    expect(budgetBarColor(p)).toBe(color)
  })
})

describe('pct', () => {
  it('0 quando total é 0', () => {
    expect(pct(40, 0)).toBe(0)
  })
  it('arredonda', () => {
    expect(pct(25, 200)).toBe(13)
  })
})
