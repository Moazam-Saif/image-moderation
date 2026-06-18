import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import CategoryResults from '../../components/CategoryResults';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

function ImageCard({ image }) {
  const [expanded, setExpanded] = useState(image.outcome !== 'approved');
  const canAppeal = ['flagged', 'blocked'].includes(image.outcome) && image.appealStatus === 'none';

  return (
    <div className="card mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <img
            src={image.storageUrl}
            alt={image.originalFilename}
            className="w-14 h-14 object-cover rounded border border-fog"
          />
          <div>
            <p className="font-mono text-sm text-bark font-medium">{image.originalFilename}</p>
            <p className="text-xs text-silver mt-0.5">
              {(image.fileSizeBytes / 1024 / 1024).toFixed(2)} MB ·{' '}
              {image.verdictAt ? new Date(image.verdictAt).toLocaleString() : 'Pending'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OutcomeBadge outcome={image.outcome} />
          {expanded ? <ChevronUp size={16} className="text-silver" /> : <ChevronDown size={16} className="text-silver" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-fog">
          <CategoryResults results={image.categoryResults} />

          {/* Appeal / override info */}
          <div className="mt-5 pt-4 border-t border-fog flex items-center justify-between">
            <div className="text-sm">
              {image.overriddenBy && (
                <span className="text-silver text-xs">
                  Overridden by admin
                  {image.overrideNote && `: ${image.overrideNote}`}
                </span>
              )}
              {image.appealStatus !== 'none' && (
                <span className="text-xs text-silver capitalize">
                  Appeal: <strong>{image.appealStatus}</strong>
                </span>
              )}
            </div>
            {canAppeal && (
              <Link
                to={`/appeal/${image._id}`}
                className="btn-secondary text-sm"
              >
                File an Appeal
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/submissions/${id}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Submission not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl">
      <p className="text-red-600 text-sm">{error}</p>
      <Link to="/submissions" className="text-gold text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const { submission, images } = data;
  const outcomes = images.map((i) => i.outcome);
  const overallOutcome = outcomes.includes('blocked') ? 'blocked'
    : outcomes.includes('flagged') ? 'flagged' : 'approved';

  return (
    <div className="max-w-3xl">
      <Link to="/submissions" className="inline-flex items-center gap-1 text-sm text-silver hover:text-gold mb-6">
        <ArrowLeft size={14} /> Back to history
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bark">Submission Detail</h1>
          <p className="text-sm text-silver mt-1">
            {new Date(submission.createdAt).toLocaleString()} ·{' '}
            {submission.imageCount} image{submission.imageCount !== 1 ? 's' : ''}
          </p>
        </div>
        <OutcomeBadge outcome={overallOutcome} />
      </div>

      {images.map((img) => (
        <ImageCard key={img._id} image={img} />
      ))}
    </div>
  );
}
