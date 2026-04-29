"use client";

import Navbar from '@/components/Navbar';
import { useState } from 'react';
import { Save, Eye, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookEditor() {
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <Link href="/books/1" className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-semibold">Propose Changes</h1>
              <p className="text-xs text-muted font-bold uppercase tracking-widest">The Architecture of Biological Systems</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border border-border hover:bg-black/5 transition-all"
            >
              {isPreview ? <><Info size={14} /> Edit Mode</> : <><Eye size={14} /> Preview</>}
            </button>
            <button className="flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-accent text-white hover:bg-accent/90 transition-all shadow-soft">
              <Save size={14} />
              Submit Proposal
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            {!isPreview ? (
              <textarea 
                className="w-full h-[600px] p-12 rounded-2xl bg-white border border-border shadow-soft focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none font-mono text-sm leading-relaxed"
                placeholder="Start writing your proposal in Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="w-full min-h-[600px] p-12 rounded-2xl bg-white border border-border shadow-soft prose prose-editorial max-w-none">
                {content || "Nothing to preview yet."}
              </div>
            )}
          </div>
          
          <aside className="lg:col-span-4 space-y-8">
            <div className="p-8 bg-accent/5 rounded-2xl border border-accent/10">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                <Info size={14} />
                Curation Guidelines
              </h3>
              <ul className="space-y-4 text-sm text-muted leading-relaxed">
                <li>• Ensure all scientific claims are cited.</li>
                <li>• Maintain the editorial tone of the book.</li>
                <li>• Changes will be reviewed by the lead curator.</li>
                <li>• Avoid breaking the existing structure.</li>
              </ul>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-border shadow-soft">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4">Change Summary</h3>
              <textarea 
                className="w-full h-32 p-4 rounded-xl bg-background border border-border text-sm outline-none focus:border-accent transition-colors"
                placeholder="Briefly describe what you changed and why..."
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
