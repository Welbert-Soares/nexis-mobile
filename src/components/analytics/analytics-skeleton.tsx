import { View } from '#/tw'

export function AnalyticsSkeleton() {
  return (
    <View className="gap-3">
      <View className="h-16 rounded-2xl border border-border bg-card" />
      <View className="h-40 rounded-2xl border border-border bg-card" />
      <View className="h-40 rounded-2xl border border-border bg-card" />
    </View>
  )
}
