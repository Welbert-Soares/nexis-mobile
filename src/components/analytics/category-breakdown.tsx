import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { PieChart } from 'react-native-gifted-charts'

import { View, Text, Pressable } from '#/tw'
import { fmtBRL, tabularNums } from '#/lib/format'
import { pct } from '#/lib/analytics-calcs'
import { colors } from '#/theme/colors'

type CategoryItem = { id: string; name: string; color: string; amount: number }

// Gastos por categoria — donut + legenda top-5; toca e revela a lista completa.
export function CategoryBreakdown({ items }: { items: CategoryItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const total = items.reduce((acc, i) => acc + i.amount, 0)

  const reveal = useRef(new Animated.Value(0)).current
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      reveal.setValue(expanded ? 1 : 0)
      return
    }
    Animated.timing(reveal, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start()
  }, [expanded, reveal])

  if (!items.length || !total) return null

  const rotate = reveal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
  const listHeight = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, items.length * 26 + 12],
  })

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center gap-4 p-4 active:opacity-80"
      >
        <PieChart
          data={items.map((i) => ({ value: i.amount, color: i.color }))}
          donut
          radius={56}
          innerRadius={34}
          innerCircleColor={colors.card}
        />

        <View className="min-w-0 flex-1 gap-2">
          {items.slice(0, 5).map((i) => (
            <View key={i.id} className="flex-row items-center justify-between gap-2">
              <View className="min-w-0 flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
                <Text numberOfLines={1} className="flex-shrink text-xs text-muted">
                  {i.name}
                </Text>
              </View>
              <Text className="shrink-0 text-xs text-muted">{pct(i.amount, total)}%</Text>
            </View>
          ))}
        </View>

        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={16} color={colors.muted} />
        </Animated.View>
      </Pressable>

      <Animated.View style={{ height: listHeight, overflow: 'hidden' }}>
        <View className="gap-2.5 px-4 pb-3">
          {items.map((i) => (
            <View key={i.id} className="flex-row items-center justify-between gap-2">
              <View className="min-w-0 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
                <Text numberOfLines={1} className="flex-shrink text-xs text-muted">
                  {i.name}
                </Text>
              </View>
              <Text className="shrink-0 text-xs font-medium text-fg" style={tabularNums}>
                {fmtBRL(i.amount)}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  )
}
