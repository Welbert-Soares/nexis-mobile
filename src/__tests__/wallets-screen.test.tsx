import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Wallets from '#/app/(app)/wallets'

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
jest.mock('#/api/wallets', () => ({
  walletsQuery: { queryKey: ['wallets'], queryFn: jest.fn(), staleTime: Infinity },
}))
jest.mock('#/components/wallets/wallet-sheet', () => ({ WalletSheet: () => null }))
jest.mock('#/components/wallets/transfer-sheet', () => ({ TransferSheet: () => null }))

const CHECKING = {
  id: 'w1', name: 'Nubank', type: 'CHECKING', color: null, icon: null,
  balance: 1500, initialBalance: 1000, creditLimit: null, closingDay: null, dueDay: null,
}
const CREDIT = {
  id: 'w2', name: 'Cartão', type: 'CREDIT', color: '#ef4444', icon: null,
  balance: -300, initialBalance: 0, creditLimit: 2000, closingDay: 5, dueDay: 15,
}

let qc: QueryClient
afterEach(() => qc?.clear())

function renderWith(wallets: unknown) {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } } })
  qc.setQueryData(['wallets'], wallets)
  return render(
    <QueryClientProvider client={qc}>
      <Wallets />
    </QueryClientProvider>,
  )
}

describe('Wallets screen', () => {
  it('mostra saldo total e um card por carteira; crédito vira fatura', () => {
    const { getByText } = renderWith([CHECKING, CREDIT])
    // total = 1500 + (-300) = 1200
    expect(getByText(/1\.200,00/)).toBeTruthy()
    expect(getByText('Nubank')).toBeTruthy()
    expect(getByText('Cartão')).toBeTruthy()
    // fatura do crédito = |min(-300,0)| = 300
    expect(getByText(/300,00/)).toBeTruthy()
    expect(getByText(/de R\$.*2\.000,00 · 15%/)).toBeTruthy()
  })

  it('sem carteiras → EmptyState', () => {
    const { getByText, queryByText } = renderWith([])
    expect(getByText('Nenhuma carteira ainda')).toBeTruthy()
    expect(getByText('Criar carteira')).toBeTruthy()
    expect(queryByText('Saldo total')).toBeTruthy()
  })

  it('botão de transferência só aparece com 2+ carteiras', () => {
    expect(renderWith([CHECKING]).queryByTestId('transfer-btn')).toBeNull()
    qc.clear()
    expect(renderWith([CHECKING, CREDIT]).queryByTestId('transfer-btn')).toBeTruthy()
  })
})
