import React from 'react';
import { useAgentViewStore } from '../store/useAgentViewStore';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiTerminal, FiInfo, FiAlertCircle, FiCheckCircle, FiDownload } = FiIcons;

const severityConfig = {
  INFO: { color: 'text-slate-400', icon: FiInfo },
  SUCCESS: { color: 'text-emerald-400', icon: FiCheckCircle },
  WARNING: { color: 'text-amber-400', icon: FiAlertCircle },
  ERROR: { color: 'text-rose-400', icon: FiAlertCircle },
};

export default function LogsFeed() {
  const { systemLogs } = useAgentViewStore();

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(systemLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadAnchorNode.setAttribute("download", `axim_session_ledger_${timestamp}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800 w-80">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-widest">
          <SafeIcon icon={FiTerminal} className="text-indigo-400" />
          System Ledger
        </h2>
        <button
          onClick={handleDownload}
          title="Download Ledger"
          className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors rounded hover:bg-indigo-500/10"
        >
          <SafeIcon icon={FiDownload} className="text-lg" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {systemLogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-slate-600 font-mono italic">No events recorded in current node session.</p>
          </div>
        )}
        {systemLogs.map(log => {
          const config = severityConfig[log.severity] || severityConfig.INFO;
          return (
            <div key={log.id} className="space-y-1 group">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={`${config.color} font-bold`}>[{log.type}]</span>
                <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed border-l border-slate-800 pl-3 group-hover:border-indigo-500/50 transition-colors">
                {log.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
