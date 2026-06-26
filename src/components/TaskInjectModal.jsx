import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiActivity, FiCheck } = FiIcons;

export default function TaskInjectModal() {
  const { isTaskModalOpen, setTaskModalOpen, createTaskVector } = useAgentViewStore();
  
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [skills, setSkills] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const skillArray = skills.split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean);
    
    try {
      await createTaskVector('dev_passport_token_77x', {
        title,
        priority,
        skills: skillArray.length > 0 ? skillArray : ['general_compute'],
        idempotency_key: crypto.randomUUID() // Attach cryptographic idempotency key
      });

      // Reset
      setTitle('');
      setPriority('MEDIUM');
      setSkills('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isTaskModalOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setTaskModalOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <SafeIcon icon={FiActivity} className="text-indigo-400" />
                Inject Task Vector
              </h2>
              <button 
                onClick={() => !isSubmitting && setTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                disabled={isSubmitting}
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vector Designation (Title)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Data Anomaly Resolution"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority Tier</label>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                    disabled={isSubmitting}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Req. Skills (CSV)</label>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="triage, python"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => !isSubmitting && setTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <SafeIcon icon={FiCheck} />
                  )}
                  {isSubmitting ? 'Injecting...' : 'Inject Vector'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
