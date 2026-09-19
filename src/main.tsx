import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GuitarProvider } from './store';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GuitarProvider>
        <App />
      </GuitarProvider>
    </BrowserRouter>
  </StrictMode>,
);
