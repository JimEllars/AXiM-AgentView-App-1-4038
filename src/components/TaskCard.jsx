import React from 'react';
import SafeIcon from '../common/SafeIcon';
import Badge from './ui/Badge';
import { motion } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import * as FiIcons from 'react-icons/fi';

const { FiCheckCircle, FiTrash2, FiClock } = FiIcons;

export default function TaskCard({ task, workers }) {
  const delegateWorkflow = useAgentViewStore(state => state.delegateWorkflow);
  const completeTask = useAgentViewStore(state => state.completeTask);
  const removeTask = useAgentViewStore(state => state.removeTask);
  
  const isUnassigned = task.status === 'UNASSIGNED';
  const isInProgress = task.status === 'IN_PROGRESS';
  const isCompleted = task.status === 'COMPLETED';

  const handleAssign = (e) => {
    if (e.target.value) {
      delegateWorkflow('dev_passport_token_77x', e.target.value, task.task_id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900 border ${isCompleted ? 'border-emerald-500/20 opacity-75' : 'border-slate-800'} rounded-xl p-4 hover:border-slate-700 transition-colors group relative`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={`font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
            {task.title}
          </h3>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{task.task_id}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={task.priority === 'CRITICAL' ? 'rose' : task.priority === 'HIGH' ? 'amber' : 'slate'}>
            {task.priority}
          </Badge>
          <button 
            onClick={() => removeTask(task.task_id)}
            className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="text-sm" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {task.required_skills.map(skill => (
          <span key={skill} className="px-2 py-0.5 rounded text-[10px] bg-slate-800/50 text-slate-400 border border-slate-700/50 font-mono">
            req:{skill}
          </span>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center">
        <Badge variant={isUnassigned ? 'slate' : isCompleted ? 'emerald' : 'amber'}>
          {task.status.replace('_', ' ')}
        </Badge>
        
        {isUnassigned && !isCompleted && (
          <select 
            onChange={handleAssign}
            className="bg-slate-950 border border-indigo-500/30 text-indigo-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
          >
            <option value="">Assign Resource...</option>
            {workers.filter(w => w.operational_capability.current_status === 'IDLE').map(w => (
              <option key={w.agent_id} value={w.agent_id}>
                {w.identity_profile.display_name} ({w.identity_profile.classification_type})
              </option>
            ))}
          </select>
        )}

        {isInProgress && (
          <button 
            onClick={() => completeTask(task.task_id)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold transition-colors"
          >
            <SafeIcon icon={FiCheckCircle} />
            Resolve
          </button>
        )}

        {isCompleted && (
          <div className="text-xs flex items-center gap-2 text-slate-500 italic">
            <SafeIcon icon={FiCheckCircle} className="text-emerald-500" />
            Vector Resolved
          </div>
        )}

        {!isUnassigned && !isCompleted && !isInProgress && (
           <div className="text-xs flex items-center gap-2 text-slate-400 font-mono">
             <SafeIcon icon={FiClock} className="text-amber-500" />
             {task.assigned_agent}
           </div>
        )}
      </div>
    </motion.div>
  );
}