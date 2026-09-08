import { forwardRef, useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
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
  const [iconsExpanded, setIconsExpanded] = useState(false)
  const [saved, setSaved] = useState(false)

  // Grid de ícones: 12 visíveis + fade; toca e revela o resto (padrão wallet-sheet).
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
  const extraRowsHeight = reveal.interpolate({ inputRange: [0, 1], outputRange: [0, 200] })
  const fadeHintOpacity = reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })

  function reset(c?: EditableCategory) {
    setName(c?.name ?? '')
    setIcon(c?.icon ?? null)
    setColor(c?.color ?? WALLET_COLORS[0])
    setType(c?.type ?? defaultType)
    setIconsExpanded(false)
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
                        onPress={() => setType(opt.value)}
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
              </View>
            )}

            <View className="gap-2">
              <Text className="text-xs text-muted">Ícone</Text>
              <View className="relative">
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
