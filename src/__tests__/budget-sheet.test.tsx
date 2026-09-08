import { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { BudgetSheet } from '#/components/budgets/budget-sheet'
import type { SheetRef } from '#/components/ui/sheet'

// useMutation + RNTL v13 trava nesse ambiente — testamos superfície de render +
// estado local. O caminho save/delete → invalidateQueries é validado no device.
jest.mock('#/api/budgets', () => ({
  saveBudget: jest.fn(),
  removeBudget: jest.fn(),
}))
jest.mock('#/api/categories', () => ({
  categoriesQuery: (type: string) => ({
    queryKey: ['categories', type],
    queryFn: jest.fn(),
    staleTime: Infinity,
  }),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable, ScrollView: RN.ScrollView, TextInput: RN.TextInput }
})
jest.mock('#/components/ui/sheet', () => {
  const RN = require('react-native')
  return {
    Sheet: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetTextInput: RN.TextInput,
  }
})
jest.mock('#/components/ui/currency-input', () => ({ CurrencyInput: () => null }))
jest.mock('lucide-react-native', () => ({ Check: () => null, Trash2: () => null }))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))

const CATEGORY = { id: 'c1', name: 'Alimentação', color: '#f00', icon: null, type: 'EXPENSE', userId: null }

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(['categories', 'EXPENSE'], [CATEGORY])
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('BudgetSheet', () => {
  it('modo criação: título, chip de categoria e botão "Criar orçamento"', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<BudgetSheet ref={ref} month={9} year={2026} />)
    expect(getByText('Novo orçamento')).toBeTruthy()
    expect(getByText('Categoria')).toBeTruthy()
    expect(getByText('Alimentação')).toBeTruthy()
    expect(getByText('Criar orçamento')).toBeTruthy()
  })

  it('modo edição: título "Editar orçamento", sem chips de categoria, com lixeira', () => {
    const ref = createRef<SheetRef>()
    const { getByText, queryByText, getByTestId } = wrap(
      <BudgetSheet ref={ref} month={9} year={2026} budget={{ id: 'b1', categoryId: 'c1', limit: 200 }} />,
    )
    expect(getByText('Editar orçamento')).toBeTruthy()
    expect(queryByText('Categoria')).toBeNull()
    expect(getByText('Salvar')).toBeTruthy()
    expect(getByTestId('budget-delete')).toBeTruthy()
  })

  it('tocar a lixeira mostra a confirmação de remoção', () => {
    const ref = createRef<SheetRef>()
    const { getByTestId, getByText } = wrap(
      <BudgetSheet ref={ref} month={9} year={2026} budget={{ id: 'b1', categoryId: 'c1', limit: 200 }} />,
    )
    fireEvent.press(getByTestId('budget-delete'))
    expect(getByText('Remover este orçamento?')).toBeTruthy()
  })
})
