import type { ComponentType } from 'react'

import { View, Text, Pressable } from '#/tw'
import { colors } from '#/theme/colors'
import { useHaptic } from '#/lib/haptics'

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

// Estado vazio padrão. `card` (default) tem moldura; `bare` é só o conteúdo.
// A ação é um convite — texto no imperativo, sem "→".
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'card',
}: {
  icon?: IconType
  title: string
  description?: string
  action?: { label: string; onPress: () => void }
  variant?: 'card' | 'bare'
}) {
  const haptic = useHaptic()
  const shell =
    variant === 'card'
      ? 'items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12'
      : 'items-center gap-3 py-12'

  return (
    <View testID="empty-state" className={shell}>
      {Icon ? <Icon size={28} color={colors.muted} strokeWidth={1.5} /> : null}
      <Text className="text-center text-sm text-muted">{title}</Text>
      {description ? (
        <Text className="text-center text-xs text-muted">{description}</Text>
      ) : null}
      {action ? (
        <Pressable
          onPress={() => {
            haptic.tap()
            action.onPress()
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          className="rounded-xl bg-border px-4 py-2.5 active:opacity-70"
        >
          <Text className="text-sm font-medium text-fg">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
