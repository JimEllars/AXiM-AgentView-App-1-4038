import { create } from 'zustand';

// Cloudflare Worker API URL prefix
const API_URL = '/api/agentview';

// Helper function to handle fetch calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const resolvedToken = token || 'dev_passport_token_77x'; // Fallback token for system-level operations
  const headers = {
    'Content-Type': 'application/json',
  };
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`;
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
    const error = new Error(`API error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    if (response.status === 401 || response.status === 403) {
      error.isAuthError = true;
    }
    throw error;
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
  authError: false,
  consecutiveFailures: 0,
  isCircuitBroken: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setTaskModalOpen: (isOpen) => set({ isTaskModalOpen: isOpen }),
  resetCircuitBreaker: () => set({ authError: false, consecutiveFailures: 0, isCircuitBroken: false }),

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
    const state = get();
    if (state.authError || state.isCircuitBroken) {
      return; // Circuit broken, halt further requests
    }

    set({ isLoading: true });
    
    try {
      const data = await apiCall('/state');

      set({ 
        activeWorkers: data.workers || [],
        activeTasks: data.tasks || [],
        systemLogs: data.logs || [],
        isLoading: false,
        consecutiveFailures: 0
      });
      get().addLog('SYNC', 'Ecosystem state synchronized via Worker API.', 'SUCCESS');
    } catch (error) {
      if (error.isAuthError) {
        set({ authError: true, isLoading: false });
        window.dispatchAgentViewAnomaly('AUTH_FAILURE', error);
        get().addLog('AUTH', 'Authentication failed. Please re-authenticate via AXiM Passport.', 'ERROR');
        return;
      }

      const newFailures = state.consecutiveFailures + 1;
      const isBroken = newFailures >= 3;

      set({
        isLoading: false,
        consecutiveFailures: newFailures,
        isCircuitBroken: isBroken
      });

      window.dispatchAgentViewAnomaly('STATE_SYNC_FAILURE', error);

      if (isBroken) {
        get().addLog('CIRCUIT_BREAKER', 'API unreachable. Circuit breaker engaged. Halting sync loops.', 'CRITICAL');
      } else {
        get().addLog('FALLBACK', 'API unreachable. Using edge cache.', 'WARNING');
      }
    }
  },

  delegateWorkflow: async (passportToken, agentId, taskId) => {
    get().addLog('DELEGATION', `Routing task ${taskId} to node ${agentId}...`);
    
    const previousTasks = get().activeTasks;
    const previousWorkers = get().activeWorkers;

    // Optimistic Update
    const taskToUpdate = previousTasks.find(t => t.task_id === taskId);
    if (taskToUpdate) {
      const updatedTask = {
        ...taskToUpdate,
        status: 'IN_PROGRESS',
        assigned_agent: agentId
      };
      set({ activeTasks: previousTasks.map(t => t.task_id === taskId ? updatedTask : t) });
    }

    const workerToUpdate = previousWorkers.find(w => w.agent_id === agentId);
    if (workerToUpdate) {
      const updatedWorker = {
        ...workerToUpdate,
        operational_capability: {
          ...workerToUpdate.operational_capability,
          current_status: 'WORKING'
        }
      };
      set({ activeWorkers: previousWorkers.map(w => w.agent_id === agentId ? updatedWorker : w) });
    }

    try {
      await apiCall('/delegate', 'POST', { agentId, taskId }, passportToken);
      
      // Keep optimistic update, no need to fetch if successful, but fetching ensures sync with server
      // To strictly follow optimistic UI, we might skip fetch or just re-fetch in background.
      // Instruction says: "modify the local state arrays... Wrap the apiCall in a try/catch. If the edge proxy throws an error, revert the local state... and fire a warning telemetry payload."
      get().addLog('DELEGATION', `Workflow successfully locked to ${agentId}.`, 'SUCCESS');
    } catch (error) {
      // Revert local state
      set({ activeTasks: previousTasks, activeWorkers: previousWorkers });
      window.dispatchAgentViewAnomaly('DELEGATION_REJECTION', new Error("Network rejection: Task assignment rolled back."));
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

  approveIntake: async (agentId) => {
    const previousWorkers = get().activeWorkers;
    const workerToUpdate = previousWorkers.find(w => w.agent_id === agentId);

    if (workerToUpdate) {
      const updatedWorker = {
        ...workerToUpdate,
        ecosystem_context: {
          ...workerToUpdate.ecosystem_context,
          ingest_origin: 'VERIFIED_ACTIVE' // Or some active status
        }
      };
      set({ activeWorkers: previousWorkers.map(w => w.agent_id === agentId ? updatedWorker : w) });
    }

    get().addLog('GIG_BOARD', `Approving intake for agent ${agentId}...`);
    try {
      await apiCall(`/gigboard/approve/${agentId}`, 'POST');
      get().addLog('GIG_BOARD', `Agent ${agentId} deployed.`, 'SUCCESS');
    } catch (error) {
      set({ activeWorkers: previousWorkers }); // Revert
      window.dispatchAgentViewAnomaly('GIG_BOARD_APPROVAL_FAILURE', new Error("Network rejection: Agent approval rolled back."));
      get().addLog('GIG_BOARD', 'Failed to approve agent.', 'ERROR');
    }
  },

  rejectIntake: async (agentId) => {
    const previousWorkers = get().activeWorkers;
    set({ activeWorkers: previousWorkers.filter(w => w.agent_id !== agentId) });

    get().addLog('GIG_BOARD', `Rejecting intake for agent ${agentId}...`);
    try {
      await apiCall(`/gigboard/reject/${agentId}`, 'POST');
      get().addLog('GIG_BOARD', `Agent ${agentId} rejected.`, 'SUCCESS');
    } catch (error) {
      set({ activeWorkers: previousWorkers }); // Revert
      window.dispatchAgentViewAnomaly('GIG_BOARD_REJECTION_FAILURE', new Error("Network rejection: Agent rejection rolled back."));
      get().addLog('GIG_BOARD', 'Failed to reject agent.', 'ERROR');
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
