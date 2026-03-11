"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { Loader2, BookOpen, AlertCircle, Bookmark, PenTool, ArrowRight, Library } from "lucide-react";
import { useI18n, getCategoryTranslation } from "@/contexts/I18nContext";

interface Book {
  id: string;
  title: string;
  category: string;
  synopsis?: string;
  coverUrl: string;
  author: string;
}

export default function MyWorksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [publishedBooks, setPublishedBooks] = useState<Book[]>([]);
  const [pendingBooks, setPendingBooks] = useState<Book[]>([]);
  const [localDraft, setLocalDraft] = useState<any | null>(null);
  const [localEditDrafts, setLocalEditDrafts] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
      if (currentUser) {
        fetchUserWorks(currentUser.uid);
      }
    });

    // Check for local draft regardless of auth state (though technically they need auth to publish)
    const savedDraft = localStorage.getItem("aethel_draft");
    if (savedDraft) {
      try {
        setLocalDraft(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Error parsing local draft");
      }
    }

    // Check for edit drafts
    const editDrafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("aethel_edit_draft_")) {
        try {
          const draftId = key.replace("aethel_edit_draft_", "");
          const draftData = JSON.parse(localStorage.getItem(key) || "{}");
          editDrafts.push({ ...draftData, bookId: draftId });
        } catch(e) {
          console.error("Error parsing edit draft");
        }
      }
    }
    setLocalEditDrafts(editDrafts);

    return () => unsubscribe();
  }, []);

  const fetchUserWorks = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch Published Books
      const pubQuery = query(collection(db, "books"), where("authorId", "==", userId));
      const pubSnap = await getDocs(pubQuery);
      const pubs: Book[] = [];
      pubSnap.forEach(doc => pubs.push({ id: doc.id, ...doc.data() } as Book));
      setPublishedBooks(pubs);

      // Fetch Pending Books (waiting for moderation)
      const penQuery = query(collection(db, "pending_books"), where("authorId", "==", userId));
      const penSnap = await getDocs(penQuery);
      const pens: Book[] = [];
      penSnap.forEach(doc => pens.push({ id: doc.id, ...doc.data() } as Book));
      setPendingBooks(pens);
    } catch (error) {
      console.error("Error fetching user works:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background py-32 flex flex-col items-center justify-center text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-black uppercase tracking-[0.2em]">{t("myWorks.syncing")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-8 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-3xl font-serif font-semibold mb-4 text-white">{t("myWorks.restrictedTitle")}</h2>
        <p className="text-muted leading-relaxed mb-10 max-w-sm mx-auto">
          {t("myWorks.restrictedDesc")}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-4 border border-border text-xs font-black uppercase tracking-[0.2em] rounded-full text-text hover:bg-white hover:text-black transition-all duration-300 shadow-editorial"
        >
          {t("myWorks.loginButton")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            <Bookmark size={12} />
            {t("myWorks.headerTag")}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-white mb-4">
            {t("myWorks.title")} <span className="text-primary italic font-light">{t("myWorks.titleHighlight")}</span>
          </h1>
          <p className="text-muted font-light max-w-xl">
            {t("myWorks.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em]">{t("myWorks.loadingCatalog")}</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Drafts Section */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-serif font-semibold text-white mb-6 border-b border-border/50 pb-4">
                <PenTool className="text-primary w-5 h-5" /> {t("myWorks.draftsTitle")}
              </h2>
              
              {!localDraft && pendingBooks.length === 0 && localEditDrafts.length === 0 ? (
                <div className="bg-surface/50 border border-border border-dashed rounded-3xl p-10 text-center">
                  <p className="text-muted text-sm">{t("myWorks.noDrafts")}</p>
                  <Link href="/publish" className="inline-flex items-center gap-2 mt-4 text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                    {t("myWorks.startWriting")} <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Local Draft */}
                  {localDraft && (
                    <div className="bg-surface rounded-2xl border border-primary/30 p-6 flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 block">{t("myWorks.localSaved")}</span>
                      <h3 className="text-2xl font-serif font-bold text-white mb-2 line-clamp-1">{localDraft.title || t("myWorks.untitled")}</h3>
                      <p className="text-sm text-muted line-clamp-2 mb-6 flex-grow">
                        {localDraft.synopsis || t("myWorks.noSynopsis")}
                      </p>
                      <Link href="/publish" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/20 text-primary hover:bg-primary hover:text-white text-xs font-black uppercase tracking-wider rounded-full transition-all w-fit">
                        {t("myWorks.continueWriting")} <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}

                  {/* Local Edit Drafts */}
                  {localEditDrafts.map(draft => (
                    <div key={draft.bookId} className="bg-surface rounded-2xl border border-cyan-500/30 p-6 flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3 block">{t("myWorks.localEditDraft")}</span>
                      <h3 className="text-2xl font-serif font-bold text-white mb-2 line-clamp-1">{draft.title || t("myWorks.editInProgress")}</h3>
                      <p className="text-sm text-muted line-clamp-2 mb-6 flex-grow">
                        {draft.synopsis || t("myWorks.pendingReview")}
                      </p>
                      <Link href={`/book/${draft.bookId}/edit`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white text-xs font-black uppercase tracking-wider rounded-full transition-all w-fit">
                        {t("myWorks.continueEdit")} <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}

                  {/* Pending Books */}
                  {pendingBooks.map(book => (
                    <div key={book.id} className="bg-surface rounded-2xl border border-border p-6 flex flex-col group">
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-3 block">{t("myWorks.inReview")}</span>
                      <h3 className="text-xl font-serif font-bold text-white mb-2 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-muted line-clamp-2 mb-6 flex-grow">
                        {book.synopsis || t("myWorks.noSynopsisAvailable")}
                      </p>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted border-t border-border/50 pt-4 mt-auto">
                        {t("myWorks.immutable")}
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </section>

            {/* Published Books Section */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-serif font-semibold text-white mb-6 border-b border-border/50 pb-4">
                <Library className="text-primary w-5 h-5" /> {t("myWorks.publishedTitle")}
              </h2>
              
              {publishedBooks.length === 0 ? (
                <div className="bg-surface/50 border border-border border-dashed rounded-3xl p-10 text-center">
                  <p className="text-muted text-sm line-height-relaxed" dangerouslySetInnerHTML={{ __html: t("myWorks.noPublished") }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {publishedBooks.map(book => (
                    <Link href={`/book/${book.id}`} key={book.id} className="group block">
                      <div className="relative aspect-[2/3] w-full bg-surface border border-border rounded-xl mb-4 overflow-hidden shadow-soft transition-all duration-500 group-hover:border-primary/50 group-hover:-translate-y-2 group-hover:shadow-editorial z-10">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                      </div>
                      <h3 className="text-lg font-serif font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted uppercase tracking-wider font-semibold mt-1">
                        {getCategoryTranslation(book.category, t)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
