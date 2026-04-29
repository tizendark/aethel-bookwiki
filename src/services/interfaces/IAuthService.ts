import { UserProfile, UserRole, AuthUser } from '@/types';

export interface IAuthService {
  getUserProfile(uid: string): Promise<UserProfile | null>;
  createUserProfile(user: AuthUser, role?: UserRole): Promise<UserProfile>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signUpWithEmail(email: string, password: string, name: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
}
