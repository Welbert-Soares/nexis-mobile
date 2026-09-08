import { z } from 'zod'

// Contrato de getDashboardData (repo nexis). `recent[].category` chega como a
// Category completa serializada; aqui pegamos so o subconjunto usado pela tela.
// `date` e string ISO no JSON. z.object e nao-strict: campos extras (type,
// userId, createdAt...) sao ignorados.

const RecentTx = z.object({
  id: z.string(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number(),
  description: z.string().nullable(),
  date: z.string(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
      icon: z.string().nullable(),
    })
    .nullable(),
  wallet: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
  }),
})

export const DashboardResponseSchema = z.object({
  totalBalance: z.number(),
  hasWallets: z.boolean(),
  monthly: z.object({ income: z.number(), expenses: z.number() }),
  recent: z.array(RecentTx),
  categoryBreakdown: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      amount: z.number(),
    }),
  ),
})

export type DashboardData = z.infer<typeof DashboardResponseSchema>
