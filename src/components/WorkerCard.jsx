import React from 'react';
import SafeIcon from '../common/SafeIcon';
import Badge from './ui/Badge';
import { motion } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import * as FiIcons from 'react-icons/fi';

const { FiCpu, FiUser, FiGlobe } = FiIcons;

export default function WorkerCard({ worker }) {
  const { identity_profile, operational_capability, ecosystem_context } = worker;
  const setSelectedAgent = useAgentViewStore(state => state.setSelectedAgent);
  
  const isAI = identity_profile.classification_type === 'AI_AGENT';
  const isIdle = operational_capability.current_status === 'IDLE';
  
  const costLabel = isAI ? 'Compute Cost / Task' : 'Hourly Rate';
  const formattedRate = ecosystem_context.associated_billing_rate_cents
    ? `$${(ecosystem_context.associated_billing_rate_cents / 100).toFixed(2)}`
    : '$0.00';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => setSelectedAgent(worker)}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border transition-colors ${isAI ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/50' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50'}`}>
            <SafeIcon icon={isAI ? FiCpu : FiUser} className="text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{identity_profile.display_name}</h3>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{worker.agent_id}</div>
          </div>
        </div>
        <Badge variant={isAI ? 'indigo' : 'emerald'}>
          {identity_profile.classification_type}
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">Capabilities</div>
        <div className="flex flex-wrap gap-1.5">
          {operational_capability.skills.map(skill => (
            <span key={skill} className="px-2 py-1 rounded text-[11px] bg-slate-950 text-slate-300 border border-slate-800">
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-slate-800/50 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shadow-sm ${!isIdle ? 'bg-amber-400 shadow-amber-500/50' : 'bg-emerald-400 shadow-emerald-500/50'}`} />
          <span className="text-slate-400 text-xs font-medium">{operational_capability.current_status.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-slate-500 text-[11px] flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider">{costLabel}</span>
            <span className="font-mono text-slate-300">{formattedRate}</span>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 font-mono">
            <SafeIcon icon={FiGlobe} className="text-slate-600" /> {ecosystem_context.ingest_origin.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
