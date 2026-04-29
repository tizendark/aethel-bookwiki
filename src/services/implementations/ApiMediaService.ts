import { IMediaService } from '../interfaces/IMediaService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Implementación real conectada a un Backend REST (Node.js/AWS).
 */
export class ApiMediaService implements IMediaService {

  async uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        body: formData,
        // No enviamos Content-Type para que el navegador ponga el boundary del FormData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('[ApiMediaService] uploadImage error:', error);
      return null;
    }
  }
}
