// close to the official cercanias colors
export const LINE_COLORS = {
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

export const lineColor = (line) => LINE_COLORS[line] || '#555'

// dark text on light line colors (C5 yellow, C10 lime...), white on the rest
export function textOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return lum > 150 ? '#111' : '#fff'
}

export const STATUS = {
  STOPPED_AT: 'Stopped at station',
  INCOMING_AT: 'Arriving',
  IN_TRANSIT_TO: 'In transit',
}

export function delayInfo(seconds) {
  if (seconds == null) return { text: 'No delay info', cls: 'unknown' }
  const min = Math.round(seconds / 60)
  if (min <= 0) return { text: 'On time', cls: 'ontime' }
  if (min < 3) return { text: `${min} min late`, cls: 'ontime' }
  if (min <= 10) return { text: `${min} min late`, cls: 'late' }
  return { text: `${min} min late`, cls: 'verylate' }
}

export const sortLines = (a, b) => a.localeCompare(b, undefined, { numeric: true })
