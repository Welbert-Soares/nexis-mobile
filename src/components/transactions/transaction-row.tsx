import { useRef } from 'react'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { ArrowLeftRight, Repeat2, Trash2 } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { CATEGORY_ICONS } from '#/lib/category-icons'
import { fmtBRL, tabularNums } from '#/lib/format'
import { colors } from '#/theme/colors'
import type { Transaction } from '#/schemas/transaction'

type SwipeMethods = { close: () => void }

export function TransactionRow({
  tx,
  onPress,
  onSwipeDelete,
  hideWallet,
}: {
  tx: Transaction
  onPress?: () => void
  onSwipeDelete?: () => void
  hideWallet?: boolean
}) {
  const isExpense = tx.type === 'EXPENSE'
  const label = tx.description ?? tx.category?.name ?? 'Sem descrição'
  const color = tx.category?.color ?? tx.wallet.color ?? colors.muted
  const CategoryIcon = tx.category?.icon ? CATEGORY_ICONS[tx.category.icon] : null
  const isRecurringish = tx.recurring || !!tx.parentId
  const swipeRef = useRef<SwipeMethods>(null)

  const inner = (
    <>
      <View
        className="h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: tx.isTransfer ? `${colors.muted}20` : `${color}20` }}
      >
        {tx.isTransfer ? (
          <ArrowLeftRight size={16} color={colors.muted} strokeWidth={1.75} />
        ) : CategoryIcon ? (
          <CategoryIcon size={16} color={color} strokeWidth={1.75} />
        ) : (
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        )}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="flex-shrink text-sm text-fg">
            {label}
          </Text>
          {isRecurringish && <Repeat2 size={12} color={colors.muted} />}
        </View>
        {!hideWallet ? (
          <Text className="text-xs text-muted">{tx.wallet.name}</Text>
        ) : tx.category?.name ? (
          <Text className="text-xs text-muted">{tx.category.name}</Text>
        ) : null}
      </View>

      <Text
        className="shrink-0 text-sm font-medium"
        style={[tabularNums, { color: isExpense ? colors.negative : colors.positive }]}
      >
        {isExpense ? '-' : '+'}
        {fmtBRL(tx.amount)}
      </Text>
    </>
  )

  const body = onPress ? (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl px-1 py-2.5 active:opacity-70"
    >
      {inner}
    </Pressable>
  ) : (
    <View className="flex-row items-center gap-3 rounded-xl px-1 py-2.5">{inner}</View>
  )

  // Transferência é read-only; sem swipe.
  if (!onSwipeDelete || tx.isTransfer) return body

  return (
    <ReanimatedSwipeable
      ref={swipeRef as never}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          onPress={() => {
            swipeRef.current?.close()
            onSwipeDelete()
          }}
          className="my-1 items-center justify-center rounded-xl"
          style={{ width: 88, backgroundColor: 'rgba(248,113,113,0.18)' }}
        >
          <Trash2 size={18} color={colors.negative} />
          <Text className="mt-1 text-[11px]" style={{ color: colors.negative }}>
            Excluir
          </Text>
        </Pressable>
      )}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          swipeRef.current?.close()
          onSwipeDelete()
        }
      }}
    >
      {body}
    </ReanimatedSwipeable>
  )
}
