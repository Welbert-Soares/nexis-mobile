import { forwardRef } from 'react'

import { View, Text, Pressable } from '#/tw'
import { Sheet, SheetRef, BottomSheetView } from '#/components/ui/sheet'
import { colors } from '#/theme/colors'
import type { Transaction } from '#/schemas/transaction'

export type DeleteMode = 'this' | 'this-and-future' | 'all'

type Props = {
  tx?: Transaction | null
  onPick: (mode: DeleteMode) => void
  onClose?: () => void
}

// Seletor de escopo de exclusão pra parcelas / séries recorrentes. Usado pelo
// swipe (na tela) e pelo botão de excluir do transaction-sheet.
export const DeleteModeSheet = forwardRef<SheetRef, Props>(function DeleteModeSheet(
  { tx, onPick, onClose },
  ref,
) {
  const isInstallment = !!tx?.isInstallment
  function pick(mode: DeleteMode) {
    ;(ref as React.RefObject<SheetRef>)?.current?.dismiss()
    onPick(mode)
  }

  return (
    <Sheet ref={ref} onDismiss={() => onClose?.()}>
      <BottomSheetView>
        <View className="gap-3 p-5 pb-8">
          <Text className="text-center text-sm text-fg">
            {isInstallment ? 'Excluir parcelamento' : 'Excluir recorrência'}
          </Text>
          <Text className="text-center text-xs text-muted">O saldo da carteira será revertido.</Text>

          <Pressable
            onPress={() => pick('this')}
            className="rounded-xl border border-border px-4 py-3.5 active:opacity-70"
          >
            <Text className="text-sm font-medium text-fg">
              {isInstallment ? 'Só esta parcela' : 'Só esta ocorrência'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => pick('this-and-future')}
            className="rounded-xl border border-border px-4 py-3.5 active:opacity-70"
          >
            <Text className="text-sm font-medium text-fg">
              {isInstallment ? 'Esta e as próximas' : 'Esta e as futuras'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => pick('all')}
            className="rounded-xl px-4 py-3.5 active:opacity-70"
            style={{ backgroundColor: 'rgba(248,113,113,0.18)' }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.negative }}>
              {isInstallment ? 'Todas as parcelas' : 'Toda a série'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => (ref as React.RefObject<SheetRef>)?.current?.dismiss()}
            className="rounded-xl border border-border py-3"
          >
            <Text className="text-center text-sm text-muted">Cancelar</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </Sheet>
  )
})
