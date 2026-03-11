import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Book } from '@/types';

/**
 * FLUJO DE PUBLICACIÓN
 */

// 1. Usuario crea propuesta de libro
export const proposeNewBook = async (bookData: Omit<Book, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  const pendingRef = collection(db, 'pending_books');
  return await addDoc(pendingRef, {
    ...bookData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

// 2. Moderador aprueba libro (Mover de pending_books a books)
export const approveBook = async (pendingBookId: string) => {
  const pendingDocRef = doc(db, 'pending_books', pendingBookId);
  const pendingSnap = await getDoc(pendingDocRef);

  if (!pendingSnap.exists()) throw new Error("Book proposal not found");

  const bookData = pendingSnap.data();
  
  // Crear en la colección principal
  const newBookRef = doc(collection(db, 'books'));
  await setDoc(newBookRef, {
    ...bookData,
    id: newBookRef.id,
    status: 'approved',
    approvedAt: new Date().toISOString(),
  });

  // Eliminar de pendientes
  await deleteDoc(pendingDocRef);
  
  return newBookRef.id;
};

// Obtener libros aprobados para la galería
export const getApprovedBooks = async () => {
  const q = query(collection(db, 'books'), where('status', '==', 'approved'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
};
