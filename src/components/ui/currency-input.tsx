import { useState, type ComponentType } from 'react'

import { View, Text, TextInput } from '#/tw'
import { colors } from '#/theme/colors'

const MAX_CENTS = 99_999_999

// `Intl.NumberFormat` (mesmo caminho do `fmtBRL`) em vez de
// `Number.prototype.toLocaleString(locale, opts)` — o segundo agrupa milhar de
// forma inconsistente no Hermes. Sem símbolo: o "R$" é renderizado à parte.
const decimalFmt = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCents(cents: number): string {
  // Normaliza o espaço ICU (U+00A0 / U+202F) pra saída idêntica em Node (jest)
  // e Hermes (device) — igual ao `fmtBRL`.
  return decimalFmt.format(cents / 100).replace(/[  ]/g, ' ')
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

/**
 * Campo de moeda com preenchimento da direita pra esquerda (centavos primeiro).
 *
 * A camada visível é um `<Text>` puro em React; o `TextInput` real fica por
 * cima com texto transparente e sem cursor. Assim o round-trip nativo do RN
 * (que no controlled input faz o texto "piscar"/voltar a cada tecla e o cursor
 * saltar pro início) nunca aparece — o número visível vem só do estado React,
 * como no PWA.
 */
export function CurrencyInput({
  cents,
  onChange,
  autoFocus,
  error,
  InputComponent = TextInput,
}: Props) {
  const [focused, setFocused] = useState(false)
  const display = formatCents(cents)

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '')
    onChange(digits ? Math.min(parseInt(digits, 10), MAX_CENTS) : 0)
  }

  const borderColor = error
    ? 'rgba(248,113,113,0.5)'
    : focused
      ? colors.muted
      : 'transparent'

  return (
    <View className="relative">
      {/* Camada de digitação — fica embaixo; texto transparente, sem cursor */}
      <InputComponent
        value={display}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        caretHidden
        style={{
          width: '100%',
          borderRadius: 12,
          borderWidth: 1,
          borderColor,
          paddingVertical: 12,
          paddingLeft: 40,
          paddingRight: 16,
          fontSize: 14,
          fontWeight: '600',
          color: 'transparent',
          backgroundColor: error ? 'rgba(248,113,113,0.12)' : colors.border,
        }}
      />

      {/* Camada visível — por cima, sem interceptar toque (passa pro input) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          pointerEvents: 'none',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '300',
            marginRight: 6,
            color: error ? colors.negative : colors.muted,
          }}
        >
          R$
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: '600',
            fontVariant: ['tabular-nums'],
            color: error ? colors.negative : colors.fg,
          }}
        >
          {display}
        </Text>
      </View>
    </View>
  )
}
