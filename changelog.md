### Micro-Increment 2 (Universal Validation & Contract Shell)

**Phase 1: Universal Hardening & UI Constraints**
- Added type and presence validation (non-empty string check) to `completeTask`, `removeTask`, and `decommissionNode` in `useAgentViewStore.js`. Dispatches `VALIDATION_FAILURE` anomaly and aborts if payload is invalid.
- Implemented scroll constraints on Dashboard matrix columns (Resource Matrix and Task Vectors) with `max-h-[600px] overflow-y-auto pr-2` to preserve the single pane of glass UX.
- Wired Intent Telemetry for the "Generate Smart Contract" button in `AgentDetailPanel.jsx`. Clicking the button triggers `initiateContractGeneration` in the store, which logs initialization intent, alerts offline status, and opens the new modal shell.

**Phase 2: Financial & Contract Scaffolding**
- Built `ContractModal.jsx`, an empty structural modal overlay with Framer Motion animations based on existing UI patterns (`bg-void` and `axim-teal`).
- Mounted `ContractModal` inside `App.jsx` and added corresponding state (`isContractModalOpen`, `setContractModalOpen`) to `useAgentViewStore.js`.

### Micro-Increment 3 (Triage Sorting & Optimistic Resolution)

**Phase 1: Triage UX & Optimistic Hardening**
- Updated Dashboard.jsx to correctly sort tasks by priority (CRITICAL > HIGH > MEDIUM > LOW) to ensure operators see critical vectors first.
- Re-wrote completeTask in useAgentViewStore.js to implement optimistic task resolution. Now mutates activeTasks locally before the API call, and rolls back if an error occurs.
- Upgraded handleTelemetry in App.jsx to properly render validation_failure anomalies into visual toast alerts.

**Phase 2: Financial Data Integrity**
- Added a read-only Entity Verification block to ContractModal.jsx. It displays selectedAgent data (display name, ID, and billing rate in dollars) securely. Included an explicit fallback UI error state preventing action if the required entity context is null.

## Micro-Increment 14: Edge Validation & Session Time-Tracking

### Phase 1: Edge Security & Payload Validation
* **`worker.js`**: Implemented strict payload validation on `/api/agentview/payroll/settle` and `/api/v1/contracts` endpoints. Verify that `agentId` exists, is a string, and is not empty. Returns a 400 Bad Request if validation fails, halting execution before hitting the KV store or Core API.
* **`useAgentViewStore.js`**: Enhanced error handling to intercept 400 Bad Request status codes. Dispatches a `SECURITY_ANOMALY` telemetry event and logs the anomaly as CRITICAL when the edge proxy rejects a payload.

### Phase 2: Payroll Time-Tracking Hook
* **`useAgentViewStore.js`**: Added `session_start_time` set to `Date.now()` inside `operational_capability` during the `delegateWorkflow` optimistic update (transition to 'WORKING' status). Clears `session_start_time` upon reverting to 'IDLE' in `settlePayroll`.
* **`PayrollModal.jsx`**: Replaced static mock compute logic with dynamic calculation. Calculates elapsed time in seconds from `session_start_time`, multiplies by the billing rate (per hour), and correctly formats the output as a dollar amount. Defaults to $0.00 if `session_start_time` is missing.

## [1.4.15] - 2024-02-XX
### CPU and Data Integrity Improvements
- **WorkerCard.jsx**: Implemented \`IntersectionObserver\` to pause compute tickers for out-of-view workers, saving client CPU cycles.
- **TaskCard.jsx & useAgentViewStore.js**: Added failsafe to prevent deletion of in-progress tasks. If an assigned task is deleted (via remote override or edge case), the assigned agent is optimistically reset to \`IDLE\` to prevent stranding.
- **worker.js**: Hardened edge routing with strict enterprise security headers (nosniff, X-Frame-Options DENY, HSTS).
- **LogsFeed.jsx**: Added "System Ledger Archival" via a one-click local JSON export to preserve volatile session data before the 50-item cap rotates it out.
