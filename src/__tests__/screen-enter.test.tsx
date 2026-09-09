import { render } from '@testing-library/react-native'
import { Text } from 'react-native'

import { ScreenEnter } from '#/components/ui/screen-enter'

const mockReduce = jest.fn(() => false)
jest.mock('#/lib/reduce-motion', () => ({ useReduceMotion: () => mockReduce() }))

afterEach(() => mockReduce.mockReturnValue(false))

describe('ScreenEnter', () => {
  it('renderiza os children (a animação não bloqueia)', () => {
    const { getByText } = render(
      <ScreenEnter>
        <Text>conteúdo</Text>
      </ScreenEnter>,
    )
    expect(getByText('conteúdo')).toBeTruthy()
  })

  it('com "reduzir movimento" ligado, renderiza sem Animated', () => {
    mockReduce.mockReturnValue(true)
    const { getByText } = render(
      <ScreenEnter>
        <Text>conteúdo</Text>
      </ScreenEnter>,
    )
    expect(getByText('conteúdo')).toBeTruthy()
  })
})
