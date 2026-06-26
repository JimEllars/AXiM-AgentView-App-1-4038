import React from 'react';
import SafeIcon from '../common/SafeIcon';
import { useAgentViewStore } from '../store/useAgentViewStore';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiRefreshCw, FiBell, FiPlus } = FiIcons;

export default function Header() {
  const fetchState = useAgentViewStore(state => state.fetchEcosystemState);
  const isLoading = useAgentViewStore(state => state.isLoading);
  const setTaskModalOpen = useAgentViewStore(state => state.setTaskModalOpen);
  const { searchQuery, setSearchQuery } = useAgentViewStore();

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query Ecosystem Entity..." 
            className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm w-96 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-900/20"
        >
          <SafeIcon icon={FiPlus} />
          Inject Task
        </button>
        <button 
          onClick={() => fetchState()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 transition-colors disabled:opacity-50"
        >
          <SafeIcon icon={FiRefreshCw} className={isLoading ? "animate-spin text-indigo-400" : "text-indigo-400"} />
          Sync Core
        </button>
        <div className="w-px h-6 bg-slate-800"></div>
        <button className="text-slate-400 hover:text-slate-200 relative">
          <SafeIcon icon={FiBell} className="text-xl" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-slate-950"></span>
        </button>
      </div>
    </header>
  );
}