import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AgroProvider } from './context/AgroContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AgroProvider>
        <App />
      </AgroProvider>
    </LanguageProvider>
  </StrictMode>,
);
