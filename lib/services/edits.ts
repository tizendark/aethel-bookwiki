import { 
  collection, 
  addDoc, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Edition } from '@/types';

/**
 * FLUJO DE EDICIÓN
 */

// 1. Usuario propone cambios a un libro existente
export const proposeEdition = async (
  bookId: string, 
  userId: string, 
  userName: string, 
  newContent: string, 
  summary: string
) => {
  const editsRef = collection(db, 'pending_edits');
  return await addDoc(editsRef, {
    bookId,
    userId,
    userName,
    content: newContent, // El nuevo contenido propuesto
    changes: summary,
    status: 'pending',
    timestamp: new Date().toISOString(),
  });
};

// 2. Moderador aprueba edición (Sobreescribir 'content' en el libro original)
export const approveEdition = async (editId: string) => {
  const editDocRef = doc(db, 'pending_edits', editId);
  const editSnap = await getDoc(editDocRef);

  if (!editSnap.exists()) throw new Error("Edition proposal not found");

  const editData = editSnap.data();
  const { bookId, content } = editData;

  // Actualizar el documento original en 'books'
  const bookRef = doc(db, 'books', bookId);
  await updateDoc(bookRef, {
    content: content,
    updatedAt: new Date().toISOString(),
    lastEditedBy: editData.userName
  });

  // Marcar como aprobada o eliminar de pendientes
  await deleteDoc(editDocRef);
  
  return bookId;
};

// Rechazar edición
export const rejectEdition = async (editId: string) => {
  const editDocRef = doc(db, 'pending_edits', editId);
  await updateDoc(editDocRef, { status: 'rejected' });
  // Opcionalmente eliminar después de un tiempo o mantener para historial
};
