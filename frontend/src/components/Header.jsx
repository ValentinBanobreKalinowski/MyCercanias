import { timeAgo, useAnimatedNumber, useNow } from '../hooks.js'

export default function Header({ shown, total, updated, error }) {
  const count = useAnimatedNumber(shown)
  const now = useNow(1000)

  let status = 'Connecting…'
  if (error) status = 'Offline, retrying'
  else if (updated) status = `Updated ${timeAgo(updated, now)}`

  return (
    <header className="topbar glass">
      <div className="brand">
        <img className="brand-logo" src="/logo.png" alt="" width="44" height="44" />
        <div>
          <h1>MyCercanías</h1>
          <p>Madrid commuter trains, live</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{count}</span>
          <span className="stat-label">
            {shown !== total ? <>of {total} trains</> : 'trains'}
          </span>
        </div>
        <div className={`live${error ? ' is-error' : ''}`} role="status">
          <span className="live-dot" />
          {status}
        </div>
      </div>
    </header>
  )
}
