import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import SafeIcon from '../common/SafeIcon';
import Badge from './ui/Badge';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiCpu, FiUser, FiActivity, FiGlobe, FiClock, FiStar, FiDatabase, FiTrash2 } = FiIcons;

export default function AgentDetailPanel() {
  const { selectedAgent, setSelectedAgent, decommissionNode } = useAgentViewStore();

  const handleDecommission = () => {
    if (window.confirm(`Are you sure you want to purge ${selectedAgent.identity_profile.display_name} from the ecosystem?`)) {
      decommissionNode(selectedAgent.agent_id);
    }
  };

  const isAI = selectedAgent?.identity_profile.classification_type === 'AI_AGENT';
  const costLabel = isAI ? 'Compute Cost / Task' : 'Hourly Rate';
  const formattedRate = selectedAgent?.ecosystem_context.associated_billing_rate_cents
    ? `$${(selectedAgent.ecosystem_context.associated_billing_rate_cents / 100).toFixed(2)}`
    : '$0.00';

  return (
    <AnimatePresence>
      {selectedAgent && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setSelectedAgent(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40"
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg border ${isAI ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  <SafeIcon icon={isAI ? FiCpu : FiUser} className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 leading-tight">
                    {selectedAgent.identity_profile.display_name}
                  </h2>
                  <div className="text-xs text-slate-500 font-mono">
                    {selectedAgent.agent_id}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-8">
              {/* Status Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Current Status</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedAgent.operational_capability.current_status === 'IDLE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-semibold text-slate-200">
                      {selectedAgent.operational_capability.current_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Assigned Vector</div>
                  <div className="text-xs font-mono text-indigo-400">
                    {selectedAgent.operational_capability.assigned_job_id || 'NONE'}
                  </div>
                </div>
              </div>

              {/* Classification Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiDatabase} className="text-indigo-400" /> Ecosystem Classification
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Tier</div>
                    <Badge variant={selectedAgent.identity_profile.engagement_tier === 'INTERNAL' ? 'indigo' : 'rose'}>
                      {selectedAgent.identity_profile.engagement_tier}
                    </Badge>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Origin</div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 break-all">
                      <SafeIcon icon={FiGlobe} className="text-slate-500" /> {selectedAgent.ecosystem_context.ingest_origin}
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-slate-900 border border-slate-800 p-3 rounded-lg flex justify-between items-center">
                    <div className="text-[10px] font-bold uppercase text-slate-500">{costLabel}</div>
                    <div className="text-sm text-slate-300 font-mono">{formattedRate}</div>
                </div>
              </div>

              {/* Verified Capabilities */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiActivity} className="text-emerald-400" /> Verified Capabilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.operational_capability.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700 font-mono shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiStar} className="text-amber-400" /> Node Performance Index
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Task Resolution Success Rate</span>
                      <span className="text-emerald-400 font-mono">99.4%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[99.4%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Context Window Utilization</span>
                      <span className="text-indigo-400 font-mono">42.1%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[42.1%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dangerous Actions */}
              <div className="pt-8 border-t border-slate-800">
                <button 
                  onClick={handleDecommission}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-sm font-bold transition-all"
                >
                  <SafeIcon icon={FiTrash2} />
                  Decommission Node
                </button>
                <p className="text-[10px] text-slate-600 mt-2 text-center uppercase tracking-widest font-bold">
                  Warning: This action is irreversible
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
