import { TrendingDown, TrendingUp } from 'lucide-react-native'

import { View, Text } from '#/tw'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'

// Card "Entradas" / "Saídas" — usado no Dashboard, em Transações e no detalhe
// da carteira.
export function SummaryCard({
  label,
  value,
  kind,
  loading,
}: {
  label: string
  value: number
  kind: 'in' | 'out'
  loading: boolean
}) {
  const isIn = kind === 'in'
  const Icon = isIn ? TrendingUp : TrendingDown
  const tone = isIn ? colors.positive : colors.negative

  return (
    <View className="flex-1 gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Icon color={tone} size={16} />
        <Text className="text-xs text-muted">{label}</Text>
      </View>
      {loading ? (
        <View className="h-6 w-24 rounded bg-bg" />
      ) : (
        <Text className="text-lg font-semibold" style={[tabularNums, { color: tone }]}>
          {fmtBRL(value)}
        </Text>
      )}
    </View>
  )
}
