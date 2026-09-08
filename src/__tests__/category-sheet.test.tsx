import { createRef } from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { CategorySheet } from '#/components/profile/category-sheet'
import type { SheetRef } from '#/components/ui/sheet'

jest.mock('#/api/categories', () => ({ createCategory: jest.fn(), editCategory: jest.fn() }))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable, ScrollView: RN.ScrollView, TextInput: RN.TextInput }
})
jest.mock('#/components/ui/sheet', () => {
  const RN = require('react-native')
  return {
    Sheet: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => children,
  }
})
jest.mock('#/components/ui/sheet-field', () => {
  const RN = require('react-native')
  return { SheetField: RN.TextInput, inputStyle: {} }
})
jest.mock('lucide-react-native', () => ({ Check: () => null }))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: { Dog: () => null, Car: () => null } }))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('CategorySheet', () => {
  it('criação: título, segmented de tipo, botão "Criar categoria"', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = wrap(<CategorySheet ref={ref} defaultType="EXPENSE" />)
    expect(getByText('Nova categoria')).toBeTruthy()
    expect(getByText('Despesa')).toBeTruthy()
    expect(getByText('Receita')).toBeTruthy()
    expect(getByText('Criar categoria')).toBeTruthy()
  })

  it('edição: sem segmented de tipo, título "Editar categoria"', () => {
    const ref = createRef<SheetRef>()
    const { getByText, queryByText } = wrap(
      <CategorySheet
        ref={ref}
        defaultType="EXPENSE"
        category={{ id: 'c1', name: 'Mercado', color: '#f00', icon: 'Car', type: 'EXPENSE', userId: 'u1' }}
      />,
    )
    expect(getByText('Editar categoria')).toBeTruthy()
    expect(queryByText('Despesa')).toBeNull()
    expect(getByText('Salvar')).toBeTruthy()
  })
})
