import { useState } from 'react'
import type { TextInputProps } from 'react-native'

import { BottomSheetTextInput } from '#/components/ui/sheet'
import { colors } from '#/theme/colors'

// Fundo e borda dos inputs dentro de um sheet. `colors.border` fica mais claro
// que o fundo da página (`colors.bg`) — a hierarquia do projeto. A borda está
// sempre presente (transparente) pra o foco não empurrar o layout.
export const inputStyle = {
  borderRadius: 12,
  backgroundColor: colors.border,
  color: colors.fg,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 14,
  borderWidth: 1,
  borderColor: 'transparent',
} as const

/**
 * TextInput de sheet com indicador de foco (o RN não tem `:focus` de CSS).
 * Borda neutra ao focar, como o `focus:ring` do PWA. Usa BottomSheetTextInput
 * por baixo (senão o teclado empurra errado dentro do @gorhom/bottom-sheet).
 */
export function SheetField({ style, onFocus, onBlur, ...props }: TextInputProps) {
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
