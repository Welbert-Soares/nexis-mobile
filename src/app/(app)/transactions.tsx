import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  FilterX,
  Layers,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'

import { View, Text, Pressable, ScrollView } from '#/tw'
import { monthTransactionsQuery } from '#/api/transactions'
import { walletsQuery } from '#/api/wallets'
import { fmtBRL, fmtDayGroup, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { TransactionRow } from '#/components/transactions/transaction-row'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'
import type { Transaction } from '#/schemas/transaction'

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE'

const TYPE_FILTERS: { value: FilterType; label: string; icon: LucideIcon; tone?: string }[] = [
  { value: 'ALL', label: 'Tudo', icon: Layers },
  { value: 'INCOME', label: 'Receitas', icon: TrendingUp, tone: colors.positive },
  { value: 'EXPENSE', label: 'Despesas', icon: TrendingDown, tone: colors.negative },
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

  const [filterType, setFilterType] = useState<FilterType>('ALL')
  const [filterWalletId, setFilterWalletId] = useState<string | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedChip, setExpandedChip] = useState<string | null>(null)

  const { data: wallets = [] } = useQuery(walletsQuery)

  const clearFilters = useCallback(() => {
    setFilterType('ALL')
    setFilterWalletId(null)
    setFilterCategoryId(null)
    setExpandedChip(null)
  }, [])

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

  const categoriesInMonth = useMemo(() => {
    const seen = new Map<
      string,
      { id: string; name: string; color: string | null; icon: string | null }
    >()
    for (const t of txs) {
      if (t.categoryId && t.category && !seen.has(t.categoryId)) {
        seen.set(t.categoryId, {
          id: t.categoryId,
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
        })
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [txs])

  const filteredTxs = useMemo(
    () =>
      txs.filter(
        (t) =>
          (filterType === 'ALL' || t.type === filterType) &&
          (!filterWalletId || t.walletId === filterWalletId) &&
          (!filterCategoryId || t.categoryId === filterCategoryId),
      ),
    [txs, filterType, filterWalletId, filterCategoryId],
  )

  const hasActiveFilter = filterType !== 'ALL' || !!filterWalletId || !!filterCategoryId

  const sections = useMemo(() => groupByDay(filteredTxs), [filteredTxs])

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

        {/* Filtros — colapsável (espelha o PWA) */}
        <View>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => {
                setFiltersOpen((o) => !o)
                setExpandedChip(null)
              }}
              className="flex-row items-center gap-2 active:opacity-70"
            >
              <View>
                <SlidersHorizontal size={16} color={hasActiveFilter ? colors.fg : colors.muted} />
                {hasActiveFilter && (
                  <View
                    className="absolute h-1.5 w-1.5 rounded-full"
                    style={{ top: -2, right: -2, backgroundColor: colors.accent }}
                  />
                )}
              </View>
              <Text
                className="text-xs font-medium"
                style={{ color: hasActiveFilter ? colors.fg : colors.muted }}
              >
                {filterSummary(
                  filterType,
                  filterWalletId,
                  filterCategoryId,
                  wallets,
                  categoriesInMonth,
                )}
              </Text>
              <View style={{ transform: [{ rotate: filtersOpen ? '-90deg' : '90deg' }] }}>
                <ChevronRight size={13} color={colors.muted} />
              </View>
            </Pressable>
            {hasActiveFilter && (
              <Pressable
                testID="filters-clear"
                onPress={clearFilters}
                className="p-0.5 active:opacity-60"
              >
                <FilterX size={14} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {filtersOpen && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 4, paddingTop: 12, paddingBottom: 2 }}
            >
              {TYPE_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  testID={`filter-type-${f.value}`}
                  icon={f.icon}
                  iconColor={f.tone}
                  label={f.label}
                  selected={filterType === f.value}
                  expanded={expandedChip === `type-${f.value}`}
                  onPress={() => {
                    setFilterType(f.value)
                    setExpandedChip((c) => (c === `type-${f.value}` ? null : `type-${f.value}`))
                  }}
                />
              ))}

              {wallets.length > 1 && (
                <>
                  <ChipDivider />
                  <FilterChip
                    testID="filter-wallet-all"
                    icon={Wallet}
                    label="Todas"
                    selected={filterWalletId === null}
                    expanded={expandedChip === 'wallet-all'}
                    onPress={() => {
                      setFilterWalletId(null)
                      setExpandedChip((c) => (c === 'wallet-all' ? null : 'wallet-all'))
                    }}
                  />
                  {wallets.map((w) => (
                    <FilterChip
                      key={w.id}
                      testID={`filter-wallet-${w.id}`}
                      icon={Wallet}
                      iconColor={w.color ?? undefined}
                      label={w.name}
                      selected={filterWalletId === w.id}
                      expanded={expandedChip === `wallet-${w.id}`}
                      onPress={() => {
                        setFilterWalletId((cur) => (cur === w.id ? null : w.id))
                        setExpandedChip((c) => (c === `wallet-${w.id}` ? null : `wallet-${w.id}`))
                      }}
                    />
                  ))}
                </>
              )}

              {categoriesInMonth.length > 0 && (
                <>
                  <ChipDivider />
                  {categoriesInMonth.map((c) => (
                    <FilterChip
                      key={c.id}
                      testID={`filter-category-${c.id}`}
                      icon={c.icon ? (CATEGORY_ICONS[c.icon] ?? null) : null}
                      iconColor={c.color ?? undefined}
                      label={c.name}
                      selected={filterCategoryId === c.id}
                      expanded={expandedChip === `category-${c.id}`}
                      onPress={() => {
                        setFilterCategoryId((cur) => (cur === c.id ? null : c.id))
                        setExpandedChip((ec) =>
                          ec === `category-${c.id}` ? null : `category-${c.id}`,
                        )
                      }}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {cold ? (
        <ListSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
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
          ListEmptyComponent={
            hasActiveFilter ? <EmptyFiltered onClear={clearFilters} /> : <EmptyState />
          }
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

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <View className="mt-6 items-center gap-3 rounded-2xl border border-border bg-card py-12">
      <Text className="text-sm text-muted">Nenhuma transação com esses filtros</Text>
      <Pressable onPress={onClear} className="rounded-full bg-accent px-4 py-2 active:opacity-80">
        <Text className="text-xs font-medium text-white">limpar filtros</Text>
      </Pressable>
    </View>
  )
}

function filterSummary(
  type: 'ALL' | 'INCOME' | 'EXPENSE',
  walletId: string | null,
  categoryId: string | null,
  wallets: { id: string; name: string }[],
  cats: { id: string; name: string }[],
): string {
  const parts = [
    type === 'INCOME' ? 'Receitas' : type === 'EXPENSE' ? 'Despesas' : null,
    walletId ? (wallets.find((w) => w.id === walletId)?.name ?? null) : null,
    categoryId ? (cats.find((c) => c.id === categoryId)?.name ?? null) : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Filtros'
}

/** Separador vertical entre os grupos de chips (tipo | carteira | categoria). */
function ChipDivider() {
  return <View className="my-1 w-px shrink-0" style={{ backgroundColor: colors.border }} />
}

/**
 * Chip de filtro: só o ícone por padrão; ao tocar, seleciona e revela o rótulo
 * ao lado (`expanded`). Selecionado = fundo claro. Mesmo padrão dos chips de
 * categoria/carteira do sheet.
 */
function FilterChip({
  icon: Icon,
  iconColor,
  label,
  selected,
  expanded,
  onPress,
  testID,
}: {
  icon: LucideIcon | null
  iconColor?: string
  label: string
  selected: boolean
  expanded: boolean
  onPress: () => void
  testID?: string
}) {
  const mark = selected ? colors.bg : (iconColor ?? colors.muted)
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="shrink-0 flex-row items-center rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: selected ? colors.fg : colors.border }}
    >
      {Icon ? (
        <Icon size={14} color={mark} strokeWidth={2} />
      ) : (
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: mark }} />
      )}
      {expanded && (
        <Text
          numberOfLines={1}
          className="ml-1.5 text-xs font-medium"
          style={{ color: selected ? colors.bg : colors.muted }}
        >
          {label}
        </Text>
      )}
    </Pressable>
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
