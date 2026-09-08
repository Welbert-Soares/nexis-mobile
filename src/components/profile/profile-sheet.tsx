import { forwardRef, useEffect, useRef, useState } from 'react'
import { Animated, type LayoutChangeEvent } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut, Plus, Tag } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { Image } from '#/tw/image'
import { Sheet, SheetRef, BottomSheetScrollView } from '#/components/ui/sheet'
import { CategorySheet, type EditableCategory } from '#/components/profile/category-sheet'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { colors } from '#/theme/colors'
import { useAuthSession } from '#/auth/session'
import { signOut } from '#/auth/client'
import { categoriesManagementQuery, removeCategory } from '#/api/categories'
import type { CategoryManagement } from '#/schemas/category'

type Props = { onClose?: () => void }

export const ProfileSheet = forwardRef<SheetRef, Props>(function ProfileSheet({ onClose }, ref) {
  const { session } = useAuthSession()
  const qc = useQueryClient()
  const user = session?.user

  const [catOpen, setCatOpen] = useState(false)
  const [catType, setCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<CategoryManagement | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const { data: cats = [] } = useQuery(categoriesManagementQuery)

  const categorySheetRef = useRef<SheetRef>(null)
  const [editingCategory, setEditingCategory] = useState<EditableCategory | undefined>()

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressed = useRef(false)

  // Acordeão com altura "auto": mede o conteúdo (onLayout) e anima até essa
  // altura, em vez de um valor fixo que corta/sobra dependendo do nº de chips.
  const [contentH, setContentH] = useState(0)
  const reveal = useRef(new Animated.Value(0)).current
  const firstRun = useRef(true)
  useEffect(() => {
    const to = catOpen ? 1 : 0
    if (firstRun.current) {
      firstRun.current = false
      reveal.setValue(to)
      return
    }
    Animated.timing(reveal, { toValue: to, duration: 220, useNativeDriver: false }).start()
  }, [catOpen, contentH, reveal])

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height)
    if (h && h !== contentH) setContentH(h)
  }

  const remove = useMutation({
    mutationFn: (id: string) => removeCategory(id),
    onSuccess: () => {
      setConfirmingDelete(null)
      qc.invalidateQueries({ queryKey: ['categories-management'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' })
    },
  })

  function openEditCategory(c: CategoryManagement) {
    setExpandedId(null)
    setEditingCategory({ id: c.id, name: c.name, color: c.color, icon: c.icon, type: c.type, userId: c.userId })
    categorySheetRef.current?.present()
  }

  function startLongPress(c: CategoryManagement) {
    longPressed.current = false
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true
      setExpandedId(null)
      if (c.userId) setConfirmingDelete(c)
    }, 500)
  }
  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  function onChipPress(c: CategoryManagement) {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    if (expandedId !== c.id) {
      setExpandedId(c.id)
    } else if (c.userId) {
      openEditCategory(c)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
    } catch {
      /* ignora — o guard redireciona na próxima navegação */
    }
    onClose?.()
    ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
  }

  const filtered = cats.filter((c) => c.type === catType)
  const height = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentH || 1],
  })
  const chevronRotate = reveal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })

  return (
    <>
      <Sheet ref={ref} onDismiss={() => onClose?.()}>
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 24 }}
        >
          {/* Identidade */}
          <View className="flex-row items-center gap-4">
            {user?.image ? (
              <Image source={user.image} className="h-14 w-14 rounded-full" />
            ) : (
              <View
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-lg font-semibold" style={{ color: '#0b1220' }}>
                  {(user?.name ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-base font-semibold text-fg">
                {user?.name ?? '—'}
              </Text>
              <Text numberOfLines={1} className="text-sm text-muted">
                {user?.email ?? ''}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Categorias — acordeão */}
          <View>
            <Pressable
              onPress={() => {
                setCatOpen((o) => !o)
                setExpandedId(null)
              }}
              className="flex-row items-center gap-2 active:opacity-70"
            >
              <Tag size={16} color={catOpen ? colors.fg : colors.muted} strokeWidth={1.5} />
              <Text
                className="flex-1 text-sm font-medium"
                style={{ color: catOpen ? colors.fg : colors.muted }}
              >
                Categorias
              </Text>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <ChevronDown size={14} color={colors.muted} />
              </Animated.View>
            </Pressable>

            <Animated.View style={{ height, overflow: 'hidden' }}>
              {/* onLayout mede o conteúdo real pra a animação ir até a altura certa */}
              <View onLayout={onContentLayout}>
                <View className="gap-3 pt-4">
                  {/* Toggle tipo — segmented igual ao da criação de transação */}
                  <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.border }}>
                    {(
                      [
                        { value: 'EXPENSE', label: 'Despesas', tone: colors.negative },
                        { value: 'INCOME', label: 'Receitas', tone: colors.positive },
                      ] as const
                    ).map((opt) => {
                      const on = catType === opt.value
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            setCatType(opt.value)
                            setExpandedId(null)
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

                  {confirmingDelete ? (
                    <View className="items-center gap-3 py-3">
                      <Text className="text-center text-sm text-fg">
                        Excluir &quot;{confirmingDelete.name}&quot;?
                      </Text>
                      {remove.isError && (
                        <Text className="text-center text-xs" style={{ color: colors.negative }}>
                          {remove.error instanceof Error ? remove.error.message : 'Não foi possível excluir'}
                        </Text>
                      )}
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => setConfirmingDelete(null)}
                          className="flex-1 rounded-xl border border-border py-2.5"
                        >
                          <Text className="text-center text-sm text-muted">Cancelar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => remove.mutate(confirmingDelete.id)}
                          disabled={remove.isPending}
                          className="flex-1 rounded-xl py-2.5"
                          style={{ backgroundColor: 'rgba(248,113,113,0.18)' }}
                        >
                          <Text
                            className="text-center text-sm font-medium"
                            style={{ color: colors.negative }}
                          >
                            {remove.isPending ? 'Excluindo…' : 'Excluir'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Pressable onPress={() => setExpandedId(null)}>
                        <View className="flex-row flex-wrap gap-2">
                          {filtered.map((c) => {
                            const Icon = c.icon ? CATEGORY_ICONS[c.icon] : null
                            const tint = c.color ?? colors.muted
                            const on = expandedId === c.id
                            return (
                              <Pressable
                                key={c.id}
                                onPress={() => onChipPress(c)}
                                onPressIn={() => startLongPress(c)}
                                onPressOut={cancelLongPress}
                                className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5"
                                style={{ backgroundColor: colors.border }}
                              >
                                {Icon ? (
                                  <Icon size={14} color={tint} strokeWidth={1.75} />
                                ) : (
                                  <View
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tint }}
                                  />
                                )}
                                {on && (
                                  <Text className="text-xs font-medium text-fg">{c.name}</Text>
                                )}
                              </Pressable>
                            )
                          })}
                          {filtered.length === 0 && (
                            <Text className="py-1 text-xs text-muted">Nenhuma categoria</Text>
                          )}
                        </View>
                      </Pressable>

                      <Text className="text-center text-[11px] text-muted">
                        toque para ver · toque expandido para editar · segure para excluir
                      </Text>

                      <Pressable
                        onPress={() => {
                          setEditingCategory(undefined)
                          categorySheetRef.current?.present()
                        }}
                        className="flex-row items-center justify-center gap-2 rounded-xl py-2.5"
                        style={{ borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}
                      >
                        <Plus size={14} color={colors.muted} />
                        <Text className="text-xs text-muted">Nova categoria</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            className="flex-row items-center gap-3 px-1 py-2 active:opacity-70"
            style={{ opacity: loggingOut ? 0.5 : 1 }}
          >
            <LogOut size={20} color={colors.negative} strokeWidth={1.5} />
            <Text className="text-sm font-medium" style={{ color: colors.negative }}>
              {loggingOut ? 'Saindo…' : 'Sair da conta'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </Sheet>

      <CategorySheet
        ref={categorySheetRef}
        category={editingCategory}
        defaultType={catType}
        onClose={() => {
          setEditingCategory(undefined)
          qc.invalidateQueries({ queryKey: ['categories-management'] })
        }}
      />
    </>
  )
})
