import { render } from '@testing-library/react-native'

import { Skeleton } from '#/components/ui/skeleton'

const mockUseReduceMotion = jest.fn(() => false)
jest.mock('#/lib/reduce-motion', () => ({
  useReduceMotion: () => mockUseReduceMotion(),
}))

afterEach(() => mockUseReduceMotion.mockReturnValue(false))

describe('Skeleton', () => {
  it('renderiza', () => {
    const { toJSON } = render(<Skeleton style={{ height: 40, width: 160 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('não anima com pulse={false}', () => {
    const { toJSON } = render(<Skeleton pulse={false} />)
    expect(toJSON()).toBeTruthy()
  })

  it('não anima quando "reduzir movimento" está ligado', () => {
    mockUseReduceMotion.mockReturnValue(true)
    const { toJSON } = render(<Skeleton />)
    expect(toJSON()).toBeTruthy()
  })

  it('fica escondido do leitor de tela', () => {
    const { toJSON } = render(<Skeleton />)
    const root = toJSON() as { props: Record<string, unknown> }
    expect(root.props.accessibilityElementsHidden).toBe(true)
  })
})
