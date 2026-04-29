"use client";

import Navbar from '@/components/Navbar';
import { Check, X, ExternalLink, ShieldCheck } from 'lucide-react';

const PENDING_EDITIONS = [
  { id: '1', user: 'Marcus Thorne', book: 'Quantum Ethics', change: 'Added section on Decentralized Intelligence', date: '2h ago' },
  { id: '2', user: 'Sarah Jenkins', book: 'Urban Ecology', change: 'Updated statistics on vertical farming', date: '5h ago' },
];

export default function ModerationPanel() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 px-8 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Moderator Access</span>
            </div>
            <h1 className="text-4xl font-serif font-semibold">Moderation Queue</h1>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Pending Reviews</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {PENDING_EDITIONS.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-2xl border border-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-accent">{item.book}</span>
                  <span className="text-muted">•</span>
                  <span className="text-xs font-medium text-muted">{item.date}</span>
                </div>
                <h3 className="text-lg font-bold">{item.change}</h3>
                <p className="text-sm text-muted">Proposed by <span className="font-bold text-foreground">{item.user}</span></p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-border hover:bg-black/5 transition-all">
                  <ExternalLink size={14} />
                  Review
                </button>
                <button className="p-3 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
                <button className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                  <Check size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
