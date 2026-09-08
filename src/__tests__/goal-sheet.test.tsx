import { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { GoalSheet } from '#/components/goals/goal-sheet'
import type { SheetRef } from '#/components/ui/sheet'

jest.mock('#/api/goals', () => ({
  createGoal: jest.fn(),
  editGoal: jest.fn(),
  deleteGoal: jest.fn(),
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
    BottomSheetTextInput: RN.TextInput,
  }
})
jest.mock('#/components/ui/sheet-field', () => {
  const RN = require('react-native')
  return { SheetField: RN.TextInput, inputStyle: {} }
})
jest.mock('#/components/ui/currency-input', () => ({ CurrencyInput: () => null }))
jest.mock('@react-native-community/datetimepicker', () => () => null)
jest.mock('lucide-react-native', () => ({
  Calendar: () => null, Check: () => null, Trash2: () => null, X: () => null,
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('GoalSheet', () => {
  it('modo criação: título, "Já guardei", Prazo, botão "Criar meta"', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<GoalSheet ref={ref} />)
    expect(getByText('Nova meta')).toBeTruthy()
    expect(getByText('Já guardei (opcional)')).toBeTruthy()
    expect(getByText('Prazo (opcional)')).toBeTruthy()
    expect(getByText('Criar meta')).toBeTruthy()
  })

  it('modo edição: sem "Já guardei", título "Editar meta", lixeira', () => {
    const ref = createRef<SheetRef>()
    const { getByText, queryByText, getByTestId } = wrap(
      <GoalSheet ref={ref} goal={{ id: 'g1', name: 'Viagem', targetAmount: 5000, deadline: null, color: '#3b82f6' }} />,
    )
    expect(getByText('Editar meta')).toBeTruthy()
    expect(queryByText('Já guardei (opcional)')).toBeNull()
    expect(getByText('Salvar')).toBeTruthy()
    expect(getByTestId('goal-delete')).toBeTruthy()
  })

  it('tocar a lixeira abre a confirmação', () => {
    const ref = createRef<SheetRef>()
    const { getByTestId, getByText } = wrap(
      <GoalSheet ref={ref} goal={{ id: 'g1', name: 'Viagem', targetAmount: 5000, deadline: null, color: '#3b82f6' }} />,
    )
    fireEvent.press(getByTestId('goal-delete'))
    expect(getByText('Excluir esta meta?')).toBeTruthy()
  })
})
