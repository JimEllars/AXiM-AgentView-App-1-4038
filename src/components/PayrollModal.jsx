import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentViewStore } from '../store/useAgentViewStore';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiDollarSign } = FiIcons;

export default function PayrollModal() {
  const { isPayrollModalOpen, setPayrollModalOpen, selectedAgent } = useAgentViewStore();
  const modalRef = useRef(null);

  const handleClose = () => {
    setPayrollModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    if (isPayrollModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPayrollModalOpen, setPayrollModalOpen]);

  return (
    <AnimatePresence>
      {isPayrollModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleClose()}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            ref={modalRef}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-void border border-slate-700 shadow-2xl rounded-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-void/50">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <SafeIcon icon={FiDollarSign} className="text-axim-teal-400" />
                Settle Active Ledger
              </h2>
              <button
                onClick={() => handleClose()}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {!selectedAgent ? (
                <div className="text-rose-400 text-sm font-mono bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
                  CRITICAL: No agent context found. Cannot settle ledger without an explicit entity lock.
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4">
                  <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Entity Verification Lock</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Target Entity:</span>
                      <span className="text-sm font-bold text-slate-100">{selectedAgent.identity_profile?.display_name || 'UNKNOWN'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Agent ID:</span>
                      <span className="text-xs font-mono text-axim-teal-400">{selectedAgent.agent_id}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 mt-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="final_compute" className="text-sm font-medium text-slate-300">
                    Final Compute / Invoice Total
                  </label>
                  <input
                    type="text"
                    id="final_compute"
                    readOnly
                    value="$0.00"
                    className="w-full bg-void border border-slate-700 rounded-lg p-3 text-slate-400 cursor-not-allowed focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/50 mt-4">
                <button
                  type="button"
                  onClick={() => handleClose()}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled
                  className="px-4 py-2 text-sm font-bold bg-rose-500/50 text-void rounded-lg border border-rose-400/50 opacity-50 cursor-not-allowed transition-all"
                >
                  Confirm Settlement
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
