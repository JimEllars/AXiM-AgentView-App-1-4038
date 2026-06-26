import React, { useMemo } from 'react';
import { useAgentViewStore } from '../store/useAgentViewStore';
import WorkerCard from './WorkerCard';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiExternalLink, FiDownloadCloud } = FiIcons;

export default function ExternalResources() {
  const { activeWorkers, searchQuery } = useAgentViewStore();
  
  const externalResources = useMemo(() => {
    let resources = activeWorkers.filter(w => w.identity_profile.engagement_tier === 'EXTERNAL');
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      resources = resources.filter(w => 
        w.identity_profile.display_name.toLowerCase().includes(lowerQ) ||
        w.agent_id.toLowerCase().includes(lowerQ)
      );
    }
    return resources;
  }, [activeWorkers, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <SafeIcon icon={FiDownloadCloud} className="text-indigo-400" />
            Gig Board Ingestion
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            External 1099 contractors ingested via AXiM Gig Board Scraper protocols.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors">
          <SafeIcon icon={FiExternalLink} />
          Launch Gig Board
        </button>
      </div>

      {searchQuery && (
        <div className="text-sm text-slate-400 font-mono">
          Filtering ingestions by: <span className="text-indigo-400">"{searchQuery}"</span>
        </div>
      )}

      {externalResources.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
          <SafeIcon icon={FiDownloadCloud} className="text-4xl text-slate-700 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium">No External Ingestions</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
            {searchQuery 
              ? "No external resources match your search query."
              : "The Gig Board scraper has not detected any new applicants matching current system requirements."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {externalResources.map(w => <WorkerCard key={w.agent_id} worker={w} />)}
        </div>
      )}
    </div>
  );
}