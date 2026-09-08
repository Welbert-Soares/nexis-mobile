import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import AnalyticsScreen from '#/app/(app)/analytics'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, Pressable: RN.Pressable }
})
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }))
jest.mock('expo-router', () => ({ useFocusEffect: () => {} }))
jest.mock('react-native-gifted-charts', () => ({ BarChart: () => null, PieChart: () => null }))
jest.mock('#/components/budgets/budget-sheet', () => ({ BudgetSheet: () => null }))
jest.mock('#/api/analytics', () => ({
  analyticsQuery: { queryKey: ['analytics'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/api/budgets', () => ({
  budgetsQuery: (y: number, m: number) => ({
    queryKey: ['budgets', y, m],
    queryFn: jest.fn(),
    staleTime: Infinity,
  }),
  saveBudget: jest.fn(),
  removeBudget: jest.fn(),
}))

const now = new Date()
const Y = now.getFullYear()
const M = now.getMonth() + 1

const FULL = {
  monthly: { income: 5000, expenses: 3200 },
  categoryBreakdown: [{ id: 'c1', name: 'Mercado', color: '#f00', amount: 1200 }],
  trend: [
    { month: '2026-04', income: 4800, expenses: 3000 },
    { month: '2026-09', income: 5000, expenses: 3200 },
  ],
  dayOfMonth: 8,
  daysInMonth: 30,
}

let qc: QueryClient
afterEach(() => qc?.clear())

function renderWith(analytics: unknown, budgets: unknown) {
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  })
  if (analytics !== undefined) qc.setQueryData(['analytics'], analytics)
  qc.setQueryData(['budgets', Y, M], budgets)
  return render(
    <QueryClientProvider client={qc}>
      <AnalyticsScreen />
    </QueryClientProvider>,
  )
}

describe('AnalyticsScreen', () => {
  it('com receita > 0 monta as 5 seções', () => {
    const { getByText } = renderWith(FULL, [])
    expect(getByText('Resumo do mês')).toBeTruthy()
    expect(getByText('Ritmo do mês')).toBeTruthy()
    expect(getByText('Últimos 6 meses')).toBeTruthy()
    expect(getByText('Gastos por categoria')).toBeTruthy()
    expect(getByText('Orçamentos')).toBeTruthy()
  })

  it('com receita = 0 esconde o "Ritmo do mês"', () => {
    const { queryByText, getByText } = renderWith(
      { ...FULL, monthly: { income: 0, expenses: 100 } },
      [],
    )
    expect(getByText('Resumo do mês')).toBeTruthy()
    expect(queryByText('Ritmo do mês')).toBeNull()
  })

  it('sem orçamentos mostra o empty', () => {
    const { getByText } = renderWith(FULL, [])
    expect(getByText('Nenhum orçamento definido')).toBeTruthy()
  })

  it('em cold load (sem cache de análise) mostra o header e o skeleton, sem as seções', () => {
    const { getByText, queryByText } = renderWith(undefined, [])
    expect(getByText('Análise')).toBeTruthy()
    expect(queryByText('Resumo do mês')).toBeNull()
    expect(queryByText('Orçamentos')).toBeNull()
  })
})
