import { z } from 'zod';

export const BookStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export const UserRoleSchema = z.enum(['admin', 'moderator', 'user']);

export const NewBookInputSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(100),
  category: z.string().min(1, "Debes seleccionar una categoría"),
  synopsis: z.string().min(10, "La sinopsis debe tener al menos 10 caracteres").max(1000),
  content: z.array(z.string().min(1, "Una página no puede estar vacía")).min(1, "El libro debe tener al menos una página"),
  coverUrl: z.string().url("URL de portada inválida"),
  author: z.string().min(1, "Nombre de autor requerido"),
  authorId: z.string().min(1, "ID de autor requerido"),
});

export const EditProposalInputSchema = z.object({
  bookId: z.string().min(1, "ID de libro requerido"),
  proposedTitle: z.string().min(3, "El título debe tener al menos 3 caracteres").max(100),
  proposedCategory: z.string().min(1, "Debes seleccionar una categoría"),
  proposedSynopsis: z.string().min(10, "La sinopsis debe tener al menos 10 caracteres").max(1000),
  proposedContent: z.array(z.string().min(1, "Una página no puede estar vacía")).min(1, "El libro debe tener al menos una página"),
  proposedCoverUrl: z.string().url("URL de portada inválida"),
  authorId: z.string().min(1, "ID de autor requerido"),
  author: z.string().min(1, "Nombre de autor requerido"),
});

export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email("Email inválido"),
  displayName: z.string().min(1, "Nombre requerido"),
  role: UserRoleSchema,
  createdAt: z.string().datetime().optional().or(z.string()), // Aceptamos ISO strings
});
