import { useCallback, useRef, useState } from 'react'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Plus, Target } from 'lucide-react-native'

import { ScrollView, View, Text, Pressable } from '#/tw'
import { goalsQuery } from '#/api/goals'
import { walletsQuery } from '#/api/wallets'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { useHaptic } from '#/lib/haptics'
import { usePullRefresh } from '#/lib/use-pull-refresh'
import { GoalCard } from '#/components/goals/goal-card'
import { GoalSheet, type EditableGoal } from '#/components/goals/goal-sheet'
import { GoalMoveSheet } from '#/components/goals/goal-move-sheet'
import { ScreenEnter } from '#/components/ui/screen-enter'
import { Skeleton } from '#/components/ui/skeleton'
import { EmptyState } from '#/components/ui/empty-state'
import type { SheetRef } from '#/components/ui/sheet'
import type { Goal } from '#/schemas/goal'

export default function GoalsScreen() {
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: goals = [], isLoading, isFetching } = useQuery(goalsQuery)
  const { data: wallets = [] } = useQuery(walletsQuery)

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
    }, [qc]),
  )

  const goalSheetRef = useRef<SheetRef>(null)
  const moveSheetRef = useRef<SheetRef>(null)
  const haptic = useHaptic()

  const { refreshing, onRefresh } = usePullRefresh(isFetching, () => {
    haptic.tap()
    qc.invalidateQueries({ queryKey: ['goals'] })
    qc.invalidateQueries({ queryKey: ['wallets'] })
  })
  const [editing, setEditing] = useState<EditableGoal | undefined>()
  const [movingGoal, setMovingGoal] = useState<Goal | undefined>()
  const [moveMode, setMoveMode] = useState<'deposit' | 'withdraw'>('deposit')

  function openNew() {
    setEditing(undefined)
    goalSheetRef.current?.present()
  }
  function openEdit(g: Goal) {
    setEditing({ id: g.id, name: g.name, targetAmount: g.targetAmount, deadline: g.deadline, color: g.color })
    goalSheetRef.current?.present()
  }
  function openMove(g: Goal, mode: 'deposit' | 'withdraw') {
    setMovingGoal(g)
    setMoveMode(mode)
    moveSheetRef.current?.present()
  }

  const cold = isLoading && !goals.length
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0)
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0)

  return (
    <ScreenEnter>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 32,
          gap: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top + 8}
            tintColor={colors.muted}
            colors={[colors.muted]}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            className="p-1 active:opacity-60"
          >
            <ChevronLeft size={24} color={colors.fg} />
          </Pressable>
          <Text className="text-2xl font-bold text-fg" accessibilityRole="header">
            Metas
          </Text>
          <Pressable
            onPress={openNew}
            accessibilityRole="button"
            accessibilityLabel="Nova meta"
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-border active:opacity-70"
          >
            <Plus size={16} color={colors.fg} />
          </Pressable>
        </View>

        <View className="gap-1">
          <Text className="text-xs text-muted">Total guardado</Text>
          <Text
            className="text-3xl font-bold text-fg"
            style={tabularNums}
            maxFontSizeMultiplier={1.4}
            accessibilityLabel={`Total guardado: ${fmtBRL(totalSaved)}`}
          >
            {fmtBRL(totalSaved)}
          </Text>
          {totalTarget > 0 && (
            <Text className="text-xs text-muted">de {fmtBRL(totalTarget)} em metas</Text>
          )}
        </View>

        {cold ? (
          <View className="gap-3">
            <Skeleton style={{ height: 112, borderRadius: 16, borderWidth: 1, borderColor: colors.border }} />
            <Skeleton style={{ height: 112, borderRadius: 16, borderWidth: 1, borderColor: colors.border }} />
          </View>
        ) : goals.length === 0 ? (
          <EmptyState
            variant="bare"
            icon={Target}
            title="Nenhuma meta ainda"
            action={{ label: 'Criar meta', onPress: openNew }}
          />
        ) : (
          <View className="gap-3">
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onEdit={openEdit}
                onDeposit={(x) => openMove(x, 'deposit')}
                onWithdraw={(x) => openMove(x, 'withdraw')}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <GoalSheet
        ref={goalSheetRef}
        goal={editing}
        onClose={() => {
          setEditing(undefined)
          qc.invalidateQueries({ queryKey: ['goals'] })
        }}
      />
      <GoalMoveSheet
        ref={moveSheetRef}
        mode={moveMode}
        goal={movingGoal}
        wallets={wallets}
        onClose={() => {
          setMovingGoal(undefined)
          qc.invalidateQueries({ queryKey: ['goals'] })
          qc.invalidateQueries({ queryKey: ['wallets'] })
        }}
      />
    </ScreenEnter>
  )
}
