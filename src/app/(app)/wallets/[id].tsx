import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeftRight, ArrowUp, ChevronLeft, Pencil } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { walletsQuery } from '#/api/wallets'
import { monthTransactionsQuery, maxDateQuery } from '#/api/transactions'
import { fmtBRL, tabularNums } from '#/lib/format'
import { groupByDay } from '#/lib/tx-group'
import { budgetBarColor } from '#/lib/analytics-calcs'
import { colors } from '#/theme/colors'
import { useHaptic } from '#/lib/haptics'
import { WALLET_META, type WalletType } from '#/lib/wallet-meta'
import { TransactionRow } from '#/components/transactions/transaction-row'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'
import { WalletSheet } from '#/components/wallets/wallet-sheet'
import { TransferSheet } from '#/components/wallets/transfer-sheet'
import { ScreenEnter } from '#/components/ui/screen-enter'
import { SummaryCard } from '#/components/ui/summary-card'
import { EmptyState } from '#/components/ui/empty-state'
import type { SheetRef } from '#/components/ui/sheet'

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export default function WalletDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()

  const { data: wallets = [], isLoading: walletsLoading } = useQuery(walletsQuery)
  const wallet = wallets.find((w) => w.id === id)

  const now = useMemo(() => new Date(), [])
  const [{ year, month }, setYM] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })

  const txq = useQuery({
    ...monthTransactionsQuery(year, month),
    placeholderData: keepPreviousData,
  })
  const { data: maxDateStr } = useQuery(maxDateQuery)
  const { openEdit } = useTransactionSheet()

  const walletTxs = useMemo(
    () => (txq.data ?? []).filter((t) => t.walletId === id),
    [txq.data, id],
  )

  // Diferente da tela geral de Transações, aqui a transferência CONTA — ela é
  // um fluxo de dinheiro real desta carteira.
  const { income, expenses, net } = useMemo(() => {
    let income = 0
    let expenses = 0
    for (const t of walletTxs) {
      if (t.type === 'INCOME') income += t.amount
      else expenses += t.amount
    }
    return { income, expenses, net: income - expenses }
  }, [walletTxs])

  const sections = useMemo(() => groupByDay(walletTxs), [walletTxs])
  const cold = txq.isLoading && !txq.data

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['wallets'] })
      qc.invalidateQueries({ queryKey: ['transactions', year, month] })
    }, [qc, year, month]),
  )

  // Carteira excluída (pelo Editar) com a tela aberta → volta pra lista.
  useEffect(() => {
    if (!walletsLoading && id && !wallet) router.back()
  }, [walletsLoading, id, wallet, router])

  const walletSheetRef = useRef<SheetRef>(null)
  const transferSheetRef = useRef<SheetRef>(null)
  const haptic = useHaptic()

  const today = new Date()
  const canGoNext = (() => {
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    if (
      nextYear < today.getFullYear() ||
      (nextYear === today.getFullYear() && nextMonth <= today.getMonth() + 1)
    ) {
      return true
    }
    const ceiling = maxDateStr
      ? new Date(maxDateStr)
      : new Date(today.getFullYear(), today.getMonth() + 24, 1)
    return (
      nextYear < ceiling.getFullYear() ||
      (nextYear === ceiling.getFullYear() && nextMonth <= ceiling.getMonth() + 1)
    )
  })()

  function shift(delta: number) {
    if (delta > 0 && !canGoNext) return
    const d = new Date(year, month - 1 + delta, 1)
    setYM({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  if (!wallet) return null

  const isCredit = wallet.type === 'CREDIT'
  const invoice = Math.abs(Math.min(wallet.balance, 0))
  const limit = wallet.creditLimit ?? 0
  const usePct = limit > 0 ? Math.min((invoice / limit) * 100, 100) : 0

  return (
    <ScreenEnter>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {/* Header + herói */}
        <View className="gap-4 px-4 pb-4 pt-2">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
              className="p-1 active:opacity-60"
            >
              <ChevronLeft size={24} color={colors.fg} />
            </Pressable>
            <View>
              <Text
                className="text-base font-semibold text-fg"
                numberOfLines={1}
                accessibilityRole="header"
              >
                {wallet.name}
              </Text>
              <Text className="text-xs text-muted">
                {WALLET_META[wallet.type as WalletType].label}
              </Text>
            </View>
          </View>

          {isCredit ? (
            <View className="gap-2">
              <Text
                className="text-4xl font-bold"
                style={[tabularNums, { color: invoice > 0 ? colors.negative : colors.fg }]}
                maxFontSizeMultiplier={1.4}
                accessibilityLabel={`Fatura atual: ${fmtBRL(invoice)}`}
              >
                {fmtBRL(invoice)}
              </Text>
              <Text className="text-xs text-muted">
                fatura atual
                {limit > 0 ? ` · de ${fmtBRL(limit)} · ${Math.round(usePct)}%` : ''}
              </Text>
              {limit > 0 && (
                <View className="h-1.5 w-full rounded-full bg-border">
                  <View
                    style={{
                      height: 6,
                      borderRadius: 9999,
                      backgroundColor: budgetBarColor(usePct),
                      width: `${usePct}%`,
                    }}
                  />
                </View>
              )}
            </View>
          ) : (
            <View className="gap-1.5">
              <Text
                className="text-4xl font-bold"
                style={[tabularNums, { color: wallet.color ?? colors.accent }]}
                maxFontSizeMultiplier={1.4}
                accessibilityLabel={`Saldo: ${fmtBRL(wallet.balance)}`}
              >
                {fmtBRL(wallet.balance)}
              </Text>
              <View className="flex-row items-center gap-1">
                {net >= 0 ? (
                  <ArrowUp size={13} color={colors.positive} strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={13} color={colors.negative} strokeWidth={2.5} />
                )}
                <Text
                  className="text-xs"
                  style={[tabularNums, { color: net >= 0 ? colors.positive : colors.negative }]}
                >
                  {fmtBRL(Math.abs(net))} em {MONTHS[month - 1]}
                </Text>
              </View>
            </View>
          )}

          {/* Ações */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                haptic.tap()
                walletSheetRef.current?.present()
              }}
              accessibilityRole="button"
              accessibilityLabel="Editar carteira"
              className="flex-row items-center gap-2 rounded-full bg-card px-4 py-2 active:opacity-70"
            >
              <Pencil size={14} color={colors.fg} />
              <Text className="text-xs font-medium text-fg">Editar</Text>
            </Pressable>
            {wallets.length >= 2 && (
              <Pressable
                onPress={() => {
                  haptic.tap()
                  transferSheetRef.current?.present()
                }}
                accessibilityRole="button"
                accessibilityLabel="Transferir entre carteiras"
                className="flex-row items-center gap-2 rounded-full bg-card px-4 py-2 active:opacity-70"
              >
                <ArrowLeftRight size={14} color={colors.fg} />
                <Text className="text-xs font-medium text-fg">Transferir</Text>
              </Pressable>
            )}
          </View>

          {/* Mini-resumo do mês */}
          <View className="flex-row gap-3">
            <SummaryCard label="Entradas" value={income} kind="in" loading={cold} />
            <SummaryCard label="Saídas" value={expenses} kind="out" loading={cold} />
          </View>

          {/* Nav de mês */}
          <View className="flex-row items-center justify-between">
            <Pressable
              testID="wd-month-prev"
              onPress={() => shift(-1)}
              accessibilityRole="button"
              accessibilityLabel="Mês anterior"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
            >
              <ChevronLeft size={18} color={colors.fg} />
            </Pressable>
            <Text
              className="text-sm font-semibold capitalize text-fg"
              accessibilityRole="header"
              maxFontSizeMultiplier={1.4}
            >
              {MONTHS[month - 1]} {year}
            </Text>
            <Pressable
              testID="wd-month-next"
              onPress={() => shift(1)}
              disabled={!canGoNext}
              accessibilityRole="button"
              accessibilityLabel="Próximo mês"
              accessibilityState={{ disabled: !canGoNext }}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70"
              style={{ opacity: canGoNext ? 1 : 0.35 }}
            >
              <ChevronLeft size={18} color={colors.fg} style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={txq.isFetching && !txq.isLoading}
              onRefresh={() => {
                haptic.tap()
                qc.invalidateQueries({ queryKey: ['transactions', year, month] })
              }}
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
              hideWallet
              onPress={item.isTransfer ? undefined : () => openEdit(item)}
            />
          )}
          ListEmptyComponent={
            cold ? null : (
              <View className="mt-6">
                <EmptyState
                  title={`Sem movimentações em ${MONTHS[month - 1]}`}
                  description="Toque em ＋ para registrar"
                />
              </View>
            )
          }
        />
      </View>

      <WalletSheet ref={walletSheetRef} wallet={wallet} onClose={() => {}} />
      <TransferSheet ref={transferSheetRef} wallets={wallets} />
    </ScreenEnter>
  )
}
