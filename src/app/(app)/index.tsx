import { useCallback, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Wallet } from 'lucide-react-native'

import { ScrollView, View, Text, Pressable } from '#/tw'
import { Image } from '#/tw/image'
import { dashboardQuery } from '#/api/dashboard'
import { useAuthSession } from '#/auth/session'
import { fmtBRL, fmtDate, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { useHaptic } from '#/lib/haptics'
import { usePullRefresh } from '#/lib/use-pull-refresh'
import { ProfileSheet } from '#/components/profile/profile-sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { EmptyState } from '#/components/ui/empty-state'
import { SummaryCard } from '#/components/ui/summary-card'
import type { SheetRef } from '#/components/ui/sheet'
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
  const profileRef = useRef<SheetRef>(null)
  const haptic = useHaptic()
  const totalBalance = data?.totalBalance ?? 0

  const { refreshing, onRefresh } = usePullRefresh(isFetching, () => {
    haptic.tap()
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  })

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
            <Skeleton style={{ height: 40, width: 160, borderRadius: 8 }} />
          ) : (
            <Text
              className="text-4xl font-bold text-fg"
              style={tabularNums}
              maxFontSizeMultiplier={1.4}
              accessibilityRole="header"
              accessibilityLabel={`Saldo total: ${fmtBRL(totalBalance)}`}
            >
              {fmtBRL(totalBalance)}
            </Text>
          )}
          <Text className="text-xs text-muted">Saldo total · todas as carteiras</Text>
        </View>

        <Pressable
          onPress={() => profileRef.current?.present()}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          hitSlop={8}
          className="active:opacity-70"
        >
          {session?.user?.image ? (
            <Image source={session.user.image} className="h-10 w-10 rounded-full" />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-card">
              <Text className="text-sm text-fg">{firstName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </Pressable>
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
            <Text
              className="text-xs font-medium uppercase tracking-widest text-muted"
              accessibilityRole="header"
            >
              Recentes
            </Text>
            {cold ? (
              <ListSkeleton />
            ) : !data?.recent.length ? (
              <EmptyState title="Nenhuma transação ainda" description="Toque em + para adicionar" />
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

    <ProfileSheet ref={profileRef} />
    </>
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

function ListSkeleton() {
  return (
    <View className="gap-1">
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center gap-3 rounded-xl px-1 py-2.5">
          <Skeleton style={{ height: 32, width: 32, borderRadius: 12 }} />
          <View className="flex-1 gap-1.5">
            <Skeleton style={{ height: 14, width: 112, borderRadius: 4 }} />
            <Skeleton style={{ height: 12, width: 80, borderRadius: 4 }} />
          </View>
          <Skeleton style={{ height: 14, width: 56, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  )
}
