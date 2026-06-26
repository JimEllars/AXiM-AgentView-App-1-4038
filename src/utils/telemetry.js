// Centralized Telemetry & Triage Loop
window.dispatchAgentViewAnomaly = (anomalyType, errorDetails) => {
  const telemetryEnvelope = {
    telemetry_envelope: {
      project_id: "AXIM_AGENTVIEW",
      environment: "production",
      timestamp: new Date().toISOString()
    },
    event_payload: {
      event_type: anomalyType.toLowerCase(),
      severity: "HIGH",
      component_origin: "src/store/useAgentViewStore.js",
      error_message: errorDetails.message || errorDetails.toString(),
      stack_trace: errorDetails.stack || null,
      metadata: { window_location: window.location.href }
    }
  };

  // Fire beacon directly to central network routing layers
  if (navigator.sendBeacon) {
    // Suppressed real network call in sandbox to avoid CORS errors in console
    // navigator.sendBeacon('https://api.axim.us.com/v1/telemetry/collect', JSON.stringify(telemetryEnvelope));
  }

  // Dispatch custom event to render the anomaly in the UI for demonstration
  window.dispatchEvent(
    new CustomEvent('axim-telemetry-fired', { detail: telemetryEnvelope })
  );
  
  console.warn('[AXiM Onyx Swarm] Telemetry Dispatched:', telemetryEnvelope);
};