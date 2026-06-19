import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

export default function Submit() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addFiles = useCallback((incoming) => {
    setError('');
    const valid = [];
    const errs = [];
    Array.from(incoming).forEach((file) => {
      if (!ALLOWED.includes(file.type)) { errs.push(`${file.name}: unsupported type`); return; }
      if (file.size > MAX_SIZE) { errs.push(`${file.name}: exceeds 10 MB`); return; }
      valid.push({ file, preview: URL.createObjectURL(file), id: crypto.randomUUID() });
    });
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) { errs.push(`Maximum ${MAX_FILES} files.`); return combined.slice(0, MAX_FILES); }
      return combined;
    });
    if (errs.length) setError(errs.join(' · '));
  }, []);

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const handleSubmit = async () => {
    if (!files.length) return;
    setError('');
    setSubmitting(true);
    try {
      const form = new FormData();
      files.forEach(({ file }) => form.append('images', file));
      const res = await client.post('/submissions', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/submissions/${res.data.submission._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-bark tracking-tight mb-1">Submit Images</h1>
        <p className="text-silver text-sm">Up to {MAX_FILES} images — each screened independently.</p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-colors cursor-pointer
          ${dragging ? 'border-terra bg-terra/5' : 'border-fog hover:border-sand/60'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple accept={ALLOWED.join(',')} className="hidden"
          onChange={(e) => addFiles(e.target.files)} />
        <Upload size={28} className="mx-auto text-silver mb-3" />
        <p className="text-bark font-medium mb-1">Drop images here, or click to browse</p>
        <p className="text-xs text-silver tracking-wide">JPG · PNG · WEBP · max 10 MB each</p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="text-xs font-semibold text-bark-mid uppercase tracking-widest mb-3">
            Queued — {files.length}/{MAX_FILES}
          </div>
          {files.map(({ file, preview, id }) => (
            <div key={id} className="flex items-center gap-3 bg-cream border border-fog rounded-2xl px-4 py-3 hover:border-sand/40 transition-colors">
              <img src={preview} alt="" className="w-10 h-10 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-bark truncate font-mono">{file.name}</p>
                <p className="text-xs text-silver">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(id); }}
                className="text-silver hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <button onClick={handleSubmit} disabled={!files.length || submitting} className="btn-primary inline-flex items-center gap-2">
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Screening…</>
          ) : (
            <><ImageIcon size={14} />Submit {files.length > 0 ? `${files.length} image${files.length > 1 ? 's' : ''}` : 'images'}</>
          )}
        </button>
        {submitting && <p className="text-xs text-silver mt-2">AI is screening your images…</p>}
      </div>
    </div>
  );
}
