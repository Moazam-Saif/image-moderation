import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import CategoryResults from '../../components/CategoryResults';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function AppealReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appeal, setAppeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminResponse, setAdminResponse] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/admin/appeals/${id}`)
      .then((res) => setAppeal(res.data.appeal))
      .catch(() => setError('Appeal not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const resolve = async (decision) => {
    setResolving(true); setError('');
    try {
      await client.patch(`/admin/appeals/${id}`, { decision, adminResponse });
      navigate('/admin/appeals');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve.');
      setResolving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-terra border-t-transparent rounded-full animate-spin" /></div>;

  if (!appeal) return (
    <div className="max-w-2xl">
      <p className="text-red-600 text-sm">{error || 'Appeal not found.'}</p>
      <Link to="/admin/appeals" className="text-sand text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const image = appeal.imageId;
  const isPending = appeal.status === 'pending';

  return (
    <div className="max-w-2xl">
      <Link to="/admin/appeals" className="inline-flex items-center gap-1 text-sm text-silver hover:text-sand mb-6">
        <ArrowLeft size={14} /> Back to queue
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-bark tracking-tight">Appeal Review</h1>
        <span className={`text-sm font-semibold capitalize px-4 py-1 rounded-pill
          ${appeal.status === 'pending' ? 'bg-amber-100 text-amber-700'
            : appeal.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'}`}>
          {appeal.status}
        </span>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="label">Filed by</span>
            <p className="text-bark">{appeal.userId?.email ?? '—'}</p>
          </div>
          <div>
            <span className="label">Filed at</span>
            <p className="text-bark">{new Date(appeal.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {image && (
        <div className="card mb-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={image.storageUrl} alt={image.originalFilename}
              className="w-20 h-20 object-cover rounded-xl border border-fog" />
            <div>
              <p className="font-mono text-sm font-medium text-bark">{image.originalFilename}</p>
              <div className="mt-1.5"><OutcomeBadge outcome={image.outcome} /></div>
            </div>
          </div>
          <CategoryResults results={image.categoryResults || []} />
        </div>
      )}

      <div className="card mb-4">
        <span className="label">User's Justification</span>
        <p className="text-sm text-bark leading-relaxed">{appeal.justification}</p>
      </div>

      {!isPending ? (
        <div className="card">
          <span className="label">Admin Response</span>
          <p className="text-sm text-bark">{appeal.adminResponse || '—'}</p>
          <p className="text-xs text-silver mt-3">
            Resolved by {appeal.adminId?.email} on {new Date(appeal.resolvedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="card">
          <label className="label">Admin Response (optional)</label>
          <textarea className="input min-h-[100px] resize-y mb-4"
            placeholder="Leave a note for the user…"
            value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} />
          {error && <p className="text-red-600 text-xs mb-4">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => resolve('rejected')} disabled={resolving} className="btn-danger flex items-center gap-2 flex-1 justify-center">
              <XCircle size={14} />Reject
            </button>
            <button onClick={() => resolve('accepted')} disabled={resolving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <CheckCircle size={14} />Accept
            </button>
          </div>
          <p className="text-xs text-silver mt-2 text-center">Accepting overrides verdict to Approved.</p>
        </div>
      )}
    </div>
  );
}
