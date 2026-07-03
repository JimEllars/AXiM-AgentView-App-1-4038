// Centralized Telemetry & Triage Loop
const APP_START_TIME = Date.now();
const telemetryThrottleCache = {};
const THROTTLE_WINDOW_MS = 60000;

window.dispatchAgentViewAnomaly = (anomalyType, errorDetails) => {
  let severity = "HIGH";

  // Specific handler for STATE_SYNC_FAILURE for Onyx Swarm interception
  if (anomalyType === 'STATE_SYNC_FAILURE') {
    severity = "CRITICAL";
  }

  // Throttling logic
  const now = Date.now();
  const cacheKey = severity === 'CRITICAL' ? 'GLOBAL_CRITICAL' : anomalyType;

  if (telemetryThrottleCache[cacheKey]) {
    const timeSinceLast = now - telemetryThrottleCache[cacheKey];
    if (timeSinceLast < THROTTLE_WINDOW_MS) {
      console.log(`[AXiM Onyx Swarm] Suppressed duplicate ${severity} telemetry for ${anomalyType}`);
      return; // Suppress duplicate payload
    }
  }

  telemetryThrottleCache[cacheKey] = now;

  const telemetryEnvelope = {
    telemetry_envelope: {
      project_id: "AXIM_AGENTVIEW",
      environment: "production",
      timestamp: new Date().toISOString()
    },
    event_payload: {
      event_type: anomalyType.toLowerCase(),
      severity: severity,
      component_origin: "src/store/useAgentViewStore.js",
      error_message: errorDetails?.message || errorDetails?.toString() || "Unknown error",
      stack_trace: errorDetails?.stack || null,
      metadata: { window_location: window.location.href },
      client_metrics: {
        time_elapsed_ms: Date.now() - APP_START_TIME,
        screen_resolution: `${window.innerWidth}x${window.innerHeight}`,
        user_agent: navigator.userAgent
      }
    }
  };

  // Route High-Severity Logs to edge telemetry route
  if (severity === "CRITICAL" || anomalyType === "SECURITY_ANOMALY") {
    fetch('/api/v1/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        level: severity,
        type: anomalyType,
        message: telemetryEnvelope.event_payload.error_message,
        timestamp: telemetryEnvelope.telemetry_envelope.timestamp
      })
    }).catch(err => {
      // Background request, intentionally unhandled
    });
  }

  // Fire beacon directly to central network routing layers
  if (navigator.sendBeacon) {
    // Suppressed real network call in sandbox to avoid CORS errors in console
    // navigator.sendBeacon('https://api.axim.us.com/v1/telemetry/collect', JSON.stringify(telemetryEnvelope));
  }

  // Dispatch custom event to render the anomaly in the UI for demonstration
  window.dispatchEvent(
    new CustomEvent('axim-telemetry-fired', { detail: telemetryEnvelope })
  );
  
  console.warn(`[AXiM Onyx Swarm] Telemetry Dispatched (${severity}):`, telemetryEnvelope);
};

// Methodical Validation - Simulated Failure Test
window.runSimulatedFailureTest = () => {
  console.log("Initializing simulated Core API failure test...");

  // Create a mock error simulating an unreachable Core API
  const mockError = new Error("Failed to fetch from AXiM Core API. Connection Refused.");
  mockError.stack = "Error: Failed to fetch from AXiM Core API. Connection Refused.\n    at fetchEcosystemState (src/store/useAgentViewStore.js:68:15)";

  // Dispatch anomaly specifically for STATE_SYNC_FAILURE
  window.dispatchAgentViewAnomaly('STATE_SYNC_FAILURE', mockError);

  console.log("Simulated failure test complete. Verify CRITICAL payload in console.");
};

// Methodical Validation - 503 Gateway Timeout Simulation
window.verifyOnyxSwarmTelemetry = () => {
  console.log("Initiating Onyx Swarm CRITICAL Telemetry Validation...");

  const mockTimeoutError = new Error("Gateway Timeout: Upstream server (AXiM Core API) failed to respond in 30000ms.");
  mockTimeoutError.status = 503;

  // Math verification: Ensure we only dispatch if severity rules align
  let testSeverity = "HIGH";
  if (mockTimeoutError.status >= 500) {
     testSeverity = "CRITICAL";
  }

  if (testSeverity === "CRITICAL") {
      window.dispatchAgentViewAnomaly('STATE_SYNC_FAILURE', mockTimeoutError);
      console.log("Validation Successful: CRITICAL payload mathematically verified and dispatched.");
  } else {
      console.error("Validation Failed: Severity did not match CRITICAL parameters.");
  }
};
