import { z } from 'zod'

const TX_TYPE = z.enum(['INCOME', 'EXPENSE'])
export type TransactionType = z.infer<typeof TX_TYPE>

const INTERVAL = z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'])
export type RecurrenceInterval = z.infer<typeof INTERVAL>

// Resposta de getTransactionsByMonth (repo web já converte Decimal → number).
// z.object é não-strict: `parent`, `_count`, timestamps e outros campos do
// Prisma passam sem quebrar.
export const TransactionSchema = z.object({
  id: z.string(),
  type: TX_TYPE,
  amount: z.number(),
  description: z.string().nullable(),
  date: z.string(), // ISO
  walletId: z.string(),
  categoryId: z.string().nullable(),
  category: z
    .object({
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
  recurring: z.boolean(),
  // o repo sempre manda (null ou valor); nullish pra não quebrar fixtures antigas
  interval: INTERVAL.nullish(),
  parentId: z.string().nullable(),
  isInstallment: z.boolean(),
  isTransfer: z.boolean(),
})
export const TransactionsSchema = z.array(TransactionSchema)
export type Transaction = z.infer<typeof TransactionSchema>

// Bodies — espelham os schemas de src/server/services/transaction.service.ts.
export const TransactionInput = z.object({
  walletId: z.string(),
  amount: z.number().positive(),
  type: TX_TYPE,
  categoryId: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(), // 'YYYY-MM-DD'
  recurring: z.boolean().optional(),
  interval: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  installments: z.number().int().min(2).max(24).optional(),
})
export type TransactionInputData = z.infer<typeof TransactionInput>

export const TransactionEditInput = z.object({
  amount: z.number().positive(),
  type: TX_TYPE,
  walletId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date: z.string().optional(),
  recurring: z.boolean().optional(),
  interval: INTERVAL.optional(),
})
export type TransactionEditData = z.infer<typeof TransactionEditInput>
