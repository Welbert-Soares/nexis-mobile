import { forwardRef, useEffect, useState } from 'react'
import { Modal } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, ChevronDown } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetView, BottomSheetTextInput } from '#/components/ui/sheet'
import { CurrencyInput } from '#/components/ui/currency-input'
import { fmtBRL, tabularNums } from '#/lib/format'
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
        <Text className="text-lg font-semibold text-fg">Transferir</Text>

        {saved ? (
          <View className="items-center gap-3 py-8">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(52,211,153,0.18)' }}
            >
              <Check size={28} color={colors.positive} strokeWidth={2.5} />
            </View>
            <Text className="text-base font-medium text-muted">Transferência realizada</Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              <WalletPicker
                label="De"
                title="Carteira de origem"
                value={fromId}
                onChange={setFromId}
                wallets={wallets}
                exclude={toId}
              />
              <ArrowRight size={18} color={colors.muted} />
              <WalletPicker
                label="Para"
                title="Carteira de destino"
                value={toId}
                onChange={setToId}
                wallets={wallets}
                exclude={fromId}
              />
            </View>

            {from && (
              <Text className="text-sm text-muted">
                Disponível:{' '}
                <Text style={[tabularNums, { color: colors.fg }]}>{fmtBRL(from.balance)}</Text>
              </Text>
            )}

            <View className="gap-2">
              <Text className="text-sm text-muted">Valor</Text>
              <CurrencyInput
                cents={cents}
                onChange={setCents}
                error={insufficient}
                InputComponent={BottomSheetTextInput}
              />
            </View>

            {mutation.isError && (
              <Text className="text-center text-sm" style={{ color: colors.negative }}>
                {mutation.error instanceof Error ? mutation.error.message : 'Erro ao transferir'}
              </Text>
            )}

            <Pressable
              onPress={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              className="rounded-xl py-4"
              style={{ backgroundColor: colors.accent, opacity: !canSubmit || mutation.isPending ? 0.4 : 1 }}
            >
              <Text className="text-center text-base font-semibold text-white">
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
  title,
  value,
  onChange,
  wallets,
  exclude,
}: {
  label: string
  title: string
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
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl px-3 py-3"
        style={{ backgroundColor: colors.border }}
      >
        <Text
          numberOfLines={1}
          className="flex-1 text-base"
          style={{ color: selected ? colors.fg : colors.muted }}
        >
          {selected?.name ?? label}
        </Text>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: colors.card, width: '80%', maxWidth: 300 }}
          >
            {/* Título (accent) + divisor — hierarquia clara vs. a lista */}
            <Text className="px-4 pb-2.5 pt-3 text-sm font-semibold" style={{ color: colors.accent }}>
              {title}
            </Text>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View className="py-1">
              {options.map((w) => {
                const on = w.id === value
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => {
                      onChange(w.id)
                      setOpen(false)
                    }}
                    className="flex-row items-center justify-between px-4 py-3 active:opacity-50"
                  >
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-base"
                      style={{ color: on ? colors.fg : colors.muted, fontWeight: on ? '600' : '400' }}
                    >
                      {w.name}
                    </Text>
                    {on && <Check size={16} color={colors.accent} strokeWidth={2} />}
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
