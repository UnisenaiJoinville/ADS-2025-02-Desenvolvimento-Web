import React,{useEffect,useState} from 'react'; import{createRoot}from'react-dom/client';
function App(){const[tasks,setTasks]=useState([]); useEffect(()=>{fetch('/api/tasks').then(r=>r.json()).then(x=>setTasks(x.data||[]))},[]); return <main><h1>Painel de tarefas</h1><p>Acesso através do Nginx.</p><ul>{tasks.map(t=><li key={t.id}>{t.description}</li>)}</ul></main>}
createRoot(document.getElementById('root')).render(<App/>);
