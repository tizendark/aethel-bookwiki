"use client";

import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

const USER_EDITIONS = [
  { id: '1', book: 'The Architecture of Biological Systems', status: 'pending', date: 'Oct 24, 2025' },
  { id: '2', book: 'Quantum Ethics', status: 'approved', date: 'Oct 20, 2025' },
  { id: '3', book: 'Urban Ecology', status: 'rejected', date: 'Oct 15, 2025' },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 px-8 max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl font-serif font-semibold mb-2">Your Dashboard</h1>
          <p className="text-muted text-sm font-medium">Manage your contributions and publications.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Total Contributions', value: '12', icon: FileText, color: 'text-accent' },
            { label: 'Approved Edits', value: '8', icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Pending Review', value: '3', icon: Clock, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-white rounded-2xl border border-border shadow-soft">
              <stat.icon className={`${stat.color} mb-4`} size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{stat.label}</p>
              <p className="text-3xl font-bold tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-8">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Book Title</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {USER_EDITIONS.map((edit) => (
                  <tr key={edit.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold">{edit.book}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        edit.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        edit.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {edit.status === 'pending' && <Clock size={10} />}
                        {edit.status === 'approved' && <CheckCircle size={10} />}
                        {edit.status === 'rejected' && <XCircle size={10} />}
                        {edit.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-muted font-medium">{edit.date}</td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
