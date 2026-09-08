import { Plus } from 'lucide-react-native'

import { View, Pressable } from '#/tw'
import { colors } from '#/theme/colors'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'

/**
 * Botão central "+" da tab bar (via `tabBarButton` da rota fantasma `new`).
 * Não navega — abre o sheet de nova transação pelo TransactionSheetProvider.
 *
 * Reaproveita o `style` que o navegador passa pro slot (mesmo flex/tamanho das
 * outras abas) e só força o centro — assim o "+" fica alinhado com os outros
 * ícones e dentro da barra, sem margem negativa cruzando a linha do topo.
 */
export function FabTabButton(props: { style?: unknown }) {
  const { openNew } = useTransactionSheet()

  return (
    <Pressable
      {...props}
      onPress={openNew}
      accessibilityRole="button"
      accessibilityLabel="Nova transação"
      testID="fab-new-transaction"
      style={[props.style as never, { alignItems: 'center', justifyContent: 'center' }]}
    >
      <View
        className="items-center justify-center rounded-full active:opacity-80"
        style={{
          height: 40,
          width: 40,
          backgroundColor: colors.accent,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Plus size={22} color="#ffffff" strokeWidth={2.75} />
      </View>
    </Pressable>
  )
}
