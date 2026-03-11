# Firebase Security Rules (Logic)

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Verificar rol del usuario
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    // Reglas para Libros
    match /books/{bookId} {
      allow read: if true; // Público
      allow write: if getUserRole() in ['admin', 'moderator'];
    }

    // Reglas para Propuestas de Libros
    match /pending_books/{proposalId} {
      allow read: if getUserRole() in ['admin', 'moderator'] || request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
      allow delete: if getUserRole() in ['admin', 'moderator'];
    }

    // Reglas para Ediciones
    match /pending_edits/{editId} {
      allow read: if getUserRole() in ['admin', 'moderator'] || request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
      allow update, delete: if getUserRole() in ['admin', 'moderator'];
    }

    // Reglas para Perfiles de Usuario
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
    }
  }
}
```
