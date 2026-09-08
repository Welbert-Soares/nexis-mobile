import { Plus } from 'lucide-react-native'

import { View, Pressable } from '#/tw'
import { colors } from '#/theme/colors'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'

/**
 * Botão central "+" da tab bar (via `tabBarButton` da rota fantasma `new`).
 * Não navega — abre o sheet de nova transação pelo TransactionSheetProvider.
 * Levemente elevado pra destacar da linha das abas, mas ancorado na barra.
 */
export function FabTabButton() {
  const { openNew } = useTransactionSheet()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova transação"
        testID="fab-new-transaction"
        onPress={openNew}
        className="items-center justify-center rounded-full active:opacity-80"
        style={{
          height: 46,
          width: 46,
          marginTop: -10,
          backgroundColor: colors.accent,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Plus size={22} color="#ffffff" strokeWidth={2.75} />
      </Pressable>
    </View>
  )
}
