"use client";

import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ChevronRight, Edit3, Share2, Bookmark, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// Mock data for demonstration
const BOOK_DATA = {
  id: '1',
  title: 'The Architecture of Biological Systems',
  author: 'Dr. Elena Vance',
  category: 'Biology',
  content: `
    <h2>Introduction</h2>
    <p>The structural integrity of cellular life has long been a subject of fascination. As we move into an era of synthetic environments, understanding these foundations becomes paramount.</p>
    
    <h2>The Cellular Scaffold</h2>
    <p>At the heart of every biological entity lies a complex network of proteins and lipids that define its form and function. This scaffold is not merely a container but a dynamic participant in the life of the cell.</p>
    
    <h2>Synthetic Adaptations</h2>
    <p>When we introduce biological systems into non-native environments, the stress responses triggered can lead to remarkable evolutionary leaps. These adaptations are the blueprint for the next generation of bio-engineering.</p>

    <h2>Future Implications</h2>
    <p>The convergence of biology and architecture suggests a future where our buildings are grown rather than built, responding to their inhabitants in real-time.</p>
  `,
  toc: [
    { id: 'intro', title: 'Introduction' },
    { id: 'scaffold', title: 'The Cellular Scaffold' },
    { id: 'synthetic', title: 'Synthetic Adaptations' },
    { id: 'future', title: 'Future Implications' }
  ]
};

export default function ReadingMode() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto px-8 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Persistent Lateral TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-6">Table of Contents</h4>
                <nav className="space-y-4">
                  {BOOK_DATA.toc.map((item) => (
                    <a 
                      key={item.id} 
                      href={`#${item.id}`}
                      className="block text-sm font-medium text-muted hover:text-foreground transition-colors border-l-2 border-transparent hover:border-accent pl-4"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
              
              <div className="pt-8 border-t border-border">
                <Link 
                  href={`/editor/${BOOK_DATA.id}`}
                  className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                >
                  <Edit3 size={16} />
                  Propose Edition
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <article className="flex-1 max-w-3xl">
            <header className="mb-16">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6">
                <Link href="/library">Library</Link>
                <ChevronRight size={10} />
                <span>{BOOK_DATA.category}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-semibold leading-tight mb-8">
                {BOOK_DATA.title}
              </h1>
              <div className="flex items-center justify-between py-6 border-y border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    EV
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">{BOOK_DATA.author}</p>
                    <p className="text-[10px] text-muted uppercase tracking-widest">Lead Curator</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="p-2 hover:bg-accent/5 rounded-full text-muted hover:text-accent transition-colors">
                    <Bookmark size={20} />
                  </button>
                  <button className="p-2 hover:bg-accent/5 rounded-full text-muted hover:text-accent transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </header>

            <div 
              className="prose prose-editorial max-w-none"
              dangerouslySetInnerHTML={{ __html: BOOK_DATA.content }}
            />
            
            <footer className="mt-20 pt-10 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
                  <MessageSquare size={16} />
                  12 Comments
                </button>
                <span className="text-[10px] text-muted uppercase tracking-widest">Last updated 2 days ago</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        .prose-editorial h2 {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 600;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          color: #1A1A1A;
        }
        .prose-editorial p {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          line-height: 1.8;
          margin-bottom: 2rem;
          color: #374151;
        }
      `}</style>
    </main>
  );
}
