import { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ProfileSheet } from '#/components/profile/profile-sheet'
import type { SheetRef } from '#/components/ui/sheet'

jest.mock('#/auth/client', () => ({ signOut: jest.fn() }))
jest.mock('#/auth/session', () => ({
  useAuthSession: () => ({
    session: { user: { name: 'Welbert Soares', email: 'welbert@example.com', image: null } },
    isPending: false,
  }),
}))
jest.mock('#/api/categories', () => ({
  categoriesManagementQuery: { queryKey: ['categories-management'], queryFn: jest.fn(), staleTime: Infinity },
  removeCategory: jest.fn(),
}))
jest.mock('#/components/profile/category-sheet', () => ({ CategorySheet: () => null }))
jest.mock('#/lib/haptics', () => ({
  useHaptic: () => ({ tap: jest.fn(), success: jest.fn(), error: jest.fn(), heavy: jest.fn() }),
}))
jest.mock('#/lib/app-lock', () => ({
  isAppLockEnabled: jest.fn().mockResolvedValue(false),
  setAppLockEnabled: jest.fn().mockResolvedValue(undefined),
  canUseAppLock: jest.fn().mockResolvedValue(true),
  runAuth: jest.fn().mockResolvedValue(true),
}))
jest.mock('#/lib/app-lock-context', () => ({ useAppLock: () => ({ refreshEnabled: jest.fn() }) }))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable, ScrollView: RN.ScrollView }
})
jest.mock('#/tw/image', () => ({ Image: () => null }))
jest.mock('#/components/ui/sheet', () => {
  const RN = require('react-native')
  return {
    Sheet: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => children,
  }
})
jest.mock('lucide-react-native', () => ({
  ChevronDown: () => null, Lock: () => null, LogOut: () => null, Plus: () => null, Tag: () => null,
}))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(['categories-management'], [
    { id: 'c1', name: 'Mercado', color: '#f00', icon: null, type: 'EXPENSE', userId: 'u1', _count: { transactions: 0 } },
  ])
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('ProfileSheet', () => {
  it('mostra nome, email e "Sair da conta"', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<ProfileSheet ref={ref} />)
    expect(getByText('Welbert Soares')).toBeTruthy()
    expect(getByText('welbert@example.com')).toBeTruthy()
    expect(getByText('Sair da conta')).toBeTruthy()
  })

  it('abrir o acordeão de Categorias mostra o toggle Despesas/Receitas', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<ProfileSheet ref={ref} />)
    fireEvent.press(getByText('Categorias'))
    expect(getByText('Despesas')).toBeTruthy()
    expect(getByText('Receitas')).toBeTruthy()
  })

  it('mostra a linha "Bloqueio do app"', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<ProfileSheet ref={ref} />)
    expect(getByText('Bloqueio do app')).toBeTruthy()
  })
})
