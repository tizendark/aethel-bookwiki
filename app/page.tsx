"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import BookCard from '@/components/BookCard';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  // author is currently optional or not strictly implemented in publish form, 
  // so we'll provide a fallback in the card if missing
  author?: string; 
  category: string;
  synopsis?: string;
  content: string | string[];
  coverUrl: string;
  createdAt: any;
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
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

  return (
    <main className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-10">
              <Sparkles size={12} />
              The Future of Knowledge
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.85] mb-12">
              Living <br />
              <span className="text-primary italic font-serif font-normal">Literature.</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 font-serif leading-relaxed max-w-2xl mb-12">
              Aethel is a curated sanctuary for evolving books. Open-source knowledge that grows, adapts, and breathes with human discovery.
            </p>
            
            <div className="flex flex-wrap items-center gap-8">
              <Link href="/library" className="bg-white text-black px-10 py-5 rounded-full font-black text-[10px] tracking-[0.2em] uppercase hover:bg-primary hover:text-white transition-all flex items-center gap-4 group shadow-editorial">
                Explore Library
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/manifesto" className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-white/10 pb-1 hover:border-primary transition-all">
                Our Manifesto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <h2 className="text-[11px] uppercase tracking-[0.5em] font-black text-primary mb-6">Curated Selection</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-semibold leading-tight">Current Editions</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-20 bg-border" />
            <Link href="/library" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">
              View Full Archive
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-4">
                <div className="aspect-[3/4] bg-surface rounded-2xl w-full border border-border" />
                <div className="h-4 bg-surface rounded w-1/4 mt-2" />
                <div className="h-8 bg-surface rounded w-3/4" />
                <div className="h-16 bg-surface rounded w-full" />
                <div className="h-4 bg-surface rounded w-1/3 mt-2" />
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
            {books.map((book) => (
              <BookCard 
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author || 'Usuario Anónimo'}
                category={book.category}
                description={book.synopsis || (Array.isArray(book.content) ? book.content[0] : book.content)}
                cover={book.coverUrl}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center w-full">
            <p className="text-muted text-lg font-serif">La biblioteca está temporalmente vacía o no hay libros aprobados aún.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <span className="text-lg font-bold tracking-tighter uppercase">Aethel</span>
          </div>
          
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
          
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
            © 2025 Aethel Platform.
          </p>
        </div>
      </footer>
    </main>
  );
}
