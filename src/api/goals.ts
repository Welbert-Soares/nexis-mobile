import { apiGet, apiPost, apiDelete } from './client'
import {
  GoalsSchema,
  GoalSchema,
  type GoalInputData,
  type GoalEditData,
  type GoalMoveData,
} from '#/schemas/goal'

export const goalsQuery = {
  queryKey: ['goals'] as const,
  queryFn: () => apiGet('/api/mobile/goals', (r) => GoalsSchema.parse(r)),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
}

// POST devolve o registro cru (Decimals já convertidos pela rota) — parse
// tolerante; a UI recarrega via invalidação de ['goals'].
export const createGoal = (b: GoalInputData) =>
  apiPost('/api/mobile/goals', b, (r) => GoalSchema.partial().parse(r))

export const editGoal = (id: string, b: GoalEditData) =>
  apiPost(`/api/mobile/goals/${id}`, b, (r) => GoalSchema.partial().parse(r))

export const deleteGoal = (id: string) => apiDelete(`/api/mobile/goals/${id}`)

export const depositGoal = (id: string, b: GoalMoveData) =>
  apiPost(`/api/mobile/goals/${id}/deposit`, b)

export const withdrawGoal = (id: string, b: GoalMoveData) =>
  apiPost(`/api/mobile/goals/${id}/withdraw`, b)
