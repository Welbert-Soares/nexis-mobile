import { forwardRef, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Trash2 } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetScrollView, BottomSheetTextInput } from '#/components/ui/sheet'
import { CurrencyInput } from '#/components/ui/currency-input'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { colors } from '#/theme/colors'
import { categoriesQuery } from '#/api/categories'
import { saveBudget, removeBudget } from '#/api/budgets'

export type EditableBudget = {
  id: string
  categoryId: string
  limit: number
}

type Props = {
  budget?: EditableBudget
  month: number
  year: number
  onClose?: () => void
}

export const BudgetSheet = forwardRef<SheetRef, Props>(function BudgetSheet(
  { budget, month, year, onClose },
  ref,
) {
  const isEdit = !!budget
  const qc = useQueryClient()

  const [cents, setCents] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: categories = [] } = useQuery(categoriesQuery('EXPENSE'))

  function reset(b?: EditableBudget) {
    setCents(Math.round((b?.limit ?? 0) * 100))
    setCategoryId(b?.categoryId ?? '')
    setSaved(false)
    setConfirmDelete(false)
  }

  useEffect(() => {
    reset(budget)
  }, [budget])

  function dismiss() {
    ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
  }

  const save = useMutation({
    mutationFn: () => saveBudget({ categoryId, month, year, amount: cents / 100 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'], refetchType: 'all' })
      setSaved(true)
      setTimeout(dismiss, 900)
    },
  })

  const remove = useMutation({
    mutationFn: () => removeBudget(budget!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'], refetchType: 'all' })
      dismiss()
    },
  })

  const busy = save.isPending || remove.isPending || saved
  const isDirty = !isEdit || cents / 100 !== budget!.limit
  const canSave = !!categoryId && cents > 0 && !busy && isDirty

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
            {isEdit ? 'Editar orçamento' : 'Novo orçamento'}
          </Text>
          {isEdit && !saved && (
            <Pressable
              testID="budget-delete"
              onPress={() => setConfirmDelete(true)}
              className="p-1 active:opacity-60"
            >
              <Trash2 size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {confirmDelete ? (
          <View className="items-center gap-4 py-6">
            <Text className="text-sm text-fg">Remover este orçamento?</Text>
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
                  {remove.isPending ? 'Removendo…' : 'Remover'}
                </Text>
              </Pressable>
            </View>
            {remove.isError && (
              <Text className="text-xs" style={{ color: colors.negative }}>
                Não foi possível remover. Tente de novo.
              </Text>
            )}
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
              {isEdit ? 'Orçamento atualizado' : 'Orçamento criado'}
            </Text>
          </View>
        ) : (
          <>
            <View className="gap-2">
              <Text className="text-xs text-muted">Limite mensal</Text>
              <CurrencyInput
                cents={cents}
                onChange={setCents}
                autoFocus
                InputComponent={BottomSheetTextInput}
              />
            </View>

            {!isEdit && (
              <View className="gap-2">
                <Text className="text-xs text-muted">Categoria</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((cat) => {
                    const on = categoryId === cat.id
                    const Icon = cat.icon ? CATEGORY_ICONS[cat.icon] : null
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                        style={{ backgroundColor: on ? colors.fg : colors.border }}
                      >
                        {Icon ? (
                          <Icon
                            size={12}
                            color={on ? colors.bg : (cat.color ?? colors.muted)}
                            strokeWidth={1.75}
                          />
                        ) : (
                          <View
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: on ? colors.bg : (cat.color ?? colors.muted) }}
                          />
                        )}
                        <Text
                          className="text-xs font-medium"
                          style={{ color: on ? colors.bg : colors.muted }}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

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
                {save.isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar orçamento'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </Sheet>
  )
})
