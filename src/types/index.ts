// ============================================================
// LibroVivo — Domain Types
// Fuente única de verdad para todas las entidades del sistema.
// ============================================================

// === Status ===
export type BookStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'moderator' | 'user';

// === Core Entity ===
export interface Book {
  id: string;
  title: string;
  author: string;
  authorId: string;
  category: string;
  synopsis: string;
  content: string[];           // Siempre array — datos legacy se normalizan en el servicio
  coverUrl: string;
  status: BookStatus;
  createdAt: string;
  updatedAt?: string;
}

// === DTOs (Data Transfer Objects) ===

/** Datos necesarios para crear un nuevo libro (propuesta). */
export interface NewBookInput {
  title: string;
  category: string;
  synopsis: string;
  content: string[];
  coverUrl: string;
  author: string;
  authorId: string;
}

/** Datos necesarios para proponer una edición a un libro existente. */
export interface EditProposalInput {
  bookId: string;
  proposedTitle: string;
  proposedCategory: string;
  proposedSynopsis: string;
  proposedContent: string[];
  proposedCoverUrl: string;
  authorId: string;
  author: string;
}

/** Propuesta de edición almacenada (incluye metadatos del sistema). */
export interface EditProposal extends EditProposalInput {
  id: string;
  status: BookStatus;
  createdAt: string;
}

// === Auth Types ===

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Representación abstracta del usuario autenticado.
 * Desacoplada del Firebase User SDK para permitir migración a JWT/REST.
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
