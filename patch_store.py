import re

with open('src/store/useAgentViewStore.js', 'r') as f:
    content = f.read()

replacement = """  completeTask: async (taskId) => {
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
  },"""

pattern = r"  completeTask: async \(taskId\) => \{.*?\n  \},"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/store/useAgentViewStore.js', 'w') as f:
    f.write(content)
