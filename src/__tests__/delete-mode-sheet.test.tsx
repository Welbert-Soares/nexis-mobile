import { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react-native'

import { DeleteModeSheet } from '#/components/transactions/delete-mode-sheet'
import type { SheetRef } from '#/components/ui/sheet'
import type { Transaction } from '#/schemas/transaction'

jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable }
})
jest.mock('#/components/ui/sheet', () => {
  const RN = require('react-native')
  return {
    Sheet: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => children,
  }
})

const RECURRING = { id: 't1', isInstallment: false, recurring: true, parentId: null } as unknown as Transaction
const INSTALLMENT = { id: 't2', isInstallment: true, recurring: false, parentId: 'r1' } as unknown as Transaction

describe('DeleteModeSheet', () => {
  it('recorrente: rótulos de série + onPick com o mode certo', () => {
    const onPick = jest.fn()
    const ref = createRef<SheetRef>()
    const { getByText } = render(<DeleteModeSheet ref={ref} tx={RECURRING} onPick={onPick} />)
    expect(getByText('Só esta ocorrência')).toBeTruthy()
    expect(getByText('Toda a série')).toBeTruthy()
    fireEvent.press(getByText('Esta e as futuras'))
    expect(onPick).toHaveBeenCalledWith('this-and-future')
  })

  it('parcelamento: rótulos de parcela', () => {
    const ref = createRef<SheetRef>()
    const { getByText } = render(<DeleteModeSheet ref={ref} tx={INSTALLMENT} onPick={jest.fn()} />)
    expect(getByText('Só esta parcela')).toBeTruthy()
    expect(getByText('Todas as parcelas')).toBeTruthy()
  })
})
