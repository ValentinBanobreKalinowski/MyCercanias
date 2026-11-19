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

export default function App() {
  const [trains, setTrains] = useState([])
  const [updated, setUpdated] = useState(null)
  const [error, setError] = useState(null)

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

  const lines = [...new Set(trains.map((t) => t.line))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )

  return (
    <div className="app">
      <header>
        <h1>MyMadrid · Cercanías live</h1>
        <div className="meta">
          {error ? (
            <span className="error">Error: {error}</span>
          ) : (
            <>
              <strong>{trains.length}</strong> trains
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

        {trains.map((t) => (
          <CircleMarker
            key={t.id}
            center={[t.lat, t.lon]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: lineColor(t.line), fillOpacity: 1 }}
          >
            <Popup>
              <strong>{t.line}</strong> · {t.label || t.id}
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
            <span key={line}>
              <i style={{ background: lineColor(line) }} />
              {line}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
