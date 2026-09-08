import { apiGet, apiPost, apiDelete } from './client'
import { BudgetsSchema, BudgetSchema, type BudgetInputData } from '#/schemas/budget'

export const budgetsQuery = (year: number, month: number) => ({
  queryKey: ['budgets', year, month] as const,
  queryFn: () =>
    apiGet(`/api/mobile/budgets?year=${year}&month=${month}`, (r) => BudgetsSchema.parse(r)),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
})

// O POST responde o registro cru do upsert (sem category expandida) — parse
// tolerante; a UI recarrega via invalidação de ['budgets'].
export const saveBudget = (body: BudgetInputData) =>
  apiPost('/api/mobile/budgets', body, (r) => BudgetSchema.partial().parse(r))

export const removeBudget = (id: string) => apiDelete(`/api/mobile/budgets/${id}`)
