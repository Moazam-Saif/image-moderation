import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost p-1.5 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
        .reduce((acc, p, i, arr) => {
          if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-2 text-silver text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-pill text-sm font-medium transition-colors
                ${p === page ? 'bg-terra text-white' : 'text-bark-mid hover:bg-fog'}`}
            >
              {p}
            </button>
          )
        )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="btn-ghost p-1.5 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
