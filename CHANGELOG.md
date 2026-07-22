# Changelog

## [1.0.1] - 2026-07-01
### Fixed
- State Integrity: Ensure presence polling in `useAgentViewStore.js` is visibility-aware and respects the circuit breaker, thereby optimizing Cloudflare KV read usage.
- State Integrity: Fix duplicate WebSocket instantiation in `connectEcosystemStream`.
- State Integrity: Optimistic state update in `settlePayroll` to transition an active worker back to `IDLE`.

### Added
- Edge Compute: Scaffold the `/api/agentview/payroll/settle` POST endpoint in `worker.js` to begin settling records at the edge.

## Phase 1: KV Integration & UI Security
- Added `/api/v1/presence` endpoint in `worker.js` with optimized KV namespace (`KV_BINDING`) concurrent listing. Handles missing KV namespace securely.
- Updated `syncPresenceState` in `useAgentViewStore.js` to poll `/api/v1/presence`.
- Mocked basic Role-Based Access Control via `currentUserRole: 'MANAGER'` in `useAgentViewStore.js`.
- Disabled access to smart contract creation and payroll execution buttons for non-ADMIN users in `AgentDetailPanel.jsx`.

## Phase 2: Contract UX Polish
- Added `<AnimatePresence>` around the mapped contracts in `AgentDetailPanel.jsx`, with subtle `scale` and `opacity` transition physics when rendering a generated smart contract.

## Micro-Increment 19: Edge RBAC & KV Beacons

### Edge Security & KV Write Paths (worker.js)
- Enforced Role-Based Access Control (RBAC) at the Cloudflare Edge.
- Extracted JWT from Authorization header and verified 'ADMIN' role in the base64 payload.
- Added strict permission checks for `/api/v1/contracts` and `/api/agentview/payroll/settle` endpoints, returning a 403 Forbidden with `{ error: "Insufficient ecosystem clearance for financial mutation." }` on invalid roles.
- Established a new `POST` route at `/api/v1/presence` to process `{ agentId, status }` presence beacons, leveraging `KV_BINDING.put` with a 300s expiration.

### Client Heartbeat Beacon (useAgentViewStore.js)
- Enhanced `connectEcosystemStream` with a lightweight 3-minute interval background fetch to `POST /api/v1/presence` maintaining the operator's ONLINE status.
- Added cleanup logic to clear the `presenceInterval` inside `disconnectEcosystemStream` and reconnect phases to avoid zombie beacon loops.

### Payment Gateway Scaffolding (PayrollModal.jsx)
- Scaffolded an empty, read-only UI container in `PayrollModal.jsx` representing the future payment gateway block.
- Styled as a dark, recessed box with `FiCreditCard` icon and muted "Secure Payment Gateway Offline" text directly above the "Confirm Settlement" action.
## Micro-Increment 21: Zero-Downtime Fallbacks & Shadow Realtime

### Global Persona State (Phase 1)
- Abstracted the `activePersona` state and `setActivePersona` from `Dashboard.jsx` to `useAgentViewStore.js` to ensure global accessibility.
- Updated `Dashboard.jsx` to consume the store values instead of maintaining local `useState`.
- Extended `Sidebar.jsx` to read `activePersona` and dynamically render a visually synchronized teal indicator highlighting the active ecosystem context on the "Dashboard" nav item.

### Graceful Degradation Hook (Phase 1)
- Introduced `realtimeConnectionStatus` (default: 'OFFLINE') into the Zustand store.
- Augmented the `presenceInterval` polling mechanism inside `connectEcosystemStream` with connection viability checks against `wsInstance`.
- Implemented an automatic failover to the legacy HTTP edge polling (`fetchEcosystemState`) if the WebSocket drops, accompanied by an INFO log: `"Realtime stream unavailable. Seamless fallback to Edge API active."`

### Shadow Realtime Ingestion (Phase 2)
- Added `@supabase/supabase-js` as a project dependency to handle the stream.
- Wired `worker.js` with `createClient` and initialized a strictly sandboxed subscription to the `public.satellite_job_queue` channel.
- Handled `INSERT` and `UPDATE` postgres events, piping output directly to `console.log("Shadow Ingest: [Event]...", payload)` to protect the active operators' UI state while validating the stream structure.
