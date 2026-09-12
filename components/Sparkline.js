// Sparkline SVG minimaliste — pas de dépendance de charting, juste une polyline.
export default function Sparkline({ points, width = 260, height = 48, color = "#c9814a" }) {
  if (!points || points.length < 2) {
    return (
      <div className="sparkline-empty">
        Pas encore assez de points — l'historique se construit heure après heure.
      </div>
    );
  }

  const values = points.map((p) => Number(p.valeur));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const coords = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1];

  return (
    <div className="sparkline-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <polyline points={coords} fill="none" stroke={color} strokeWidth="2" />
      </svg>
      <div className="sparkline-meta">
        <span>{values.length} points</span>
        <span>dernière valeur : {Math.round(last * 100) / 100}</span>
      </div>
    </div>
  );
}
