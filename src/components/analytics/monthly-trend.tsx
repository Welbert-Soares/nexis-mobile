import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'

import { View, Text } from '#/tw'
import { fmtMonthKeyShort } from '#/lib/format'
import { colors } from '#/theme/colors'

type TrendItem = { month: string; income: number; expenses: number }

const WITHIN_PAIR = 4 // gap Receita↔Despesa do mesmo mês
const EDGE = 8 // respiro nas pontas
const CHART_HEIGHT = 104

// Tendência dos últimos 6 meses — pares de barras Receitas/Despesas por mês.
// A largura das barras é derivada da largura real do card (medida via onLayout)
// pra os 6 meses ocuparem a faixa toda, em vez de ficarem finos e amontoados
// num canto.
export function MonthlyTrend({ trend }: { trend: TrendItem[] }) {
  const [w, setW] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)

  const max = Math.max(...trend.flatMap((t) => [t.income, t.expenses]), 1)

  // total ≈ 2*EDGE + 12*bw + 6*WITHIN_PAIR + 5*between, com between = 0.8*bw
  // → bw = (w - 2*EDGE - 6*WITHIN_PAIR) / (12 + 5*0.8)
  const rawBw = w > 0 ? (w - 2 * EDGE - 6 * WITHIN_PAIR) / 16 : 0
  const barWidth = Math.max(10, Math.min(26, Math.round(rawBw)))
  const between = Math.max(6, Math.round(barWidth * 0.8))
  const groupWidth = barWidth * 2 + WITHIN_PAIR

  const data = trend.flatMap((t) => [
    {
      value: t.income,
      frontColor: colors.positive,
      spacing: WITHIN_PAIR,
      label: fmtMonthKeyShort(t.month),
      labelWidth: groupWidth,
      labelTextStyle: { color: colors.muted, fontSize: 11, textAlign: 'center' as const },
    },
    { value: t.expenses, frontColor: colors.negative },
  ])

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row gap-4">
        <Legend color={colors.positive} label="Receitas" />
        <Legend color={colors.negative} label="Despesas" />
      </View>

      <View onLayout={onLayout} style={{ height: CHART_HEIGHT + 22 }}>
        {w > 0 && (
          <BarChart
            data={data}
            width={w}
            maxValue={max}
            height={CHART_HEIGHT}
            barWidth={barWidth}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            initialSpacing={EDGE}
            endSpacing={EDGE}
            spacing={between}
            hideRules
            hideYAxisText
            yAxisThickness={0}
            yAxisLabelWidth={0}
            xAxisThickness={0}
            disableScroll
            isAnimated
          />
        )}
      </View>
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
