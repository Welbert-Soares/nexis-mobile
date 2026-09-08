import { apiGet } from './client'
import { CategoriesSchema } from '#/schemas/category'

export const categoriesQuery = (type: 'INCOME' | 'EXPENSE') => ({
  queryKey: ['categories', type] as const,
  queryFn: () =>
    apiGet(`/api/mobile/categories?type=${type}`, (r) => CategoriesSchema.parse(r)),
  staleTime: 5 * 60_000,
  gcTime: 10 * 60_000,
})
