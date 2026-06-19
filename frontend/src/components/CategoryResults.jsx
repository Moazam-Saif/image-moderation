const CATEGORY_LABELS = {
  graphic_violence:       'Graphic Violence',
  hate_symbols:           'Hate Symbols',
  self_harm:              'Self-Harm',
  extremist_propaganda:   'Extremist Propaganda',
  weapons_contraband:     'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

function barColor(result, confidence) {
  if (result === 'violation') {
    if (confidence >= 80) return 'bg-red-500';
    return 'bg-amber-400';
  }
  if (result === 'clean') return 'bg-emerald-400';
  return 'bg-fog';
}

function resultLabel(result) {
  const map = {
    violation:    { text: 'VIOLATION',    cls: 'text-red-600 font-semibold' },
    clean:        { text: 'CLEAN',        cls: 'text-emerald-600 font-semibold' },
    inconclusive: { text: 'INCONCLUSIVE', cls: 'text-silver font-medium' },
  };
  return map[result] || map.inconclusive;
}

export default function CategoryResults({ results = [] }) {
  if (!results.length) {
    return <p className="text-xs text-silver italic">No category results available.</p>;
  }

  return (
    <div className="space-y-3">
      {results.map((r) => {
        const label = resultLabel(r.result);
        return (
          <div key={r.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-bark-mid font-medium uppercase tracking-wider">
                {CATEGORY_LABELS[r.category] ?? r.category}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${label.cls}`}>{label.text}</span>
                <span className="text-xs font-mono text-silver w-8 text-right">{r.confidence}%</span>
              </div>
            </div>
            <div className="confidence-bar">
              <div
                className={`confidence-bar-fill ${barColor(r.result, r.confidence)}`}
                style={{ width: `${r.confidence}%` }}
              />
            </div>
            {r.reasoning && (
              <p className="text-xs text-silver mt-1 leading-relaxed">{r.reasoning}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
