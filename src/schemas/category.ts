import { z } from 'zod'

// Resposta de getCategoriesByType — registros crus de Category do Prisma.
// `userId` null = categoria global. z.object não-strict: `budgets`, timestamps
// e outros campos passam sem quebrar.
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  type: z.enum(['INCOME', 'EXPENSE']),
  userId: z.string().nullable(),
})
export const CategoriesSchema = z.array(CategorySchema)
export type Category = z.infer<typeof CategorySchema>

// Resposta de GET /api/mobile/categories/manage — Category + _count.transactions
// (pro gerenciador no Perfil: bloqueia excluir categoria em uso).
export const CategoryManagementSchema = CategorySchema.extend({
  _count: z.object({ transactions: z.number() }),
})
export const CategoriesManagementSchema = z.array(CategoryManagementSchema)
export type CategoryManagement = z.infer<typeof CategoryManagementSchema>

// Bodies — espelham category.service.ts.
export const CategoryInput = z.object({
  name: z.string().min(1),
  color: z.string(),
  icon: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
})
export type CategoryInputData = z.infer<typeof CategoryInput>

export const CategoryEditInput = z.object({
  name: z.string().min(1),
  color: z.string(),
  icon: z.string().nullable().optional(),
})
export type CategoryEditData = z.infer<typeof CategoryEditInput>
