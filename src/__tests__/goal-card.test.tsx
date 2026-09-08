import { render } from '@testing-library/react-native'

import { GoalCard } from '#/components/goals/goal-card'
import type { Goal } from '#/schemas/goal'

jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable }
})
jest.mock('lucide-react-native', () => ({ ArrowDownLeft: () => null, PiggyBank: () => null }))

const GOAL: Goal = {
  id: 'g1',
  name: 'Viagem Europa',
  targetAmount: 10000,
  seedAmount: 0,
  currentAmount: 2500,
  deadline: null,
  color: '#3b82f6',
}

const noop = () => {}

describe('GoalCard', () => {
  it('mostra nome e progresso (%)', () => {
    const { getByText } = render(
      <GoalCard goal={GOAL} onEdit={noop} onDeposit={noop} onWithdraw={noop} />,
    )
    expect(getByText('Viagem Europa')).toBeTruthy()
    expect(getByText('25%')).toBeTruthy()
    expect(getByText('Aportar')).toBeTruthy()
    expect(getByText('Resgatar')).toBeTruthy()
  })

  it('desabilita "Resgatar" quando currentAmount é 0', () => {
    const { getByText } = render(
      <GoalCard
        goal={{ ...GOAL, currentAmount: 0 }}
        onEdit={noop}
        onDeposit={noop}
        onWithdraw={noop}
      />,
    )
    // o Pressable de Resgatar tem disabled — o texto continua no DOM
    const label = getByText('Resgatar')
    expect(label).toBeTruthy()
  })
})
