import { useCallback, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Plus, Wallet as WalletIcon } from 'lucide-react-native'

import { ScrollView, View, Text, Pressable } from '#/tw'
import { walletsQuery } from '#/api/wallets'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import { useHaptic } from '#/lib/haptics'
import { usePullRefresh } from '#/lib/use-pull-refresh'
import { WalletCard } from '#/components/wallets/wallet-card'
import { WalletSheet } from '#/components/wallets/wallet-sheet'
import { TransferSheet } from '#/components/wallets/transfer-sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { EmptyState } from '#/components/ui/empty-state'
import type { SheetRef } from '#/components/ui/sheet'

export default function Wallets() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const router = useRouter()
  const { data, isLoading, isFetching } = useQuery(walletsQuery)
  const wallets = data ?? []
  const cold = isLoading && !data

  // Saldo é derivado no backend a cada leitura — recarrega ao focar a aba pra
  // refletir transações lançadas em outra tela.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['wallets'] })
    }, [qc]),
  )

  const walletRef = useRef<SheetRef>(null)
  const transferRef = useRef<SheetRef>(null)
  const haptic = useHaptic()

  const { refreshing, onRefresh } = usePullRefresh(isFetching, () => {
    haptic.tap()
    qc.invalidateQueries({ queryKey: ['wallets'] })
  })

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)

  function openNew() {
    walletRef.current?.present()
  }

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
            <Text className="text-sm text-muted" accessibilityRole="header">
              Saldo total
            </Text>
            {cold ? (
              <Skeleton style={{ height: 40, width: 160, borderRadius: 8 }} />
            ) : (
              <Text
                className="text-4xl font-bold text-fg"
                style={tabularNums}
                maxFontSizeMultiplier={1.4}
                accessibilityLabel={`Saldo total: ${fmtBRL(totalBalance)}`}
              >
                {fmtBRL(totalBalance)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {wallets.length >= 2 && (
              <Pressable
                testID="transfer-btn"
                onPress={() => transferRef.current?.present()}
                accessibilityRole="button"
                accessibilityLabel="Transferir entre carteiras"
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
              >
                <ArrowLeftRight size={16} color={colors.fg} />
              </Pressable>
            )}
            <Pressable
              onPress={openNew}
              accessibilityRole="button"
              accessibilityLabel="Nova carteira"
              hitSlop={6}
              className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
            >
              <Plus size={20} color={colors.fg} />
            </Pressable>
          </View>
        </View>

        {/* Lista */}
        {cold ? (
          <View className="gap-3">
            <Skeleton style={{ height: 72, borderRadius: 16 }} />
            <Skeleton style={{ height: 72, borderRadius: 16 }} />
          </View>
        ) : wallets.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="Nenhuma carteira ainda"
            description="Crie uma para começar a registrar transações"
            action={{ label: 'Criar carteira', onPress: openNew }}
          />
        ) : (
          <View className="gap-3">
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => {
                  haptic.tap()
                  router.push({ pathname: '/wallets/[id]', params: { id: w.id } })
                }}
                accessibilityRole="button"
                accessibilityLabel={`${w.name}, saldo ${fmtBRL(w.balance)}`}
                className="active:opacity-80"
              >
                <WalletCard wallet={w} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <WalletSheet ref={walletRef} />
      <TransferSheet ref={transferRef} wallets={wallets} />
    </>
  )
}
