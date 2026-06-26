import React, { useMemo } from 'react';
import { useAgentViewStore } from '../store/useAgentViewStore';
import WorkerCard from './WorkerCard';
import TaskCard from './TaskCard';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiLayers, FiClock, FiCpu, FiActivity, FiUserPlus } = FiIcons;

export default function Dashboard() {
  const { activeWorkers, activeTasks, isLoading, searchQuery } = useAgentViewStore();

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return activeWorkers;
    const lowerQ = searchQuery.toLowerCase();
    return activeWorkers.filter(w => 
      w.identity_profile.display_name.toLowerCase().includes(lowerQ) ||
      w.agent_id.toLowerCase().includes(lowerQ) ||
      w.operational_capability.skills.some(s => s.toLowerCase().includes(lowerQ))
    );
  }, [activeWorkers, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return activeTasks;
    const lowerQ = searchQuery.toLowerCase();
    return activeTasks.filter(t => 
      t.title.toLowerCase().includes(lowerQ) ||
      t.task_id.toLowerCase().includes(lowerQ) ||
      t.required_skills.some(s => s.toLowerCase().includes(lowerQ))
    );
  }, [activeTasks, searchQuery]);

  // Gig Board Intake List
  const pendingIntake = useMemo(() => {
    return activeWorkers.filter(w =>
      w.ecosystem_context.ingest_origin === 'GIG_BOARD_SCRAPER' ||
      w.ecosystem_context.ingest_origin === 'GIG_BOARD_APPLICANT'
    );
  }, [activeWorkers]);

  const verifiedWorkers = useMemo(() => {
    // Everything else that is not in pending intake
    return filteredWorkers.filter(w =>
      w.ecosystem_context.ingest_origin !== 'GIG_BOARD_SCRAPER' &&
      w.ecosystem_context.ingest_origin !== 'GIG_BOARD_APPLICANT'
    );
  }, [filteredWorkers]);

  if (isLoading && activeWorkers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-axim-teal-500"></div>
          <span className="font-mono text-sm tracking-widest uppercase">Syncing Core State...</span>
        </div>
      </div>
    );
  }

  const aiAgentsCount = activeWorkers.filter(w => w.identity_profile.classification_type === 'AI_AGENT').length;
  const idleCount = activeWorkers.filter(w => w.operational_capability.current_status === 'IDLE').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-void border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <SafeIcon icon={FiUsers} className="text-8xl" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Total Resources</div>
          <div className="text-3xl font-bold text-slate-100">{activeWorkers.length}</div>
          <div className="text-xs text-axim-teal-400 mt-2 font-mono flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-axim-teal-500"></div> {aiAgentsCount} AI Nodes Active
          </div>
        </div>
        <div className="bg-void border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <SafeIcon icon={FiLayers} className="text-8xl" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Active Tasks</div>
          <div className="text-3xl font-bold text-slate-100">{activeTasks.length}</div>
          <div className="text-xs text-emerald-400 mt-2 font-mono flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ecosystem Pipeline Live
          </div>
        </div>
        <div className="bg-void border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <SafeIcon icon={FiClock} className="text-8xl" />
          </div>
          <div className="text-slate-400 text-sm font-medium mb-1">Idle Capacity</div>
          <div className="text-3xl font-bold text-slate-100">{idleCount}</div>
          <div className="text-xs text-amber-400 mt-2 font-mono flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Awaiting Delegation
          </div>
        </div>
      </div>
      
      {/* Search Result Indicator */}
      {searchQuery && (
        <div className="text-sm text-slate-400 font-mono bg-void/50 p-3 rounded-lg border border-slate-800">
          Search results for: <span className="text-axim-teal-400">"{searchQuery}"</span>
          ({filteredWorkers.length} nodes, {filteredTasks.length} tasks)
        </div>
      )}

      {/* Intake Queue */}
      {pendingIntake.length > 0 && !searchQuery && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
               <SafeIcon icon={FiUserPlus} /> Intake / Pending Verification
             </h2>
             <span className="text-xs font-mono bg-amber-500/20 text-amber-400 px-2 py-1 rounded">{pendingIntake.length} Pending</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingIntake.map(w => (
                <div key={w.agent_id} className="relative group">
                  <WorkerCard worker={w} />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); alert('Mock: Approve/Deploy ' + w.agent_id); }}
                      className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-1.5 rounded-md text-xs font-bold transition-colors"
                      title="Approve / Deploy"
                    >
                      <SafeIcon icon={FiActivity} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); alert('Mock: Reject ' + w.agent_id); }}
                      className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 p-1.5 rounded-md text-xs font-bold transition-colors"
                      title="Reject"
                    >
                      <SafeIcon icon={FiClock} />
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
               <SafeIcon icon={FiCpu} className="text-axim-teal-400" /> Resource Matrix
             </h2>
           </div>
           <div className="space-y-3">
             {verifiedWorkers.length > 0 ? (
               verifiedWorkers.map(w => <WorkerCard key={w.agent_id} worker={w} />)
             ) : (
               <div className="text-slate-500 text-sm italic py-4 text-center border border-dashed border-slate-800 rounded-xl">No resources match query.</div>
             )}
           </div>
        </div>
        <div className="space-y-5">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
               <SafeIcon icon={FiActivity} className="text-emerald-400" /> Task Vectors
             </h2>
           </div>
           <div className="space-y-3">
             {filteredTasks.length > 0 ? (
               filteredTasks.map(t => <TaskCard key={t.task_id} task={t} workers={activeWorkers} />)
             ) : (
               <div className="text-slate-500 text-sm italic py-4 text-center border border-dashed border-slate-800 rounded-xl">No tasks match query.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
