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
