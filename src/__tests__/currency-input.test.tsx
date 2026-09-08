import { render, fireEvent } from '@testing-library/react-native'

import { CurrencyInput, formatCents } from '#/components/ui/currency-input'

jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, TextInput: RN.TextInput }
})

function setup(cents = 0, onChange = jest.fn()) {
  const utils = render(<CurrencyInput cents={cents} onChange={onChange} />)
  const input = utils.UNSAFE_getByType(require('react-native').TextInput)
  return { ...utils, input, onChange }
}

describe('formatCents', () => {
  it('formata em pt-BR com 2 casas', () => {
    expect(formatCents(0)).toBe('0,00')
    expect(formatCents(123450)).toBe('1.234,50')
  })
})

describe('CurrencyInput', () => {
  it('exibe o valor formatado a partir de cents', () => {
    const { input } = setup(123450)
    expect(input.props.value).toBe('1.234,50')
  })

  it('onChange recebe só os dígitos como cents', () => {
    const { input, onChange } = setup(0)
    fireEvent.changeText(input, '12345')
    expect(onChange).toHaveBeenCalledWith(12345)
  })

  it('ignora não-dígitos', () => {
    const { input, onChange } = setup(0)
    fireEvent.changeText(input, 'R$ 9,x')
    expect(onChange).toHaveBeenCalledWith(9)
  })

  it('campo vazio → 0', () => {
    const { input, onChange } = setup(500)
    fireEvent.changeText(input, '')
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('trava no teto de 99.999.999 cents', () => {
    const { input, onChange } = setup(0)
    fireEvent.changeText(input, '1234567890')
    expect(onChange).toHaveBeenCalledWith(99_999_999)
  })
})
