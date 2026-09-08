import { z } from 'zod'

// Resposta de getGoalsByUser (repo nexis já converte Decimal → number e
// calcula currentAmount). z.object não-strict — createdAt etc. passam.
export const GoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  seedAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.string().nullable(), // ISO ou null
  color: z.string().nullable(),
})
export const GoalsSchema = z.array(GoalSchema)
export type Goal = z.infer<typeof GoalSchema>

// Bodies — espelham goal.service.ts / a rota /api/mobile/goals.
export const GoalInput = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  seedAmount: z.number().min(0).optional(),
  deadline: z.string().nullable().optional(), // 'YYYY-MM-DD'
  color: z.string().optional(),
})
export type GoalInputData = z.infer<typeof GoalInput>

export const GoalEditInput = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  deadline: z.string().nullable().optional(),
  color: z.string().optional(),
})
export type GoalEditData = z.infer<typeof GoalEditInput>

export const GoalMoveInput = z.object({
  walletId: z.string(),
  amount: z.number().positive(),
})
export type GoalMoveData = z.infer<typeof GoalMoveInput>
