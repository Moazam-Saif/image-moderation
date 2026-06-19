import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import Pagination from '../../components/Pagination';

const STATUS_TABS = ['pending', 'accepted', 'rejected'];

export default function AppealQueue() {
  const [appeals, setAppeals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.get(`/admin/appeals?status=${status}&page=${page}&limit=20`)
      .then((res) => { setAppeals(res.data.appeals || []); setPagination(res.data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [status, page]);

  const switchTab = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-bark tracking-tight mb-1">Appeals Queue</h1>
        <p className="text-silver text-sm">Review and resolve user appeals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-fog">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => switchTab(s)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
              ${status === s ? 'border-terra text-terra' : 'border-transparent text-silver hover:text-bark'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-terra border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appeals.length === 0 ? (
          <div className="py-12 text-center text-silver text-sm">No {status} appeals.</div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>User</th>
                <th>File</th>
                <th>Verdict</th>
                <th>Filed</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr key={appeal._id}>
                  <td className="text-xs text-silver truncate max-w-[140px]">{appeal.userId?.email ?? '—'}</td>
                  <td className="font-mono text-xs truncate max-w-[140px]">{appeal.imageId?.originalFilename ?? '—'}</td>
                  <td>{appeal.imageId?.outcome ? <OutcomeBadge outcome={appeal.imageId.outcome} /> : '—'}</td>
                  <td className="text-silver text-xs whitespace-nowrap">{new Date(appeal.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`text-xs font-semibold capitalize
                      ${appeal.status === 'pending' ? 'text-amber-600' : appeal.status === 'accepted' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {appeal.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/appeals/${appeal._id}`} className="text-xs text-sand hover:text-sand-dark whitespace-nowrap">
                      {appeal.status === 'pending' ? 'Review →' : 'View →'}
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
