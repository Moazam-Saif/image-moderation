import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import Pagination from '../../components/Pagination';
import { SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'graphic_violence',       label: 'Graphic Violence' },
  { value: 'hate_symbols',           label: 'Hate Symbols' },
  { value: 'self_harm',              label: 'Self-Harm' },
  { value: 'extremist_propaganda',   label: 'Extremist Propaganda' },
  { value: 'weapons_contraband',     label: 'Weapons & Contraband' },
  { value: 'harassment_humiliation', label: 'Harassment & Humiliation' },
];

export default function SubmissionList() {
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ outcome: '', category: '', from: '', to: '' });
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchImages = async (f, p) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (f.outcome)  params.set('outcome', f.outcome);
      if (f.category) params.set('category', f.category);
      if (f.from)     params.set('from', f.from);
      if (f.to)       params.set('to', f.to);
      const res = await client.get(`/submissions?${params}`);
      setImages(res.data.images || []);
      setPagination(res.data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(applied, page); }, [applied, page]);

  const applyFilters = () => { setApplied({ ...filters }); setPage(1); };
  const clearFilters = () => {
    const empty = { outcome: '', category: '', from: '', to: '' };
    setFilters(empty); setApplied(empty); setPage(1);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-bark tracking-tight mb-1">History</h1>
        <p className="text-silver text-sm">{pagination.total ?? 0} images total</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-bark-mid uppercase tracking-widest">
          <SlidersHorizontal size={13} />
          Filters
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <select className="input" value={filters.outcome} onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}>
            <option value="">All outcomes</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="blocked">Blocked</option>
          </select>
          <select className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button onClick={applyFilters} className="btn-primary text-xs">Apply</button>
          <button onClick={clearFilters} className="btn-secondary text-xs">Clear</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-terra border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="py-12 text-center text-silver text-sm">No images match your filters.</div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>File</th>
                <th>Submitted</th>
                <th>Outcome</th>
                <th>Appeal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {images.map((img) => (
                <tr key={img._id}>
                  <td className="font-mono text-xs truncate max-w-[180px]">{img.originalFilename}</td>
                  <td className="text-silver text-xs whitespace-nowrap">{new Date(img.createdAt).toLocaleString()}</td>
                  <td><OutcomeBadge outcome={img.outcome} /></td>
                  <td><span className="text-xs text-silver capitalize">{img.appealStatus === 'none' ? '—' : img.appealStatus}</span></td>
                  <td>
                    <Link to={`/submissions/${img.submissionId?._id || img.submissionId}`}
                      className="text-xs text-sand hover:text-sand-dark whitespace-nowrap">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
    </div>
  );
}
