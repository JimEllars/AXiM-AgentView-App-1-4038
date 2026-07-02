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
    if (response.status === 400) {
      error.isBadRequest = true;
    }
    error.status = response.status;
    if (response.status === 401 || response.status === 403) {
      error.isAuthError = true;
    }
    if (response.status === 400) {
      window.dispatchAgentViewAnomaly('SECURITY_ANOMALY', error);
      // We will let the catch block log it or we can log it here if we use useAgentViewStore.getState().addLog
      useAgentViewStore.getState().addLog('CRITICAL', 'Edge validation rejected payload. Potential data corruption or tampering detected.', 'CRITICAL');
    }
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const useAgentViewStore = create((set, get) => ({
  activeWorkers: [],
  activeTasks: [],
  activeContracts: [],
  systemLogs: [],
  isLoading: false,
  searchQuery: '',
  selectedAgent: null,
  isTaskModalOpen: false,
  isContractModalOpen: false,
  isPayrollModalOpen: false,
  authError: false,
  consecutiveFailures: 0,
  isCircuitBroken: false,
  wsInstance: null,
  wsReconnectAttempts: 0,
  wsPingInterval: null,


    settlePayroll: async (agentId) => {
    get().addLog('PAYROLL', 'Initiating ledger settlement for node...', 'INFO');

    const previousContracts = get().activeContracts;
    const previousWorkers = get().activeWorkers;

    // Optimistic Update: Remove active contract and set worker to IDLE
    const updatedContracts = previousContracts.filter(c => c.agent_id !== agentId || c.status !== 'ACTIVE');

    const workerToUpdate = previousWorkers.find(w => w.agent_id === agentId);
    let updatedWorkers = previousWorkers;
    if (workerToUpdate) {
      const updatedWorker = {
        ...workerToUpdate,
        operational_capability: {
          ...workerToUpdate.operational_capability,
          current_status: 'IDLE',
          session_start_time: null
        }
      };
      updatedWorkers = previousWorkers.map(w => w.agent_id === agentId ? updatedWorker : w);
    }

    set({
      activeContracts: updatedContracts,
      activeWorkers: updatedWorkers,
      isPayrollModalOpen: false
    });

    try {
      await apiCall('/payroll/settle', 'POST', { agentId });
      get().addLog('PAYROLL', 'Ledger closed and payment queued.', 'SUCCESS');
    } catch (error) {
      set({ activeContracts: previousContracts, activeWorkers: previousWorkers });
      window.dispatchAgentViewAnomaly('PAYROLL_SETTLEMENT_FAILURE', new Error("Network rejection: Payroll settlement rolled back."));
      get().addLog('PAYROLL', 'Failed to settle payroll.', 'ERROR');
    }
  },

  setContractModalOpen: (isOpen) => set({ isContractModalOpen: isOpen }),
  setPayrollModalOpen: (isOpen) => set({ isPayrollModalOpen: isOpen }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setTaskModalOpen: (isOpen) => set({ isTaskModalOpen: isOpen }),
  resetCircuitBreaker: () => {
    set({ authError: false, consecutiveFailures: 0, isCircuitBroken: false, wsReconnectAttempts: 0 });
    get().connectEcosystemStream();
  },

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


    connectEcosystemStream: () => {
    const state = get();
    if (state.isCircuitBroken) return;

    if (state.wsInstance && (state.wsInstance.readyState === WebSocket.OPEN || state.wsInstance.readyState === WebSocket.CONNECTING)) {
      return; // Prevent duplicate connections
    }

    // Close existing connection if any
    if (state.wsInstance) {
      state.wsInstance.close();
    }

    // Append user token for edge authorization
    const passportToken = 'dev_passport_token_77x';
    const ws = new WebSocket(`wss://api.axim.us.com/v1/stream?token=${passportToken}`);

    ws.onopen = () => {
      // Clear any existing zombie intervals just in case
      if (state.wsPingInterval) {
        clearInterval(state.wsPingInterval);
      }

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30000);

      set({ wsPingInterval: pingInterval });
      const isReconnect = state.wsReconnectAttempts > 0;
      set({ wsReconnectAttempts: 0, wsInstance: ws });

      if (isReconnect) {
        get().addLog('WS_SYNC', 'Socket re-established. State reconciled.', 'INFO');
        get().fetchEcosystemState();
      } else {
        get().addLog('WS_SYNC', 'Edge proxy stream connected.', 'SUCCESS');
      }
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        if (type === 'TASK_STATUS_CHANGED') {
          set((state) => ({
            activeTasks: state.activeTasks.map(t => t.task_id === payload.taskId ? { ...t, status: payload.status } : t)
          }));
        } else if (type === 'WORKER_STATUS_CHANGED') {
          set((state) => ({
            activeWorkers: state.activeWorkers.map(w => w.agent_id === payload.agentId ? {
              ...w,
              operational_capability: { ...w.operational_capability, current_status: payload.status }
            } : w)
          }));
        } else if (type === 'CONTRACT_ACTIVATED') {
          set((state) => ({
            activeContracts: state.activeContracts.map(c => c.contract_id === payload.contractId ? { ...c, status: 'ACTIVE' } : c)
          }));
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      get().handleWsDisconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      const state = get();
      if (state.wsPingInterval) {
        clearInterval(state.wsPingInterval);
        set({ wsPingInterval: null });
      }
      // Let onclose handle reconnect logic
    };

    set({ wsInstance: ws });
  },

  handleWsDisconnect: () => {
    const state = get();
    if (state.wsPingInterval) {
      clearInterval(state.wsPingInterval);
      set({ wsPingInterval: null });
    }
    if (state.wsReconnectTimeout) {
      clearTimeout(state.wsReconnectTimeout);
      set({ wsReconnectTimeout: null });
    }
    if (state.isCircuitBroken) return;

    const attempts = state.wsReconnectAttempts;
    if (attempts >= 3) {
      set({ isCircuitBroken: true });
      get().addLog('CIRCUIT_BREAKER', 'WebSocket unreachable. Circuit breaker engaged. Halting sync loops.', 'CRITICAL');
      window.dispatchAgentViewAnomaly('CRITICAL', new Error('WebSocket connection dropped permanently.'));
    } else {
      const delay = Math.pow(2, attempts) * 1000;
      set({ wsReconnectAttempts: attempts + 1 });
      get().addLog('WS_RECONNECT', `WebSocket disconnected. Reconnecting in ${delay}ms...`, 'WARNING');
      const timeoutId = setTimeout(() => {
        get().connectEcosystemStream();
      }, delay);
      set({ wsReconnectTimeout: timeoutId });
    }
  },

  disconnectEcosystemStream: () => {
    const state = get();
    if (state.presenceInterval) {
      clearInterval(state.presenceInterval);
      set({ presenceInterval: null });
    }
    if (state.wsPingInterval) {
      clearInterval(state.wsPingInterval);
      set({ wsPingInterval: null });
    }
    if (state.wsReconnectTimeout) {
      clearTimeout(state.wsReconnectTimeout);
      set({ wsReconnectTimeout: null });
    }
    if (state.wsInstance) {
      // Temporarily remove onclose to prevent reconnect logic from firing when intentionally pausing
      state.wsInstance.onclose = null;
      state.wsInstance.close();
      set({ wsInstance: null });
    }
  },


  syncPresenceState: async () => {
    if (get().isCircuitBroken || document.hidden) return;
    try {
      const response = await fetch('/api/agentview/presence', {
        headers: { 'Authorization': 'Bearer dev_passport_token_77x' }
      });
      if (!response.ok) return;
      const presenceMap = await response.json();

      set(state => {
        const updatedWorkers = state.activeWorkers.map(worker => ({
          ...worker,
          presence_state: presenceMap[worker.agent_id] || 'OFFLINE'
        }));
        return { activeWorkers: updatedWorkers };
      });
    } catch (error) {
      console.error("Failed to sync presence state", error);
    }
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
      get().syncPresenceState();

      if (!get().presenceInterval) {
        const intervalId = setInterval(() => {
          get().syncPresenceState();
        }, 30000);
        set({ presenceInterval: intervalId });
      }

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
    if (!agentId || typeof agentId !== 'string' || !taskId || typeof taskId !== 'string') {
      const error = new Error("Malformed payload: agentId and taskId must be valid strings.");
      window.dispatchAgentViewAnomaly('WARNING', error);
      return;
    }

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
          current_status: 'WORKING',
          session_start_time: Date.now()
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
    if (!taskId || typeof taskId !== 'string') {
      const error = new Error("Malformed payload: taskId must be a valid string.");
      window.dispatchAgentViewAnomaly('VALIDATION_FAILURE', error);
      return;
    }

    const previousTasks = get().activeTasks;
    const taskToUpdate = previousTasks.find(t => t.task_id === taskId);
    if (!taskToUpdate) return;
    
    get().addLog('RESOLUTION', `Finalizing task vector ${taskId}...`);
    
    // Optimistic Update
    const updatedTask = {
      ...taskToUpdate,
      status: 'COMPLETED'
    };
    set({ activeTasks: previousTasks.map(t => t.task_id === taskId ? updatedTask : t) });

    try {
      await apiCall('/tasks/complete', 'POST', { taskId });
      
      const agentId = taskToUpdate.assigned_agent;
      // Depending on if we want to fetch the whole state to clear it out, let's keep it to sync
      await get().fetchEcosystemState();
      get().addLog('RESOLUTION', `Task ${taskId} resolved. Resource ${agentId || 'N/A'} released.`, 'SUCCESS');
    } catch (error) {
      // Revert local state
      set({ activeTasks: previousTasks });
      window.dispatchAgentViewAnomaly('TASK_RESOLUTION_FAILURE', new Error("Network rejection: Task resolution rolled back."));
      get().addLog('RESOLUTION', 'Failed to close task vector.', 'ERROR');
    }
  },

  decommissionNode: async (agentId) => {
    if (!agentId || typeof agentId !== 'string') {
      const error = new Error("Malformed payload: agentId must be a valid string.");
      window.dispatchAgentViewAnomaly('VALIDATION_FAILURE', error);
      return;
    }

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
    if (!taskId || typeof taskId !== 'string') {
      const error = new Error("Malformed payload: taskId must be a valid string.");
      window.dispatchAgentViewAnomaly('VALIDATION_FAILURE', error);
      return;
    }

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
  },


  generateSmartContract: async (agentId, scope, compensation) => {
    get().addLog('FINANCE', `Initiating smart contract generation for node ${agentId}...`, 'INFO');

    try {
      const response = await fetch('/api/v1/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev_passport_token_77x'
        },
        body: JSON.stringify({ agentId, scope, compensation })
      });

      if (!response.ok) {
        const error = new Error('Contract generation failed');
        if (response.status === 400) {
          window.dispatchAgentViewAnomaly('SECURITY_ANOMALY', error);
          get().addLog('CRITICAL', 'Edge validation rejected payload. Potential data corruption or tampering detected.', 'CRITICAL');
        }
        throw error;
      }

      const contractData = await response.json();

      set(state => ({
        activeContracts: [...state.activeContracts, contractData],
        isContractModalOpen: false
      }));

      get().addLog('FINANCE', 'Smart Contract securely deployed.', 'SUCCESS');
      // alert('Smart Contract securely deployed.');
    } catch (error) {
      window.dispatchAgentViewAnomaly('CONTRACT_FAILURE', error);
      get().addLog('FINANCE', 'Failed to deploy smart contract.', 'ERROR');
    }
  },

  initiateContractGeneration: () => {
    get().addLog('FINANCE', 'Smart Contract generation module initialized.', 'INFO');
    alert('Smart Contract Module offline for edge synchronization.');
    set({ isContractModalOpen: true });
  },

  activateContract: (contractId) => {
    get().addLog('FINANCE', `Initiating contract activation for ${contractId}...`, 'INFO');

    // Optimistic UI update
    set(state => ({
      activeContracts: state.activeContracts.map(c =>
        c.contract_id === contractId ? { ...c, status: 'ACTIVE' } : c
      )
    }));

    // Simulate network delay
    const timeoutId = setTimeout(() => {
      get().addLog('FINANCE', `Contract ${contractId} successfully activated.`, 'SUCCESS');
    }, 1000);
  }
}));
