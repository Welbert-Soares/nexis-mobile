import { View, Text } from '#/tw'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'

// Resumo do mês corrente — 3 cards (Receitas / Despesas / Saldo).
export function SummaryCards({
  income,
  expenses,
  loading,
}: {
  income: number
  expenses: number
  loading: boolean
}) {
  const net = income - expenses
  return (
    <View className="flex-row gap-2">
      <Card label="Receitas" value={income} color={colors.positive} loading={loading} />
      <Card label="Despesas" value={expenses} color={colors.negative} loading={loading} />
      <Card
        label="Saldo"
        value={net}
        color={net >= 0 ? colors.accent : colors.negative}
        loading={loading}
      />
    </View>
  )
}

function Card({
  label,
  value,
  color,
  loading,
}: {
  label: string
  value: number
  color: string
  loading: boolean
}) {
  return (
    <View className="flex-1 gap-1.5 rounded-2xl border border-border bg-card p-3">
      <Text className="text-xs text-muted">{label}</Text>
      {loading ? (
        <View className="h-5 w-16 rounded bg-border" />
      ) : (
        <Text className="text-sm font-semibold" style={[tabularNums, { color }]}>
          {fmtBRL(value)}
        </Text>
      )}
    </View>
  )
}
