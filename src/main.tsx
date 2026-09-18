import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/brand.css';

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No se encontró el nodo #root en el documento.');

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
