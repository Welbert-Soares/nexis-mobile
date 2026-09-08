import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Transactions from '#/app/(app)/transactions'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, Pressable: RN.Pressable }
})
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))
jest.mock('expo-router', () => ({ useFocusEffect: () => {} }))
jest.mock('#/api/transactions', () => ({
  monthTransactionsQuery: (y: number, m: number) => ({
    queryKey: ['transactions', y, m],
    queryFn: jest.fn(),
    staleTime: Infinity,
  }),
}))
jest.mock('#/api/wallets', () => ({
  walletsQuery: { queryKey: ['wallets'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/components/transactions/transaction-sheet-context', () => ({
  useTransactionSheet: () => ({
    openNew: jest.fn(),
    openEdit: jest.fn(),
    createdMonth: null,
    consumeCreatedMonth: jest.fn(),
  }),
}))

const now = new Date()
const YEAR = now.getFullYear()
const MONTH = now.getMonth() + 1

function iso(day: number) {
  return new Date(YEAR, MONTH - 1, day, 12, 0, 0).toISOString()
}

const today = new Date()
const yesterday = new Date(Date.now() - 86_400_000)

const FIXTURE = [
  {
    id: 't1', type: 'INCOME', amount: 1000, description: 'Salário', date: today.toISOString(),
    walletId: 'w1', categoryId: 'c1',
    category: { name: 'Trabalho', color: '#22c55e', icon: null },
    wallet: { id: 'w1', name: 'Nubank', color: null },
    recurring: false, parentId: null, isInstallment: false, isTransfer: false,
  },
  {
    id: 't2', type: 'EXPENSE', amount: 50, description: 'Mercado', date: today.toISOString(),
    walletId: 'w1', categoryId: 'c2',
    category: { name: 'Alimentação', color: '#f00', icon: null },
    wallet: { id: 'w1', name: 'Nubank', color: null },
    recurring: false, parentId: null, isInstallment: false, isTransfer: false,
  },
  {
    id: 't3', type: 'EXPENSE', amount: 300, description: 'Transf p/ Poupança', date: yesterday.toISOString(),
    walletId: 'w1', categoryId: null, category: null,
    wallet: { id: 'w1', name: 'Nubank', color: null },
    recurring: false, parentId: null, isInstallment: false, isTransfer: true,
  },
]

let qc: QueryClient
afterEach(() => qc?.clear())

function renderWith(data: unknown) {
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  })
  qc.setQueryData(['transactions', YEAR, MONTH], data)
  qc.setQueryData(
    ['wallets'],
    [
      {
        id: 'w1', name: 'Nubank', type: 'CHECKING', color: null, icon: null,
        balance: 0, initialBalance: 0, creditLimit: null, closingDay: null, dueDay: null,
      },
    ],
  )
  return render(
    <QueryClientProvider client={qc}>
      <Transactions />
    </QueryClientProvider>,
  )
}

describe('Transactions screen', () => {
  it('soma Receitas/Despesas ignorando isTransfer', () => {
    const { getAllByText, queryByText } = renderWith(FIXTURE)
    // receitas = 1000 (card + linha do salário) ; despesas = 50 (a transferência de 300 é ignorada)
    expect(getAllByText(/1\.000,00/).length).toBeGreaterThanOrEqual(2)
    expect(getAllByText(/\b50,00/).length).toBeGreaterThanOrEqual(2)
    // se a transferência tivesse entrado, despesas seria 350
    expect(queryByText(/350,00/)).toBeNull()
  })

  it('agrupa por dia com "Hoje" e "Ontem"', () => {
    const { getByText } = renderWith(FIXTURE)
    expect(getByText('Hoje')).toBeTruthy()
    expect(getByText('Ontem')).toBeTruthy()
  })

  it('mostra o mês atual no header', () => {
    const MONTHS = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ]
    const { getByText } = renderWith(FIXTURE)
    expect(getByText(new RegExp(MONTHS[MONTH - 1], 'i'))).toBeTruthy()
  })

  it('empty state quando não há transações', () => {
    const { getByText } = renderWith([])
    expect(getByText('Nenhuma transação neste mês')).toBeTruthy()
  })

  // "Despesas" também é rótulo do card de resumo — pega o último match (o chip).
  const pressFilterChip = (getAllByText: (t: string) => unknown[], label: string) => {
    const els = getAllByText(label) as Parameters<typeof fireEvent.press>[0][]
    fireEvent.press(els[els.length - 1])
  }

  it('filtro de tipo Despesas some as receitas da lista mas o resumo não muda', () => {
    const { getByText, queryByText, getAllByText } = renderWith(FIXTURE)
    // resumo: receitas = 1000 (card + linha do salário)
    expect(getAllByText(/1\.000,00/).length).toBeGreaterThanOrEqual(2)
    fireEvent.press(getByText('Filtros'))
    pressFilterChip(getAllByText, 'Despesas')
    // linha do salário sai
    expect(queryByText('Salário')).toBeNull()
    // card Receitas continua com 1.000,00
    expect(getAllByText(/1\.000,00/).length).toBeGreaterThanOrEqual(1)
  })

  it('"limpar" restaura a lista', () => {
    const { getByText, queryByText, getAllByText } = renderWith(FIXTURE)
    fireEvent.press(getByText('Filtros'))
    pressFilterChip(getAllByText, 'Despesas')
    expect(queryByText('Salário')).toBeNull()
    fireEvent.press(getByText('limpar'))
    expect(getByText('Salário')).toBeTruthy()
  })

  it('filtro sem resultado mostra o empty state de filtro', () => {
    const { getByText, getAllByText } = renderWith([FIXTURE[0]]) // só a receita
    fireEvent.press(getByText('Filtros'))
    pressFilterChip(getAllByText, 'Despesas')
    expect(getByText('Nenhuma transação com esses filtros')).toBeTruthy()
  })
})
