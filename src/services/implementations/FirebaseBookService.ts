import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Book, NewBookInput } from '@/types';
import { NewBookInputSchema } from '@/types/schemas';
import { IBookService } from '../interfaces/IBookService';

/**
 * Normaliza el campo `content` de Firestore.
 * Datos legacy pueden tener `content` como string; esto lo convierte a string[].
 */
function normalizeContent(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') return [raw];
  return [''];
}

/** Convierte un snapshot de Firestore a un Book tipado. */
function snapshotToBook(id: string, data: Record<string, unknown>): Book {
  return {
    id,
    title: (data.title as string) || '',
    author: (data.author as string) || (data.authorName as string) || 'Anónimo',
    authorId: (data.authorId as string) || '',
    category: (data.category as string) || '',
    synopsis: (data.synopsis as string) || '',
    content: normalizeContent(data.content),
    coverUrl: (data.coverUrl as string) || (data.cover as string) || '',
    status: (data.status as Book['status']) || 'pending',
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    updatedAt: (data.updatedAt as string) || undefined,
    likesCount: typeof data.likesCount === 'number' ? data.likesCount : 0,
  };
}

export class FirebaseBookService implements IBookService {

  // === Queries ===

  async getApprovedBooks(): Promise<Book[]> {
    try {
      const q = query(collection(db, 'books'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => snapshotToBook(d.id, d.data()));
    } catch (error) {
      console.error('[BookService] Error fetching approved books:', error);
      throw error;
    }
  }

  async getPendingBooks(): Promise<Book[]> {
    try {
      const q = query(collection(db, 'pending_books'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => snapshotToBook(d.id, d.data()));
    } catch (error) {
      console.error('[BookService] Error fetching pending books:', error);
      throw error;
    }
  }

  async getBookById(id: string): Promise<Book | null> {
    try {
      const bookRef = doc(db, 'books', id);
      const snap = await getDoc(bookRef);
      if (snap.exists()) {
        return snapshotToBook(snap.id, snap.data());
      }
      return null;
    } catch (error) {
      console.error(`[BookService] Error fetching book ${id}:`, error);
      throw error;
    }
  }

  async getBooksByAuthor(authorId: string): Promise<Book[]> {
    try {
      const q = query(collection(db, 'books'), where('authorId', '==', authorId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => snapshotToBook(d.id, d.data()));
    } catch (error) {
      console.error('[BookService] Error fetching books by author:', error);
      throw error;
    }
  }

  async getPendingBooksByAuthor(authorId: string): Promise<Book[]> {
    try {
      const q = query(collection(db, 'pending_books'), where('authorId', '==', authorId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => snapshotToBook(d.id, d.data()));
    } catch (error) {
      console.error('[BookService] Error fetching pending books by author:', error);
      throw error;
    }
  }

  // === Mutations ===

  async createBook(data: NewBookInput): Promise<string> {
    try {
      NewBookInputSchema.parse(data);
      const pendingRef = collection(db, 'pending_books');
      const docRef = await addDoc(pendingRef, {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('[BookService] Error creating book:', error);
      throw error;
    }
  }

  async updateBook(id: string, data: Partial<Book>): Promise<void> {
    try {
      // Validar parcialmente si se proporcionan campos conocidos
      // Nota: Book tiene campos que no están en NewBookInputSchema,
      // pero para propósitos de actualización, validamos lo que coincida.
      NewBookInputSchema.partial().parse(data);

      const bookRef = doc(db, 'books', id);
      await updateDoc(bookRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[BookService] Error updating book ${id}:`, error);
      throw error;
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      const bookRef = doc(db, 'books', id);
      await deleteDoc(bookRef);
    } catch (error) {
      console.error(`[BookService] Error deleting book ${id}:`, error);
      throw error;
    }
  }

  // === Moderation ===

  async approveBook(pendingBookId: string): Promise<string> {
    try {
      const pendingDocRef = doc(db, 'pending_books', pendingBookId);
      const pendingSnap = await getDoc(pendingDocRef);

      if (!pendingSnap.exists()) {
        throw new Error('Book proposal not found');
      }

      const bookData = pendingSnap.data();
      const newBookRef = doc(collection(db, 'books'));
      await setDoc(newBookRef, {
        ...bookData,
        id: newBookRef.id,
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });

      await deleteDoc(pendingDocRef);
      return newBookRef.id;
    } catch (error) {
      console.error(`[BookService] Error approving book ${pendingBookId}:`, error);
      throw error;
    }
  }

  async rejectBook(pendingBookId: string): Promise<void> {
    try {
      const pendingDocRef = doc(db, 'pending_books', pendingBookId);
      await deleteDoc(pendingDocRef);
    } catch (error) {
      console.error(`[BookService] Error rejecting book ${pendingBookId}:`, error);
      throw error;
    }
  }

  // === Social Interactions ===

  async hasUserLiked(bookId: string, userId: string): Promise<boolean> {
    try {
      const likeRef = doc(db, `books/${bookId}/likes`, userId);
      const snap = await getDoc(likeRef);
      return snap.exists();
    } catch (error) {
      console.error(`[BookService] Error checking like for book ${bookId} by user ${userId}:`, error);
      return false;
    }
  }

  async toggleLike(bookId: string, userId: string): Promise<boolean> {
    try {
      const bookRef = doc(db, 'books', bookId);
      const likeRef = doc(db, `books/${bookId}/likes`, userId);
      let isLiked = false;

      await runTransaction(db, async (transaction) => {
        const bookDoc = await transaction.get(bookRef);
        if (!bookDoc.exists()) {
          throw new Error('El libro no existe');
        }

        const likeDoc = await transaction.get(likeRef);
        const currentLikes = bookDoc.data().likesCount || 0;

        if (likeDoc.exists()) {
          // Ya le dio like, quitarlo
          transaction.delete(likeRef);
          transaction.update(bookRef, { likesCount: Math.max(0, currentLikes - 1) });
          isLiked = false;
        } else {
          // No le ha dado like, añadirlo
          transaction.set(likeRef, { createdAt: new Date().toISOString() });
          transaction.update(bookRef, { likesCount: currentLikes + 1 });
          isLiked = true;
        }
      });

      return isLiked;
    } catch (error) {
      console.error(`[BookService] Error toggling like for book ${bookId}:`, error);
      throw error;
    }
  }
}
