import { useEffect, useState } from 'react';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import CategoryResults from '../../components/CategoryResults';
import Pagination from '../../components/Pagination';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

function ImageReviewCard({ image, onResolved }) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const resolve = async (outcome) => {
    setResolving(true);
    setError('');
    try {
      await client.patch(`/admin/images/${image._id}/verdict`, { outcome, note });
      onResolved(image._id, outcome);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve.');
      setResolving(false);
    }
  };

  return (
    <div className="card mb-4">
      {/* Header row */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-4">
          <img
            src={image.storageUrl}
            alt={image.originalFilename}
            className="w-14 h-14 object-cover rounded border border-fog"
          />
          <div>
            <p className="font-mono text-sm font-medium text-bark">{image.originalFilename}</p>
            <p className="text-xs text-silver mt-0.5">
              Submitted by {image.userId?.email ?? '—'} ·{' '}
              {new Date(image.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OutcomeBadge outcome={image.outcome} />
          {expanded
            ? <ChevronUp size={16} className="text-silver" />
            : <ChevronDown size={16} className="text-silver" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-fog">
          {/* Category breakdown */}
          <CategoryResults results={image.categoryResults || []} />

          {/* Admin decision */}
          <div className="mt-5 pt-4 border-t border-fog">
            <label className="label mb-2">Admin Note (optional)</label>
            <input
              type="text"
              className="input mb-4"
              placeholder="Reason for this decision…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => resolve('blocked')}
                disabled={resolving}
                className="btn-danger flex items-center gap-2 flex-1 justify-center"
              >
                <XCircle size={15} />
                Block
              </button>
              <button
                onClick={() => resolve('approved')}
                disabled={resolving}
                className="btn-primary flex items-center gap-2 flex-1 justify-center"
              >
                <CheckCircle size={15} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlaggedQueue() {
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchQueue = (p) => {
    setLoading(true);
    client.get(`/admin/images/flagged?page=${p}&limit=20`)
      .then((res) => {
        setImages(res.data.images || []);
        setPagination(res.data.pagination || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQueue(page); }, [page]);

  // Remove resolved image from list optimistically
  const handleResolved = (imageId) => {
    setImages((prev) => prev.filter((img) => img._id !== imageId));
    setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bark">Flagged Review Queue</h1>
        <p className="text-sm text-silver mt-1">
          {pagination.total} image{pagination.total !== 1 ? 's' : ''} awaiting review —
          approve or block each one.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-silver text-sm">No flagged images — queue is clear.</p>
        </div>
      ) : (
        images.map((img) => (
          <ImageReviewCard key={img._id} image={img} onResolved={handleResolved} />
        ))
      )}

      <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
    </div>
  );
}
