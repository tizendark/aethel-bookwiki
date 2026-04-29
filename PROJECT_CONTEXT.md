# LibroVivo - Project Context

## Overview
**LibroVivo** is a curated wiki-library and sanctuary for evolving literature. It is designed as a platform where knowledge isn't static; books grow, adapt, and breathe through human discovery and collaborative curation. It combines the aesthetic of a premium editorial publication with the collaborative power of a wiki.

---

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: 
  - **Vanilla CSS**: Used for the core design system and editorial aesthetics (Glassmorphism, custom typography).
  - **Tailwind CSS**: Used for layout management and responsive utility classes.
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (Google & Email/Password)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) (Optimized book cover hosting)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API (used for Internationalization)

---

## Requirements

### Functional Requirements
1.  **Public Gallery & Library**: 
    *   Dynamic homepage with featured editions.
    *   Searchable library with category filtering and real-time results.
2.  **eBook Creation & Publishing**:
    *   Page-by-page (block) editor allowing authors to structure content as slides.
    *   Rich Text Support: Custom toolbar for Bold, Italic, and Header formatting (HTML-based).
    *   Metadata: Title, Category, Synopsis, and Cover Image upload.
3.  **Collaborative Evolution**:
    *   Users can "Propose Edits" to any existing work.
    *   Proposed changes are stored as "Edits" for curator review.
4.  **Moderation Panel (Curators)**:
    *   Dedicated dashboard for moderators to review new submissions and proposed edits.
    *   Full preview capabilities (modal-based) before approving or rejecting content.
    *   Direct edit capabilities for moderators on live content.
5.  **User Workspace ("My Works")**:
    *   Personal dashboard to manage published works.
    *   Access to local drafts (new books and edit proposals).
6.  **Smart Drafting System**:
    *   Manual and Automatic saving (10-second debounce).
    *   Drafts are stored in `LocalStorage` (device-specific) with clear UI warnings.
7.  **Internationalization (i18n)**:
    *   Automatic language detection based on browser settings.
    *   Full support for **English** and **Spanish** across all UI elements and categories.
8.  **Authentication**:
    *   Secure login/registration.
    *   Role-based access (User vs. Moderator).

### Non-Functional Requirements
1.  **Premium Aesthetics**: High-end editorial design using serif typography, curated color palettes, and subtle micro-animations.
2.  **Responsiveness**: Fully adaptive layout for mobile, tablet, and desktop viewing.
3.  **Security**: 
    *   Firebase credentials secured via environment variables.
    *   Input sanitization for Rich Text rendering.
4.  **Performance**: Implementation of skeleton loaders and optimized image delivery via Cloudinary.

---

## Current Progress (Milestones Reached)
- [x] **Core Infrastructure**: Firebase integration, Secure Env variables, and Google Auth.
- [x] **Publishing Pipeline**: Block-based editor with Cloudinary integration.
- [x] **Collaborative Engine**: Edit proposal system and Moderation workflow.
- [x] **eBook Experience**: Interactive slide viewer for reading books with formatting support.
- [x] **Drafting System**: Robust LocalStorage-based draft management with auto-save.
- [x] **Global UI**: Translated interface (ES/EN) and responsive Navbar.
- [x] **Moderation**: Advanced panel with preview modals for curator decision-making.

---

## Future Roadmap (Next Steps)
- [ ] User profile customization and bio.
- [ ] Social interactions (Comments/Appreciation on books).
- [ ] Version history for books (Track changes over time).
- [ ] Offline reading support.
