import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  slate: 'bg-slate-800 text-slate-300 border-slate-700'
};

export default function Badge({ children, variant = 'slate', className }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', variants[variant], className)}>
      {children}
    </span>
  );
}