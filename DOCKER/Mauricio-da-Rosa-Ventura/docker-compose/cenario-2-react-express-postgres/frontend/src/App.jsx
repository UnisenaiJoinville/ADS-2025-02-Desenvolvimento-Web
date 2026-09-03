import { useEffect, useState } from "react";

// Componente unico e minimo: so prova, do lado do navegador, que o proxy
// Nginx encaminha "/" para este frontend e "/api/" para a API Express, que
// por sua vez fala com postgres/redis/rabbitmq (ver backend/src/index.js).
// Nenhuma regra de negocio e implementada de proposito - o foco desta
// atividade e a estrutura de containers atras de um proxy reverso.
export default function App() {
  const [status, setStatus] = useState(null);
  const [erro, setErro] = useState(null);

  async function verificar() {
    setErro(null);
    try {
      // caminho relativo: passa pelo mesmo proxy Nginx (porta 8080) que
      // serviu esta pagina, sem precisar saber o host/porta interna da api
      const resp = await fetch("/api/status");
      setStatus(await resp.json());
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    verificar();
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "2rem auto" }}>
      <h1>Cenário 2 — Docker Compose</h1>
      <p>ReactJS + PostgreSQL + Node/Express + Redis + RabbitMQ, atrás de um proxy Nginx.</p>
      <button onClick={verificar}>Testar conexão com a API</button>
      {erro && <p style={{ color: "crimson" }}>Erro: {erro}</p>}
      {status && <pre>{JSON.stringify(status, null, 2)}</pre>}
    </main>
  );
}
