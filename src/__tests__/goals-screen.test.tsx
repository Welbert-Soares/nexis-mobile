import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import GoalsScreen from '#/app/(app)/goals'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, Pressable: RN.Pressable }
})
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }))
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))
jest.mock('#/api/goals', () => ({
  goalsQuery: { queryKey: ['goals'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/api/wallets', () => ({
  walletsQuery: { queryKey: ['wallets'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/components/goals/goal-sheet', () => ({ GoalSheet: () => null }))
jest.mock('#/components/goals/goal-move-sheet', () => ({ GoalMoveSheet: () => null }))

const GOAL = {
  id: 'g1', name: 'Viagem Europa', targetAmount: 10000, seedAmount: 0,
  currentAmount: 2500, deadline: null, color: '#3b82f6',
}

let qc: QueryClient
afterEach(() => qc?.clear())

function renderWith(goals: unknown) {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } } })
  qc.setQueryData(['goals'], goals)
  qc.setQueryData(['wallets'], [])
  return render(
    <QueryClientProvider client={qc}>
      <GoalsScreen />
    </QueryClientProvider>,
  )
}

describe('GoalsScreen', () => {
  it('com metas: header, total guardado e um card', () => {
    const { getByText } = renderWith([GOAL])
    expect(getByText('Metas')).toBeTruthy()
    expect(getByText('Total guardado')).toBeTruthy()
    expect(getByText('Viagem Europa')).toBeTruthy()
  })

  it('sem metas: empty state', () => {
    const { getByText } = renderWith([])
    expect(getByText('Nenhuma meta ainda')).toBeTruthy()
  })
})
