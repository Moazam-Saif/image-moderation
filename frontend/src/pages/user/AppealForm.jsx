import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import OutcomeBadge from '../../components/OutcomeBadge';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const CATEGORY_LABELS = {
  graphic_violence:       'Graphic Violence',
  hate_symbols:           'Hate Symbols',
  self_harm:              'Self-Harm',
  extremist_propaganda:   'Extremist Propaganda',
  weapons_contraband:     'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

export default function AppealForm() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/images/${imageId}`)
      .then((res) => setImage(res.data.image))
      .catch(() => setError('Image not found.'))
      .finally(() => setLoading(false));
  }, [imageId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (justification.trim().length < 20) {
      setError('Please provide at least 20 characters of justification.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await client.post('/appeals', { imageId, justification });
      navigate(`/submissions/${image.submissionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file appeal.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!image) return (
    <div className="max-w-xl">
      <p className="text-red-600 text-sm">{error || 'Image not found.'}</p>
    </div>
  );

  const violations = (image.categoryResults || [])
    .filter((r) => r.result === 'violation')
    .map((r) => `${CATEGORY_LABELS[r.category] ?? r.category} (${r.confidence}%)`);

  return (
    <div className="max-w-xl">
      <Link
        to={`/submissions/${image.submissionId}`}
        className="inline-flex items-center gap-1 text-sm text-silver hover:text-gold mb-6"
      >
        <ArrowLeft size={14} /> Back to submission
      </Link>

      <h1 className="text-2xl font-bold text-bark mb-6">File an Appeal</h1>

      {/* Image summary */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <img
            src={image.storageUrl}
            alt={image.originalFilename}
            className="w-16 h-16 object-cover rounded border border-fog"
          />
          <div>
            <p className="font-mono text-sm text-bark font-medium">{image.originalFilename}</p>
            <div className="flex items-center gap-2 mt-1">
              <OutcomeBadge outcome={image.outcome} />
            </div>
            {violations.length > 0 && (
              <p className="text-xs text-silver mt-1.5">
                Triggered: {violations.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <label className="label">Your Justification</label>
        <textarea
          className="input min-h-[140px] resize-y font-sans"
          placeholder="Explain why you believe this verdict is incorrect. Include any relevant context about the image. (minimum 20 characters)"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          required
        />
        <div className="flex items-center justify-between mt-1 mb-4">
          <p className="text-xs text-silver">
            Minimum 20 characters · {justification.length} typed
          </p>
          {justification.length >= 20 && (
            <span className="text-xs text-emerald-600 font-medium">✓ Ready</span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-4">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={submitting || justification.length < 20} className="btn-primary w-full">
          {submitting ? 'Submitting…' : 'Submit Appeal'}
        </button>
      </form>
    </div>
  );
}
