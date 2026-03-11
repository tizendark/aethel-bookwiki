"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Search, Menu, User, LogOut, ArrowLeft, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/contexts/I18nContext';

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter(); // Added useRouter
  const isHome = pathname === '/'; // Added isHome
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    import('@/lib/firebase').then(({ auth, db }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              setUser({
                name: firebaseUser.displayName || 'Author',
                role: userDoc.exists() ? userDoc.data().role : 'user'
              });
            } else {
              setUser(null);
            }
          });
          return () => unsubscribe();
        });
      });
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled || pathname !== '/' ? 'py-4 glass-nav bg-background/80' : 'py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Modified Back Navigation */}
          {!isHome && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all text-muted"
              title={t("navbar.back")} // Updated title
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105 duration-300 shadow-lg shadow-primary/20">
              <BookOpen size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase hidden sm:block">Aethel</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-[0.25em] font-bold text-neutral-400">
          <Link href="/library" className="hover:text-primary transition-colors">{t("navbar.explorer")}</Link>
          <Link href="/publish" className="hover:text-primary transition-colors">{t("navbar.publish")}</Link>
          <Link href="/manifesto" className="hover:text-primary transition-colors">{t("navbar.manifesto")}</Link>
          {user?.role === 'moderator' && (
            <Link href="/moderation" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {t("navbar.moderation")}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-[10px] font-black tracking-widest uppercase hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-full"
            title="Cambiar Idioma / Change Language"
          >
            {language === 'en' ? 'ES' : 'EN'}
          </button>
          <Link href="/library?search=focus" className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400">
            <Search size={20} />
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <Link
                href="/my-works"
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
                title={t("navbar.myWorks")}
              >
                <Bookmark size={18} />
              </Link>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{user.role}</p>
                <p className="text-xs font-medium">{user.name}</p>
              </div>
              <button 
                onClick={() => import('@/lib/firebase').then(({auth}) => import('firebase/auth').then(({signOut}) => signOut(auth)))}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:border-red-500/50 hover:text-red-400 transition-colors"
                title={t("navbar.signOut")}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-primary hover:text-white transition-all shadow-soft"
            >
              {t("navbar.signIn")}
            </Link>
          )}
          
          <button className="md:hidden p-2">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
}
