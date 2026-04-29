# Desacoplamiento Completo de Firebase — Clean Architecture

## Contexto

El proyecto LibroVivo tiene una capa de servicios parcialmente implementada de una sesión anterior, pero con **problemas graves** que necesitan resolverse antes de continuar:

1. **Interfaces contaminadas con `any`** — `IAuthService`, `IEditService` y `IBookService` usan `any` extensivamente, eliminando la seguridad de tipos.
2. **Inconsistencia de firmas** — La firma de `proposeEdition` en `IEditService` (`bookId, userId, userName, newContent, summary, proposedData?`) no coincide con cómo se llama desde el componente `edit/page.tsx` (`bookId, { proposedTitle, ... }`). Esto causará errores en runtime.
3. **Import faltante** — `FirebaseBookService` usa `updateDoc` en la línea 94 pero **no lo importa** → crash en runtime.
4. **Tipos duplicados/ambiguos** — `Book` en `types/index.ts` tiene campos inconsistentes (`cover` vs `coverUrl`, `description` vs `synopsis`, `content: string | string[]`). Los componentes y la interfaz `PendingBook`/`ProposedEdit` en moderation definen tipos locales ad-hoc.
5. **Sin error handling en servicios** — Los try/catch están solo en componentes, no en la capa de servicio.
6. **Sin inyección por variable de entorno** — `services/index.ts` siempre instancia Firebase, sin soporte para `NEXT_PUBLIC_DATA_SOURCE`.
7. **`publish/page.tsx` usa `User` sin importar** — El tipo `User` está referenciado en línea 24 pero no importado.
8. **`edit/page.tsx` importa `uploadToCloudinary` directamente** — Debería usar `mediaService`.

> [!CAUTION]
> El código actual tiene al menos 3 bugs que producirán crashes en runtime:
> - `updateDoc` no importado en `FirebaseBookService`
> - Firma de `proposeEdition` incompatible entre interfaz e implementación vs. uso en componentes
> - `User` tipo no importado en `publish/page.tsx`

## Propuesta: Rediseño desde cero

Propongo **reescribir las interfaces y las implementaciones** siguiendo principios de Clean Architecture estrictos, en vez de parchear lo existente.

---

## Cambios Propuestos

### 1. Domain Types — `src/types/index.ts`

#### [MODIFY] [index.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/types/index.ts)

Redefinir los tipos del dominio con consistencia:

```typescript
// === Domain Status ===
export type BookStatus = 'pending' | 'approved' | 'rejected';

// === Core Entity ===
export interface Book {
  id: string;
  title: string;
  author: string;
  authorId: string;
  category: string;
  synopsis: string;
  content: string[];          // ← siempre array, nunca string suelto
  coverUrl: string;           // ← un solo nombre, no cover/coverUrl
  status: BookStatus;
  createdAt: string;
  updatedAt?: string;
}

// === DTOs (Data Transfer Objects) ===
export interface NewBookInput {
  title: string;
  category: string;
  synopsis: string;
  content: string[];
  coverUrl: string;
  author: string;
  authorId: string;
}

export interface EditProposalInput {
  bookId: string;
  proposedTitle: string;
  proposedCategory: string;
  proposedSynopsis: string;
  proposedContent: string[];
  proposedCoverUrl: string;
  authorId: string;
  authorName: string;
}

export interface EditProposal extends EditProposalInput {
  id: string;
  status: BookStatus;
  createdAt: string;
}

// === Auth Types ===
export type UserRole = 'admin' | 'moderator' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

// Auth user — lo que devuelve onAuthStateChanged
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
```

> [!IMPORTANT]
> `content` pasa a ser **siempre `string[]`**. Los componentes ya trabajan con arrays (`pages`). El servicio Firebase normalizará datos legacy que vengan como `string` → `[string]`.

---

### 2. Interfaces de Servicio

#### [MODIFY] [IBookService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/interfaces/IBookService.ts)

```typescript
import { Book, NewBookInput } from '@/types';

export interface IBookService {
  // Queries
  getApprovedBooks(): Promise<Book[]>;
  getPendingBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book | null>;
  getBooksByAuthor(authorId: string): Promise<Book[]>;
  getPendingBooksByAuthor(authorId: string): Promise<Book[]>;
  
  // Mutations
  createBook(data: NewBookInput): Promise<string>;
  updateBook(id: string, data: Partial<Book>): Promise<void>;
  deleteBook(id: string): Promise<void>;
  
  // Moderation
  approveBook(pendingBookId: string): Promise<string>;
  rejectBook(pendingBookId: string): Promise<void>;
}
```

#### [MODIFY] [IEditService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/interfaces/IEditService.ts)

```typescript
import { EditProposal, EditProposalInput } from '@/types';

export interface IEditService {
  proposeEdit(data: EditProposalInput): Promise<string>;
  getPendingEdits(): Promise<EditProposal[]>;
  approveEdit(editId: string): Promise<string>;
  rejectEdit(editId: string): Promise<void>;
}
```

#### [MODIFY] [IAuthService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/interfaces/IAuthService.ts)

```typescript
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
```

#### [IMediaService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/interfaces/IMediaService.ts) — sin cambios

---

### 3. Implementaciones Firebase

#### [MODIFY] [FirebaseBookService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/FirebaseBookService.ts)

- Fix del import faltante de `updateDoc`
- Reescritura con `NewBookInput` tipado
- Normalización de `content` (string → string[])
- Try/catch interno con logging

#### [MODIFY] [FirebaseEditService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/FirebaseEditService.ts)

- Firma actualizada a `proposeEdit(data: EditProposalInput)`
- Retorno tipado `EditProposal[]`
- Try/catch interno

#### [MODIFY] [FirebaseAuthService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/FirebaseAuthService.ts)

- Retorno `AuthUser` en vez de `any`
- Conversión interna de Firebase `User` → `AuthUser`

---

### 4. API Placeholder + Inyección por ENV

#### [NEW] [ApiBookService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/ApiBookService.ts)
#### [NEW] [ApiEditService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/ApiEditService.ts)
#### [NEW] [ApiAuthService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/ApiAuthService.ts)
#### [NEW] [ApiMediaService.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/implementations/ApiMediaService.ts)

Placeholders que devuelven mocks. Implementan las interfaces correctamente para que TypeScript valide la conformidad.

#### [MODIFY] [index.ts](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/services/index.ts)

```typescript
const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'firebase';

// Lazy initialization based on env
function createBookService(): IBookService { ... }
function createEditService(): IEditService { ... }
function createAuthService(): IAuthService { ... }
function createMediaService(): IMediaService { ... }

export const bookService = createBookService();
// etc.
```

---

### 5. Refactorización de Componentes

#### [MODIFY] [publish/page.tsx](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/app/publish/page.tsx)
- Fix tipo `User` → `AuthUser`
- Reemplazar `uploadToCloudinary` por `mediaService.uploadImage`
- Usar `bookService.createBook()` con `NewBookInput` tipado (sin `as any`)

#### [MODIFY] [book/[id]/edit/page.tsx](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/app/book/%5Bid%5D/edit/page.tsx)
- Eliminar import de `uploadToCloudinary` → usar `mediaService`
- Corregir llamada a `editService.proposeEdit()` para que coincida con la nueva interfaz
- Eliminar import de `UserProfile` (no se usa)

#### [MODIFY] [moderation/page.tsx](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/app/moderation/page.tsx)
- Actualizar tipos `PendingBook`/`ProposedEdit` locales → usar `Book`/`EditProposal` de `@/types`
- Actualizar llamadas `editService.approveEdition()` → `editService.approveEdit()`
- Actualizar llamadas `editService.rejectEdition()` → `editService.rejectEdit()`

#### [MODIFY] [book/[id]/page.tsx](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/app/book/%5Bid%5D/page.tsx)
- Normalización: la UI ya no necesita manejar `content: string | string[]` porque el servicio siempre devuelve `string[]`

#### [MODIFY] [my-works/page.tsx](file:///c:/Users/Aruma%20Studio/Documents/GitHub/librovivo/src/app/my-works/page.tsx)
- Verificar que usa `AuthUser` correctamente

#### Componentes ya limpios (sin cambios necesarios):
- `page.tsx` (home) ✅
- `Navbar.tsx` ✅
- `login/page.tsx` ✅
- `library/page.tsx` ✅

---

## User Review Required

> [!IMPORTANT]
> **Cambio Breaking en `content`**: El tipo `Book.content` pasa de `string | string[]` a solo `string[]`. Esto significa que el servicio Firebase normalizará datos legacy automáticamente, pero si hay datos en Firestore almacenados como strings sueltos, necesitan un handler. ¿Hay datos legacy en producción que sean strings y no arrays?

> [!IMPORTANT]
> **Renaming de métodos**: `proposeEdition/approveEdition/rejectEdition` se renombran a `proposeEdit/approveEdit/rejectEdit` para consistencia con la interfaz `IEditService`. ¿Aceptas esta convención?

> [!IMPORTANT]
> **`proposeNewBook` → `createBook`**: Se renombra para seguir convenciones CRUD estándar. ¿De acuerdo?

---

## Verification Plan

### Automated Tests
```bash
npx tsc --noEmit   # Verificar compilación TypeScript sin errores
npm run build       # Verificar que el build de Next.js pasa
```

### Manual Verification
- Verificar que `NEXT_PUBLIC_DATA_SOURCE=firebase` (default) mantiene el comportamiento actual
- Verificar que `NEXT_PUBLIC_DATA_SOURCE=api` carga los Api*Service placeholders sin crash
- Auditar que **cero** imports de `firebase/*` existan fuera de `src/lib/` y `src/services/implementations/Firebase*`
