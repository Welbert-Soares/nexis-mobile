import { render } from '@testing-library/react-native'
import { Text } from 'react-native'

import { ScreenEnter } from '#/components/ui/screen-enter'

describe('ScreenEnter', () => {
  it('renderiza os children (a animação não bloqueia)', () => {
    const { getByText } = render(
      <ScreenEnter>
        <Text>conteúdo</Text>
      </ScreenEnter>,
    )
    expect(getByText('conteúdo')).toBeTruthy()
  })
})
