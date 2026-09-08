import { apiGet, apiPost, apiDelete } from './client'
import {
  TransactionsSchema,
  TransactionSchema,
  type TransactionInputData,
  type TransactionEditData,
} from '#/schemas/transaction'

export const monthTransactionsQuery = (year: number, month: number) => ({
  queryKey: ['transactions', year, month] as const,
  queryFn: () =>
    apiGet(`/api/mobile/transactions?year=${year}&month=${month}`, (r) => TransactionsSchema.parse(r)),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
})

// Data da transação mais futura do usuário — libera a navegação de mês além do
// mês atual (parcelas/recorrências caem em meses futuros).
export const maxDateQuery = {
  queryKey: ['transactions-max-date'] as const,
  queryFn: () =>
    apiGet('/api/mobile/transactions/max-date', (r) => {
      const d = (r as { date?: unknown })?.date
      return typeof d === 'string' ? d : null
    }),
  staleTime: 60_000,
}

// O POST do repo web não faz `include`, então o corpo não traz category/wallet
// expandidos. Parse com `.partial()` e o app ignora o corpo (só confirma o ok);
// a UI recarrega via invalidação.
export const createTransaction = (body: TransactionInputData) =>
  apiPost('/api/mobile/transactions', body, (r) =>
    r == null ? null : TransactionSchema.partial().parse(r),
  )

export const editTransaction = (id: string, body: TransactionEditData) =>
  apiPost(`/api/mobile/transactions/${id}`, body, (r) => TransactionSchema.partial().parse(r))

export const deleteTransaction = (
  id: string,
  mode?: 'this' | 'this-and-future' | 'all',
) => apiDelete(`/api/mobile/transactions/${id}${mode ? `?mode=${mode}` : ''}`)

// Gera as ocorrências recorrentes vencidas (o app chama ao abrir). Responde
// quantas foram lançadas — `count > 0` ⇒ invalidar as queries de transações.
export const triggerRecurring = () =>
  apiPost('/api/mobile/transactions/trigger-recurring', undefined, (r) => {
    const c = (r as { count?: unknown })?.count
    return typeof c === 'number' ? c : 0
  })
