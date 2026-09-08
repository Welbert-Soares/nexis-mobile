import { z } from 'zod'

const WALLET_TYPE = z.enum(['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'CREDIT'])

// Resposta de getWalletsByUser / createWallet / updateWallet (repo web já
// converte Decimal → number). z.object é não-strict: currency/userId/timestamps
// e outros campos extras do Prisma passam sem quebrar.
export const WalletSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: WALLET_TYPE,
  color: z.string().nullable(),
  icon: z.string().nullable(),
  balance: z.number(),
  initialBalance: z.number(),
  creditLimit: z.number().nullable(),
  closingDay: z.number().nullable(),
  dueDay: z.number().nullable(),
})
export const WalletsSchema = z.array(WalletSchema)
export type Wallet = z.infer<typeof WalletSchema>

// Bodies — espelham os schemas de src/server/services/wallet.service.ts.
export const WalletInput = z.object({
  name: z.string().min(1),
  type: WALLET_TYPE,
  color: z.string().optional(),
  icon: z.string().optional(),
  balance: z.number().min(0).optional(),
  creditLimit: z.number().positive().nullable().optional(),
  closingDay: z.number().int().min(1).max(28).nullable().optional(),
  dueDay: z.number().int().min(1).max(28).nullable().optional(),
})
export type WalletInputData = z.infer<typeof WalletInput>

export const WalletEditInput = WalletInput.partial().extend({
  icon: z.string().nullable().optional(),
})
export type WalletEditData = z.infer<typeof WalletEditInput>

export const TransferInput = z.object({
  fromWalletId: z.string(),
  toWalletId: z.string(),
  amount: z.number().positive(),
})
export type TransferData = z.infer<typeof TransferInput>
