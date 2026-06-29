import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

replacement = """    const handleTelemetry = (e) => {
      const id = Date.now();
      const anomaly = e.detail;

      // Specifically catch validation failures to show the operator a warning overlay
      if (anomaly.event_payload.event_type === 'validation_failure' || anomaly.event_payload.event_type === 'validation_failure'.toLowerCase()) {
         // Keep existing flow, but ensure it pops up in alerts
         setAlerts(prev => [...prev, { id, ...anomaly }]);
         addLog('VALIDATION', anomaly.event_payload.error_message, 'WARNING');
      } else {
         setAlerts(prev => [...prev, { id, ...anomaly }]);
         addLog('ANOMALY', anomaly.event_payload.error_message, 'ERROR');
      }

      setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
    };"""

pattern = r"    const handleTelemetry = \(e\) => \{.*?\n    \};"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/App.jsx', 'w') as f:
    f.write(content)
