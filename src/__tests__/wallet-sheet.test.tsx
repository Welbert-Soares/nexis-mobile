import { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { WalletSheet } from '#/components/wallets/wallet-sheet'
import type { SheetRef } from '#/components/ui/sheet'
import type { Wallet } from '#/schemas/wallet'

// NB: o fluxo assíncrono de useMutation + react-test-renderer (RNTL v13) trava
// nesse ambiente, então testamos a superfície de render + estado local. O
// caminho create/edit/delete → invalidateQueries é validado no device (Task 9).
jest.mock('#/api/wallets', () => ({
  createWallet: jest.fn(),
  editWallet: jest.fn(),
  deleteWallet: jest.fn(),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable, TextInput: RN.TextInput }
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
jest.mock('lucide-react-native', () => ({ Check: () => null, Trash2: () => null }))
jest.mock('#/lib/category-icons', () => ({ CATEGORY_ICONS: {} }))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const CREDIT: Wallet = {
  id: 'w2', name: 'Cartão', type: 'CREDIT', color: '#ef4444', icon: null,
  balance: -100, initialBalance: 0, creditLimit: 2000, closingDay: 5, dueDay: 15,
}

describe('WalletSheet', () => {
  it('modo criação: campos e botão certos', () => {
    const { getByText, getByPlaceholderText, queryByTestId } = wrap(
      <WalletSheet ref={createRef<SheetRef>()} />,
    )
    expect(getByText('Nova carteira')).toBeTruthy()
    expect(getByPlaceholderText('Nome da carteira')).toBeTruthy()
    expect(getByText('Saldo inicial')).toBeTruthy()
    expect(getByText('Conta corrente')).toBeTruthy() // chip de tipo
    expect(getByText('Criar carteira')).toBeTruthy()
    expect(queryByTestId('wallet-delete')).toBeNull() // sem lixeira ao criar
  })

  it('modo edição de CREDIT: campos de cartão + botão de salvar', () => {
    const { getByText } = wrap(<WalletSheet ref={createRef<SheetRef>()} wallet={CREDIT} />)
    expect(getByText('Editar carteira')).toBeTruthy()
    expect(getByText('Limite')).toBeTruthy()
    expect(getByText('Fechamento (dia)')).toBeTruthy()
    expect(getByText('Vencimento (dia)')).toBeTruthy()
    expect(getByText('Salvar alterações')).toBeTruthy()
  })

  it('lixeira abre a confirmação inline (estado local)', () => {
    const { getByTestId, getByText } = wrap(
      <WalletSheet ref={createRef<SheetRef>()} wallet={CREDIT} />,
    )
    fireEvent.press(getByTestId('wallet-delete'))
    expect(getByText('Excluir esta carteira?')).toBeTruthy()
    expect(getByText('Excluir')).toBeTruthy()
  })
})
