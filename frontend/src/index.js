import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Determine basename for BrowserRouter based on API Gateway URL
const getBasename = () => {
  const apiUrl = window.__RUNTIME_CONFIG__?.REACT_APP_API_GATEWAY_URL || process.env.REACT_APP_API_GATEWAY_URL || '';
  try {
    if (apiUrl) {
      const u = new URL(apiUrl);
      let p = u.pathname || '/';
      if (p.endsWith('/')) p = p.slice(0, -1); // Remove trailing slash for basename
      return p; // e.g. /dev
    }
  } catch (_) {}
  return ''; // No base path for local or root deployment
};

const basename = getBasename();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}> {/* Use dynamic basename */}
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);