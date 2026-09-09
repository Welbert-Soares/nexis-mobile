import { render, fireEvent } from '@testing-library/react-native'

import { UndoToast } from '#/components/ui/undo-toast'

jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable }
})

describe('UndoToast', () => {
  it('não renderiza nada quando visible=false', () => {
    const { queryByText } = render(<UndoToast visible={false} label="Excluído" onUndo={() => {}} />)
    expect(queryByText('Excluído')).toBeNull()
    expect(queryByText('Desfazer')).toBeNull()
  })

  it('mostra o label + "Desfazer" e chama onUndo ao tocar', () => {
    const onUndo = jest.fn()
    const { getByText } = render(
      <UndoToast visible label="Transação excluída" onUndo={onUndo} />,
    )
    expect(getByText('Transação excluída')).toBeTruthy()
    fireEvent.press(getByText('Desfazer'))
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('anuncia como live region pro leitor de tela', () => {
    const { getByLabelText } = render(
      <UndoToast visible label="Transação excluída" onUndo={() => {}} />,
    )
    const node = getByLabelText('Transação excluída. Toque em desfazer.')
    expect(node.props.accessibilityLiveRegion).toBe('polite')
  })
})
