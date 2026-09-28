import { copy } from "../copy";

export interface ChartRep {
  actual: number;
  remaining: number;
  leftEarly: boolean;
}

interface Props {
  predicted: number;
  reps: ChartRep[];
  /** The plain-English sentence under the chart; also its alt text (plan 0c D21). */
  story: string;
}

const W = 326;
const H = 196;
const LEFT = 26;
const RIGHT = 12;
const TOP = 18;
const BOTTOM = 40;
const plotW = W - LEFT - RIGHT;
const plotH = H - TOP - BOTTOM;

const y = (v: number) => TOP + ((8 - v) / 8) * plotH;

/**
 * Canvas-only (DESIGN.md §5): one axis, 0 to 8, a dashed "under 4 is done"
 * line (named in the legend, so it never collides with a point). Predicted flat teal dashes; actual an ink line with hollow rings;
 * remaining an apricot-ink line with dots filled from the ramp. Each point
 * carries its number, and attempts get a dashed tick on the x axis.
 */
export function RepChart({ predicted, reps, story }: Props) {
  const n = reps.length;
  const x = (i: number) => LEFT + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const points = (key: "actual" | "remaining") =>
    reps.map((r, i) => `${x(i)},${y(r[key])}`).join(" ");

  return (
    <figure className="db-chart">
      <figcaption className="t-heading db-chart-title">{copy.controls.chartTitle}</figcaption>
      <ul className="db-chart-legend" aria-hidden="true">
        <li>
          <svg width="22" height="10" className="db-chart-svg">
            <line x1="0" y1="5" x2="22" y2="5" className="db-chart-predicted" />
          </svg>
          {copy.controls.chartPredicted}
        </li>
        <li>
          <svg width="14" height="14" className="db-chart-svg">
            <circle cx="7" cy="7" r="5" className="db-chart-ring" />
          </svg>
          {copy.controls.chartActual}
        </li>
        <li>
          <svg width="14" height="14" className="db-chart-svg">
            <circle
              cx="7"
              cy="7"
              r="4.5"
              className="db-chart-dot"
              style={{ fill: "var(--difficulty-4)" }}
            />
          </svg>
          {copy.controls.chartRemaining}
        </li>
        <li>
          <svg width="22" height="10" className="db-chart-svg">
            <line x1="0" y1="5" x2="22" y2="5" className="db-chart-four" />
          </svg>
          {copy.controls.chartUnderFour}
        </li>
      </ul>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="db-chart-svg db-chart-plot"
        role="img"
        aria-label={story}
      >
        <line x1={LEFT} y1={y(8)} x2={W - RIGHT} y2={y(8)} className="db-chart-grid" />
        <line x1={LEFT} y1={y(0)} x2={W - RIGHT} y2={y(0)} className="db-chart-grid" />
        <line x1={LEFT} y1={y(4)} x2={W - RIGHT} y2={y(4)} className="db-chart-four" />
        {[8, 4, 0].map((v) => (
          <text key={v} x={LEFT - 10} y={y(v) + 5} className="db-chart-axis" textAnchor="end">
            {v}
          </text>
        ))}
        <line
          x1={LEFT}
          y1={y(predicted)}
          x2={W - RIGHT}
          y2={y(predicted)}
          className="db-chart-predicted"
        />
        {n > 1 && <polyline points={points("actual")} className="db-chart-actual-line" />}
        {n > 1 && <polyline points={points("remaining")} className="db-chart-remaining-line" />}
        {reps.map((r, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(r.actual)} r="6.5" className="db-chart-ring" />
            <text x={x(i)} y={y(r.actual) - 11} className="db-chart-value" textAnchor="middle">
              {r.actual}
            </text>
            <circle
              cx={x(i)}
              cy={y(r.remaining)}
              r="4.5"
              className="db-chart-dot"
              style={{ fill: `var(--difficulty-${r.remaining})` }}
            />
            <text
              x={x(i)}
              y={y(r.remaining) + 17}
              className="db-chart-value is-remaining"
              textAnchor="middle"
            >
              {r.remaining}
            </text>
            <text x={x(i)} y={H - 14} className="db-chart-axis" textAnchor="middle">
              {i + 1}
            </text>
            {r.leftEarly && (
              <line
                x1={x(i) - 6}
                y1={H - 4}
                x2={x(i) + 6}
                y2={H - 4}
                className="db-chart-attempt"
              />
            )}
          </g>
        ))}
      </svg>
      <p className="db-chart-story" aria-hidden="true">
        {story}
      </p>
    </figure>
  );
}
