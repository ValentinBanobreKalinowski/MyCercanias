import { memo } from 'react'
import L from 'leaflet'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import { STATUS, delayInfo, lineColor, textOn } from '../lines.js'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

// one icon per line/status/delay combo, so markers don't rebuild on every refresh
const icons = new Map()

function trainIcon(line, stopped, delayCls) {
  const key = `${line}|${stopped}|${delayCls}`
  if (!icons.has(key)) {
    const bg = lineColor(line)
    const late = delayCls === 'late' || delayCls === 'verylate'
    icons.set(
      key,
      L.divIcon({
        className: 'train-marker',
        iconSize: [38, 22],
        iconAnchor: [19, 11],
        popupAnchor: [0, -12],
        html:
          `<span class="train-pill${stopped ? ' is-stopped' : ''}" style="--c:${bg};--t:${textOn(bg)}">` +
          esc(line) +
          (late ? `<i class="train-late ${delayCls}"></i>` : '') +
          '</span>',
      }),
    )
  }
  return icons.get(key)
}

// markers glide to their new position (CSS), but not while zooming
function GlideControl() {
  const map = useMapEvents({
    zoomstart: () => map.getContainer().classList.add('is-zooming'),
    zoomend: () => setTimeout(() => map.getContainer().classList.remove('is-zooming'), 60),
  })
  return null
}

function TrainLayer({ trains }) {
  return (
    <>
      <GlideControl />
      {trains.map((t) => {
        const delay = delayInfo(t.delay)
        return (
          <Marker
            key={t.id}
            position={[t.lat, t.lon]}
            icon={trainIcon(t.line, t.status === 'STOPPED_AT', delay.cls)}
          >
            <Popup className="train-popup">
              <div className="popup-head" style={{ '--c': lineColor(t.line), '--t': textOn(lineColor(t.line)) }}>
                <span className="popup-line">{t.line}</span>
                <span className="popup-label">{t.label || t.id}</span>
              </div>
              <span className={`delay ${delay.cls}`}>{delay.text}</span>
              <div className="popup-meta">
                {STATUS[t.status] || t.status}
                {t.stop && <> · stop {t.stop}</>}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default memo(TrainLayer)
