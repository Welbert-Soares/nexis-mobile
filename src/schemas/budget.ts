import { z } from 'zod'

// Resposta de GET /api/mobile/budgets — o mesmo map do getBudgets de
// budget.service.ts (repo nexis). z.object é não-strict.
export const BudgetSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  categoryColor: z.string(),
  categoryIcon: z.string().nullable(),
  limit: z.number(),
  spent: z.number(),
})
export const BudgetsSchema = z.array(BudgetSchema)
export type Budget = z.infer<typeof BudgetSchema>

// Body de POST /api/mobile/budgets — espelha o saveBudget schema do service.
export const BudgetInput = z.object({
  categoryId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  amount: z.number().positive(),
})
export type BudgetInputData = z.infer<typeof BudgetInput>
