import { apiGet, apiPost, apiDelete } from './client'
import {
  WalletsSchema,
  WalletSchema,
  type WalletInputData,
  type WalletEditData,
  type TransferData,
} from '#/schemas/wallet'

export const walletsQuery = {
  queryKey: ['wallets'] as const,
  queryFn: () => apiGet('/api/mobile/wallets', (r) => WalletsSchema.parse(r)),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
}

export const createWallet = (body: WalletInputData) =>
  apiPost('/api/mobile/wallets', body, (r) => WalletSchema.parse(r))

export const editWallet = (id: string, body: WalletEditData) =>
  apiPost(`/api/mobile/wallets/${id}`, body, (r) => WalletSchema.parse(r))

export const deleteWallet = (id: string) => apiDelete(`/api/mobile/wallets/${id}`)

export const transferWallets = (body: TransferData) =>
  apiPost('/api/mobile/wallets/transfer', body)
