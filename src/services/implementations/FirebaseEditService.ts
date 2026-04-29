import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EditProposal, EditProposalInput } from '@/types';
import { EditProposalInputSchema } from '@/types/schemas';
import { IEditService } from '../interfaces/IEditService';

/** Convierte un snapshot de Firestore a un EditProposal tipado. */
function snapshotToEditProposal(id: string, data: Record<string, unknown>): EditProposal {
  return {
    id,
    bookId: (data.bookId as string) || '',
    proposedTitle: (data.proposedTitle as string) || '',
    proposedCategory: (data.proposedCategory as string) || '',
    proposedSynopsis: (data.proposedSynopsis as string) || '',
    proposedContent: Array.isArray(data.proposedContent)
      ? (data.proposedContent as string[])
      : [(data.proposedContent as string) || ''],
    proposedCoverUrl: (data.proposedCoverUrl as string) || '',
    authorId: (data.authorId as string) || '',
    author: (data.author as string) || (data.authorName as string) || 'Anónimo',
    status: (data.status as EditProposal['status']) || 'pending',
    createdAt: data.createdAt
      ? (typeof data.createdAt === 'string'
          ? data.createdAt
          : new Date().toISOString())
      : new Date().toISOString(),
  };
}

export class FirebaseEditService implements IEditService {

  async proposeEdit(data: EditProposalInput): Promise<string> {
    try {
      EditProposalInputSchema.parse(data);
      const editsRef = collection(db, 'edits');
      const docRef = await addDoc(editsRef, {
        bookId: data.bookId,
        proposedTitle: data.proposedTitle,
        proposedCategory: data.proposedCategory,
        proposedSynopsis: data.proposedSynopsis,
        proposedContent: data.proposedContent,
        proposedCoverUrl: data.proposedCoverUrl,
        authorId: data.authorId,
        author: data.author,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('[EditService] Error proposing edit:', error);
      throw error;
    }
  }

  async getPendingEdits(): Promise<EditProposal[]> {
    try {
      const q = query(collection(db, 'edits'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => snapshotToEditProposal(d.id, d.data()));
    } catch (error) {
      console.error('[EditService] Error fetching pending edits:', error);
      throw error;
    }
  }

  async approveEdit(editId: string): Promise<string> {
    try {
      const editDocRef = doc(db, 'edits', editId);
      const editSnap = await getDoc(editDocRef);

      if (!editSnap.exists()) {
        throw new Error('Edition proposal not found');
      }

      const editData = editSnap.data();
      const bookId = editData.bookId as string;

      // Aplicar los cambios propuestos al libro
      const bookRef = doc(db, 'books', bookId);
      await updateDoc(bookRef, {
        title: editData.proposedTitle || undefined,
        category: editData.proposedCategory || undefined,
        synopsis: editData.proposedSynopsis || undefined,
        content: editData.proposedContent,
        coverUrl: editData.proposedCoverUrl || undefined,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: editData.author || editData.authorName,
      });

      // Marcar la edición como aprobada
      await updateDoc(editDocRef, {
        status: 'approved',
        resolvedAt: serverTimestamp(),
      });

      return bookId;
    } catch (error) {
      console.error(`[EditService] Error approving edit ${editId}:`, error);
      throw error;
    }
  }

  async rejectEdit(editId: string): Promise<void> {
    try {
      const editDocRef = doc(db, 'edits', editId);
      await updateDoc(editDocRef, {
        status: 'rejected',
        resolvedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`[EditService] Error rejecting edit ${editId}:`, error);
      throw error;
    }
  }
}
