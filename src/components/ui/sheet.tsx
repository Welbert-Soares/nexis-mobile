import { forwardRef, useCallback, type ReactNode } from 'react'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetModalProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'

import { colors } from '#/theme/colors'

// Peças reexportadas: dentro do sheet, inputs precisam ser BottomSheetTextInput
// (senão o teclado empurra errado); conteúdo vai em BottomSheetView (tamanho
// dinâmico) ou BottomSheetScrollView (forms longos).
export { BottomSheetView, BottomSheetScrollView, BottomSheetTextInput }
export type SheetRef = BottomSheetModal

type Props = Omit<BottomSheetModalProps, 'children'> & { children: ReactNode }

export const Sheet = forwardRef<BottomSheetModal, Props>(function Sheet({ children, ...rest }, ref) {
  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  )

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      {...rest}
    >
      {children}
    </BottomSheetModal>
  )
})
