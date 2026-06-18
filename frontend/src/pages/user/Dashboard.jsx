import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import { Upload, Image as ImageIcon, FileCheck, AlertTriangle } from 'lucide-react';

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-bark">{value ?? '—'}</div>
        <div className="text-xs text-silver uppercase tracking-wide">{label}</div>
      </div>
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
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bark">Dashboard</h1>
        <p className="text-sm text-silver mt-1">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Submissions" value={pagination.total ?? 0} icon={ImageIcon} accent="bg-bark" />
        <StatCard label="Flagged / Blocked" value={flaggedOrBlocked} icon={AlertTriangle} accent="bg-amber-500" />
        <StatCard label="Pending Appeals" value={appeals.length} icon={FileCheck} accent="bg-gold" />
      </div>

      {/* Recent submissions */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-bark">Recent Images</h2>
          <Link to="/submissions" className="text-sm text-gold hover:text-gold-dark">View all</Link>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-silver text-sm mb-3">No images submitted yet.</p>
            <Link to="/submit" className="btn-primary text-sm">Submit your first image</Link>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>File</th>
                <th>Date</th>
                <th>Outcome</th>
                <th>Appeal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {images.map((img) => (
                <tr key={img._id}>
                  <td className="font-mono text-xs text-bark truncate max-w-[160px]">
                    {img.originalFilename}
                  </td>
                  <td className="text-silver text-xs">
                    {new Date(img.createdAt).toLocaleDateString()}
                  </td>
                  <td><OutcomeBadge outcome={img.outcome} /></td>
                  <td>
                    {img.appealStatus !== 'none' ? (
                      <span className="text-xs text-silver capitalize">{img.appealStatus}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <Link
                      to={`/submissions/${img.submissionId?._id || img.submissionId}`}
                      className="text-xs text-gold hover:text-gold-dark"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Link to="/submit" className="btn-primary inline-flex items-center gap-2">
        <Upload size={15} />
        New Submission
      </Link>
    </div>
  );
}
