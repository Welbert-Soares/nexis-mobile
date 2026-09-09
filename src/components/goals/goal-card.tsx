import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { ArrowDownLeft, PiggyBank } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { fmtBRL, fmtDate, tabularNums } from '#/lib/format'
import { pct } from '#/lib/analytics-calcs'
import { colors } from '#/theme/colors'
import type { Goal } from '#/schemas/goal'

export function GoalCard({
  goal,
  onEdit,
  onDeposit,
  onWithdraw,
}: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDeposit: (g: Goal) => void
  onWithdraw: (g: Goal) => void
}) {
  const progress =
    goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0
  const percent = pct(goal.currentAmount, goal.targetAmount)
  const done = percent >= 100
  const tint = goal.color ?? colors.accent
  const canWithdraw = goal.currentAmount > 0

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
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <Pressable
        onPress={() => onEdit(goal)}
        accessibilityRole="button"
        accessibilityLabel={`Editar meta ${goal.name}`}
        className="gap-2 active:opacity-70"
      >
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-row items-center gap-2">
            <View className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tint }} />
            <Text numberOfLines={1} className="flex-shrink text-sm text-fg">
              {goal.name}
            </Text>
          </View>
          <View className="shrink-0 flex-row items-center gap-2">
            <Text className="text-xs text-muted" style={tabularNums}>
              {fmtBRL(goal.currentAmount)} / {fmtBRL(goal.targetAmount)}
            </Text>
            <Text
              className="text-xs font-semibold"
              style={[tabularNums, { color: done ? colors.positive : colors.muted }]}
            >
              {percent}%
            </Text>
          </View>
        </View>

        <View
          className="h-1.5 w-full rounded-full bg-border"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
          <Animated.View
            style={{
              height: 6,
              borderRadius: 9999,
              backgroundColor: tint,
              width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            }}
          />
        </View>

        {goal.deadline && (
          <Text className="text-[11px] text-muted">até {fmtDate(new Date(goal.deadline))}</Text>
        )}
      </Pressable>

      <View className="flex-row gap-2">
        <Action
          icon={PiggyBank}
          label="Aportar"
          a11yLabel={`Aportar na meta ${goal.name}`}
          onPress={() => onDeposit(goal)}
        />
        <Action
          icon={ArrowDownLeft}
          label="Resgatar"
          a11yLabel={`Resgatar da meta ${goal.name}`}
          onPress={() => onWithdraw(goal)}
          disabled={!canWithdraw}
        />
      </View>
    </View>
  )
}

function Action({
  icon: Icon,
  label,
  a11yLabel,
  onPress,
  disabled,
}: {
  icon: typeof PiggyBank
  label: string
  a11yLabel?: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-border py-2.5 active:opacity-70"
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Icon size={14} color={colors.muted} strokeWidth={1.75} />
      <Text className="text-xs font-medium text-muted">{label}</Text>
    </Pressable>
  )
}
