# Log de Refactorización y Cambios — LibroVivo

Este documento detalla la migración de la arquitectura de LibroVivo desde una dependencia directa de Firebase hacia una **Clean Architecture** desacoplada, así como las correcciones de bugs críticos realizados.

## 1. Arquitectura de Servicios (Abstracción)

Se ha implementado una capa de servicios que separa la lógica de negocio de la infraestructura:

-   **Interfaces (`src/services/interfaces/`)**: Definición de contratos estrictos (`IAuthService`, `IBookService`, `IEditService`, `IMediaService`).
-   **Implementaciones**:
    -   `Firebase*Service`: Implementación actual basada en Google Firebase.
    -   `Api*Service`: Placeholders preparados para una futura migración a una API REST propia (Node.js/AWS).
-   **Inyección de Dependencias**: El archivo `src/services/index.ts` actúa como un contenedor que instancia los servicios basándose en la variable de entorno `NEXT_PUBLIC_DATA_SOURCE`.

## 2. Unificación del Modelo de Datos (Dominio)

Se han estandarizado los tipos en `src/types/index.ts` para eliminar la ambigüedad:

-   **`Book`**: La entidad principal ahora tiene una estructura clara.
-   **`AuthUser`**: Interfaz abstracta para el usuario autenticado, eliminando la dependencia directa del SDK de Firebase en los componentes.
-   **Consistencia de Campos**: Se unificó el uso de `author` (antes `authorName`) en todas las entidades (`Book`, `EditProposal`, `NewBookInput`).
-   **Normalización de Contenido**: El campo `content` ahora es siempre un array de strings (`string[]`), simplificando el visor de libros.

## 3. Correcciones de Bugs Críticos (Bug Fixes)

-   **Runtime Crash (Visor)**: Se añadió *null-safety* en `book/[id]/page.tsx` y en el modal de moderación para evitar fallos si el contenido de una página es `undefined`.
-   **Fuga de Tipos (`any`)**: Se eliminó el uso extensivo de `any` en los servicios y en la página de `my-works`, sustituyéndolos por tipos de dominio estrictos.
-   **Import Faltante**: Se corrigió la falta del import `updateDoc` en `FirebaseBookService.ts`.
-   **Error de Mapeo en Moderación**: Se corrigió el modal de moderación que no mostraba correctamente el nombre del autor debido a una discrepancia en los nombres de los campos.

## 4. Mejoras de Infraestructura

-   **LocalStorage Drafts**: Se mejoró el sistema de borradores para que el auto-guardado sea más robusto y use los tipos de entrada (`NewBookInput`).
-   **Lazy Loading**: Los servicios de infraestructura (Firebase) solo se cargan mediante `require` dinámico cuando son necesarios, optimizando el bundle de la aplicación.
-   **Cloudinary Separation**: La lógica de subida de imágenes se movió a `CloudinaryMediaService`, permitiendo cambiar de proveedor de almacenamiento sin tocar los componentes.

## 5. Próximos Pasos (Roadmap Técnico)

-   [x] **Implementar un Hook de Autenticación Centralizado (`useAuth`)**: Se creó `AuthContext.tsx` que maneja el estado global del usuario, su perfil y permisos (moderador/admin). Se refactorizaron todas las páginas (`publish`, `moderation`, `book/[id]`, `my-works`) para eliminar lógica duplicada.
-   [x] **Añadir validación de esquemas (Zod)**: Se instaló `zod` y se definieron esquemas estrictos en `src/types/schemas.ts` para todas las entradas de datos. Los servicios (`Book`, `Edit`, `Auth`) ahora validan los datos en runtime antes de interactuar con la base de datos, garantizando la integridad de la información.
-   [x] **Implementar la versión real de los `Api*Service`**: Se sustituyeron los placeholders por implementaciones reales basadas en `fetch`. Estos servicios están listos para conectarse a un backend REST (Node.js/Go/Python) mediante la variable `NEXT_PUBLIC_API_URL`. Incluyen soporte para autenticación por JWT (Bearer token) y un sistema de observación de estado de sesión basado en `localStorage`.

---
*Este log marca el fin de la fase de desacoplamiento de infraestructura. El sistema es ahora agnóstico a la persistencia y puede alternar entre Firebase y una API REST mediante configuración.*
