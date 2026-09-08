import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Cenário 2 — React + Postgres + Nginx</h1>
      <p>Servido pelo Nginx na porta 8080. O React nao publica porta propria.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
