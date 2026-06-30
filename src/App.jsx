import ErrorBoundary from "./components/ErrorBoundary";
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExternalResources from './components/ExternalResources';
import CoreModules from './components/CoreModules';
import LogsFeed from './components/LogsFeed';
import TaskInjectModal from './components/TaskInjectModal';
import AgentDetailPanel from './components/AgentDetailPanel';
import ContractModal from './components/ContractModal';
import { useAgentViewStore } from './store/useAgentViewStore';
window.useAgentViewStore = useAgentViewStore;
import './utils/telemetry';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const fetchState = useAgentViewStore(state => state.fetchEcosystemState);
  const connectEcosystemStream = useAgentViewStore(state => state.connectEcosystemStream);
  const disconnectEcosystemStream = useAgentViewStore(state => state.disconnectEcosystemStream);
  const addLog = useAgentViewStore(state => state.addLog);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchState('dev_passport_token_77x');
    connectEcosystemStream('dev_passport_token_77x');

    const handleTelemetry = (e) => {
      const id = Date.now();
      const anomaly = e.detail;
      
      // Specifically catch validation failures to show the operator a warning overlay
      if (anomaly.event_payload.event_type === 'validation_failure' || anomaly.event_payload.event_type === 'validation_failure'.toLowerCase()) {
         // Keep existing flow, but ensure it pops up in alerts
         setAlerts(prev => [...prev, { id, ...anomaly }]);
         addLog('VALIDATION', anomaly.event_payload.error_message, 'WARNING');
      } else {
         setAlerts(prev => [...prev, { id, ...anomaly }]);
         addLog('ANOMALY', anomaly.event_payload.error_message, 'ERROR');
      }
      
      setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
    };

    window.addEventListener('axim-telemetry-fired', handleTelemetry);
    return () => {
      window.removeEventListener('axim-telemetry-fired', handleTelemetry);
      disconnectEcosystemStream();
    };
  }, [fetchState, addLog]);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-indigo-500/30">
        <Sidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Header />
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-auto p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/external" element={<ExternalResources />} />
                <Route path="/modules" element={<CoreModules />} />
              </Routes>
            </main>
            <LogsFeed />
          </div>
          
          <div className="fixed bottom-6 right-[340px] z-[60] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="bg-slate-900 border-l-4 border-rose-500 px-4 py-3 rounded shadow-2xl shadow-rose-900/40 w-80 backdrop-blur-md pointer-events-auto"
                >
                  <div className="font-bold text-xs text-slate-200 mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Onyx Swarm Alert
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded mt-2 border border-slate-800">
                    {alert.event_payload.error_message}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Overlays */}
      <TaskInjectModal />
      <ContractModal />
      <AgentDetailPanel />
    </BrowserRouter>
    </ErrorBoundary>
  );
}