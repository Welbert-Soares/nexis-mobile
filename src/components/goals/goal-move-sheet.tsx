import { forwardRef, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, Check, PiggyBank } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetScrollView, BottomSheetTextInput } from '#/components/ui/sheet'
import { CurrencyInput } from '#/components/ui/currency-input'
import { fmtBRL } from '#/lib/format'
import { colors } from '#/theme/colors'
import { depositGoal, withdrawGoal } from '#/api/goals'
import type { Goal } from '#/schemas/goal'
import type { Wallet } from '#/schemas/wallet'

type Mode = 'deposit' | 'withdraw'
type Props = { mode: Mode; goal?: Goal; wallets: Wallet[]; onClose?: () => void }

export const GoalMoveSheet = forwardRef<SheetRef, Props>(function GoalMoveSheet(
  { mode, goal, wallets, onClose },
  ref,
) {
  const qc = useQueryClient()
  const [cents, setCents] = useState(0)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function reset() {
    setCents(0)
    setWalletId(wallets.length === 1 ? wallets[0].id : null)
    setSaved(false)
  }

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.id, mode, wallets.length])

  function dismiss() {
    ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
  }

  const amount = cents / 100
  const wallet = wallets.find((w) => w.id === walletId)
  const overBalance = mode === 'deposit' && !!wallet && amount > wallet.balance
  const overSaved = mode === 'withdraw' && !!goal && amount > goal.currentAmount
  const invalid = overBalance || overSaved

  const move = useMutation({
    mutationFn: () =>
      mode === 'deposit'
        ? depositGoal(goal!.id, { walletId: walletId!, amount })
        : withdrawGoal(goal!.id, { walletId: walletId!, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['wallets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      setSaved(true)
      setTimeout(dismiss, 900)
    },
  })

  const busy = move.isPending || saved
  const canConfirm = cents > 0 && !!walletId && !invalid && !busy

  const isDeposit = mode === 'deposit'
  const Icon = isDeposit ? PiggyBank : ArrowDownLeft

  return (
    <Sheet
      ref={ref}
      onDismiss={() => {
        reset()
        onClose?.()
      }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <View className="flex-row items-center gap-3">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: isDeposit ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)' }}
          >
            <Icon size={16} color={isDeposit ? colors.positive : colors.accent} strokeWidth={1.75} />
          </View>
          <View className="min-w-0">
            <Text className="text-sm font-semibold text-fg">
              {isDeposit ? 'Aportar na meta' : 'Resgatar da meta'}
            </Text>
            {goal && (
              <Text numberOfLines={1} className="text-xs text-muted">
                {goal.name}
              </Text>
            )}
          </View>
        </View>

        {saved ? (
          <View className="items-center gap-3 py-6">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(52,211,153,0.18)' }}
            >
              <Check size={28} color={colors.positive} strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-medium text-muted">
              {isDeposit ? 'Aporte feito' : 'Resgate feito'}
            </Text>
          </View>
        ) : (
          <>
            <View className="gap-2">
              <Text className="text-xs text-muted">{isDeposit ? 'Debitar de' : 'Creditar em'}</Text>
              <View className="flex-row flex-wrap gap-2">
                {wallets.map((w) => {
                  const on = walletId === w.id
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => setWalletId(w.id)}
                      className="gap-1 rounded-xl px-3 py-2"
                      style={{
                        backgroundColor: colors.border,
                        borderWidth: 2,
                        borderColor: on ? colors.accent : 'transparent',
                      }}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <View
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: w.color ?? colors.muted }}
                        />
                        <Text className="text-xs font-medium text-fg">{w.name}</Text>
                      </View>
                      <Text className="text-[11px] text-muted">{fmtBRL(w.balance)}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs text-muted">Valor</Text>
              <CurrencyInput
                cents={cents}
                onChange={setCents}
                autoFocus
                InputComponent={BottomSheetTextInput}
              />
            </View>

            {overBalance && (
              <Text className="text-xs" style={{ color: colors.negative }}>
                Saldo insuficiente na carteira selecionada
              </Text>
            )}
            {overSaved && (
              <Text className="text-xs" style={{ color: colors.negative }}>
                Valor acima do guardado na meta
              </Text>
            )}
            {move.isError && (
              <Text className="text-xs" style={{ color: colors.negative }}>
                Não foi possível concluir. Tente de novo.
              </Text>
            )}

            <Pressable
              onPress={() => move.mutate()}
              disabled={!canConfirm}
              className="rounded-2xl py-3.5"
              style={{ backgroundColor: colors.fg, opacity: canConfirm ? 1 : 0.4 }}
            >
              <Text className="text-center text-sm font-semibold" style={{ color: colors.bg }}>
                {move.isPending ? 'Confirmando…' : 'Confirmar'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </Sheet>
  )
})
