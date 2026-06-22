import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("GameView crashed:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="loading">
          Что-то пошло не так в интерфейсе: {this.state.error.message}
          <button className="back-button" onClick={this.handleReset}>
            Назад в меню
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
