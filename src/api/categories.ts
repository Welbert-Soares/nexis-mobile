import { apiGet, apiPost, apiDelete } from './client'
import {
  CategoriesSchema,
  CategorySchema,
  CategoriesManagementSchema,
  type CategoryInputData,
  type CategoryEditData,
} from '#/schemas/category'

export const categoriesQuery = (type: 'INCOME' | 'EXPENSE') => ({
  queryKey: ['categories', type] as const,
  queryFn: () =>
    apiGet(`/api/mobile/categories?type=${type}`, (r) => CategoriesSchema.parse(r)),
  staleTime: 5 * 60_000,
  gcTime: 10 * 60_000,
})

// Todas as categorias (globais + do usuário) com _count.transactions — Perfil.
export const categoriesManagementQuery = {
  queryKey: ['categories-management'] as const,
  queryFn: () =>
    apiGet('/api/mobile/categories/manage', (r) => CategoriesManagementSchema.parse(r)),
  staleTime: 60_000,
  gcTime: 5 * 60_000,
}

export const createCategory = (b: CategoryInputData) =>
  apiPost('/api/mobile/categories', b, (r) => CategorySchema.partial().parse(r))

export const editCategory = (id: string, b: CategoryEditData) =>
  apiPost(`/api/mobile/categories/${id}`, b, (r) => CategorySchema.partial().parse(r))

export const removeCategory = (id: string) => apiDelete(`/api/mobile/categories/${id}`)
