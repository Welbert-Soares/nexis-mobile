import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus } from 'lucide-react-native'

import { Pressable } from '#/tw'
import { colors } from '#/theme/colors'
import { useTransactionSheet } from '#/components/transactions/transaction-sheet-context'

// Altura padrão da tab bar do RN (iOS/Android) + safe-area. Medir com
// `useBottomTabBarHeight()` exigiria estar dentro do navigator; o FAB é irmão
// do <Tabs>, então usa a constante (verificado no device — Task de verificação).
const TAB_BAR_HEIGHT = 49

/**
 * Botão "+" flutuante, sobre a tab bar, disponível em qualquer aba.
 * Abre o sheet de nova transação via TransactionSheetProvider.
 */
export function Fab() {
  const insets = useSafeAreaInsets()
  const { openNew } = useTransactionSheet()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nova transação"
      testID="fab-new-transaction"
      onPress={openNew}
      className="absolute items-center justify-center rounded-full active:opacity-80"
      style={{
        alignSelf: 'center',
        bottom: TAB_BAR_HEIGHT + insets.bottom + 12,
        height: 56,
        width: 56,
        backgroundColor: colors.accent,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Plus size={24} color="#ffffff" strokeWidth={2.5} />
    </Pressable>
  )
}
