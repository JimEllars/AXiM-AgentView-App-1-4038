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
