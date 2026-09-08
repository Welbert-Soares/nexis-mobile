import { forwardRef, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetScrollView } from '#/components/ui/sheet'
import { SheetField } from '#/components/ui/sheet-field'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { WALLET_COLORS } from '#/lib/wallet-meta'
import { colors } from '#/theme/colors'
import { createCategory, editCategory } from '#/api/categories'

const ICON_OPTIONS = Object.keys(CATEGORY_ICONS)
const ICON_COLS = 6
const ICON_CELL_W = `${100 / ICON_COLS}%` as const

export type EditableCategory = {
  id: string
  name: string
  color: string | null
  icon: string | null
  type: 'INCOME' | 'EXPENSE'
  userId: string | null
}

type Props = {
  category?: EditableCategory
  defaultType: 'INCOME' | 'EXPENSE'
  onClose?: () => void
}

export const CategorySheet = forwardRef<SheetRef, Props>(function CategorySheet(
  { category, defaultType, onClose },
  ref,
) {
  const isEdit = !!category
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
  const [color, setColor] = useState(WALLET_COLORS[0])
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(defaultType)
  const [saved, setSaved] = useState(false)

  function reset(c?: EditableCategory) {
    setName(c?.name ?? '')
    setIcon(c?.icon ?? null)
    setColor(c?.color ?? WALLET_COLORS[0])
    setType(c?.type ?? defaultType)
    setSaved(false)
  }

  useEffect(() => {
    reset(category)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, defaultType])

  function dismiss() {
    ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
  }

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? editCategory(category!.id, { name, color, icon })
        : createCategory({ name, color, icon: icon ?? undefined, type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-management'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' })
      setSaved(true)
      setTimeout(dismiss, 900)
    },
  })

  const busy = save.isPending || saved
  const isDirty =
    !isEdit ||
    name !== (category?.name ?? '') ||
    icon !== (category?.icon ?? null) ||
    color !== (category?.color ?? WALLET_COLORS[0])
  const canSave = !!name.trim() && !busy && isDirty

  return (
    <Sheet
      ref={ref}
      onDismiss={() => {
        reset()
        onClose?.()
      }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <Text className="text-base font-semibold text-fg">
          {isEdit ? 'Editar categoria' : 'Nova categoria'}
        </Text>

        {saved ? (
          <View className="items-center gap-3 py-8">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(52,211,153,0.18)' }}
            >
              <Check size={28} color={colors.positive} strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-medium text-muted">
              {isEdit ? 'Categoria atualizada' : 'Categoria criada'}
            </Text>
          </View>
        ) : (
          <>
            <SheetField
              placeholder="Nome da categoria"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoFocus={!isEdit}
            />

            {!isEdit && (
              <View className="gap-2">
                <Text className="text-xs text-muted">Tipo</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['EXPENSE', 'INCOME'] as const).map((t) => {
                    const on = type === t
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setType(t)}
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: on ? colors.fg : colors.border }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: on ? colors.bg : colors.muted }}
                        >
                          {t === 'EXPENSE' ? 'Despesa' : 'Receita'}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            <View className="gap-2">
              <Text className="text-xs text-muted">Ícone</Text>
              <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                {ICON_OPTIONS.map((n) => {
                  const Icon = CATEGORY_ICONS[n]
                  const on = icon === n
                  return (
                    <View key={n} style={{ width: ICON_CELL_W, padding: 4 }}>
                      <Pressable
                        onPress={() => setIcon(on ? null : n)}
                        className="w-full items-center justify-center rounded-xl"
                        style={{
                          height: 40,
                          backgroundColor: on ? `${color}26` : colors.border,
                          borderWidth: 2,
                          borderColor: on ? color : 'transparent',
                        }}
                      >
                        <Icon size={18} color={on ? color : colors.muted} strokeWidth={1.75} />
                      </Pressable>
                    </View>
                  )
                })}
              </View>
            </View>

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
                {save.isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar categoria'}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetScrollView>
    </Sheet>
  )
})
