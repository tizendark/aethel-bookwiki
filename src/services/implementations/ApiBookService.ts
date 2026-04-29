import { Book, NewBookInput } from '@/types';
import { IBookService } from '../interfaces/IBookService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Implementación real conectada a un Backend REST (Node.js/Go/Python).
 */
export class ApiBookService implements IBookService {
  private async fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  async getApprovedBooks(): Promise<Book[]> {
    return this.fetchApi<Book[]>('/books?status=approved');
  }

  async getPendingBooks(): Promise<Book[]> {
    return this.fetchApi<Book[]>('/books/pending');
  }

  async getBookById(id: string): Promise<Book | null> {
    try {
      return await this.fetchApi<Book>(`/books/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getBooksByAuthor(authorId: string): Promise<Book[]> {
    return this.fetchApi<Book[]>(`/books?authorId=${authorId}`);
  }

  async getPendingBooksByAuthor(authorId: string): Promise<Book[]> {
    return this.fetchApi<Book[]>(`/books/pending?authorId=${authorId}`);
  }

  async createBook(data: NewBookInput): Promise<string> {
    const result = await this.fetchApi<{ id: string }>('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.id;
  }

  async updateBook(id: string, data: Partial<Book>): Promise<void> {
    await this.fetchApi(`/books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBook(id: string): Promise<void> {
    await this.fetchApi(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  async approveBook(pendingBookId: string): Promise<string> {
    const result = await this.fetchApi<{ id: string }>(`/books/${pendingBookId}/approve`, {
      method: 'POST',
    });
    return result.id;
  }

  async rejectBook(pendingBookId: string): Promise<void> {
    await this.fetchApi(`/books/${pendingBookId}/reject`, {
      method: 'POST',
    });
  }

  // === Social Interactions ===

  async hasUserLiked(bookId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.fetchApi<{ liked: boolean }>(`/books/${bookId}/likes/${userId}`);
      return result.liked;
    } catch (e) {
      return false;
    }
  }

  async toggleLike(bookId: string, userId: string): Promise<boolean> {
    const result = await this.fetchApi<{ liked: boolean }>(`/books/${bookId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return result.liked;
  }
}
