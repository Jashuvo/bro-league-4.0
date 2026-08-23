import React from 'react';

// Small inline-SVG trend line — deliberately not a charting library, this
// is the only place in the app that needs one. `data` is the manager's
// slice of computeRankHistory()'s output: [{ gw, rank }], oldest first.
const RankTrendSparkline = ({ data = [], maxRank = 15 }) => {
  if (data.length < 2) {
    return (
      <p className="text-xs text-bro-muted text-center py-2">
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
  const strokeColor = unchanged ? '#9ca3af' : improved ? '#4ade80' : '#f87171';

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-12">
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle key={d.gw} cx={i * stepX} cy={scaleY(d.rank)} r="1.8" fill={strokeColor} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-bro-muted mt-1">
        <span>GW{first.gw}: #{first.rank}</span>
        <span>GW{last.gw}: #{last.rank}</span>
      </div>
    </div>
  );
};

export default RankTrendSparkline;
