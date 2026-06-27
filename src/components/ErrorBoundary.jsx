import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRestart = this.handleRestart.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (window.dispatchAgentViewAnomaly) {
      // By dispatching 'STATE_SYNC_FAILURE' we trigger a CRITICAL payload
      // as required by the Onyx Swarm interception logic in telemetry.js.
      window.dispatchAgentViewAnomaly('STATE_SYNC_FAILURE', error);
    }
  }

  handleRestart() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-void text-axim-teal-400 p-8 font-mono">
          <div className="border border-axim-teal-500/50 p-8 rounded-xl bg-slate-950/80 shadow-[0_0_40px_rgba(20,184,166,0.15)] max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6 text-rose-500">
              <SafeIcon icon={FiIcons.FiAlertOctagon} className="text-4xl animate-pulse" />
              <h1 className="text-2xl font-bold tracking-widest uppercase">System Failure</h1>
            </div>

            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              A catastrophic frontend crash has occurred. Operations halted to maintain state transparency.
            </p>

            <div className="bg-void border border-slate-800 p-4 rounded-lg mb-8 overflow-auto max-h-48 text-xs text-rose-400/80">
              {this.state.error && this.state.error.toString()}
            </div>

            <button
              onClick={this.handleRestart}
              className="w-full py-3 px-4 bg-axim-teal-500/10 hover:bg-axim-teal-500/20 text-axim-teal-300 border border-axim-teal-500/50 rounded-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            >
              <SafeIcon icon={FiIcons.FiRefreshCw} />
              Hard Restart Node
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
