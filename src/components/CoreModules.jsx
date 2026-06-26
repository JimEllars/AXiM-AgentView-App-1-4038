import React from 'react';
import SafeIcon from '../common/SafeIcon';
import Badge from './ui/Badge';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiCpu, FiZap, FiActivity } = FiIcons;

const modules = [
  { id: 'MOD_CORE_AUTH', name: 'Passport Identity Gateway', status: 'OPERATIONAL', health: 99.9, icon: FiShield },
  { id: 'MOD_TASK_ORCH', name: 'Swarm Task Orchestrator', status: 'DEGRADED', health: 84.2, icon: FiCpu },
  { id: 'MOD_EDGE_PROXY', name: 'Cloudflare Edge Plane', status: 'OPERATIONAL', health: 100, icon: FiZap },
  { id: 'MOD_TELEMETRY', name: 'Onyx Triage Engine', status: 'OPERATIONAL', health: 99.7, icon: FiActivity },
];

export default function CoreModules() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Core Infrastructure</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time health status of AXiM ecosystem micro-services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(mod => (
          <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400">
                  <SafeIcon icon={mod.icon} className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">{mod.name}</h3>
                  <code className="text-[10px] text-slate-500">{mod.id}</code>
                </div>
              </div>
              <Badge variant={mod.status === 'OPERATIONAL' ? 'emerald' : 'amber'}>
                {mod.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Node Health Index</span>
                <span className={mod.health > 90 ? 'text-emerald-400' : 'text-amber-400'}>{mod.health}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${mod.health > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${mod.health}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}