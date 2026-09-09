import { render, fireEvent } from '@testing-library/react-native'

import { EmptyState } from '#/components/ui/empty-state'

jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable }
})
const mockTap = jest.fn()
jest.mock('#/lib/haptics', () => ({
  useHaptic: () => ({ tap: mockTap, success: jest.fn(), error: jest.fn(), heavy: jest.fn() }),
}))

afterEach(() => mockTap.mockClear())

describe('EmptyState', () => {
  it('mostra título e descrição', () => {
    const { getByText, queryByRole } = render(
      <EmptyState title="Nada aqui" description="Toque em + para começar" />,
    )
    expect(getByText('Nada aqui')).toBeTruthy()
    expect(getByText('Toque em + para começar')).toBeTruthy()
    expect(queryByRole('button')).toBeNull()
  })

  it('dispara a ação (com haptic) ao tocar no CTA', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <EmptyState title="Sem carteiras" action={{ label: 'Criar carteira', onPress }} />,
    )
    fireEvent.press(getByText('Criar carteira'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(mockTap).toHaveBeenCalledTimes(1)
  })

  it('variant bare não usa a moldura de card', () => {
    const { getByTestId } = render(<EmptyState title="x" variant="bare" />)
    expect(getByTestId('empty-state').props.className).not.toMatch(/bg-card/)
  })
})
