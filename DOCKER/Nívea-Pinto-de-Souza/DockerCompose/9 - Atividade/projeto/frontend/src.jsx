import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';
function App(){const[s,setS]=useState('carregando');const[n,setN]=useState([]);useEffect(()=>{fetch('/api/health').then(r=>r.json()).then(j=>setS(j.status)).catch(e=>setS(e.message));fetch('/api/notes').then(r=>r.json()).then(setN).catch(()=>{});},[]);return <main style={{fontFamily:'Arial',maxWidth:700,margin:'40px auto'}}><h1>Cenário 2 via Nginx</h1><p>API: {s}</p><ul>{n.map(x=><li key={x.id}>{x.text}</li>)}</ul></main>}
createRoot(document.getElementById('root')).render(<App/>);
