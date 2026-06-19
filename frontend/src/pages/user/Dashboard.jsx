import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import { Upload, Image as ImageIcon, FileCheck, AlertTriangle } from 'lucide-react';

function BigStat({ label, value, accent }) {
  return (
    <div className="text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-silver mb-2">{label}</div>
      <div className={`text-7xl font-bold leading-none ${accent}`}>{value ?? '0'}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({});
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/submissions?limit=5'),
      client.get('/appeals/my?status=pending'),
    ]).then(([subRes, appealRes]) => {
      setImages(subRes.data.images || []);
      setPagination(subRes.data.pagination || {});
      setAppeals(appealRes.data.appeals || []);
    }).finally(() => setLoading(false));
  }, []);

  const flaggedOrBlocked = images.filter((i) => ['flagged', 'blocked'].includes(i.outcome)).length;

  return (
    <div className="max-w-3xl">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-bark tracking-tight mb-1">Dashboard</h1>
        <p className="text-silver text-sm">{user?.email}</p>
      </div>

      {/* Big stats row — check.html style */}
      <div className="grid grid-cols-3 gap-8 mb-12 py-8 border-y border-fog">
        <BigStat label="Submissions"     value={pagination.total ?? 0} accent="text-bark" />
        <BigStat label="Flagged"         value={flaggedOrBlocked}       accent="text-terra" />
        <BigStat label="Pending Appeals" value={appeals.length}         accent="text-sand" />
      </div>

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-bark tracking-tight">Recent Activity</h2>
          <Link to="/submissions" className="text-sm text-sand hover:text-sand-dark font-medium transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-5 h-5 border-2 border-sand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-silver text-sm mb-4">No images submitted yet.</p>
            <Link to="/submit" className="btn-primary">Submit your first image</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {images.map((img) => (
              <div key={img._id} className="bg-cream border border-fog rounded-2xl px-5 py-4 flex items-center justify-between hover:border-sand/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-fog flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={14} className="text-silver" />
                  </div>
                  <span className="font-mono text-xs text-bark truncate">{img.originalFilename}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <OutcomeBadge outcome={img.outcome} />
                  <Link to={`/submissions/${img.submissionId?._id || img.submissionId}`} className="text-xs text-sand hover:text-sand-dark">
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link to="/submit" className="btn-primary inline-flex items-center gap-2">
          <Upload size={14} />
          New Submission
        </Link>
      </div>
    </div>
  );
}
