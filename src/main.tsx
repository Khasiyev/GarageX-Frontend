import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AiFloatButton } from './components/AiFloatButton';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          {/* Background photo layer */}
          <div className="bg-photo-layer" aria-hidden="true" />
          <AppRouter />
          <AiFloatButton />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);
