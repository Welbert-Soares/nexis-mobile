import { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { TransactionSheet } from '#/components/transactions/transaction-sheet'
import type { SheetRef } from '#/components/ui/sheet'
import type { Transaction } from '#/schemas/transaction'

// Mesma limitação do wallet-sheet.test: useMutation + RNTL v13 trava nesse
// ambiente, então testamos a superfície de render + estado local. O caminho
// create/edit/delete → invalidateQueries é validado no device.
jest.mock('#/api/transactions', () => ({
  createTransaction: jest.fn(),
  editTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
}))
jest.mock('#/api/wallets', () => ({
  walletsQuery: { queryKey: ['wallets'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/api/categories', () => ({
  categoriesQuery: (type: string) => ({
    queryKey: ['categories', type],
    queryFn: jest.fn(),
    staleTime: Infinity,
  }),
}))
jest.mock('@react-native-community/datetimepicker', () => () => null)
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }))
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
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))

const WALLET = {
  id: 'w1', name: 'Nubank', type: 'CHECKING', color: null, icon: null,
  balance: 100, initialBalance: 100, creditLimit: null, closingDay: null, dueDay: null,
}
const CATEGORY = { id: 'c1', name: 'Alimentação', color: '#f00', icon: null, type: 'EXPENSE', userId: null }

const TX: Transaction = {
  id: 't1', type: 'EXPENSE', amount: 42.5, description: 'Almoço', date: '2026-09-15T12:00:00.000Z',
  walletId: 'w1', categoryId: 'c1',
  category: { name: 'Alimentação', color: '#f00', icon: null },
  wallet: { id: 'w1', name: 'Nubank', color: null },
  recurring: false, parentId: null, isInstallment: false, isTransfer: false,
}

const TX_INSTALLMENT: Transaction = { ...TX, id: 't2', isInstallment: true, description: 'Sofá (2/6)' }
const TX_RECURRING: Transaction = { ...TX, id: 't3', recurring: true, description: 'Netflix' }

function wrap(ui: React.ReactElement, seed?: (qc: QueryClient) => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(['wallets'], [WALLET])
  qc.setQueryData(['categories', 'EXPENSE'], [CATEGORY])
  qc.setQueryData(['categories', 'INCOME'], [])
  seed?.(qc)
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('TransactionSheet', () => {
  it('modo criação: título, campos e botão certos', () => {
    const { getByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} />)
    expect(getByText('Nova transação')).toBeTruthy()
    expect(getByText('Despesa')).toBeTruthy()
    expect(getByText('Receita')).toBeTruthy()
    expect(getByText('Valor')).toBeTruthy()
    expect(getByText('Adicionar')).toBeTruthy()
  })

  it('modo criação sem carteiras: CTA para criar carteira', () => {
    const { getByText, queryByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} />, (qc) =>
      qc.setQueryData(['wallets'], []),
    )
    expect(getByText('Você ainda não tem carteiras')).toBeTruthy()
    expect(getByText('Criar carteira')).toBeTruthy()
    expect(queryByText('Adicionar')).toBeNull()
  })

  it('modo edição: título, lixeira e "Salvar alterações"', () => {
    const { getByText, getByTestId } = wrap(<TransactionSheet ref={createRef<SheetRef>()} tx={TX} />)
    expect(getByText('Editar transação')).toBeTruthy()
    expect(getByTestId('transaction-delete')).toBeTruthy()
    expect(getByText('Salvar alterações')).toBeTruthy()
  })

  it('edição sem alterações mantém "Salvar" desabilitado', () => {
    const { getByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} tx={TX} />)
    expect(getByText('Salvar alterações')).toBeDisabled()
  })

  it('lixeira abre a confirmação inline (estado local)', () => {
    const { getByTestId, getByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} tx={TX} />)
    fireEvent.press(getByTestId('transaction-delete'))
    expect(getByText('Excluir esta transação?')).toBeTruthy()
    expect(getByText('Excluir')).toBeTruthy()
  })

  it('criação (EXPENSE) mostra Repetir e Parcelar', () => {
    const { getByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} />)
    expect(getByText('Repetir')).toBeTruthy()
    expect(getByText('Parcelar')).toBeTruthy()
  })

  it('criação com tipo INCOME não mostra Parcelar', () => {
    const { getByText, queryByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} />)
    fireEvent.press(getByText('Receita'))
    expect(getByText('Repetir')).toBeTruthy()
    expect(queryByText('Parcelar')).toBeNull()
  })

  it('edição não mostra Repetir nem Parcelar', () => {
    const { queryByText } = wrap(<TransactionSheet ref={createRef<SheetRef>()} tx={TX} />)
    expect(queryByText('Repetir')).toBeNull()
    expect(queryByText('Parcelar')).toBeNull()
  })

  it('lixeira numa parcela abre o seletor de 3 opções', () => {
    const { getByTestId, getByText } = wrap(
      <TransactionSheet ref={createRef<SheetRef>()} tx={TX_INSTALLMENT} />,
    )
    fireEvent.press(getByTestId('transaction-delete'))
    expect(getByText('Só esta parcela')).toBeTruthy()
    expect(getByText('Esta e as próximas')).toBeTruthy()
    expect(getByText('Todas as parcelas')).toBeTruthy()
  })

  it('lixeira num recorrente abre o seletor de série', () => {
    const { getByTestId, getByText } = wrap(
      <TransactionSheet ref={createRef<SheetRef>()} tx={TX_RECURRING} />,
    )
    fireEvent.press(getByTestId('transaction-delete'))
    expect(getByText('Só esta ocorrência')).toBeTruthy()
    expect(getByText('Esta e as futuras')).toBeTruthy()
    expect(getByText('Toda a série')).toBeTruthy()
  })

  it('lixeira numa transação comum mantém a confirmação simples', () => {
    const { getByTestId, getByText, queryByText } = wrap(
      <TransactionSheet ref={createRef<SheetRef>()} tx={TX} />,
    )
    fireEvent.press(getByTestId('transaction-delete'))
    expect(getByText('Excluir esta transação?')).toBeTruthy()
    expect(queryByText('Todas as parcelas')).toBeNull()
  })
})
