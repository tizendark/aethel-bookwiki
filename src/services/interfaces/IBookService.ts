import { Book, NewBookInput } from '@/types';

export interface IBookService {
  // === Queries ===
  getApprovedBooks(): Promise<Book[]>;
  getPendingBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book | null>;
  getBooksByAuthor(authorId: string): Promise<Book[]>;
  getPendingBooksByAuthor(authorId: string): Promise<Book[]>;

  // === Mutations ===
  createBook(data: NewBookInput): Promise<string>;
  updateBook(id: string, data: Partial<Book>): Promise<void>;
  deleteBook(id: string): Promise<void>;

  // === Moderation ===
  approveBook(pendingBookId: string): Promise<string>;
  rejectBook(pendingBookId: string): Promise<void>;

  // === Social Interactions ===
  toggleLike(bookId: string, userId: string): Promise<boolean>;
  hasUserLiked(bookId: string, userId: string): Promise<boolean>;
}
