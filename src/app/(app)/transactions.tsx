import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { monthTransactionsQuery } from '#/api/transactions'
import { fmtBRL, fmtDayGroup, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { TransactionRow } from '#/components/transactions/transaction-row'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'
import type { Transaction } from '#/schemas/transaction'

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export default function Transactions() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { openEdit, createdMonth, consumeCreatedMonth } = useTransactionSheet()

  // Referência de "hoje" fresca a cada montagem — não pode ser módulo-nível
  // (o bundle fica em memória por dias no app e o mês "atual" congelava).
  const [{ year, month }, setYM] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

  const query = useQuery({ ...monthTransactionsQuery(year, month), placeholderData: keepPreviousData })
  const txs = query.data ?? []
  const cold = query.isLoading && !query.data

  const today = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  // Ao voltar pra aba (ex.: depois de criar pelo FAB em outra aba), recarrega o
  // mês visível — a invalidação da mutation só refaz queries ativas.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['transactions', year, month] })
    }, [qc, year, month]),
  )

  // Acabou de criar uma transação: pula pro mês dela (senão o lançamento
  // "some" quando o mês visível é outro).
  useEffect(() => {
    if (createdMonth) {
      setYM(createdMonth)
      consumeCreatedMonth()
    }
  }, [createdMonth, consumeCreatedMonth])

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYM({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const { income, expenses } = useMemo(() => {
    let income = 0
    let expenses = 0
    for (const t of txs) {
      if (t.isTransfer) continue
      if (t.type === 'INCOME') income += t.amount
      else expenses += t.amount
    }
    return { income, expenses }
  }, [txs])

  const sections = useMemo(() => groupByDay(txs), [txs])

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header fixo */}
      <View className="gap-4 px-4 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => shift(-1)}
            className="h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
          >
            <ChevronLeft size={18} color={colors.fg} />
          </Pressable>
          <Text className="text-base font-semibold capitalize text-fg">
            {MONTHS[month - 1]} {year}
          </Text>
          <Pressable
            onPress={() => shift(1)}
            disabled={isCurrentMonth}
            className="h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
            style={{ opacity: isCurrentMonth ? 0.35 : 1 }}
          >
            <ChevronRight size={18} color={colors.fg} />
          </Pressable>
        </View>

        <View className="flex-row gap-3">
          <SummaryCard label="Receitas" value={income} kind="in" loading={cold} />
          <SummaryCard label="Despesas" value={expenses} kind="out" loading={cold} />
        </View>
      </View>

      {cold ? (
        <ListSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 96 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['transactions'] })}
              tintColor={colors.muted}
              colors={[colors.muted]}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text className="bg-bg pb-1.5 pt-4 text-xs font-medium text-muted">{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TransactionRow
              tx={item}
              onPress={item.isTransfer ? undefined : () => openEdit(item)}
            />
          )}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </View>
  )
}

type Section = { title: string; data: Transaction[] }

function groupByDay(txs: Transaction[]): Section[] {
  const map = new Map<string, Transaction[]>()
  // txs já vêm ordenadas por data desc do backend.
  for (const t of txs) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const bucket = map.get(key)
    if (bucket) bucket.push(t)
    else map.set(key, [t])
  }
  return Array.from(map.values()).map((data) => ({
    title: fmtDayGroup(new Date(data[0].date)),
    data,
  }))
}

function SummaryCard({
  label,
  value,
  kind,
  loading,
}: {
  label: string
  value: number
  kind: 'in' | 'out'
  loading: boolean
}) {
  const isIn = kind === 'in'
  const Icon = isIn ? TrendingUp : TrendingDown
  const tone = isIn ? colors.positive : colors.negative

  return (
    <View className="flex-1 gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Icon color={tone} size={16} />
        <Text className="text-xs text-muted">{label}</Text>
      </View>
      {loading ? (
        <View className="h-6 w-24 rounded bg-bg" />
      ) : (
        <Text className="text-lg font-semibold" style={[tabularNums, { color: tone }]}>
          {fmtBRL(value)}
        </Text>
      )}
    </View>
  )
}

function EmptyState() {
  return (
    <View className="mt-6 items-center gap-2 rounded-2xl border border-border bg-card py-12">
      <Text className="text-sm text-muted">Nenhuma transação neste mês</Text>
      <Text className="text-xs text-muted/70">Toque em + para adicionar</Text>
    </View>
  )
}

function ListSkeleton() {
  return (
    <View className="gap-1 px-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} className="flex-row items-center gap-3 rounded-xl px-1 py-2.5">
          <View className="h-9 w-9 shrink-0 rounded-xl bg-card" />
          <View className="flex-1 gap-1.5">
            <View className="h-3.5 w-32 rounded bg-card" />
            <View className="h-3 w-20 rounded bg-card opacity-60" />
          </View>
          <View className="h-3.5 w-16 rounded bg-card" />
        </View>
      ))}
    </View>
  )
}
