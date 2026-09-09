import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import WalletDetail from '#/app/(app)/wallets/[id]'

const mockBack = jest.fn()

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, Pressable: RN.Pressable }
})
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'w1' }),
}))
jest.mock('#/api/wallets', () => ({
  walletsQuery: { queryKey: ['wallets'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/api/transactions', () => ({
  monthTransactionsQuery: (y: number, m: number) => ({
    queryKey: ['transactions', y, m],
    queryFn: jest.fn(),
    staleTime: Infinity,
  }),
  maxDateQuery: { queryKey: ['transactions-max-date'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/components/wallets/wallet-sheet', () => ({ WalletSheet: () => null }))
jest.mock('#/components/wallets/transfer-sheet', () => ({ TransferSheet: () => null }))
jest.mock('#/components/ui/screen-enter', () => ({
  ScreenEnter: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('#/components/transactions/transaction-sheet-context', () => ({
  useTransactionSheet: () => ({ openEdit: jest.fn() }),
}))
jest.mock('#/lib/haptics', () => ({
  useHaptic: () => ({ tap: jest.fn(), success: jest.fn(), error: jest.fn(), heavy: jest.fn() }),
}))

const W1 = {
  id: 'w1', name: 'Nubank', type: 'CHECKING', color: '#8b5cf6', icon: null,
  balance: 1500, initialBalance: 1000, creditLimit: null, closingDay: null, dueDay: null,
}
const W2 = { ...W1, id: 'w2', name: 'Cash', color: null }

const now = new Date()
const Y = now.getFullYear()
const M = now.getMonth() + 1

const txBase = {
  type: 'INCOME', amount: 1000, description: 'Salário', date: now.toISOString(),
  categoryId: null, category: null,
  recurring: false, parentId: null, isInstallment: false, isTransfer: false,
}
const TX_W1 = { ...txBase, id: 't1', walletId: 'w1', wallet: { id: 'w1', name: 'Nubank', color: null } }
const TX_W2 = {
  ...txBase, id: 't2', walletId: 'w2', description: 'Freela',
  wallet: { id: 'w2', name: 'Cash', color: null },
}

let qc: QueryClient
afterEach(() => {
  qc?.clear()
  mockBack.mockClear()
})

function renderWith(wallets: unknown, txs: unknown) {
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  })
  qc.setQueryData(['wallets'], wallets)
  qc.setQueryData(['transactions', Y, M], txs)
  qc.setQueryData(['transactions-max-date'], null)
  return render(
    <QueryClientProvider client={qc}>
      <WalletDetail />
    </QueryClientProvider>,
  )
}

describe('WalletDetail', () => {
  it('herói: nome + saldo da carteira', () => {
    const { getByText, getByLabelText } = renderWith([W1, W2], [TX_W1, TX_W2])
    expect(getByText('Nubank')).toBeTruthy()
    expect(getByText('R$ 1.500,00')).toBeTruthy()
    expect(getByText('Entradas')).toBeTruthy()
    expect(getByText('Saídas')).toBeTruthy()
    expect(getByLabelText('Voltar')).toBeTruthy()
    expect(getByLabelText('Saldo: R$ 1.500,00')).toBeTruthy()
  })

  it('lista só as transações da carteira', () => {
    const { getByText, queryByText } = renderWith([W1, W2], [TX_W1, TX_W2])
    expect(getByText('Salário')).toBeTruthy()
    expect(queryByText('Freela')).toBeNull()
  })

  it('mês sem movimentações → empty', () => {
    const { getByText } = renderWith([W1, W2], [])
    expect(getByText(new RegExp('Sem movimenta'))).toBeTruthy()
  })

  it('carteira inexistente (não loading) → router.back()', () => {
    renderWith([W2], [TX_W2])
    expect(mockBack).toHaveBeenCalled()
  })
})
