import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import ApiCheck from './pages/ApiCheck.tsx';
import FaceSwapLive from './pages/FaceSwapLive.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/api-check" element={<ApiCheck />} />
        <Route path="/face-swap-live" element={<FaceSwapLive />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
