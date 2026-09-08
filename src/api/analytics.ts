import { apiGet } from './client'
import { AnalyticsSchema } from '#/schemas/analytics'

// Snapshot da Análise do mês corrente (a rota não recebe parâmetro de mês).
export const analyticsQuery = {
  queryKey: ['analytics'] as const,
  queryFn: () => apiGet('/api/mobile/analytics', (r) => AnalyticsSchema.parse(r)),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
}
