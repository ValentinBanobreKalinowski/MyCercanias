import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const MADRID = [40.4168, -3.7038]
const REFRESH_MS = 30_000

// close to the official cercanias colors
const LINE_COLORS = {
  C1: '#66aede',
  C2: '#008b45',
  C3: '#9b4782',
  C3A: '#9b4782',
  C4: '#1f4fa0',
  C4A: '#1f4fa0',
  C4B: '#1f4fa0',
  C5: '#fecb00',
  C7: '#de1e40',
  C8: '#878787',
  C8A: '#878787',
  C8B: '#878787',
  C9: '#f09a36',
  C10: '#b5d300',
}

const lineColor = (line) => LINE_COLORS[line] || '#444'

const STATUS = {
  STOPPED_AT: 'Stopped at station',
  INCOMING_AT: 'Arriving',
  IN_TRANSIT_TO: 'In transit',
}

function delayInfo(seconds) {
  if (seconds == null) return { text: 'No delay info', cls: 'unknown' }
  const min = Math.round(seconds / 60)
  if (min <= 0) return { text: 'On time', cls: 'ontime' }
  if (min < 3) return { text: `${min} min late`, cls: 'ontime' }
  if (min <= 10) return { text: `${min} min late`, cls: 'late' }
  return { text: `${min} min late`, cls: 'verylate' }
}

export default function App() {
  const [trains, setTrains] = useState([])
  const [updated, setUpdated] = useState(null)
  const [error, setError] = useState(null)
  // lines the user switched off in the legend
  const [hidden, setHidden] = useState(() => new Set())

  const toggleLine = (line) =>
    setHidden((prev) => {
      const next = new Set(prev)
      next.has(line) ? next.delete(line) : next.add(line)
      return next
    })

  useEffect(() => {
    const load = () =>
      fetch('/api/trains')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => {
          setTrains(data.trains)
          setUpdated(data.updated)
          setError(null)
        })
        .catch((err) => setError(err.message))

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  const counts = {}
  for (const t of trains) counts[t.line] = (counts[t.line] || 0) + 1

  const lines = Object.keys(counts).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )

  const visible = trains.filter((t) => !hidden.has(t.line))

  return (
    <div className="app">
      <header>
        <h1>MyMadrid · Cercanías live</h1>
        <div className="meta">
          {error ? (
            <span className="error">Error: {error}</span>
          ) : (
            <>
              <strong>{visible.length}</strong>
              {visible.length !== trains.length && <> of {trains.length}</>} trains
              {updated && <> · updated {new Date(updated).toLocaleTimeString()}</>}
            </>
          )}
        </div>
      </header>

      <MapContainer center={MADRID} zoom={10} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Data: Renfe'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visible.map((t) => (
          <CircleMarker
            key={t.id}
            center={[t.lat, t.lon]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: lineColor(t.line), fillOpacity: 1 }}
          >
            <Popup>
              <strong>{t.line}</strong> · {t.label || t.id}
              <br />
              <span className={`delay ${delayInfo(t.delay).cls}`}>{delayInfo(t.delay).text}</span>
              <br />
              {STATUS[t.status] || t.status}
              {t.stop && <> · stop {t.stop}</>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {lines.length > 0 && (
        <div className="legend">
          {lines.map((line) => (
            <button
              key={line}
              type="button"
              className={hidden.has(line) ? 'off' : ''}
              aria-pressed={!hidden.has(line)}
              title={hidden.has(line) ? `Show ${line}` : `Hide ${line}`}
              onClick={() => toggleLine(line)}
            >
              <i style={{ background: lineColor(line) }} />
              {line}
              <small>{counts[line]}</small>
            </button>
          ))}
          {hidden.size > 0 && (
            <button type="button" className="reset" onClick={() => setHidden(new Set())}>
              Show all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
