import React from 'react';

// Small inline-SVG trend line — deliberately not a charting library, this
// is the only place in the app that needs one. `data` is the manager's
// slice of computeRankHistory()'s output: [{ gw, rank }], oldest first.
const RankTrendSparkline = ({ data = [], maxRank = 15 }) => {
  if (data.length < 2) {
    return (
      <p className="text-xs font-semibold text-ink-soft text-center py-2">
        Not enough gameweeks yet to show a trend
      </p>
    );
  }

  const width = 100;
  const height = 40;
  const stepX = width / (data.length - 1);
  // Rank 1 (best) plots near the top of the chart.
  const scaleY = (rank) => ((rank - 1) / Math.max(maxRank - 1, 1)) * (height - 8) + 4;

  const points = data.map((d, i) => `${i * stepX},${scaleY(d.rank)}`).join(' ');
  const first = data[0];
  const last = data[data.length - 1];
  const improved = last.rank < first.rank;
  const unchanged = last.rank === first.rank;
  // Colours come from the central token set, applied as Tailwind
  // stroke-*/fill-* utilities so the line follows the active theme. Full
  // class names only — Tailwind can't see interpolated ones.
  const TONES = {
    flat: { stroke: 'stroke-silver', fill: 'fill-silver' },
    up: { stroke: 'stroke-pitch', fill: 'fill-pitch' },
    down: { stroke: 'stroke-coral', fill: 'fill-coral' },
  };
  const tone = TONES[unchanged ? 'flat' : improved ? 'up' : 'down'];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-12">
        <polyline
          points={points}
          fill="none"
          className={tone.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle key={d.gw} cx={i * stepX} cy={scaleY(d.rank)} r="2" className={tone.fill} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] font-bold text-ink-soft mt-1">
        <span>GW{first.gw}: #{first.rank}</span>
        <span>GW{last.gw}: #{last.rank}</span>
      </div>
    </div>
  );
};

export default RankTrendSparkline;
