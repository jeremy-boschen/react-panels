import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Note: StrictMode temporarily disabled for accurate profiling
// StrictMode causes double-rendering in dev, inflating re-render counts
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
