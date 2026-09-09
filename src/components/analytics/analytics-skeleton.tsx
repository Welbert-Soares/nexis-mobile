import { View } from '#/tw'
import { colors } from '#/theme/colors'
import { Skeleton } from '#/components/ui/skeleton'

const card: { borderWidth: number; borderColor: string; borderRadius: number } = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
}

export function AnalyticsSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton style={[card, { height: 64 }]} />
      <Skeleton style={[card, { height: 160 }]} />
      <Skeleton style={[card, { height: 160 }]} />
    </View>
  )
}
