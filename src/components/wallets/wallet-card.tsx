import { View, Text } from '#/tw'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { WALLET_META, type WalletType } from '#/lib/wallet-meta'
import { fmtBRL } from '#/lib/format'
import { colors } from '#/theme/colors'
import type { Wallet } from '#/schemas/wallet'

export function WalletCard({ wallet }: { wallet: Wallet }) {
  const meta = WALLET_META[wallet.type as WalletType]
  const Icon = (wallet.icon ? CATEGORY_ICONS[wallet.icon] : undefined) ?? meta.icon
  const tint = wallet.color ?? colors.accent

  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <View
        className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${tint}26` }}
      >
        <Icon size={20} color={tint} strokeWidth={1.5} />
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-medium text-fg">
          {wallet.name}
        </Text>
        <Text className="text-xs text-muted">{meta.label}</Text>
      </View>

      <View className="items-end">
        {wallet.type === 'CREDIT' ? (
          <CreditBalance wallet={wallet} />
        ) : (
          <Text
            className="text-sm font-semibold"
            style={{ color: wallet.balance >= 0 ? colors.fg : colors.negative }}
          >
            {fmtBRL(wallet.balance)}
          </Text>
        )}
      </View>
    </View>
  )
}

function CreditBalance({ wallet }: { wallet: Wallet }) {
  const invoice = Math.abs(Math.min(wallet.balance, 0))
  const limit = wallet.creditLimit ?? 0
  const pct = limit > 0 ? invoice / limit : 0

  return (
    <>
      <Text
        className="text-sm font-semibold"
        style={{ color: invoice > 0 ? colors.negative : colors.fg }}
      >
        {fmtBRL(invoice)}
      </Text>
      <Text className="text-[10px] text-muted">
        {limit > 0 ? `de ${fmtBRL(limit)} · ${Math.round(pct * 100)}%` : 'fatura atual'}
      </Text>
    </>
  )
}
