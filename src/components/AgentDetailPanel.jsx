import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import SafeIcon from '../common/SafeIcon';
import Badge from './ui/Badge';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiCpu, FiUser, FiActivity, FiGlobe, FiClock, FiStar, FiDatabase, FiTrash2, FiFileText } = FiIcons;

const AgentDetailPanel = function() {
  const selectedAgent = useAgentViewStore(state => state.selectedAgent);
  const setSelectedAgent = useAgentViewStore(state => state.setSelectedAgent);
  const decommissionNode = useAgentViewStore(state => state.decommissionNode);
  const initiateContractGeneration = useAgentViewStore(state => state.initiateContractGeneration);

  const handleDecommission = () => {
    if (window.confirm(`Are you sure you want to purge ${selectedAgent.identity_profile.display_name} from the ecosystem?`)) {
      decommissionNode(selectedAgent.agent_id);
    }
  };

  const classificationType = selectedAgent?.identity_profile?.classification_type || 'UNKNOWN';
  const isAI = classificationType === 'AI_AGENT';
  const isHuman = classificationType === 'HUMAN_1099' || classificationType === 'HUMAN';
  const costLabel = isAI ? 'Compute Cost / Task' : (isHuman ? 'Hourly Rate' : 'Rate');
  const formattedRate = selectedAgent?.ecosystem_context?.associated_billing_rate_cents
    ? `${(selectedAgent.ecosystem_context.associated_billing_rate_cents / 100).toFixed(2)}`
    : '$0.00';


  // Node Metrics
  const successRate = selectedAgent?.operational_capability?.success_rate ?? selectedAgent?.ecosystem_context?.success_rate;
  const contextWindow = selectedAgent?.operational_capability?.context_window_utilization ?? selectedAgent?.ecosystem_context?.context_window_utilization;
  const hasMetrics = successRate !== undefined && contextWindow !== undefined;

  // Defensive error boundary
  const isMalformed = !selectedAgent?.identity_profile || !selectedAgent?.operational_capability || !selectedAgent?.ecosystem_context;

  if (selectedAgent && isMalformed) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedAgent(null)}
          className="fixed inset-0 bg-void/40 backdrop-blur-[2px] z-40"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-void border-l-2 border-axim-teal-500 shadow-2xl z-50 flex flex-col p-8 items-center justify-center text-center"
        >
          <div className="text-rose-400 mb-4 text-4xl">
            <SafeIcon icon={FiIcons.FiAlertTriangle} />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Unknown Entity</h2>
          <p className="text-sm text-slate-400 mb-6">The payload for this entity is malformed or missing critical ecosystem context.</p>
          <button
            onClick={() => setSelectedAgent(null)}
            className="px-6 py-2 bg-axim-teal-600 hover:bg-axim-teal-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Close Panel
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {selectedAgent && !isMalformed && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setSelectedAgent(null)}
            className="fixed inset-0 bg-void/40 backdrop-blur-[2px] z-40"
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-void border-l border-slate-700 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-void/50">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg border ${isAI ? 'bg-axim-teal-500/10 text-axim-teal-400 border-axim-teal-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
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
              <div className="bg-void border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Current Status</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedAgent.operational_capability?.current_status === 'IDLE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-semibold text-slate-200">
                      {(selectedAgent.operational_capability?.current_status || "UNKNOWN").replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Assigned Vector</div>
                  <div className="text-xs font-mono text-axim-teal-400">
                    {selectedAgent.operational_capability.assigned_job_id || 'NONE'}
                  </div>
                </div>
              </div>

              {/* Classification Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiDatabase} className="text-axim-teal-400" /> Ecosystem Classification
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-void border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Tier</div>
                    <Badge variant={selectedAgent.identity_profile.engagement_tier === 'INTERNAL' ? 'axim-teal' : 'rose'}>
                      {selectedAgent.identity_profile.engagement_tier}
                    </Badge>
                  </div>
                  <div className="bg-void border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Origin</div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 break-all">
                      <SafeIcon icon={FiGlobe} className="text-slate-500" /> {selectedAgent.ecosystem_context.ingest_origin}
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-void border border-slate-800 p-3 rounded-lg flex justify-between items-center">
                    <div className="text-[10px] font-bold uppercase text-slate-500">{costLabel}</div>
                    <div className="text-sm text-slate-300 font-mono">{formattedRate}</div>
                </div>
              </div>


              {/* Contract & Compensation */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiFileText} className="text-axim-teal-400" /> Contract & Compensation
                </h3>
                <div className="bg-void border border-slate-800 p-4 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-bold uppercase text-slate-500">{costLabel}</div>
                    <div className="text-sm text-slate-300 font-mono">${formattedRate}</div>
                  </div>
                  <button

                    onClick={initiateContractGeneration} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-axim-teal-500/10 text-axim-teal-400 border border-axim-teal-500/20 rounded-xl text-sm font-bold hover:bg-axim-teal-500/20 transition-colors"
                  >
                    <SafeIcon icon={FiFileText} />
                    Generate Smart Contract
                  </button>
                </div>
              </div>

              {/* Verified Capabilities */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiActivity} className="text-emerald-400" /> Verified Capabilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedAgent.operational_capability?.skills || []).map(skill => (
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
                  {!hasMetrics ? (
                    <div className="flex items-center justify-center py-4 text-axim-teal-400 animate-pulse text-sm font-mono border border-dashed border-axim-teal-500/30 rounded-xl bg-axim-teal-500/5">
                      Telemetry Calibrating...
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-400">Task Resolution Success Rate</span>
                          <span className="text-emerald-400 font-mono">{successRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-void rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${successRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-400">Context Window Utilization</span>
                          <span className="text-axim-teal-400 font-mono">{contextWindow}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-void rounded-full overflow-hidden">
                          <div className="h-full bg-axim-teal-500" style={{ width: `${contextWindow}%` }} />
                        </div>
                      </div>
                    </>
                  )}
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
export default React.memo(AgentDetailPanel);
