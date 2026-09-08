import { forwardRef, useEffect, useState } from 'react'
import { Modal, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Calendar, Check, Trash2 } from 'lucide-react-native'

import { View, Text, Pressable, ScrollView } from '#/tw'
import { Sheet, SheetRef, BottomSheetScrollView, BottomSheetTextInput } from '#/components/ui/sheet'
import { SheetField, inputStyle } from '#/components/ui/sheet-field'
import { CurrencyInput } from '#/components/ui/currency-input'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { fmtDate, toYMD } from '#/lib/format'
import { colors } from '#/theme/colors'
import { walletsQuery } from '#/api/wallets'
import { categoriesQuery } from '#/api/categories'
import { createTransaction, editTransaction, deleteTransaction } from '#/api/transactions'
import type { Transaction, TransactionType } from '#/schemas/transaction'
import type { Category } from '#/schemas/category'

type TxType = TransactionType

type Props = { tx?: Transaction; onClose?: () => void }

export const TransactionSheet = forwardRef<SheetRef, Props>(function TransactionSheet(
  { tx, onClose },
  ref,
) {
  const isEdit = !!tx
  const qc = useQueryClient()

  const [type, setType] = useState<TxType>('EXPENSE')
  const [cents, setCents] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date())
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const { data: wallets = [] } = useQuery(walletsQuery)
  const { data: categories = [] } = useQuery(categoriesQuery(type))

  function reset(t?: Transaction) {
    setType((t?.type as TxType) ?? 'EXPENSE')
    setCents(Math.round((t?.amount ?? 0) * 100))
    setWalletId(t?.walletId ?? wallets[0]?.id ?? '')
    setCategoryId(t?.categoryId ?? null)
    setDescription(t?.description ?? '')
    setDate(t?.date ? new Date(t.date) : new Date())
    setSaved(false)
    setConfirmDelete(false)
    setShowDatePicker(false)
  }

  useEffect(() => {
    reset(tx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx])

  // As carteiras podem chegar depois do primeiro render — fixa o default.
  useEffect(() => {
    if (!walletId && wallets.length > 0) setWalletId(tx?.walletId ?? wallets[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets])

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['wallets'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const save = useMutation({
    mutationFn: () => {
      const amount = cents / 100
      const dateStr = toYMD(date)
      return isEdit
        ? editTransaction(tx!.id, {
            amount,
            type,
            walletId,
            categoryId: categoryId ?? null,
            description: description.trim() || null,
            date: dateStr,
          })
        : createTransaction({
            amount,
            type,
            walletId,
            categoryId: categoryId ?? undefined,
            description: description.trim() || undefined,
            date: dateStr,
          })
    },
    onSuccess: () => {
      invalidate()
      setSaved(true)
      setTimeout(() => (ref as React.RefObject<SheetRef>)?.current?.dismiss(), 900)
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteTransaction(tx!.id),
    onSuccess: () => {
      invalidate()
      ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
    },
  })

  const busy = save.isPending || remove.isPending || saved

  const isDirty =
    !isEdit ||
    type !== (tx?.type as TxType) ||
    cents !== Math.round((tx?.amount ?? 0) * 100) ||
    walletId !== tx?.walletId ||
    categoryId !== (tx?.categoryId ?? null) ||
    description.trim() !== (tx?.description ?? '') ||
    toYMD(date) !== toYMD(new Date(tx!.date))

  const saveDisabled = busy || cents <= 0 || !walletId || !isDirty

  return (
    <Sheet
      ref={ref}
      onDismiss={() => {
        reset()
        onClose?.()
      }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-fg">
            {isEdit ? 'Editar transação' : 'Nova transação'}
          </Text>
          {isEdit && !saved && (
            <Pressable
              testID="transaction-delete"
              onPress={() => setConfirmDelete(true)}
              className="p-1 active:opacity-60"
            >
              <Trash2 size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {wallets.length === 0 ? (
          <View className="items-center gap-4 py-6">
            <Text className="text-sm text-fg">Você ainda não tem carteiras</Text>
            <Text className="text-center text-xs text-muted">
              Crie uma carteira para registrar transações.
            </Text>
            <Pressable
              onPress={() => {
                ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
                router.navigate('/wallets')
              }}
              className="rounded-xl px-5 py-3"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-center text-sm font-semibold text-white">Criar carteira</Text>
            </Pressable>
          </View>
        ) : confirmDelete ? (
          <View className="items-center gap-4 py-6">
            <Text className="text-sm text-fg">Excluir esta transação?</Text>
            <Text className="text-center text-xs text-muted">
              O saldo da carteira será revertido.
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
              {isEdit ? 'Transação atualizada' : 'Transação salva'}
            </Text>
          </View>
        ) : (
          <>
            {/* Tipo */}
            <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.border }}>
              {(
                [
                  { value: 'EXPENSE', label: 'Despesa', tone: colors.negative },
                  { value: 'INCOME', label: 'Receita', tone: colors.positive },
                ] as const
              ).map((opt) => {
                const on = type === opt.value
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setType(opt.value)
                      setCategoryId(null)
                    }}
                    className="flex-1 rounded-lg py-2"
                    style={{ backgroundColor: on ? `${opt.tone}26` : 'transparent' }}
                  >
                    <Text
                      className="text-center text-sm font-medium"
                      style={{ color: on ? opt.tone : colors.muted }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {/* Valor */}
            <View className="gap-2">
              <Text className="text-xs text-muted">Valor</Text>
              <CurrencyInput
                cents={cents}
                onChange={setCents}
                autoFocus={!isEdit}
                InputComponent={BottomSheetTextInput}
              />
            </View>

            {/* Data — mesmo layout dos outros campos: label + surface full-width.
                O toque abre o calendário nativo (modal no iOS, dialog no Android). */}
            <View className="gap-2">
              <Text className="text-xs text-muted">Data</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between"
                style={inputStyle}
              >
                <Text className="text-sm capitalize text-fg">{fmtDate(date)}</Text>
                <Calendar size={16} color={colors.muted} />
              </Pressable>

              {/* Android: o picker É o próprio dialog nativo (portal), sem wrapper. */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  locale="pt-BR"
                  maximumDate={new Date()}
                  onChange={(event, selected) => {
                    setShowDatePicker(false)
                    if (event.type === 'set' && selected) setDate(selected)
                  }}
                />
              )}

              {/* iOS: calendário inline num modal centralizado — mesmo padrão do
                  picker De/Para do transfer-sheet (card colors.card, título accent). */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
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
                      onPress={() => setShowDatePicker(false)}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    <View
                      className="overflow-hidden rounded-2xl"
                      style={{ backgroundColor: colors.card, width: '100%', maxWidth: 360 }}
                    >
                      <Text
                        className="px-4 pb-2.5 pt-3 text-sm font-semibold"
                        style={{ color: colors.accent }}
                      >
                        Data da transação
                      </Text>
                      <View style={{ height: 1, backgroundColor: colors.border }} />
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="inline"
                        locale="pt-BR"
                        maximumDate={new Date()}
                        themeVariant="dark"
                        accentColor={colors.accent}
                        onChange={(event, selected) => {
                          if (event.type === 'set' && selected) setDate(selected)
                        }}
                        style={{ alignSelf: 'center' }}
                      />
                      <Pressable
                        onPress={() => setShowDatePicker(false)}
                        className="m-3 rounded-xl py-3 active:opacity-80"
                        style={{ backgroundColor: colors.accent }}
                      >
                        <Text className="text-center text-sm font-semibold text-white">Concluir</Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
              )}
            </View>

            {/* Categoria */}
            <View className="gap-2">
              <Text className="text-xs text-muted">Categoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}
              >
                {categories.map((c) => (
                  <CategoryChip
                    key={c.id}
                    category={c}
                    selected={categoryId === c.id}
                    onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Carteira */}
            {wallets.length > 1 && (
              <View className="gap-2">
                <Text className="text-xs text-muted">Carteira</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                >
                  {wallets.map((w) => {
                    const on = walletId === w.id
                    return (
                      <Pressable
                        key={w.id}
                        onPress={() => setWalletId(w.id)}
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: on ? colors.fg : colors.border }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: on ? colors.bg : colors.muted }}
                        >
                          {w.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
            )}

            {/* Descrição */}
            <SheetField
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
            />

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
                {save.isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </Sheet>
  )
})

function CategoryChip({
  category,
  selected,
  onPress,
}: {
  category: Category
  selected: boolean
  onPress: () => void
}) {
  const Icon = category.icon ? CATEGORY_ICONS[category.icon] : null
  const tint = category.color ?? colors.muted
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: selected ? colors.fg : colors.border }}
    >
      {Icon ? (
        <Icon size={13} color={selected ? colors.bg : tint} strokeWidth={1.75} />
      ) : (
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: selected ? colors.bg : tint }} />
      )}
      <Text
        className="text-xs font-medium"
        style={{ color: selected ? colors.bg : colors.muted }}
      >
        {category.name}
      </Text>
    </Pressable>
  )
}
