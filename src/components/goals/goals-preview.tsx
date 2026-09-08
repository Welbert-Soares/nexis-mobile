import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { goalsQuery } from '#/api/goals'
import { pct } from '#/lib/analytics-calcs'
import { colors } from '#/theme/colors'

// Bloco read-only na tela Análise — resumo das metas + deep-link pra /goals.
export function GoalsPreview() {
  const router = useRouter()
  const { data: goals = [], isLoading } = useQuery(goalsQuery)

  if (isLoading && !goals.length) return null

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium uppercase tracking-widest text-muted">Metas</Text>
        <Pressable
          onPress={() => router.push('/goals')}
          className="h-6 w-6 items-center justify-center rounded-full bg-border active:opacity-70"
        >
          <ArrowRight size={14} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/goals')}
        className="gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
      >
        {goals.length === 0 ? (
          <Text className="text-xs text-muted">Nenhuma meta ainda</Text>
        ) : (
          goals.slice(0, 4).map((g) => {
            const percent = pct(g.currentAmount, g.targetAmount)
            const tint = g.color ?? colors.accent
            return (
              <View key={g.id} className="gap-1.5">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-row items-center gap-2">
                    <View className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tint }} />
                    <Text numberOfLines={1} className="flex-shrink text-xs text-fg">
                      {g.name}
                    </Text>
                  </View>
                  <Text
                    className="shrink-0 text-xs font-semibold"
                    style={{ color: percent >= 100 ? colors.positive : colors.muted }}
                  >
                    {percent}%
                  </Text>
                </View>
                <View className="h-1 w-full rounded-full bg-border">
                  <View
                    style={{
                      height: 4,
                      borderRadius: 9999,
                      backgroundColor: tint,
                      width: `${Math.min(percent, 100)}%`,
                    }}
                  />
                </View>
              </View>
            )
          })
        )}
      </Pressable>
    </View>
  )
}
