import { createRef } from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { GoalMoveSheet } from '#/components/goals/goal-move-sheet'
import type { SheetRef } from '#/components/ui/sheet'
import type { Goal } from '#/schemas/goal'
import type { Wallet } from '#/schemas/wallet'

jest.mock('#/api/goals', () => ({ depositGoal: jest.fn(), withdrawGoal: jest.fn() }))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable, ScrollView: RN.ScrollView, TextInput: RN.TextInput }
})
jest.mock('#/components/ui/sheet', () => {
  const RN = require('react-native')
  return {
    Sheet: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetTextInput: RN.TextInput,
  }
})
jest.mock('#/components/ui/currency-input', () => ({ CurrencyInput: () => null }))
jest.mock('lucide-react-native', () => ({ ArrowDownLeft: () => null, Check: () => null, PiggyBank: () => null }))

const GOAL: Goal = {
  id: 'g1', name: 'Viagem', targetAmount: 5000, seedAmount: 0, currentAmount: 1200, deadline: null, color: null,
}
const WALLETS: Wallet[] = [
  { id: 'w1', name: 'Nubank', type: 'CHECKING', color: null, icon: null, balance: 800, initialBalance: 800, creditLimit: null, closingDay: null, dueDay: null },
]

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('GoalMoveSheet', () => {
  it('mode=deposit: título "Aportar na meta" + carteira com saldo', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<GoalMoveSheet ref={ref} mode="deposit" goal={GOAL} wallets={WALLETS} />)
    expect(getByText('Aportar na meta')).toBeTruthy()
    expect(getByText('Debitar de')).toBeTruthy()
    expect(getByText('Nubank')).toBeTruthy()
    expect(getByText('R$ 800,00')).toBeTruthy()
  })

  it('mode=withdraw: título "Resgatar da meta"', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<GoalMoveSheet ref={ref} mode="withdraw" goal={GOAL} wallets={WALLETS} />)
    expect(getByText('Resgatar da meta')).toBeTruthy()
    expect(getByText('Creditar em')).toBeTruthy()
  })
})
