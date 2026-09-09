import { useCallback, useMemo, useRef, useState } from 'react'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

import { ScrollView, View, Text } from '#/tw'
import { analyticsQuery } from '#/api/analytics'
import { budgetsQuery } from '#/api/budgets'
import { colors } from '#/theme/colors'
import { useHaptic } from '#/lib/haptics'
import { usePullRefresh } from '#/lib/use-pull-refresh'
import { SummaryCards } from '#/components/analytics/summary-cards'
import { SpendingPaceCard } from '#/components/analytics/spending-pace'
import { MonthlyTrend } from '#/components/analytics/monthly-trend'
import { CategoryBreakdown } from '#/components/analytics/category-breakdown'
import { AnalyticsSkeleton } from '#/components/analytics/analytics-skeleton'
import { BudgetsSection } from '#/components/budgets/budgets-section'
import { BudgetSheet, type EditableBudget } from '#/components/budgets/budget-sheet'
import { GoalsPreview } from '#/components/goals/goals-preview'
import type { SheetRef } from '#/components/ui/sheet'
import type { Budget } from '#/schemas/budget'

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export default function AnalyticsScreen() {
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()

  // "Hoje" fresco a cada montagem — não pode ser módulo-nível (o bundle fica
  // em memória por dias e o mês "atual" congelava). Mesmo motivo de transactions.
  const now = useMemo(() => new Date(), [])
  const [budgetYear, setBudgetYear] = useState(now.getFullYear())
  const [budgetMonth, setBudgetMonth] = useState(now.getMonth() + 1)
  const isCurrentMonth =
    budgetYear === now.getFullYear() && budgetMonth === now.getMonth() + 1

  const { data, isLoading, isFetching } = useQuery(analyticsQuery)
  const budgets = useQuery({ ...budgetsQuery(budgetYear, budgetMonth), placeholderData: keepPreviousData })

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['analytics'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      qc.invalidateQueries({ queryKey: ['goals'] })
    }, [qc]),
  )

  const sheetRef = useRef<SheetRef>(null)
  const [editing, setEditing] = useState<EditableBudget | undefined>()
  const haptic = useHaptic()

  const { refreshing, onRefresh } = usePullRefresh(isFetching, () => {
    haptic.tap()
    qc.invalidateQueries({ queryKey: ['analytics'] })
    qc.invalidateQueries({ queryKey: ['budgets'] })
    qc.invalidateQueries({ queryKey: ['goals'] })
  })

  function prevMonth() {
    if (budgetMonth === 1) {
      setBudgetMonth(12)
      setBudgetYear((y) => y - 1)
    } else {
      setBudgetMonth((m) => m - 1)
    }
  }
  function nextMonth() {
    if (isCurrentMonth) return
    if (budgetMonth === 12) {
      setBudgetMonth(1)
      setBudgetYear((y) => y + 1)
    } else {
      setBudgetMonth((m) => m + 1)
    }
  }
  function openNew() {
    setEditing(undefined)
    sheetRef.current?.present()
  }
  function openEdit(b: Budget) {
    setEditing({ id: b.id, categoryId: b.categoryId, limit: b.limit })
    sheetRef.current?.present()
  }

  const cold = isLoading && !data
  const income = data?.monthly.income ?? 0
  const expenses = data?.monthly.expenses ?? 0

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
          gap: 24,
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
        <View className="gap-1">
          <Text className="text-2xl font-bold text-fg" accessibilityRole="header">
            Análise
          </Text>
          <Text className="text-xs text-muted">
            {MONTHS[now.getMonth()]} {now.getFullYear()}
          </Text>
        </View>

        {cold ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            <Section title="Resumo do mês">
              <SummaryCards income={income} expenses={expenses} loading={isLoading} />
            </Section>

            {income > 0 && (
              <Section title="Ritmo do mês">
                <SpendingPaceCard
                  income={income}
                  expenses={expenses}
                  dayOfMonth={data?.dayOfMonth ?? 1}
                  daysInMonth={data?.daysInMonth ?? 30}
                />
              </Section>
            )}

            {!!data?.trend.length && (
              <Section title="Últimos 6 meses">
                <MonthlyTrend trend={data.trend} />
              </Section>
            )}

            {!!data?.categoryBreakdown.length && (
              <Section title="Gastos por categoria">
                <CategoryBreakdown items={data.categoryBreakdown} />
              </Section>
            )}

            <GoalsPreview />

            <BudgetsSection
              year={budgetYear}
              month={budgetMonth}
              isCurrentMonth={isCurrentMonth}
              budgets={budgets.data ?? []}
              onPrev={prevMonth}
              onNext={nextMonth}
              onNew={openNew}
              onEdit={openEdit}
            />
          </>
        )}
      </ScrollView>

      <BudgetSheet
        ref={sheetRef}
        budget={editing}
        month={budgetMonth}
        year={budgetYear}
        onClose={() => {
          setEditing(undefined)
          // Catch-all: garante o refetch da lista quando o sheet fecha, mesmo
          // que a invalidação de dentro da mutation tenha corrido com o
          // desmonte/re-render do sheet.
          qc.invalidateQueries({ queryKey: ['budgets'] })
        }}
      />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text
        className="text-xs font-medium uppercase tracking-widest text-muted"
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  )
}
