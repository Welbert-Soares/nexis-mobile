import { forwardRef, useEffect, useRef, useState } from 'react'
import { Animated, type TextInputProps } from 'react-native'
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

const ICON_COLS = 6
const ICON_CELL_W = `${100 / ICON_COLS}%` as const

type Props = { wallet?: Wallet; onClose?: () => void }

function IconCell({
  name,
  selected,
  tint,
  onPress,
}: {
  name: string
  selected: boolean
  tint: string
  onPress: () => void
}) {
  const Icon = CATEGORY_ICONS[name]
  if (!Icon) return null
  return (
    <View style={{ width: ICON_CELL_W, padding: 4 }}>
      <Pressable
        onPress={onPress}
        className="w-full items-center justify-center rounded-xl"
        style={{
          height: 40,
          backgroundColor: selected ? `${tint}26` : colors.border,
          borderWidth: 2,
          borderColor: selected ? tint : 'transparent',
        }}
      >
        <Icon size={18} color={selected ? tint : colors.muted} strokeWidth={1.75} />
      </Pressable>
    </View>
  )
}

const inputStyle = {
  borderRadius: 12,
  backgroundColor: colors.border,
  color: colors.fg,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 14,
  // borda sempre presente (transparente) pra o foco não empurrar o layout
  borderWidth: 1,
  borderColor: 'transparent',
} as const

/**
 * TextInput do sheet com indicador de foco (o RN não tem `:focus` de CSS).
 * Borda neutra ao focar, como o `focus:ring` do PWA.
 */
function SheetField({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <BottomSheetTextInput
      {...props}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      style={[inputStyle, focused && { borderColor: colors.muted }, style]}
    />
  )
}

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

  // Um único driver (0 = recolhido, 1 = expandido): anima a altura das linhas
  // extras de ícone e faz o gradiente de fade sumir. O primeiro run apenas
  // assenta o valor (sem timer) pra não animar na montagem.
  const reveal = useRef(new Animated.Value(0)).current
  const revealFirstRun = useRef(true)
  useEffect(() => {
    if (revealFirstRun.current) {
      revealFirstRun.current = false
      reveal.setValue(iconsExpanded ? 1 : 0)
      return
    }
    const anim = Animated.timing(reveal, {
      toValue: iconsExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    })
    anim.start()
    return () => anim.stop()
  }, [iconsExpanded, reveal])
  const extraRowsHeight = reveal.interpolate({ inputRange: [0, 1], outputRange: [0, 240] })
  const fadeHintOpacity = reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })

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

  // Em edição, só habilita "Salvar" se algo mudou (espelha o isDirty do PWA).
  const isDirty =
    !isEdit ||
    name !== (wallet?.name ?? '') ||
    type !== ((wallet?.type as WalletType) ?? 'CHECKING') ||
    color !== (wallet?.color ?? WALLET_COLORS[0]) ||
    icon !== (wallet?.icon ?? null) ||
    (type === 'CREDIT' &&
      (limitCents !== Math.round((wallet?.creditLimit ?? 0) * 100) ||
        closingDay !== (wallet?.closingDay?.toString() ?? '') ||
        dueDay !== (wallet?.dueDay?.toString() ?? '')))

  const saveDisabled = busy || !name.trim() || !isDirty

  return (
    <Sheet
      ref={ref}
      // Reinicia o form ao fechar (evita flash de estado antigo na reabertura)
      // e ao abrir (repopula em edição, já que a ref de `wallet` pode não mudar).
      onDismiss={() => {
        reset()
        onClose?.()
      }}
      onChange={(index) => {
        if (index >= 0) reset(wallet)
      }}
    >
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
            <SheetField
              placeholder="Nome da carteira"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
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
                      style={{ backgroundColor: on ? colors.fg : colors.border }}
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
                    <SheetField
                      placeholder="ex: 5"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      value={closingDay}
                      onChangeText={setClosingDay}
                    />
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="text-xs text-muted">Vencimento (dia)</Text>
                    <SheetField
                      placeholder="ex: 15"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      value={dueDay}
                      onChangeText={setDueDay}
                    />
                  </View>
                </View>
              </View>
            )}

            <View className="gap-2">
              <Text className="text-xs text-muted">Ícone</Text>
              <View className="relative">
                {/* Grid base (12) — tocar em qualquer lugar expande */}
                <Pressable disabled={iconsExpanded} onPress={() => setIconsExpanded(true)}>
                  <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                    {ICON_OPTIONS.slice(0, 12).map((n) => (
                      <IconCell
                        key={n}
                        name={n}
                        selected={icon === n}
                        tint={color}
                        onPress={() => {
                          if (!iconsExpanded) {
                            setIconsExpanded(true)
                            return
                          }
                          setIcon(icon === n ? null : n)
                          setIconsExpanded(false)
                        }}
                      />
                    ))}
                  </View>
                </Pressable>

                {ICON_OPTIONS.length > 12 && (
                  <>
                    {/* Linhas extras — revelam com altura + fade */}
                    <Animated.View
                      style={{ maxHeight: extraRowsHeight, opacity: reveal, overflow: 'hidden' }}
                    >
                      <View
                        className="flex-row flex-wrap"
                        style={{ marginHorizontal: -4, paddingTop: 8 }}
                      >
                        {ICON_OPTIONS.slice(12).map((n) => (
                          <IconCell
                            key={n}
                            name={n}
                            selected={icon === n}
                            tint={color}
                            onPress={() => {
                              setIcon(icon === n ? null : n)
                              setIconsExpanded(false)
                            }}
                          />
                        ))}
                      </View>
                    </Animated.View>

                    {/* Gradiente na base enquanto recolhido — dica de "tem mais" */}
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 60,
                        opacity: fadeHintOpacity,
                      }}
                    >
                      {[0, 0.04, 0.1, 0.18, 0.28, 0.4, 0.54, 0.7, 0.85, 1].map((o, i) => (
                        <View key={i} style={{ flex: 1, backgroundColor: colors.card, opacity: o }} />
                      ))}
                    </Animated.View>
                  </>
                )}
              </View>
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
              disabled={saveDisabled}
              className="rounded-xl py-4"
              style={{ backgroundColor: colors.accent, opacity: saveDisabled ? 0.5 : 1 }}
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
