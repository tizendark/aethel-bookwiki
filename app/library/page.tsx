"use client";

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query as firestoreQuery } from 'firebase/firestore';
import BookCard from '@/components/BookCard';
import { BookOpen, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useI18n, getCategoryTranslation } from '@/contexts/I18nContext';

interface Book {
  id: string;
  title: string;
  author?: string;
  category: string;
  synopsis?: string;
  content: string | string[];
  coverUrl: string;
  createdAt: any;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All'); // New state for active category
  const { t } = useI18n();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = firestoreQuery(collection(db, "books"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const loadedBooks: Book[] = [];
        querySnapshot.forEach((doc) => {
          loadedBooks.push({ id: doc.id, ...doc.data() } as Book);
        });
        setBooks(loadedBooks);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Auto-focus logic based on URL param
  useEffect(() => {
    if (searchParams.get('search') === 'focus' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchParams, isLoading]);

  // Derived state for filtering
  const filteredBooks = books.filter((book) => {
    const queryLower = searchQuery.toLowerCase();
    const titleMatch = book.title.toLowerCase().includes(queryLower);
    const authorMatch = (book.author || 'Anonymous Author').toLowerCase().includes(queryLower);
    const categoryMatch = book.category.toLowerCase().includes(queryLower);
    
    const categoryFilter = activeCategory === 'All' || book.category === activeCategory;

    return (titleMatch || authorMatch || categoryMatch) && categoryFilter;
  });

  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-12 font-sans antialiased text-text">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              <BookOpen size={12} />
              {t("library.headerTag")}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight">
              {t("library.title")} <span className="text-primary italic font-light">{t("library.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-xl text-muted font-serif max-w-2xl leading-relaxed">
              {t("library.subtitle")}
            </p>
          </div>
          
          <div className="flex md:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("library.searchPlaceholder")}
              className="block w-full pl-12 pr-4 py-4 rounded-full border border-border bg-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none shadow-soft text-text placeholder-muted/50"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-16">
          {["All", "Ficción", "Ciencia Ficción", "Filosofía", "Biología Sintética"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? "bg-primary text-white shadow-editorial" 
                  : "bg-surface border border-border text-muted hover:text-white"
              }`}
            >
              {cat === "All" ? t("library.allCategories") : getCategoryTranslation(cat, t)}
            </button>
          ))}
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 w-full">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-4">
                <div className="aspect-[3/4] bg-surface rounded-2xl w-full border border-border" />
                <div className="h-4 bg-surface rounded w-1/4 mt-2" />
                <div className="h-8 bg-surface rounded w-3/4" />
                <div className="h-16 bg-surface rounded w-full" />
                <div className="h-4 bg-surface rounded w-1/3 mt-2" />
              </div>
            ))
          ) : filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard 
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author || 'Usuario Anónimo'}
                category={book.category}
                description={book.synopsis || (Array.isArray(book.content) ? book.content[0] : book.content)}
                cover={book.coverUrl}
              />
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-surface border border-border rounded-3xl mt-8">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-2xl font-serif font-semibold mb-2">{t("library.emptyTitle")}</h3>
              <p className="text-muted text-lg max-w-md mx-auto">
                {t("library.emptyDesc").replace("{query}", searchQuery)}
              </p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
