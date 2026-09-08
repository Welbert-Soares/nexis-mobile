import { useCallback, useRef, useState } from 'react'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Plus, Wallet as WalletIcon } from 'lucide-react-native'

import { ScrollView, View, Text, Pressable } from '#/tw'
import { walletsQuery } from '#/api/wallets'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import type { Wallet } from '#/schemas/wallet'
import { WalletCard } from '#/components/wallets/wallet-card'
import { WalletSheet } from '#/components/wallets/wallet-sheet'
import { TransferSheet } from '#/components/wallets/transfer-sheet'
import type { SheetRef } from '#/components/ui/sheet'

export default function Wallets() {
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
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

  const [editing, setEditing] = useState<Wallet | undefined>()
  const walletRef = useRef<SheetRef>(null)
  const transferRef = useRef<SheetRef>(null)

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)

  function openNew() {
    setEditing(undefined)
    walletRef.current?.present()
  }
  function openEdit(w: Wallet) {
    // objeto novo a cada abertura → o useEffect([wallet]) do sheet repopula
    // mesmo reabrindo a mesma carteira sem refetch no meio.
    setEditing({ ...w })
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
            refreshing={isFetching && !isLoading}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['wallets'] })}
            tintColor={colors.muted}
            colors={[colors.muted]}
            progressViewOffset={insets.top + 8}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-start justify-between">
          <View className="gap-1">
            <Text className="text-sm text-muted">Saldo total</Text>
            {cold ? (
              <View className="h-10 w-40 rounded-lg bg-card" />
            ) : (
              <Text className="text-4xl font-bold text-fg" style={tabularNums}>
                {fmtBRL(totalBalance)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {wallets.length >= 2 && (
              <Pressable
                testID="transfer-btn"
                onPress={() => transferRef.current?.present()}
                className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
              >
                <ArrowLeftRight size={16} color={colors.fg} />
              </Pressable>
            )}
            <Pressable
              onPress={openNew}
              className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
            >
              <Plus size={20} color={colors.fg} />
            </Pressable>
          </View>
        </View>

        {/* Lista */}
        {cold ? (
          <View className="gap-3">
            <View className="h-[72px] rounded-2xl bg-card" />
            <View className="h-[72px] rounded-2xl bg-card" />
          </View>
        ) : wallets.length === 0 ? (
          <EmptyState onAdd={openNew} />
        ) : (
          <View className="gap-3">
            {wallets.map((w) => (
              <Pressable key={w.id} onPress={() => openEdit(w)} className="active:opacity-80">
                <WalletCard wallet={w} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <WalletSheet ref={walletRef} wallet={editing} onClose={() => setEditing(undefined)} />
      <TransferSheet ref={transferRef} wallets={wallets} />
    </>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center gap-4 rounded-2xl border border-border bg-card py-12">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-bg">
        <WalletIcon size={24} color={colors.muted} strokeWidth={1.5} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-sm font-medium text-fg">Nenhuma carteira ainda</Text>
        <Text className="text-xs text-muted">Crie uma para começar a registrar transações</Text>
      </View>
      <Pressable onPress={onAdd} className="rounded-full bg-accent px-5 py-2 active:opacity-80">
        <Text className="text-sm font-medium text-white">Criar carteira</Text>
      </Pressable>
    </View>
  )
}
