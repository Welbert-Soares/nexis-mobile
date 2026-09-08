import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

import { View, Text, Pressable } from '#/tw'
import { fmtBRL, tabularNums } from '#/lib/format'
import { budgetBarColor } from '#/lib/analytics-calcs'
import { colors } from '#/theme/colors'
import type { Budget } from '#/schemas/budget'

export function BudgetRow({
  budget,
  onPress,
}: {
  budget: Budget
  onPress: (b: Budget) => void
}) {
  const over = budget.spent > budget.limit
  const progress =
    budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0

  const width = useRef(new Animated.Value(0)).current
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      width.setValue(progress)
      return
    }
    Animated.timing(width, { toValue: progress, duration: 500, useNativeDriver: false }).start()
  }, [progress, width])

  return (
    <Pressable onPress={() => onPress(budget)} className="gap-1.5 active:opacity-70">
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-row items-center gap-2">
          <View
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: budget.categoryColor }}
          />
          <Text numberOfLines={1} className="flex-shrink text-xs text-fg">
            {budget.categoryName}
          </Text>
        </View>
        <View className="shrink-0 flex-row items-center gap-1.5">
          <Text
            className="text-xs font-medium"
            style={[tabularNums, { color: over ? colors.negative : colors.fg }]}
          >
            {fmtBRL(budget.spent)}
          </Text>
          <Text className="text-xs text-muted">/ {fmtBRL(budget.limit)}</Text>
        </View>
      </View>

      <View className="h-1.5 w-full rounded-full bg-border">
        <Animated.View
          style={{
            height: 6,
            borderRadius: 9999,
            backgroundColor: budgetBarColor(progress),
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>

      {over && (
        <Text className="text-[10px]" style={{ color: colors.negative }}>
          Limite excedido em {fmtBRL(budget.spent - budget.limit)}
        </Text>
      )}
    </Pressable>
  )
}
