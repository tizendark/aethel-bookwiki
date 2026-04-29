import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, googleProvider } from '@/lib/firebase';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';
import { IAuthService } from '../interfaces/IAuthService';
import { UserProfile, UserRole, AuthUser } from '@/types';
import { UserProfileSchema } from '@/types/schemas';

/** Convierte un Firebase User a nuestro AuthUser abstracto. */
function firebaseUserToAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

export class FirebaseAuthService implements IAuthService {

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error(`[AuthService] Error fetching user profile ${uid}:`, error);
      throw error;
    }
  }

  async createUserProfile(user: AuthUser, role: UserRole = 'user'): Promise<UserProfile> {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonymous',
        role,
        createdAt: new Date().toISOString(),
      };
      
      // Validar con Zod
      UserProfileSchema.parse(userProfile);

      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('[AuthService] Error creating user profile:', error);
      throw error;
    }
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      callback(firebaseUser ? firebaseUserToAuthUser(firebaseUser) : null);
    });
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return firebaseUserToAuthUser(credential.user);
    } catch (error) {
      console.error('[AuthService] Error signing in with email:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      await updateProfile(user, { displayName: name });

      const authUser = firebaseUserToAuthUser(user);
      // El displayName no se actualiza inmediatamente en el objeto user
      authUser.displayName = name;
      await this.createUserProfile(authUser);
      return authUser;
    } catch (error) {
      console.error('[AuthService] Error signing up with email:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const authUser = firebaseUserToAuthUser(result.user);

      // Crear perfil si es la primera vez
      const profile = await this.getUserProfile(authUser.uid);
      if (!profile) {
        await this.createUserProfile(authUser);
      }

      return authUser;
    } catch (error) {
      console.error('[AuthService] Error signing in with Google:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      return signOut(auth);
    } catch (error) {
      console.error('[AuthService] Error signing out:', error);
      throw error;
    }
  }
}
