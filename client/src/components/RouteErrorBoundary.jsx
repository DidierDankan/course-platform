import { Component } from "react";
import { useLocation } from "react-router-dom";

// Without this, an error thrown while rendering a page makes React remove the whole app, header included.
// React still logs the caught error to the console. Shortcut for a portfolio project: a real product
// would also report it to a service like Sentry (createRoot's onCaughtError option).
class ErrorCatcher extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  // Moving to another page gives the visitor a clean start.
  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Something went wrong</h3>
          <p>This page ran into a problem. Reloading usually fixes it.</p>
          <button type="button" className="button button-secondary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </div>
      </main>
    );
  }
}

export default function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorCatcher resetKey={pathname}>{children}</ErrorCatcher>;
}
