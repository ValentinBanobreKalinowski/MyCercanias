import { lineColor } from '../lines.js'

export default function Legend({ lines, counts, hidden, onToggle, onReset }) {
  return (
    <nav className="legend glass" aria-label="Filter lines">
      <div className="legend-chips">
        {lines.map((line, i) => {
          const off = hidden.has(line)
          return (
            <button
              key={line}
              type="button"
              className={`chip${off ? ' is-off' : ''}`}
              style={{ '--c': lineColor(line), '--i': i }}
              aria-pressed={!off}
              title={off ? `Show ${line}` : `Hide ${line}`}
              onClick={() => onToggle(line)}
            >
              <span className="chip-dot" />
              <span className="chip-name">{line}</span>
              <span className="chip-count">{counts[line]}</span>
            </button>
          )
        })}
      </div>

      {hidden.size > 0 && (
        <button type="button" className="chip-reset" onClick={onReset}>
          Show all
        </button>
      )}
    </nav>
  )
}
