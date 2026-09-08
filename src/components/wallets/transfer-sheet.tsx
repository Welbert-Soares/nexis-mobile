import { forwardRef, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, ChevronDown } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetView, BottomSheetTextInput } from '#/components/ui/sheet'
import { CurrencyInput } from '#/components/ui/currency-input'
import { fmtBRL } from '#/lib/format'
import { colors } from '#/theme/colors'
import { transferWallets } from '#/api/wallets'
import type { Wallet } from '#/schemas/wallet'

type Props = { wallets: Wallet[]; onClose?: () => void }

export const TransferSheet = forwardRef<SheetRef, Props>(function TransferSheet({ wallets, onClose }, ref) {
  const qc = useQueryClient()
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [cents, setCents] = useState(0)
  const [saved, setSaved] = useState(false)

  function reset() {
    setFromId('')
    setToId('')
    setCents(0)
    setSaved(false)
  }
  useEffect(reset, [])

  const from = wallets.find((w) => w.id === fromId)
  const amount = cents / 100
  const insufficient = !!from && amount > from.balance
  const canSubmit = !!fromId && !!toId && fromId !== toId && cents > 0 && !insufficient

  const mutation = useMutation({
    mutationFn: () => transferWallets({ fromWalletId: fromId, toWalletId: toId, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setSaved(true)
      setTimeout(() => (ref as React.RefObject<SheetRef>)?.current?.dismiss(), 900)
    },
  })

  return (
    <Sheet
      ref={ref}
      onDismiss={() => {
        reset()
        onClose?.()
      }}
    >
      <BottomSheetView style={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <Text className="text-base font-semibold text-fg">Transferir</Text>

        {saved ? (
          <View className="items-center gap-3 py-8">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(52,211,153,0.18)' }}
            >
              <Check size={28} color={colors.positive} strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-medium text-muted">Transferência realizada</Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              <WalletPicker label="De" value={fromId} onChange={setFromId} wallets={wallets} exclude={toId} />
              <ArrowRight size={16} color={colors.muted} />
              <WalletPicker label="Para" value={toId} onChange={setToId} wallets={wallets} exclude={fromId} />
            </View>

            {from && (
              <Text className="text-xs text-muted">
                Disponível: <Text className="text-fg">{fmtBRL(from.balance)}</Text>
              </Text>
            )}

            <View className="gap-2">
              <Text className="text-xs text-muted">Valor</Text>
              <CurrencyInput
                cents={cents}
                onChange={setCents}
                error={insufficient}
                InputComponent={BottomSheetTextInput}
              />
            </View>

            {mutation.isError && (
              <Text className="text-center text-xs" style={{ color: colors.negative }}>
                {mutation.error instanceof Error ? mutation.error.message : 'Erro ao transferir'}
              </Text>
            )}

            <Pressable
              onPress={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              className="rounded-xl py-4"
              style={{ backgroundColor: colors.accent, opacity: !canSubmit || mutation.isPending ? 0.4 : 1 }}
            >
              <Text className="text-center text-sm font-semibold text-white">
                {mutation.isPending ? 'Transferindo…' : 'Transferir'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </Sheet>
  )
})

function WalletPicker({
  label,
  value,
  onChange,
  wallets,
  exclude,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  wallets: Wallet[]
  exclude: string
}) {
  const [open, setOpen] = useState(false)
  const selected = wallets.find((w) => w.id === value)
  const options = wallets.filter((w) => w.id !== exclude)

  return (
    <View className="flex-1">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between rounded-xl px-3 py-3"
        style={{ backgroundColor: colors.bg }}
      >
        <Text numberOfLines={1} className="text-xs" style={{ color: selected ? colors.fg : colors.muted }}>
          {selected?.name ?? label}
        </Text>
        <ChevronDown size={14} color={colors.muted} />
      </Pressable>
      {open && (
        <View className="mt-1 gap-1 rounded-xl p-1" style={{ backgroundColor: colors.bg }}>
          {options.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => {
                onChange(w.id)
                setOpen(false)
              }}
              className="rounded-lg px-3 py-2 active:opacity-70"
            >
              <Text className="text-xs text-fg">{w.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}
