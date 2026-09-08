import { z } from 'zod'

const TX_TYPE = z.enum(['INCOME', 'EXPENSE'])
export type TransactionType = z.infer<typeof TX_TYPE>

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
  parentId: z.string().nullable(),
  isInstallment: z.boolean(),
  isTransfer: z.boolean(),
})
export const TransactionsSchema = z.array(TransactionSchema)
export type Transaction = z.infer<typeof TransactionSchema>

// Bodies — espelham os schemas de src/server/services/transaction.service.ts
// (sem recorrência/parcelamento; fora do escopo da Fatia 3).
export const TransactionInput = z.object({
  walletId: z.string(),
  amount: z.number().positive(),
  type: TX_TYPE,
  categoryId: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(), // 'YYYY-MM-DD'
})
export type TransactionInputData = z.infer<typeof TransactionInput>

export const TransactionEditInput = z.object({
  amount: z.number().positive(),
  type: TX_TYPE,
  walletId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date: z.string().optional(),
})
export type TransactionEditData = z.infer<typeof TransactionEditInput>
