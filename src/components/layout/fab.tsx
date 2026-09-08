import { Pressable, View } from 'react-native'
import { Plus } from 'lucide-react-native'

import { colors } from '#/theme/colors'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'

/**
 * Botão central "+" da tab bar (via `tabBarButton` da rota fantasma `new`).
 * Não navega — abre o sheet de nova transação pelo TransactionSheetProvider.
 *
 * Usa os primitivos crus do `react-native` (mesmo caminho do tabBarButton
 * global do _layout, que funciona). O `#/tw` Pressable, com todos os props que
 * o navegador injeta no slot, engolia o toque.
 */
export function FabTabButton({ style }: { style?: unknown }) {
  const { openNew } = useTransactionSheet()

  return (
    <Pressable
      onPress={openNew}
      accessibilityRole="button"
      accessibilityLabel="Nova transação"
      testID="fab-new-transaction"
      style={[style as never, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
    >
      <View
        style={{
          height: 40,
          width: 40,
          borderRadius: 20,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
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
