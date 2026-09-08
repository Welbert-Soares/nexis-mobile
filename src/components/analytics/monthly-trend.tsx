import { BarChart } from 'react-native-gifted-charts'

import { View, Text } from '#/tw'
import { fmtMonthKeyShort } from '#/lib/format'
import { colors } from '#/theme/colors'

type TrendItem = { month: string; income: number; expenses: number }

// Tendência dos últimos 6 meses — pares de barras Receitas/Despesas por mês.
// As props numéricas do BarChart podem precisar de ajuste fino no device
// (Fatia 5, Task 11): barWidth/spacing conforme a largura real da tela.
export function MonthlyTrend({ trend }: { trend: TrendItem[] }) {
  const max = Math.max(...trend.flatMap((t) => [t.income, t.expenses]), 1)

  const data = trend.flatMap((t) => [
    {
      value: t.income,
      frontColor: colors.positive,
      spacing: 3,
      label: fmtMonthKeyShort(t.month),
      labelWidth: 34,
      labelTextStyle: { color: colors.muted, fontSize: 10 },
    },
    { value: t.expenses, frontColor: colors.negative },
  ])

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row gap-4">
        <Legend color={colors.positive} label="Receitas" />
        <Legend color={colors.negative} label="Despesas" />
      </View>
      <BarChart
        data={data}
        maxValue={max}
        height={112}
        barWidth={10}
        barBorderTopLeftRadius={3}
        barBorderTopRightRadius={3}
        initialSpacing={8}
        endSpacing={4}
        spacing={18}
        hideRules
        hideYAxisText
        yAxisThickness={0}
        xAxisThickness={0}
        disableScroll
        isAnimated
      />
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  )
}
