import { useEffect, useRef, useState } from 'react'

// polls /api/trains; `loading` is true until the first answer (ok or error)
export function useTrains(refreshMs) {
  const [state, setState] = useState({ trains: [], updated: null, error: null, loading: true })

  useEffect(() => {
    const load = () =>
      fetch('/api/trains')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) =>
          setState({ trains: data.trains, updated: data.updated, error: null, loading: false }),
        )
        .catch((err) => setState((s) => ({ ...s, error: err.message, loading: false })))

    load()
    const timer = setInterval(load, refreshMs)
    return () => clearInterval(timer)
  }, [refreshMs])

  return state
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// current time, re-rendering every `ms`
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}

// counts smoothly from the previous value to `target`
export function useAnimatedNumber(target, duration = 700) {
  const [value, setValue] = useState(target)
  const current = useRef(target)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    const from = current.current
    if (from === target || reduced) {
      current.current = target
      setValue(target)
      return
    }

    let raf
    const start = performance.now()
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      current.current = Math.round(from + (target - from) * eased)
      setValue(current.current)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduced])

  return value
}

export function timeAgo(date, now) {
  const s = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
