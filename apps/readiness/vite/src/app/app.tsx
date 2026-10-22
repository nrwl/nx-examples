import { useEffect, useState } from 'react';

const apis = ['node', 'tsx'];

export function App() {
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    for (const api of apis) {
      fetch(`/api/${api}`)
        .then((res) =>
          res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))
        )
        .then(({ message }) => setMessages((m) => ({ ...m, [api]: message })))
        .catch((e) =>
          setMessages((m) => ({ ...m, [api]: `error: ${e.message}` }))
        );
    }
  }, []);

  return (
    <main>
      <h1>readiness-vite</h1>
      <ul>
        {apis.map((api) => (
          <li key={api} data-testid={`api-${api}`}>
            {messages[api] ?? 'loading'}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
