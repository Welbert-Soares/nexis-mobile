import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { fmtBudgetMonth } from '#/lib/format'
import { colors } from '#/theme/colors'
import { BudgetRow } from '#/components/budgets/budget-row'
import type { Budget } from '#/schemas/budget'

export function BudgetsSection({
  year,
  month,
  isCurrentMonth,
  budgets,
  onPrev,
  onNext,
  onNew,
  onEdit,
}: {
  year: number
  month: number
  isCurrentMonth: boolean
  budgets: Budget[]
  onPrev: () => void
  onNext: () => void
  onNew: () => void
  onEdit: (b: Budget) => void
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium uppercase tracking-widest text-muted">Orçamentos</Text>
        <View className="flex-row items-center gap-1">
          <RoundBtn onPress={onPrev} testID="budget-month-prev">
            <ChevronLeft size={14} color={colors.muted} />
          </RoundBtn>
          <Text className="text-center text-xs text-muted" style={{ minWidth: 72 }}>
            {fmtBudgetMonth(year, month)}
          </Text>
          <RoundBtn onPress={onNext} disabled={isCurrentMonth} testID="budget-month-next">
            <ChevronRight size={14} color={colors.muted} />
          </RoundBtn>
          {isCurrentMonth && (
            <RoundBtn onPress={onNew} testID="budget-new">
              <Plus size={14} color={colors.muted} />
            </RoundBtn>
          )}
        </View>
      </View>

      {budgets.length > 0 ? (
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          {budgets.map((b) => (
            <BudgetRow key={b.id} budget={b} onPress={onEdit} />
          ))}
        </View>
      ) : (
        <View className="items-center rounded-2xl border border-border bg-card py-6">
          <Text className="text-xs text-muted">Nenhum orçamento definido</Text>
        </View>
      )}
    </View>
  )
}

function RoundBtn({
  onPress,
  disabled,
  testID,
  children,
}: {
  onPress: () => void
  disabled?: boolean
  testID?: string
  children: React.ReactNode
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      className="h-7 w-7 items-center justify-center rounded-full bg-border active:opacity-70"
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      {children}
    </Pressable>
  )
}
