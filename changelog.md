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
