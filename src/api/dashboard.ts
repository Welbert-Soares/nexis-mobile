import { apiGet } from './client'
import { DashboardResponseSchema, type DashboardData } from '#/schemas/dashboard'

export function getDashboard(): Promise<DashboardData> {
  return apiGet('/api/mobile/dashboard', (raw) => DashboardResponseSchema.parse(raw))
}

export const dashboardQuery = {
  queryKey: ['dashboard'] as const,
  queryFn: getDashboard,
  staleTime: 30_000,
  gcTime: 5 * 60_000,
}
