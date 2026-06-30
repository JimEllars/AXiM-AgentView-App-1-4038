import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import Badge from './ui/Badge';
import { motion } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import * as FiIcons from 'react-icons/fi';

const { FiCpu, FiUser, FiGlobe } = FiIcons;

const WorkerCard = function({ worker }) {
  const isMalformed = !worker || !worker.identity_profile || !worker.operational_capability || !worker.ecosystem_context;
  const setSelectedAgent = useAgentViewStore(state => state.setSelectedAgent);

    const [activeCostCents, setActiveCostCents] = useState(0);

  useEffect(() => {
    let intervalId;
    if (worker?.operational_capability?.current_status === 'WORKING') {
      const ratePerSecond = (worker?.ecosystem_context?.associated_billing_rate_cents || 0) / 3600;
      intervalId = setInterval(() => {
        setActiveCostCents(prev => prev + ratePerSecond);
      }, 1000);
    } else {
      setActiveCostCents(0);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [worker?.operational_capability?.current_status, worker?.ecosystem_context?.associated_billing_rate_cents]);

  if (isMalformed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-void border border-rose-500/50 rounded-xl p-4 transition-all group"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg border bg-rose-500/10 text-rose-400 border-rose-500/20">
              <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-400">Unknown Entity</h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{worker?.agent_id || 'UNKNOWN_ID'}</div>
            </div>
          </div>
          <Badge variant="rose">MALFORMED</Badge>
        </div>
        <div className="text-sm text-slate-400 text-center py-2">
          This payload is missing critical data.
        </div>
      </motion.div>
    );
  }

  const { identity_profile, operational_capability, ecosystem_context } = worker;




  
  const classificationType = identity_profile?.classification_type || 'UNKNOWN';
  const isAI = classificationType === 'AI_AGENT';
  const isHuman = classificationType === 'HUMAN_1099' || classificationType === 'HUMAN';
  const isIdle = operational_capability?.current_status === 'IDLE';
  
  const costLabel = isAI ? 'Compute Cost / Task' : (isHuman ? 'Hourly Rate' : 'Rate');
  const formattedRate = ecosystem_context?.associated_billing_rate_cents
    ? `${(ecosystem_context.associated_billing_rate_cents / 100).toFixed(2)}`
    : '$0.00';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => setSelectedAgent(worker)}
      className="bg-void border border-slate-800 rounded-xl p-4 hover:border-axim-teal-500/50 hover:shadow-lg hover:shadow-axim-teal-500/10 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border transition-colors ${isAI ? 'bg-axim-teal-500/10 text-axim-teal-400 border-axim-teal-500/20 group-hover:border-axim-teal-500/50' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50'}`}>
            <SafeIcon icon={isAI ? FiCpu : FiUser} className="text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 group-hover:text-axim-teal-300 transition-colors">{identity_profile.display_name}</h3>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{worker.agent_id}</div>
          </div>
        </div>
        <Badge variant={isAI ? 'axim-teal' : 'emerald'}>
          {classificationType}
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">Capabilities</div>
        <div className="flex flex-wrap gap-1.5">
          {(operational_capability?.skills || []).map(skill => (
            <span key={skill} className="px-2 py-1 rounded text-[11px] bg-void text-slate-300 border border-slate-800">
              {skill}
            </span>
          ))}
        </div>
                {operational_capability?.current_status === 'WORKING' && (
          <div className="mt-2 text-axim-teal-400 font-mono text-[10px] animate-pulse bg-axim-teal-500/10 p-1.5 rounded w-fit">
            [ACTIVE COMPUTE: ${(activeCostCents / 100).toFixed(2)}]
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-slate-800/50 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shadow-sm ${!isIdle ? 'bg-amber-400 shadow-amber-500/50' : 'bg-emerald-400 shadow-emerald-500/50'}`} />
          <span className="text-slate-400 text-xs font-medium">{(operational_capability?.current_status || "UNKNOWN").replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-slate-500 text-[11px] flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider">{costLabel}</span>
            <span className="font-mono text-slate-300">{formattedRate}</span>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 font-mono">
            <SafeIcon icon={FiGlobe} className="text-slate-600" /> {(ecosystem_context?.ingest_origin || "UNKNOWN").replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.worker === nextProps.worker ||
    JSON.stringify(prevProps.worker) === JSON.stringify(nextProps.worker)
  );
};
export default React.memo(WorkerCard, areEqual);
