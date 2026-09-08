import { forwardRef } from 'react'

import { Text } from '#/tw'
import { Sheet, SheetRef, BottomSheetView } from '#/components/ui/sheet'
import type { Wallet } from '#/schemas/wallet'

// Placeholder — a Task 8 implementa o form (criar/editar/excluir).
type Props = { wallet?: Wallet; onClose?: () => void }

export const WalletSheet = forwardRef<SheetRef, Props>(function WalletSheet(_props, ref) {
  return (
    <Sheet ref={ref}>
      <BottomSheetView style={{ padding: 24 }}>
        <Text className="text-sm text-muted">Formulário de carteira (Task 8)</Text>
      </BottomSheetView>
    </Sheet>
  )
})
