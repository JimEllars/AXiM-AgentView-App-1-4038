import { create } from 'zustand';

// Cloudflare Worker API URL prefix
const API_URL = '/api/agentview';

// Helper function to handle fetch calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

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

  addLog: (type, message, severity = 'INFO') => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      severity
    };
    
    set(state => ({ systemLogs: [newLog, ...state.systemLogs].slice(0, 50) }));
    
    // We fire and forget the log to the worker endpoints
    apiCall('/logs', 'POST', newLog).catch(e => {
        console.error('Failed to persist log to worker', e);
    });
  },

  fetchEcosystemState: async () => {
    set({ isLoading: true });
    
    try {
      const data = await apiCall('/state');

      set({ 
        activeWorkers: data.workers || [],
        activeTasks: data.tasks || [],
        systemLogs: data.logs || [],
        isLoading: false 
      });
      get().addLog('SYNC', 'Ecosystem state synchronized via Worker API.', 'SUCCESS');
    } catch (error) {
      set({ isLoading: false });
      window.dispatchAgentViewAnomaly('STATE_SYNC_FAILURE', error);
      get().addLog('FALLBACK', 'API unreachable. Using edge cache.', 'WARNING');
    }
  },

  delegateWorkflow: async (passportToken, agentId, taskId) => {
    get().addLog('DELEGATION', `Routing task ${taskId} to node ${agentId}...`);
    
    try {
      await apiCall('/delegate', 'POST', { agentId, taskId }, passportToken);
      
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
      await apiCall('/tasks/complete', 'POST', { taskId });
      
      const agentId = task.assigned_agent;
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
      await apiCall(`/workers/${agentId}`, 'DELETE');
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
      await apiCall(`/tasks/${taskId}`, 'DELETE');
      await get().fetchEcosystemState();
    } catch (error) {
      window.dispatchAgentViewAnomaly('TASK_REMOVAL_FAILURE', error);
    }
  },

  createTaskVector: async (passportToken, taskData) => {
    get().addLog('INJECTION', `Pushing new task vector to ecosystem...`);
    
    try {
      await apiCall('/tasks', 'POST', taskData, passportToken);
      
      await get().fetchEcosystemState();
      set({ isTaskModalOpen: false });
      get().addLog('INJECTION', `Task vector successfully injected.`, 'SUCCESS');
    } catch (error) {
      window.dispatchAgentViewAnomaly('TASK_INJECTION_FAILURE', error);
      get().addLog('INJECTION', 'Injection protocol failed.', 'ERROR');
    }
  }
}));
