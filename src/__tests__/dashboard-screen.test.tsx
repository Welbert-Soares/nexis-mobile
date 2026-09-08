import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Fora de src/app/ de proposito: o require.context do expo-router empacota
// qualquer .tsx sob src/app/ como rota, inclusive arquivos de teste.
import Dashboard from '#/app/(app)/index'

jest.mock('#/auth/session', () => ({
  useAuthSession: () => ({
    session: { user: { name: 'Welbert Soares', image: null } },
    isPending: false,
  }),
}))

// Corta a cadeia auth/client (SecureStore/better-auth) — a tela só lê do cache.
jest.mock('#/api/dashboard', () => ({
  dashboardQuery: { queryKey: ['dashboard'], queryFn: jest.fn(), staleTime: Infinity },
}))

jest.mock('expo-router', () => ({ Link: ({ children }: { children: React.ReactNode }) => children }))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

// #/tw/image puxa react-native-reanimated (worklets), que não sobe no jest.
// A sessão do teste tem image: null, então o Image nem renderiza.
jest.mock('#/tw/image', () => ({ Image: () => null }))

// #/tw usa o runtime do react-native-css (signals/observers) que trava o jest.
// Este teste valida a lógica da tela (saudação, seções, branch de onboarding)
// por texto — os primitivos crus do RN bastam.
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, Pressable: RN.Pressable }
})

// Ícones lucide são ESM (.mjs) e não passam pelo transform do jest; a tela é
// testada por texto, então stub basta.
jest.mock('lucide-react-native', () => ({
  ArrowRight: () => null,
  TrendingDown: () => null,
  TrendingUp: () => null,
  Wallet: () => null,
  LayoutDashboard: () => null,
}))

jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))

const FIXTURE = {
  totalBalance: 2395,
  hasWallets: true,
  monthly: { income: 5077, expenses: 2682 },
  recent: [
    {
      id: 't1',
      type: 'INCOME',
      amount: 3577,
      description: 'Salário',
      date: '2026-09-03T12:00:00.000Z',
      category: { id: 'c1', name: 'Salário', color: '#22c55e', icon: null },
      wallet: { id: 'w1', name: 'Santander', color: null },
    },
  ],
  categoryBreakdown: [],
}

let qc: QueryClient

afterEach(() => qc?.clear())

function renderWith(data: unknown) {
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  })
  qc.setQueryData(['dashboard'], data)
  return render(
    <QueryClientProvider client={qc}>
      <Dashboard />
    </QueryClientProvider>,
  )
}

describe('Dashboard', () => {
  it('mostra saudação, receitas/despesas e as transações recentes', () => {
    const { getByText } = renderWith(FIXTURE)
    expect(getByText(/Olá, Welbert/)).toBeTruthy()
    expect(getByText('Receitas')).toBeTruthy()
    expect(getByText('Despesas')).toBeTruthy()
    expect(getByText('Salário')).toBeTruthy()
  })

  it('mostra o onboarding quando não há carteiras', () => {
    const { getByText, queryByText } = renderWith({ ...FIXTURE, hasWallets: false, recent: [] })
    expect(getByText('Criar carteira')).toBeTruthy()
    expect(getByText(/Bem-vindo ao Nexis/)).toBeTruthy()
    // some sem carteiras: sem cards de resumo
    expect(queryByText('Receitas')).toBeNull()
  })
})
