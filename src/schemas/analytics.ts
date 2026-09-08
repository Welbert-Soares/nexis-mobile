import { z } from 'zod'

// Resposta de GET /api/mobile/analytics — retorno cru de getAnalyticsData
// (repo nexis). Snapshot do mês corrente. `trend` tem sempre 6 itens
// (`month` = 'YYYY-MM', do mais antigo pro atual). z.object é não-strict.
export const AnalyticsSchema = z.object({
  monthly: z.object({ income: z.number(), expenses: z.number() }),
  categoryBreakdown: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      amount: z.number(),
    }),
  ),
  trend: z.array(
    z.object({
      month: z.string(),
      income: z.number(),
      expenses: z.number(),
    }),
  ),
  dayOfMonth: z.number(),
  daysInMonth: z.number(),
})
export type Analytics = z.infer<typeof AnalyticsSchema>
