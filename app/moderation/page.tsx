"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Loader2, Check, X, BookOpen, AlertCircle, Inbox, ExternalLink, ShieldAlert, Edit3, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, getCategoryTranslation } from "@/contexts/I18nContext";

interface PendingBook {
  id: string;
  title: string;
  category: string;
  synopsis?: string;
  content: string | string[];
  coverUrl: string;
  status: string;
  authorId?: string;
  authorName?: string;
  createdAt: any;
}

interface ProposedEdit {
  id: string;
  bookId: string;
  proposedTitle: string;
  proposedCategory: string;
  proposedSynopsis?: string;
  proposedContent: string | string[];
  proposedCoverUrl: string;
  status: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export default function ModerationPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'books' | 'edits'>('books');
  const [books, setBooks] = useState<PendingBook[]>([]);
  const [edits, setEdits] = useState<ProposedEdit[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar record para saber qué libro o edición está procesándose (para el loader del botón)
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { t } = useI18n();

  // States for the Preview Modal
  const [previewItem, setPreviewItem] = useState<PendingBook | ProposedEdit | null>(null);
  const [previewPage, setPreviewPage] = useState(0);

  const openPreview = (item: PendingBook | ProposedEdit) => {
    setPreviewItem(item);
    setPreviewPage(0);
  };

  const closePreview = () => setPreviewItem(null);

  const fetchPendingBooks = async () => {
    try {
      const q = query(collection(db, "pending_books"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      
      const loadedBooks: PendingBook[] = [];
      querySnapshot.forEach((docSnap) => {
        loadedBooks.push({ id: docSnap.id, ...docSnap.data() } as PendingBook);
      });
      
      setBooks(loadedBooks);
    } catch (err: any) {
      console.error("Error fetching pending books:", err);
      setError(t("moderation.errorBooks"));
    }
  };

  const fetchPendingEdits = async () => {
    try {
      const q = query(collection(db, "edits"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      
      const loadedEdits: ProposedEdit[] = [];
      querySnapshot.forEach((docSnap) => {
        loadedEdits.push({ id: docSnap.id, ...docSnap.data() } as ProposedEdit);
      });
      
      setEdits(loadedEdits);
    } catch (err: any) {
      console.error("Error fetching pending edits:", err);
      setError(t("moderation.errorEdits"));
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchPendingBooks(), fetchPendingEdits()]);
    setIsLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "moderator") {
            setIsModerator(true);
            fetchAllData();
          } else {
            setIsModerator(false);
          }
        } catch (err) {
          console.error("Error checking role", err);
          setIsModerator(false);
        }
      } else {
        setIsModerator(false);
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Handlers para Nuevos Libros ---
  const handleApproveBook = async (book: PendingBook) => {
    try {
      setProcessingId(book.id);
      const newBookRef = doc(collection(db, "books"));
      await setDoc(newBookRef, {
        title: book.title,
        category: book.category,
        synopsis: book.synopsis || "",
        content: book.content,
        coverUrl: book.coverUrl,
        authorId: book.authorId || null,
        author: book.authorName || "Usuario Anónimo",
        createdAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "pending_books", book.id));
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      console.error("Error approving book:", err);
      alert(t("moderation.errorApproveBook"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBook = async (bookId: string) => {
    if (!window.confirm(t("moderation.rejectBookConfirm"))) return;
    try {
      setProcessingId(bookId);
      await deleteDoc(doc(db, "pending_books", bookId));
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error("Error rejecting book:", err);
      alert(t("moderation.errorRejectBook"));
    } finally {
      setProcessingId(null);
    }
  };

  // --- Handlers para Ediciones Propuestas ---
  const handleApproveEdit = async (edit: ProposedEdit) => {
    try {
      setProcessingId(edit.id);
      const bookRef = doc(db, "books", edit.bookId);
      
      const bookSnap = await getDoc(bookRef);
      if (!bookSnap.exists()) {
        throw new Error("El libro original no existe o fue eliminado.");
      }
      
      await updateDoc(bookRef, {
        title: edit.proposedTitle,
        category: edit.proposedCategory,
        synopsis: edit.proposedSynopsis || "",
        content: edit.proposedContent,
        coverUrl: edit.proposedCoverUrl,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: edit.authorName,
      });

      await updateDoc(doc(db, "edits", edit.id), {
        status: "approved",
        resolvedAt: serverTimestamp(),
      });

      setEdits((prev) => prev.filter((e) => e.id !== edit.id));
    } catch (err) {
      console.error("Error approving edit:", err);
      alert(t("moderation.errorApproveEdit"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEdit = async (editId: string) => {
    if (!window.confirm(t("moderation.rejectEditConfirm"))) return;
    try {
      setProcessingId(editId);
      await updateDoc(doc(db, "edits", editId), {
        status: "rejected",
        resolvedAt: serverTimestamp(),
      });
      setEdits((prev) => prev.filter((e) => e.id !== editId));
    } catch (err) {
      console.error("Error rejecting edit:", err);
      alert(t("moderation.errorRejectEdit"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text">
      <div className="max-w-6xl mx-auto">
        
        {isCheckingAuth ? (
          <div className="py-32 flex flex-col items-center justify-center text-muted">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-6" />
            <p className="text-sm font-black uppercase tracking-[0.2em]">{t("moderation.verifying")}</p>
          </div>
        ) : !isModerator ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-4">{t("moderation.restricted")}</h2>
            <p className="text-muted max-w-md mx-auto mb-8 line-height-loose">
              {t("moderation.restrictedDesc")}
            </p>
            <Link 
              href="/login"
              className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-all shadow-editorial"
            >
              {t("moderation.loginButton")}
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                  <BookOpen size={12} />
                  {t("moderation.headerTag")}
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
                  {t("moderation.title")} <span className="text-primary italic font-light">{t("moderation.titleHighlight")}</span>
                </h1>
                <p className="mt-4 text-muted font-light max-w-xl">
                  {t("moderation.subtitle")}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-medium text-muted bg-surface border border-border px-5 py-3 rounded-2xl">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                {t("moderation.pendingElements").replace("{count}", (books.length + edits.length).toString())}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
              <button 
                onClick={() => setActiveTab('books')}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all whitespace-nowrap ${activeTab === 'books' ? 'bg-primary text-white shadow-lg' : 'bg-surface border border-border text-muted hover:text-white hover:bg-white/5'}`}
              >
                <BookOpen size={16} />
                {t("moderation.tabBooks")} {books.length > 0 && `(${books.length})`}
              </button>
              <button 
                onClick={() => setActiveTab('edits')}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all whitespace-nowrap ${activeTab === 'edits' ? 'bg-primary text-white shadow-lg' : 'bg-surface border border-border text-muted hover:text-white hover:bg-white/5'}`}
              >
                <Edit3 size={16} />
                {t("moderation.tabEdits")} {edits.length > 0 && `(${edits.length})`}
              </button>
            </div>

            {/* Content Body */}
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-muted">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">{t("moderation.syncing")}</p>
              </div>
            ) : activeTab === 'books' ? (
              // TAB: NUEVOS LIBROS
              books.length === 0 ? (
                <div className="bg-surface border border-border rounded-3xl p-16 text-center shadow-soft">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                    <Inbox className="w-8 h-8 text-muted" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-2">{t("moderation.emptyBooksTitle")}</h3>
                  <p className="text-muted max-w-md mx-auto">
                    {t("moderation.emptyBooksDesc")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {books.map((book) => (
                    <div 
                      key={book.id} 
                      className="bg-surface rounded-3xl border border-border overflow-hidden shadow-soft flex flex-col lg:flex-row group transition-all duration-300 hover:border-primary/30"
                    >
                      <div className="relative w-full lg:w-72 h-64 lg:h-auto bg-background flex-shrink-0 overflow-hidden">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />
                        <div className="absolute top-4 left-4 lg:hidden">
                          <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 text-white">
                            {getCategoryTranslation(book.category, t)}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="hidden lg:inline-block px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-wider text-primary border border-primary/20 mb-3">
                              {getCategoryTranslation(book.category, t)}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-serif font-bold group-hover:text-primary transition-colors">
                              {book.title}
                            </h3>
                            <div className="text-xs text-muted mt-2 flex items-center gap-2">
                              <span>{t("moderation.bookPreTitle")}</span>
                              <span>•</span>
                              <span>{t("moderation.bookId").replace("{id}", book.id)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-grow mt-4 border border-border/50 bg-background/50 rounded-xl p-4">
                          <div 
                            className="text-muted leading-relaxed font-serif text-sm line-clamp-4 lg:line-clamp-3 prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 prose-a:text-primary"
                            dangerouslySetInnerHTML={{
                              __html: (book.synopsis || (Array.isArray(book.content) ? book.content[0] : book.content)).replace(/\n/g, '<br />')
                            }}
                          />
                        </div>
                        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-4">
                          <button
                            onClick={() => openPreview(book)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all font-black text-xs uppercase tracking-widest text-primary sm:mr-auto"
                          >
                            <Maximize2 size={16} /> {t("moderation.readBook")}
                          </button>
                          <button
                            onClick={() => handleRejectBook(book.id)}
                            disabled={processingId !== null}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed text-muted"
                          >
                            <X size={16} /> {t("moderation.rejectBook")}
                          </button>
                          <button
                            onClick={() => handleApproveBook(book)}
                            disabled={processingId !== null}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-white text-black hover:bg-primary hover:text-white transition-all shadow-editorial font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                          >
                            {processingId === book.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> {t("moderation.processing")}</>
                            ) : (
                              <><Check size={16} /> {t("moderation.approveBook")}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // TAB: EDICIONES PROPUESTAS
              edits.length === 0 ? (
                <div className="bg-surface border border-border rounded-3xl p-16 text-center shadow-soft">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                    <Inbox className="w-8 h-8 text-muted" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-2">{t("moderation.emptyEditsTitle")}</h3>
                  <p className="text-muted max-w-md mx-auto">
                    {t("moderation.emptyEditsDesc")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {edits.map((edit) => (
                    <div 
                      key={edit.id} 
                      className="bg-surface rounded-3xl border border-border overflow-hidden shadow-soft flex flex-col lg:flex-row group transition-all duration-300 hover:border-primary/30"
                    >
                      <div className="relative w-full lg:w-48 h-48 lg:h-auto bg-background flex-shrink-0 overflow-hidden">
                        <img 
                          src={edit.proposedCoverUrl} 
                          alt={edit.proposedTitle}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                           <span className="text-[10px] font-black uppercase text-white tracking-widest bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">Edición</span>
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="hidden lg:inline-block px-3 py-1 bg-cyan-500/10 rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-400 border border-cyan-500/20 mb-3">
                              {getCategoryTranslation(edit.proposedCategory, t)}
                            </span>
                            <h3 className="text-2xl font-serif font-bold group-hover:text-cyan-400 transition-colors">
                              {edit.proposedTitle}
                            </h3>
                            <div className="text-xs text-muted mt-2 flex items-center gap-2">
                              <span>{t("moderation.editPreTitle")}<strong className="text-text">{edit.authorName}</strong></span>
                              <span>•</span>
                              <Link href={`/book/${edit.bookId}`} target="_blank" className="flex items-center gap-1 hover:text-primary transition-colors">
                                {t("moderation.viewOriginal")} <ExternalLink size={12}/>
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="flex-grow mt-4 bg-background p-4 rounded-xl border border-border/50">
                          <div 
                            className="text-muted leading-relaxed font-serif text-sm line-clamp-4 prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 prose-a:text-cyan-400"
                            dangerouslySetInnerHTML={{
                              __html: (edit.proposedSynopsis || (Array.isArray(edit.proposedContent) ? edit.proposedContent[0] : edit.proposedContent)).replace(/\n/g, '<br />')
                            }}
                          />
                        </div>
                        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-4">
                          <button
                            onClick={() => openPreview(edit)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all font-black text-xs uppercase tracking-widest text-cyan-400 sm:mr-auto"
                          >
                            <Maximize2 size={16} /> {t("moderation.inspectEdit")}
                          </button>
                          <button
                            onClick={() => handleRejectEdit(edit.id)}
                            disabled={processingId !== null}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed text-muted"
                          >
                            <X size={16} /> {t("moderation.rejectEdit")}
                          </button>
                          <button
                            onClick={() => handleApproveEdit(edit)}
                            disabled={processingId !== null}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-editorial font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === edit.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> {t("moderation.processing")}</>
                            ) : (
                              <><Check size={16} /> {t("moderation.approveEdit")}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal 
            item={previewItem} 
            currentPage={previewPage}
            setPage={setPreviewPage}
            onClose={closePreview} 
            onApprove={() => {
              if ('proposedTitle' in previewItem) handleApproveEdit(previewItem as ProposedEdit);
              else handleApproveBook(previewItem as PendingBook);
              closePreview();
            }}
            onReject={() => {
              if ('proposedTitle' in previewItem) handleRejectEdit((previewItem as ProposedEdit).id);
              else handleRejectBook((previewItem as PendingBook).id);
              closePreview();
            }}
            processingId={processingId}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// Sub-componente para limpiar la estructura del Modal
function PreviewModal({ item, currentPage, setPage, onClose, onApprove, onReject, processingId }: any) {
  const { t } = useI18n();

  const isEdit = 'proposedTitle' in item;
  const title = isEdit ? item.proposedTitle : item.title;
  const author = isEdit ? item.authorName : (item.authorName || 'Usuario Anónimo');
  const c = isEdit ? item.proposedContent : item.content;
  const synopsis = isEdit ? item.proposedSynopsis : item.synopsis;
  const arrContent = Array.isArray(c) ? c : [c];
  
  const themeColor = isEdit ? "text-cyan-400" : "text-primary";
  const themeBorder = isEdit ? "border-cyan-500/20" : "border-primary/20";
  const themeBg = isEdit ? "bg-cyan-500/10" : "bg-primary/10";
  const themeHover = isEdit ? "hover:bg-cyan-500 hover:text-black hover:border-transparent" : "hover:bg-primary hover:text-white hover:border-transparent";
  const btnColor = isEdit ? "bg-cyan-500 text-black shadow-editorial" : "bg-white text-black hover:bg-primary hover:text-white shadow-editorial";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-5xl h-[90vh] bg-background border border-border/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/50 bg-surface/50 flex justify-between items-center z-10">
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${themeColor} mb-1`}>
              {isEdit ? t("moderation.modalEditTag") : t("moderation.modalBookTag")}
            </span>
            <h3 className="text-xl font-serif font-bold text-white line-clamp-1">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center hover:bg-white/10 transition-colors text-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-grow overflow-y-auto px-6 py-10 sm:px-12 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          
          {/* Cover & Synopsis for complete context */}
          <div className="max-w-3xl mx-auto mb-16 px-4">
             <div className="text-center mb-10">
               <span className="text-muted text-xs uppercase tracking-widest font-black block mb-4">
                 {t("moderation.authorLabel")} <span className="text-white">{author}</span>
               </span>
               {synopsis && (
                 <p className="text-lg md:text-xl font-serif font-light leading-relaxed text-neutral-300 italic">
                   "{synopsis}"
                 </p>
               )}
             </div>

             {/* Content Area */}
             <div className="relative min-h-[40vh]">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={currentPage}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   transition={{ duration: 0.3 }}
                   className={`prose prose-invert prose-lg md:prose-xl mx-auto prose-p:font-serif prose-p:leading-loose prose-p:text-neutral-300 prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-a:${themeColor}`}
                 >
                   <div 
                     dangerouslySetInnerHTML={{
                       __html: arrContent[currentPage].replace(/\n/g, '<br />')
                     }}
                   />
                 </motion.div>
               </AnimatePresence>
             </div>
          </div>
        </div>

        {/* Modal Footer Toolbar */}
        <div className="px-6 py-4 border-t border-border/50 bg-surface/80 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPage(currentPage > 0 ? currentPage - 1 : 0)}
              disabled={currentPage === 0}
              className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-muted"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-serif text-sm tracking-widest text-muted">
              {t("moderation.pageXofY").replace("{current}", (currentPage + 1).toString()).replace("{total}", arrContent.length.toString())}
            </span>
            <button 
              onClick={() => setPage(currentPage < arrContent.length - 1 ? currentPage + 1 : currentPage)}
              disabled={currentPage === arrContent.length - 1}
              className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-muted"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onReject}
              disabled={processingId !== null}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 text-muted"
            >
              <X size={14} /> {t("moderation.modalReject")}
            </button>
            <button
              onClick={onApprove}
              disabled={processingId !== null}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 ${btnColor}`}
            >
              {processingId === item.id ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t("moderation.processing")}</>
              ) : (
                <><Check size={14} /> {isEdit ? t("moderation.modalApproveEdit") : t("moderation.modalApproveBook")}</>
              )}
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
