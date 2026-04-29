import { EditProposal, EditProposalInput } from '@/types';
import { IEditService } from '../interfaces/IEditService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Implementación real conectada a un Backend REST (Node.js/AWS).
 */
export class ApiEditService implements IEditService {
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

  async proposeEdit(data: EditProposalInput): Promise<string> {
    const result = await this.fetchApi<{ id: string }>('/edits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.id;
  }

  async getPendingEdits(): Promise<EditProposal[]> {
    return this.fetchApi<EditProposal[]>('/edits/pending');
  }

  async approveEdit(editId: string): Promise<string> {
    const result = await this.fetchApi<{ bookId: string }>(`/edits/${editId}/approve`, {
      method: 'POST',
    });
    return result.bookId;
  }

  async rejectEdit(editId: string): Promise<void> {
    await this.fetchApi(`/edits/${editId}/reject`, {
      method: 'POST',
    });
  }
}
