import { forwardRef } from 'react'

import { Text } from '#/tw'
import { Sheet, SheetRef, BottomSheetView } from '#/components/ui/sheet'
import type { Wallet } from '#/schemas/wallet'

// Placeholder — a Task 8 implementa o form de transferência.
type Props = { wallets: Wallet[]; onClose?: () => void }

export const TransferSheet = forwardRef<SheetRef, Props>(function TransferSheet(_props, ref) {
  return (
    <Sheet ref={ref}>
      <BottomSheetView style={{ padding: 24 }}>
        <Text className="text-sm text-muted">Transferência (Task 8)</Text>
      </BottomSheetView>
    </Sheet>
  )
})
