# Changelog

## [1.0.1] - 2026-07-01
### Fixed
- State Integrity: Ensure presence polling in `useAgentViewStore.js` is visibility-aware and respects the circuit breaker, thereby optimizing Cloudflare KV read usage.
- State Integrity: Fix duplicate WebSocket instantiation in `connectEcosystemStream`.
- State Integrity: Optimistic state update in `settlePayroll` to transition an active worker back to `IDLE`.

### Added
- Edge Compute: Scaffold the `/api/agentview/payroll/settle` POST endpoint in `worker.js` to begin settling records at the edge.
