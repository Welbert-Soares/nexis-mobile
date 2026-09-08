import { useCallback } from 'react'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native'

import { ScrollView, View, Text } from '#/tw'
import { Image } from '#/tw/image'
import { dashboardQuery } from '#/api/dashboard'
import { useAuthSession } from '#/auth/session'
import { fmtBRL, fmtDate, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import type { DashboardData } from '#/schemas/dashboard'

type RecentTx = DashboardData['recent'][number]

export default function Dashboard() {
  const { session } = useAuthSession()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const { data, isLoading, isFetching } = useQuery(dashboardQuery)

  // Recarrega ao focar a aba — mutações de transação/carteira em outra aba
  // invalidam ['dashboard'], mas o refetch só é garantido ao voltar pra cá.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    }, [qc]),
  )

  const firstName = session?.user?.name?.split(' ')[0] ?? ''
  const cold = isLoading && !data

  return (
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
          refreshing={isFetching && !isLoading}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['dashboard'] })}
          tintColor={colors.muted}
          colors={[colors.muted]}
          progressViewOffset={insets.top + 8}
        />
      }
    >
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="gap-1">
          <Text className="text-sm text-muted">Olá, {firstName}</Text>
          {cold ? (
            <View className="h-10 w-40 rounded-lg bg-card" />
          ) : (
            <Text className="text-4xl font-bold text-fg" style={tabularNums}>
              {fmtBRL(data?.totalBalance ?? 0)}
            </Text>
          )}
          <Text className="text-xs text-muted">Saldo total · todas as carteiras</Text>
        </View>

        {session?.user?.image ? (
          <Image source={session.user.image} className="h-10 w-10 rounded-full" />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-card">
            <Text className="text-sm text-fg">{firstName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Onboarding OU resumo + recentes */}
      {!cold && data && !data.hasWallets ? (
        <OnboardingCard />
      ) : (
        <>
          <View className="flex-row gap-3">
            <SummaryCard label="Receitas" value={data?.monthly.income ?? 0} kind="in" loading={cold} />
            <SummaryCard label="Despesas" value={data?.monthly.expenses ?? 0} kind="out" loading={cold} />
          </View>

          <View className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-widest text-muted">Recentes</Text>
            {cold ? (
              <ListSkeleton />
            ) : !data?.recent.length ? (
              <EmptyRecent />
            ) : (
              <View className="gap-1">
                {data.recent.map((t) => (
                  <TxRow key={t.id} tx={t} />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
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

function TxRow({ tx }: { tx: RecentTx }) {
  const isExpense = tx.type === 'EXPENSE'
  const label = tx.description ?? tx.category?.name ?? 'Sem descrição'
  const color = tx.category?.color ?? tx.wallet.color ?? colors.muted
  const CategoryIcon = tx.category?.icon ? CATEGORY_ICONS[tx.category.icon] : null

  return (
    <View className="flex-row items-center gap-3 rounded-xl px-1 py-2.5">
      <View
        className="h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        {CategoryIcon ? (
          <CategoryIcon size={16} color={color} strokeWidth={1.75} />
        ) : (
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm text-fg">
          {label}
        </Text>
        <Text className="text-xs text-muted">
          {tx.wallet.name} · {fmtDate(new Date(tx.date))}
        </Text>
      </View>
      <Text
        className="shrink-0 text-sm font-medium"
        style={[tabularNums, { color: isExpense ? colors.negative : colors.positive }]}
      >
        {isExpense ? '-' : '+'}
        {fmtBRL(tx.amount)}
      </Text>
    </View>
  )
}

const ONBOARDING_STEPS = [
  { step: '1', text: 'Crie uma carteira (conta corrente, dinheiro...)' },
  { step: '2', text: 'Registre suas receitas e despesas' },
  { step: '3', text: 'Acompanhe seu saldo em tempo real' },
]

function OnboardingCard() {
  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <Wallet color={colors.accent} size={20} strokeWidth={1.5} />
        </View>
        <View>
          <Text className="text-sm font-medium text-fg">Bem-vindo ao Nexis</Text>
          <Text className="text-xs text-muted">Comece criando sua primeira carteira</Text>
        </View>
      </View>

      <View className="gap-2">
        {ONBOARDING_STEPS.map((s) => (
          <View key={s.step} className="flex-row items-center gap-3">
            <Text className="h-5 w-5 rounded-full bg-bg text-center text-[10px] font-semibold leading-5 text-muted">
              {s.step}
            </Text>
            <Text className="text-xs text-muted">{s.text}</Text>
          </View>
        ))}
      </View>

      {/* Sem tela de carteiras nesta fatia — botao apenas visual */}
      <View className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-accent py-3">
        <Text className="text-sm font-semibold text-white">Criar carteira</Text>
        <ArrowRight color="#ffffff" size={16} />
      </View>
    </View>
  )
}

function EmptyRecent() {
  return (
    <View className="items-center gap-2 rounded-2xl border border-border bg-card py-10">
      <Text className="text-sm text-muted">Nenhuma transação ainda</Text>
      <Text className="text-xs text-muted/70">Toque em + para adicionar</Text>
    </View>
  )
}

function ListSkeleton() {
  return (
    <View className="gap-1">
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center gap-3 rounded-xl px-1 py-2.5">
          <View className="h-8 w-8 shrink-0 rounded-xl bg-card" />
          <View className="flex-1 gap-1.5">
            <View className="h-3.5 w-28 rounded bg-card" />
            <View className="h-3 w-20 rounded bg-card opacity-60" />
          </View>
          <View className="h-3.5 w-14 rounded bg-card" />
        </View>
      ))}
    </View>
  )
}
