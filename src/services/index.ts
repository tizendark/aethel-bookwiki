// ============================================================
// Service Layer — Entry Point
// Inyección de dependencias basada en NEXT_PUBLIC_DATA_SOURCE.
// Valores: 'firebase' (default) | 'api' (placeholder para Node.js/AWS)
// ============================================================

import { IAuthService } from './interfaces/IAuthService';
import { IBookService } from './interfaces/IBookService';
import { IEditService } from './interfaces/IEditService';
import { IMediaService } from './interfaces/IMediaService';

const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'firebase';

function createAuthService(): IAuthService {
  if (DATA_SOURCE === 'api') {
    // Lazy import para no cargar Firebase SDK cuando no se necesita
    const { ApiAuthService } = require('./implementations/ApiAuthService');
    return new ApiAuthService();
  }
  const { FirebaseAuthService } = require('./implementations/FirebaseAuthService');
  return new FirebaseAuthService();
}

function createBookService(): IBookService {
  if (DATA_SOURCE === 'api') {
    const { ApiBookService } = require('./implementations/ApiBookService');
    return new ApiBookService();
  }
  const { FirebaseBookService } = require('./implementations/FirebaseBookService');
  return new FirebaseBookService();
}

function createEditService(): IEditService {
  if (DATA_SOURCE === 'api') {
    const { ApiEditService } = require('./implementations/ApiEditService');
    return new ApiEditService();
  }
  const { FirebaseEditService } = require('./implementations/FirebaseEditService');
  return new FirebaseEditService();
}

function createMediaService(): IMediaService {
  if (DATA_SOURCE === 'api') {
    const { ApiMediaService } = require('./implementations/ApiMediaService');
    return new ApiMediaService();
  }
  const { CloudinaryMediaService } = require('./implementations/CloudinaryMediaService');
  return new CloudinaryMediaService();
}

// Singleton instances
export const authService: IAuthService = createAuthService();
export const bookService: IBookService = createBookService();
export const editService: IEditService = createEditService();
export const mediaService: IMediaService = createMediaService();

// Re-export types for convenience
export type { IAuthService } from './interfaces/IAuthService';
export type { IBookService } from './interfaces/IBookService';
export type { IEditService } from './interfaces/IEditService';
export type { IMediaService } from './interfaces/IMediaService';
