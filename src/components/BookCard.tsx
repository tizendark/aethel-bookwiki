"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useI18n, getCategoryTranslation } from '@/contexts/I18nContext';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  description: string;
}

export default function BookCard({ id, title, author, category, cover, description }: BookCardProps) {
  const { t } = useI18n();
  
  return (
    <Link href={`/book/${id}`} className="block group">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="cursor-pointer"
      >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface mb-6 shadow-editorial">
        <img 
          src={cover} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary">{getCategoryTranslation(category, t)}</span>
          <div className="h-[1px] flex-1 bg-border" />
        </div>
        <h3 className="text-2xl font-serif font-semibold leading-tight group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-neutral-400 font-medium leading-relaxed line-clamp-2">
          {description}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 pt-2">
          By {author}
        </p>
      </div>
      </motion.div>
    </Link>
  );
}
