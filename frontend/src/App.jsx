import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Header from './components/Header.jsx'
import Legend from './components/Legend.jsx'
import TrainLayer from './components/TrainLayer.jsx'
import { useMediaQuery, useTrains } from './hooks.js'
import { sortLines } from './lines.js'

const MADRID = [40.4168, -3.7038]
const REFRESH_MS = 30_000

// carto needs an api key now, osm doesn't. dark mode is a css filter (.tiles-dark)
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Data: Renfe'

export default function App() {
  const { trains, updated, stale, error, loading } = useTrains(REFRESH_MS)
  const dark = useMediaQuery('(prefers-color-scheme: dark)')
  // lines the user switched off in the legend
  const [hidden, setHidden] = useState(() => new Set())

  const toggleLine = (line) =>
    setHidden((prev) => {
      const next = new Set(prev)
      next.has(line) ? next.delete(line) : next.add(line)
      return next
    })

  const counts = useMemo(() => {
    const c = {}
    for (const t of trains) c[t.line] = (c[t.line] || 0) + 1
    return c
  }, [trains])

  const lines = useMemo(() => Object.keys(counts).sort(sortLines), [counts])
  const visible = useMemo(() => trains.filter((t) => !hidden.has(t.line)), [trains, hidden])

  return (
    <div className="app">
      <MapContainer center={MADRID} zoom={10} zoomControl={false} className="map">
        <TileLayer
          key={dark ? 'dark' : 'light'}
          url={TILES}
          className={dark ? 'tiles-dark' : 'tiles-light'}
          maxZoom={19}
          attribution={ATTRIBUTION}
        />
        <ZoomControl position="bottomright" />
        <TrainLayer trains={visible} />
      </MapContainer>

      <Header shown={visible.length} total={trains.length} updated={updated} error={error} />

      {error && !loading && (
        <div className="toast" role="alert">
          Can't reach the server ({error}). Retrying…
        </div>
      )}

      {stale && !error && !loading && (
        <div className="toast" role="status">
          No live train data right now. Cercanías may not be running at this hour.
        </div>
      )}

      <div className={`loader glass${loading ? '' : ' is-hidden'}`} aria-hidden={!loading}>
        <span className="spinner" />
        Loading live trains…
      </div>

      {lines.length > 0 && (
        <Legend
          lines={lines}
          counts={counts}
          hidden={hidden}
          onToggle={toggleLine}
          onReset={() => setHidden(new Set())}
        />
      )}
    </div>
  )
}
