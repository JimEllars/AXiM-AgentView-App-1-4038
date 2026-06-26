import { create } from 'zustand';
import { MOCK_WORKERS, MOCK_TASKS } from '../mockData';
import { agentService } from '../services/agentService';
import { taskService } from '../services/taskService';
import { logService } from '../services/logService';

export const useAgentViewStore = create((set, get) => ({
  activeWorkers: [],
  activeTasks: [],
  systemLogs: [],
  isLoading: false,
  searchQuery: '',
  selectedAgent: null,
  isTaskModalOpen: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setTaskModalOpen: (isOpen) => set({ isTaskModalOpen: isOpen }),

  addLog: async (type, message, severity = 'INFO') => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      severity
    };
    
    set(state => ({ systemLogs: [newLog, ...state.systemLogs].slice(0, 50) }));
    
    try {
      await logService.add(newLog);
    } catch (e) {
      console.error('Failed to persist log to Sheets', e);
    }
  },

  fetchEcosystemState: async () => {
    set({ isLoading: true });
    
    try {
      const existingWorkers = await agentService.getAll();
      if (existingWorkers.length === 0) {
        get().addLog('BOOT', 'Initializing ecosystem with seed data...');
        for (const worker of MOCK_WORKERS) {
          await agentService.create(worker);
        }
        for (const task of MOCK_TASKS) {
          await taskService.create(task);
        }
      }

      const [workers, tasks, logs] = await Promise.all([
        agentService.getAll(),
        taskService.getAll(),
        logService.getAll()
      ]);

      set({ 
        activeWorkers: workers, 
        activeTasks: tasks,
        systemLogs: logs,
        isLoading: false 
      });
      get().addLog('SYNC', 'Ecosystem state synchronized with Sheets.', 'SUCCESS');
    } catch (error) {
      set({ isLoading: false });
      window.dispatchAgentViewAnomaly('STATE_SYNC_FAILURE', error);
      get().addLog('FALLBACK', 'Database unreachable. Using edge cache.', 'WARNING');
    }
  },

  delegateWorkflow: async (passportToken, agentId, taskId) => {
    get().addLog('DELEGATION', `Routing task ${taskId} to node ${agentId}...`);
    
    try {
      await Promise.all([
        taskService.updateStatus(taskId, 'IN_PROGRESS', agentId),
        agentService.updateStatus(agentId, 'ACTIVE_UTILIZATION', taskId)
      ]);
      
      await get().fetchEcosystemState();
      get().addLog('DELEGATION', `Workflow successfully locked to ${agentId}.`, 'SUCCESS');
    } catch (error) {
      window.dispatchAgentViewAnomaly('DELEGATION_REJECTION', error);
      get().addLog('DELEGATION', 'Failed to update remote state.', 'ERROR');
    }
  },

  completeTask: async (taskId) => {
    const task = get().activeTasks.find(t => t.task_id === taskId);
    if (!task) return;
    
    get().addLog('RESOLUTION', `Finalizing task vector ${taskId}...`);
    
    try {
      const agentId = task.assigned_agent;
      await Promise.all([
        taskService.updateStatus(taskId, 'COMPLETED'),
        agentId ? agentService.updateStatus(agentId, 'IDLE', null) : Promise.resolve()
      ]);
      
      await get().fetchEcosystemState();
      get().addLog('RESOLUTION', `Task ${taskId} resolved. Resource ${agentId || 'N/A'} released.`, 'SUCCESS');
    } catch (error) {
      window.dispatchAgentViewAnomaly('TASK_RESOLUTION_FAILURE', error);
      get().addLog('RESOLUTION', 'Failed to close task vector.', 'ERROR');
    }
  },

  decommissionNode: async (agentId) => {
    get().addLog('DECOMMISSION', `Initiating purge of node ${agentId}...`);
    
    try {
      const agent = get().activeWorkers.find(w => w.agent_id === agentId);
      if (agent?.operational_capability.assigned_job_id) {
        await taskService.updateStatus(agent.operational_capability.assigned_job_id, 'UNASSIGNED', null);
      }
      
      await agentService.delete(agentId);
      await get().fetchEcosystemState();
      set({ selectedAgent: null });
      get().addLog('DECOMMISSION', `Node ${agentId} successfully purged from ecosystem.`, 'SUCCESS');
    } catch (error) {
      window.dispatchAgentViewAnomaly('DECOMMISSION_FAILURE', error);
      get().addLog('DECOMMISSION', 'Purge protocol failed.', 'ERROR');
    }
  },

  removeTask: async (taskId) => {
    get().addLog('CLEANUP', `Removing task vector ${taskId}...`);
    try {
      const task = get().activeTasks.find(t => t.task_id === taskId);
      if (task?.assigned_agent) {
        await agentService.updateStatus(task.assigned_agent, 'IDLE', null);
      }
      await taskService.delete(taskId);
      await get().fetchEcosystemState();
    } catch (error) {
      window.dispatchAgentViewAnomaly('TASK_REMOVAL_FAILURE', error);
    }
  },

  createTaskVector: async (passportToken, taskData) => {
    get().addLog('INJECTION', `Pushing new task vector to ecosystem...`);
    
    try {
      await taskService.create({
        ...taskData,
        required_skills: taskData.skills,
        status: 'UNASSIGNED'
      });
      
      await get().fetchEcosystemState();
      set({ isTaskModalOpen: false });
      get().addLog('INJECTION', `Task vector successfully injected.`, 'SUCCESS');
    } catch (error) {
      window.dispatchAgentViewAnomaly('TASK_INJECTION_FAILURE', error);
      get().addLog('INJECTION', 'Injection protocol failed.', 'ERROR');
    }
  }
}));