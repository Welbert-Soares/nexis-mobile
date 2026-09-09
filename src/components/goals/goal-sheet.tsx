import { forwardRef, useEffect, useState } from 'react'
import { Modal, Platform } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Check, Trash2, X } from 'lucide-react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetScrollView, BottomSheetTextInput } from '#/components/ui/sheet'
import { SheetField, inputStyle } from '#/components/ui/sheet-field'
import { CurrencyInput } from '#/components/ui/currency-input'
import { WALLET_COLORS } from '#/lib/wallet-meta'
import { fmtDate, toYMD } from '#/lib/format'
import { colors } from '#/theme/colors'
import { useHaptic } from '#/lib/haptics'
import { createGoal, editGoal, deleteGoal } from '#/api/goals'

export type EditableGoal = {
  id: string
  name: string
  targetAmount: number
  deadline: string | null
  color: string | null
}

type Props = { goal?: EditableGoal; onClose?: () => void }

export const GoalSheet = forwardRef<SheetRef, Props>(function GoalSheet({ goal, onClose }, ref) {
  const isEdit = !!goal
  const qc = useQueryClient()
  const haptic = useHaptic()

  const [name, setName] = useState('')
  const [targetCents, setTargetCents] = useState(0)
  const [seedCents, setSeedCents] = useState(0)
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [color, setColor] = useState(WALLET_COLORS[0])
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function reset(g?: EditableGoal) {
    setName(g?.name ?? '')
    setTargetCents(Math.round((g?.targetAmount ?? 0) * 100))
    setSeedCents(0)
    setDeadline(g?.deadline ? new Date(g.deadline) : null)
    setColor(g?.color ?? WALLET_COLORS[0])
    setSaved(false)
    setConfirmDelete(false)
  }

  useEffect(() => {
    reset(goal)
  }, [goal])

  function dismiss() {
    ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
  }

  const save = useMutation({
    mutationFn: () => {
      const targetAmount = targetCents / 100
      const ymd = deadline ? toYMD(deadline) : null
      return isEdit
        ? editGoal(goal!.id, { name, targetAmount, deadline: ymd, color })
        : createGoal({
            name,
            targetAmount,
            seedAmount: seedCents > 0 ? seedCents / 100 : undefined,
            deadline: ymd,
            color,
          })
    },
    onSuccess: () => {
      haptic.success()
      qc.invalidateQueries({ queryKey: ['goals'], refetchType: 'all' })
      setSaved(true)
      setTimeout(dismiss, 900)
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteGoal(goal!.id),
    onSuccess: () => {
      haptic.error()
      qc.invalidateQueries({ queryKey: ['goals'], refetchType: 'all' })
      dismiss()
    },
  })

  const busy = save.isPending || remove.isPending || saved
  const targetAmount = targetCents / 100
  const isDirty =
    !isEdit ||
    name !== (goal?.name ?? '') ||
    targetAmount !== (goal?.targetAmount ?? 0) ||
    (deadline ? toYMD(deadline) : null) !== (goal?.deadline ? toYMD(new Date(goal.deadline)) : null) ||
    color !== (goal?.color ?? WALLET_COLORS[0])
  const canSave = !!name.trim() && targetCents > 0 && !busy && isDirty

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
            {isEdit ? 'Editar meta' : 'Nova meta'}
          </Text>
          {isEdit && !saved && (
            <Pressable
              testID="goal-delete"
              onPress={() => setConfirmDelete(true)}
              className="p-1 active:opacity-60"
            >
              <Trash2 size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {confirmDelete ? (
          <View className="items-center gap-4 py-6">
            <Text className="text-sm text-fg">Excluir esta meta?</Text>
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
              {isEdit ? 'Meta atualizada' : 'Meta criada'}
            </Text>
          </View>
        ) : (
          <>
            <SheetField
              placeholder="Nome da meta"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoFocus={!isEdit}
            />

            <View className="gap-2">
              <Text className="text-xs text-muted">Valor da meta</Text>
              <CurrencyInput
                cents={targetCents}
                onChange={setTargetCents}
                InputComponent={BottomSheetTextInput}
              />
            </View>

            {!isEdit && (
              <View className="gap-2">
                <Text className="text-xs text-muted">Já guardei (opcional)</Text>
                <CurrencyInput
                  cents={seedCents}
                  onChange={setSeedCents}
                  InputComponent={BottomSheetTextInput}
                />
              </View>
            )}

            <DeadlineField value={deadline} onChange={setDeadline} />

            <View className="gap-2">
              <Text className="text-xs text-muted">Cor</Text>
              <View className="flex-row gap-3">
                {WALLET_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      height: 28,
                      width: 28,
                      borderRadius: 9999,
                      backgroundColor: c,
                      borderWidth: 2,
                      borderColor: color === c ? colors.fg : 'transparent',
                    }}
                  />
                ))}
              </View>
            </View>

            {save.isError && (
              <Text className="text-xs" style={{ color: colors.negative }}>
                Não foi possível salvar. Tente de novo.
              </Text>
            )}

            <Pressable
              onPress={() => save.mutate()}
              disabled={!canSave}
              className="rounded-2xl py-3.5"
              style={{ backgroundColor: colors.fg, opacity: canSave ? 1 : 0.4 }}
            >
              <Text className="text-center text-sm font-semibold" style={{ color: colors.bg }}>
                {save.isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar meta'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </Sheet>
  )
})

// Prazo — mesmo padrão do campo de data do transaction-sheet (Modal no iOS,
// dialog no Android), mas `minimumDate` = hoje e com um "Limpar".
function DeadlineField({
  value,
  onChange,
}: {
  value: Date | null
  onChange: (d: Date | null) => void
}) {
  const [show, setShow] = useState(false)
  const shown = value ?? new Date()

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted">Prazo (opcional)</Text>
        {value && (
          <Pressable onPress={() => onChange(null)} className="flex-row items-center gap-1 active:opacity-60">
            <X size={12} color={colors.muted} />
            <Text className="text-xs text-muted">Limpar</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => setShow(true)}
        className="flex-row items-center justify-between"
        style={[inputStyle, show && { borderColor: colors.muted }]}
      >
        <Text className="text-sm capitalize" style={{ color: value ? colors.fg : colors.muted }}>
          {value ? fmtDate(value) : 'Sem prazo'}
        </Text>
        <Calendar size={16} color={show ? colors.fg : colors.muted} />
      </Pressable>

      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={shown}
          mode="date"
          locale="pt-BR"
          minimumDate={new Date()}
          onChange={(event, selected) => {
            setShow(false)
            if (event.type === 'set' && selected) onChange(selected)
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
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
              onPress={() => setShow(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View
              className="overflow-hidden rounded-2xl"
              style={{ backgroundColor: colors.card, width: '100%', maxWidth: 360 }}
            >
              <Text className="px-4 pb-2.5 pt-3 text-sm font-semibold" style={{ color: colors.accent }}>
                Prazo da meta
              </Text>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <DateTimePicker
                value={shown}
                mode="date"
                display="inline"
                locale="pt-BR"
                minimumDate={new Date()}
                themeVariant="dark"
                accentColor={colors.accent}
                onChange={(event, selected) => {
                  if (event.type === 'set' && selected) onChange(selected)
                }}
                style={{ alignSelf: 'center' }}
              />
              <Pressable
                onPress={() => setShow(false)}
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
  )
}
