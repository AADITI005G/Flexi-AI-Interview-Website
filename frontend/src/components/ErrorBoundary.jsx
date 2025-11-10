import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card">
            <h2>Something went wrong</h2>
            <p className="muted">Please refresh the page. If the problem persists, try logging in again.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}