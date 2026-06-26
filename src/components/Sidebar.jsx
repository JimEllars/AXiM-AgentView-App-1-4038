import React from 'react';
import SafeIcon from '../common/SafeIcon';
import { Link, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';

const { FiHexagon, FiGrid, FiUsers, FiBox, FiShield } = FiIcons;

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/external', label: 'External Resources', icon: FiUsers },
  { path: '/modules', label: 'Core Modules', icon: FiBox },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg tracking-wide">
          <SafeIcon icon={FiHexagon} className="text-2xl" />
          <span>AXiM AgentView</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Core Routing</div>
        
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              }`}
            >
              <SafeIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <SafeIcon icon={FiShield} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">Admin Node</div>
            <div className="text-[10px] text-emerald-400 font-mono">CONNECTION SECURE</div>
          </div>
        </div>
      </div>
    </div>
  );
}