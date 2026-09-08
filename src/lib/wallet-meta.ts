import { Wallet, PiggyBank, Banknote, TrendingUp, CreditCard, type LucideIcon } from 'lucide-react-native'

export type WalletType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT' | 'CREDIT'

export const WALLET_META: Record<WalletType, { label: string; icon: LucideIcon }> = {
  CHECKING: { label: 'Conta corrente', icon: Wallet },
  SAVINGS: { label: 'Poupança', icon: PiggyBank },
  CASH: { label: 'Dinheiro', icon: Banknote },
  INVESTMENT: { label: 'Investimento', icon: TrendingUp },
  CREDIT: { label: 'Crédito', icon: CreditCard },
}

export const WALLET_TYPES = (Object.keys(WALLET_META) as WalletType[]).map((value) => ({
  value,
  label: WALLET_META[value].label,
}))

export const WALLET_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#71717a',
]
