import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

import { View, Text } from '#/tw'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { spendingPace } from '#/lib/analytics-calcs'

const TEXT: Record<'over' | 'ahead' | 'ok', string> = {
  over: 'Você já gastou mais do que recebeu esse mês.',
  ahead: 'Ritmo de gastos acima do ideal pra durar o mês inteiro.',
  ok: 'Ritmo de gastos dentro do esperado pro dia do mês.',
}

// Ritmo do mês — barra "% da renda gasta" com marcador do "% do mês andado".
// Não renderiza sem receita (igual ao PWA).
export function SpendingPaceCard({
  income,
  expenses,
  dayOfMonth,
  daysInMonth,
}: {
  income: number
  expenses: number
  dayOfMonth: number
  daysInMonth: number
}) {
  const p = spendingPace(income, expenses, dayOfMonth, daysInMonth)
  const fill = Math.min(p.pctIncomeSpent, 100)

  const width = useRef(new Animated.Value(0)).current
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      width.setValue(fill)
      return
    }
    Animated.timing(width, { toValue: fill, duration: 500, useNativeDriver: false }).start()
  }, [fill, width])

  if (income <= 0) return null

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="relative h-2.5 w-full rounded-full bg-border">
        <Animated.View
          style={{
            height: 10,
            borderRadius: 9999,
            backgroundColor: p.barColor,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            height: 10,
            width: 2,
            backgroundColor: 'rgba(255,255,255,0.7)',
            left: `${p.pctMonthElapsed}%`,
          }}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted">
          <Text className="text-xs font-semibold" style={[tabularNums, { color: p.barColor }]}>
            {p.pctIncomeSpent}%
          </Text>{' '}
          da renda gasta
        </Text>
        <Text className="text-xs text-muted">mês {p.pctMonthElapsed}% andado</Text>
      </View>

      <Text className="text-[11px] leading-4 text-muted">{TEXT[p.tone]}</Text>

      {p.remaining > 0 && p.daysLeft > 0 && (
        <Text className="text-xs text-muted">
          Restam{' '}
          <Text className="font-semibold text-fg" style={tabularNums}>
            {fmtBRL(p.dailyBudget)}
          </Text>
          /dia pelos próximos {p.daysLeft} dias pra fechar o mês no azul.
        </Text>
      )}
    </View>
  )
}
