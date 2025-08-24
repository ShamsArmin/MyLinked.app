import React from 'react'

type State = { error: Error | null }
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:16, background:'#300', color:'#fff', fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
          <h3>UI crashed</h3>
          <pre>{String(this.state.error.stack || this.state.error.message || this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
