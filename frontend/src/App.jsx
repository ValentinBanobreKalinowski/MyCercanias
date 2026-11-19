import { useEffect, useState } from 'react'

export default function App() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/items')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <main>
      <h1>MyMadrid</h1>
      <p>Latest fetches</p>

      {error && <p className="error">Error: {error}</p>}
      {!error && items.length === 0 && <p>No data yet, the fetcher runs every 30 seconds.</p>}

      <ul>
        {items.map((item) => (
          <li key={item.sk}>
            {item.sk} — {item.ok ? 'ok' : 'failed'}
          </li>
        ))}
      </ul>
    </main>
  )
}
