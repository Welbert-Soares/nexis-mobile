import type { ComponentType } from 'react'

import { View, Text, TextInput } from '#/tw'
import { colors } from '#/theme/colors'

const MAX_CENTS = 99_999_999

export function formatCents(cents: number): string {
  // Formato pt-BR decimal (1.234,50) — sem prefixo, sem espaços.
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

type Props = {
  cents: number
  onChange: (cents: number) => void
  autoFocus?: boolean
  error?: boolean
  /**
   * Componente de input. Default = TextInput de #/tw. Dentro de um
   * @gorhom/bottom-sheet, passar BottomSheetTextInput (senão o teclado empurra
   * errado). Estilo é aplicado via `style` inline pra funcionar com qualquer um.
   */
  InputComponent?: ComponentType<any>
}

export function CurrencyInput({
  cents,
  onChange,
  autoFocus,
  error,
  InputComponent = TextInput,
}: Props) {
  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '')
    onChange(digits ? Math.min(parseInt(digits, 10), MAX_CENTS) : 0)
  }

  return (
    <View className="relative">
      <Text
        className="absolute left-4 z-10 text-2xl font-light"
        style={{ top: 14, color: error ? colors.negative : colors.muted }}
      >
        R$
      </Text>
      <InputComponent
        value={formatCents(cents)}
        onChangeText={handleChange}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        selectionColor={colors.accent}
        style={{
          width: '100%',
          borderRadius: 12,
          paddingVertical: 16,
          paddingLeft: 56,
          paddingRight: 16,
          fontSize: 24,
          fontWeight: '600',
          backgroundColor: error ? 'rgba(248,113,113,0.12)' : colors.bg,
          color: error ? colors.negative : colors.fg,
        }}
      />
    </View>
  )
}
