import { forwardRef, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Trash2 } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetScrollView, BottomSheetTextInput } from '#/components/ui/sheet'
import { CurrencyInput } from '#/components/ui/currency-input'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { WALLET_TYPES, WALLET_COLORS, type WalletType } from '#/lib/wallet-meta'
import { colors } from '#/theme/colors'
import { createWallet, editWallet, deleteWallet } from '#/api/wallets'
import type { Wallet } from '#/schemas/wallet'

const ICON_OPTIONS = [
  'Wallet', 'CreditCard', 'Banknote', 'PiggyBank', 'TrendingUp', 'Briefcase',
  'Home', 'ShoppingCart', 'Coffee', 'Car', 'Plane', 'Gift',
  'Smartphone', 'Laptop', 'Zap', 'Heart', 'Star', 'MoreHorizontal',
].filter((n) => CATEGORY_ICONS[n])

type Props = { wallet?: Wallet; onClose?: () => void }

const inputStyle = {
  borderRadius: 12,
  backgroundColor: colors.bg,
  color: colors.fg,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 14,
} as const

export const WalletSheet = forwardRef<SheetRef, Props>(function WalletSheet({ wallet, onClose }, ref) {
  const isEdit = !!wallet
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('CHECKING')
  const [color, setColor] = useState(WALLET_COLORS[0])
  const [icon, setIcon] = useState<string | null>(null)
  const [iconsExpanded, setIconsExpanded] = useState(false)
  const [cents, setCents] = useState(0)
  const [limitCents, setLimitCents] = useState(0)
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function reset(w?: Wallet) {
    setName(w?.name ?? '')
    setType((w?.type as WalletType) ?? 'CHECKING')
    setColor(w?.color ?? WALLET_COLORS[0])
    setIcon(w?.icon ?? null)
    setIconsExpanded(false)
    setCents(0)
    setLimitCents(Math.round((w?.creditLimit ?? 0) * 100))
    setClosingDay(w?.closingDay?.toString() ?? '')
    setDueDay(w?.dueDay?.toString() ?? '')
    setSaved(false)
    setConfirmDelete(false)
  }

  useEffect(() => {
    reset(wallet)
  }, [wallet])

  function creditData() {
    return type === 'CREDIT'
      ? {
          creditLimit: limitCents > 0 ? limitCents / 100 : null,
          closingDay: closingDay ? parseInt(closingDay, 10) : null,
          dueDay: dueDay ? parseInt(dueDay, 10) : null,
        }
      : { creditLimit: null, closingDay: null, dueDay: null }
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['wallets'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? editWallet(wallet!.id, { name, type, color, icon, ...creditData() })
        : createWallet({ name, type, color, icon: icon ?? undefined, balance: cents / 100, ...creditData() }),
    onSuccess: () => {
      invalidate()
      setSaved(true)
      setTimeout(() => (ref as React.RefObject<SheetRef>)?.current?.dismiss(), 900)
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteWallet(wallet!.id),
    onSuccess: () => {
      invalidate()
      ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
    },
  })

  const busy = save.isPending || remove.isPending || saved

  return (
    <Sheet ref={ref} onDismiss={onClose}>
      <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-fg">
            {isEdit ? 'Editar carteira' : 'Nova carteira'}
          </Text>
          {isEdit && !saved && (
            <Pressable
              testID="wallet-delete"
              onPress={() => setConfirmDelete(true)}
              className="p-1 active:opacity-60"
            >
              <Trash2 size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {confirmDelete ? (
          <View className="items-center gap-4 py-6">
            <Text className="text-sm text-fg">Excluir esta carteira?</Text>
            <Text className="text-center text-xs text-muted">
              Todas as transações vinculadas serão removidas permanentemente.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-border py-3"
              >
                <Text className="text-center text-sm text-muted">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => remove.mutate()}
                disabled={remove.isPending}
                className="flex-1 rounded-xl py-3"
                style={{ backgroundColor: 'rgba(248,113,113,0.18)' }}
              >
                <Text className="text-center text-sm font-medium" style={{ color: colors.negative }}>
                  {remove.isPending ? 'Excluindo…' : 'Excluir'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : saved ? (
          <View className="items-center gap-3 py-8">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(52,211,153,0.18)' }}
            >
              <Check size={28} color={colors.positive} strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-medium text-muted">
              {isEdit ? 'Carteira atualizada' : 'Carteira criada'}
            </Text>
          </View>
        ) : (
          <>
            <BottomSheetTextInput
              placeholder="Nome da carteira"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={inputStyle}
            />

            {!isEdit && (
              <View className="gap-2">
                <Text className="text-xs text-muted">Saldo inicial</Text>
                <CurrencyInput cents={cents} onChange={setCents} InputComponent={BottomSheetTextInput} />
              </View>
            )}

            <View className="gap-2">
              <Text className="text-xs text-muted">Tipo</Text>
              <View className="flex-row flex-wrap gap-2">
                {WALLET_TYPES.map((t) => {
                  const on = type === t.value
                  return (
                    <Pressable
                      key={t.value}
                      onPress={() => setType(t.value)}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: on ? colors.fg : colors.bg }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: on ? colors.bg : colors.muted }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {type === 'CREDIT' && (
              <View className="gap-3 rounded-xl p-4" style={{ backgroundColor: colors.bg }}>
                <Text className="text-xs font-medium text-muted">Configurações do cartão</Text>
                <View className="gap-1.5">
                  <Text className="text-xs text-muted">Limite</Text>
                  <CurrencyInput
                    cents={limitCents}
                    onChange={setLimitCents}
                    InputComponent={BottomSheetTextInput}
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1.5">
                    <Text className="text-xs text-muted">Fechamento (dia)</Text>
                    <BottomSheetTextInput
                      placeholder="ex: 5"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      value={closingDay}
                      onChangeText={setClosingDay}
                      style={inputStyle}
                    />
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="text-xs text-muted">Vencimento (dia)</Text>
                    <BottomSheetTextInput
                      placeholder="ex: 15"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      value={dueDay}
                      onChangeText={setDueDay}
                      style={inputStyle}
                    />
                  </View>
                </View>
              </View>
            )}

            <View className="gap-2">
              <Text className="text-xs text-muted">Ícone</Text>
              <View className="flex-row flex-wrap gap-2">
                {(iconsExpanded ? ICON_OPTIONS : ICON_OPTIONS.slice(0, 12)).map((n) => {
                  const Icon = CATEGORY_ICONS[n]
                  const on = icon === n
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setIcon(on ? null : n)}
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: on ? `${color}26` : colors.bg,
                        borderWidth: 2,
                        borderColor: on ? color : 'transparent',
                      }}
                    >
                      <Icon size={16} color={on ? color : colors.muted} strokeWidth={1.75} />
                    </Pressable>
                  )
                })}
              </View>
              {ICON_OPTIONS.length > 12 && (
                <Pressable onPress={() => setIconsExpanded((v) => !v)} className="self-start">
                  <Text className="text-xs" style={{ color: colors.accent }}>
                    {iconsExpanded ? 'ver menos' : 'ver mais'}
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="gap-2">
              <Text className="text-xs text-muted">Cor</Text>
              <View className="flex-row gap-3">
                {WALLET_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    className="h-7 w-7 rounded-full"
                    style={{
                      backgroundColor: c,
                      borderWidth: color === c ? 2 : 0,
                      borderColor: colors.fg,
                    }}
                  />
                ))}
              </View>
            </View>

            {save.isError && (
              <Text className="text-center text-xs" style={{ color: colors.negative }}>
                {save.error instanceof Error ? save.error.message : 'Erro ao salvar'}
              </Text>
            )}

            <Pressable
              onPress={() => save.mutate()}
              disabled={busy || !name.trim()}
              className="rounded-xl py-4"
              style={{ backgroundColor: colors.accent, opacity: busy || !name.trim() ? 0.5 : 1 }}
            >
              <Text className="text-center text-sm font-semibold text-white">
                {save.isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar carteira'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </Sheet>
  )
})
