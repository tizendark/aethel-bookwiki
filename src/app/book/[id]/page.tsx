"use client";

import { useEffect, useState } from "react";
import { authService, bookService } from "@/services";
import { Book } from "@/types";
import Link from "next/link";
import { BookOpen, Edit3, Loader2, ArrowLeft, ChevronLeft, ChevronRight, Trash2, Heart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, getCategoryTranslation } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";

export default function BookViewPage() {
  const { id } = useParams() as { id: string };
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Like states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  
  const { user, isModerator } = useAuth();
  
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setIsLoading(true);
        const data = await bookService.getBookById(id);
        setBook(data);
        
        if (data) {
          setLikesCount(data.likesCount || 0);
          if (user) {
            const liked = await bookService.hasUserLiked(id, user.uid);
            setIsLiked(liked);
          }
        }
      } catch (err) {
        console.error("Error fetching book:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-32 flex flex-col items-center justify-center text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-black uppercase tracking-[0.2em]">{t("book.loading")}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-muted" />
        </div>
        <h2 className="text-4xl font-serif font-bold mb-4">{t("book.notFoundTitle")}</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          {t("book.notFoundDesc")}
        </p>
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full hover:bg-surface transition-all text-xs font-black uppercase tracking-widest text-text"
        >
          <ArrowLeft size={16} /> {t("book.backToArchive")}
        </button>
      </div>
    );
  }

  const pages = book ? book.content : [];

  const nextSlide = () => {
    if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1);
  };

  const prevSlide = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleDelete = async () => {
    if (!window.confirm(t("book.deleteConfirm"))) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await bookService.deleteBook(book.id);
      router.push('/library');
    } catch (error) {
      console.error("Error al eliminar la obra:", error);
      alert(t("book.deleteError"));
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    const prevLiked = isLiked;
    const prevCount = likesCount;
    
    setIsLiked(!prevLiked);
    setLikesCount(prev => prevLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const serverLikedState = await bookService.toggleLike(book.id, user.uid);
      
      // Resync with server if optimistic update was wrong (rare)
      if (serverLikedState !== !prevLiked) {
         setIsLiked(serverLikedState);
         // En un entorno real, haríamos un fetch silencioso del contador exacto.
         // Por ahora, confiamos en la transacción del servidor para el eventual consistence.
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text selection:bg-primary/30 selection:text-white">
      <article className="max-w-4xl mx-auto">
        
        {/* Header/Hero Post */}
        <header className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <BookOpen size={12} />
            {getCategoryTranslation(book.category, t)}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter mb-8 leading-[1.1]">
            {book.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted font-medium uppercase tracking-widest pt-8 border-t border-border">
            <span>{t("book.writtenBy")}<strong className="text-white">{book.author || t("book.anonymous")}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span>{t("book.bookId").replace("{id}", book.id.slice(0, 8))}</span>
          </div>
        </header>

        {/* Cover Image Parallax-ish Wrapper */}
        <div className="relative w-full aspect-video md:aspect-[2.5/1] rounded-3xl overflow-hidden mb-16 shadow-editorial border border-white/5 group">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-80" />
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover object-center transform transition-transform duration-[2s] group-hover:scale-105"
          />
          
          {/* Floating Like Button on Cover */}
          <div className="absolute bottom-6 right-6 z-20">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-md border transition-all duration-300 shadow-soft
                ${isLiked 
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                  : 'bg-black/40 border-white/10 text-white hover:bg-black/60 hover:border-white/20'}`}
            >
              <motion.div
                 animate={{ scale: isLiked ? [1, 1.5, 1] : 1 }}
                 transition={{ duration: 0.3 }}
              >
                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
              </motion.div>
              <span className="text-sm font-bold tabular-nums tracking-wider">{likesCount}</span>
            </button>
          </div>
        </div>

        {/* Synopsis Area */}
        {book.synopsis && (
          <div className="max-w-2xl mx-auto mb-16 text-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6">{t("book.authorSynopsis")}</h3>
            <p className="text-xl md:text-2xl font-serif font-light leading-relaxed text-neutral-300 italic">
              "{book.synopsis}"
            </p>
          </div>
        )}

        {/* Editable Content Toolbar */}
        <div className="flex justify-between items-center mb-8 sticky top-24 z-20 bg-background/80 backdrop-blur-md py-4 border-y border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={prevSlide}
              disabled={currentPage === 0}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-surface hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-muted"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-serif text-sm tracking-widest text-muted">
              {t("book.pageXofY").replace("{current}", (currentPage + 1).toString()).replace("{total}", pages.length.toString())}
            </span>
            <button 
              onClick={nextSlide}
              disabled={currentPage === pages.length - 1}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-surface hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-muted"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex gap-3">
            {isModerator && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 sm:py-3 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-500 hover:text-white hover:border-transparent transition-all shadow-soft group"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} className="group-hover:text-white transition-colors" />}
                <span className="hidden sm:inline">{isDeleting ? t("book.deleting") : t("book.deleteWork")}</span>
              </button>
            )}

            <Link 
              href={`/book/${book.id}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2 sm:py-3 bg-surface border border-border rounded-full text-[10px] font-black uppercase tracking-wider text-text hover:bg-primary hover:text-white hover:border-transparent transition-all shadow-soft group"
            >
              <Edit3 size={14} className="text-muted group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">
                {isModerator ? t("book.edit") : t("book.proposeEdit")}
              </span>
              <span className="sm:hidden">{t("book.edit")}</span>
            </Link>
          </div>
        </div>

        {/* Content Body Pages (eBook Viewer) */}
        <div className="relative min-h-[50vh] overflow-hidden px-2 sm:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="prose prose-invert prose-lg md:prose-xl mx-auto prose-p:font-serif prose-p:leading-loose prose-p:text-neutral-300 prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80"
            >
              <div 
                dangerouslySetInnerHTML={{
                  // Convert newlines to <br/> but also allow existing HTML tags like <b>, <i>, <h2>
                  __html: (pages[currentPage] || "").replace(/\n/g, '<br />')
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

      </article>
    </div>
  );
}
