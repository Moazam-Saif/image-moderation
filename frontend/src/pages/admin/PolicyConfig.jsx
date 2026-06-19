import { useEffect, useState } from 'react';
import client from '../../api/client';
import { Save, CheckCircle } from 'lucide-react';

const CATEGORY_LABELS = {
  graphic_violence:       'Graphic Violence',
  hate_symbols:           'Hate Symbols',
  self_harm:              'Self-Harm',
  extremist_propaganda:   'Extremist Propaganda',
  weapons_contraband:     'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

const CATEGORY_DESCRIPTIONS = {
  graphic_violence:       'Depictions of physical harm, gore, or serious injury.',
  hate_symbols:           'Extremist insignia or terrorist organization imagery.',
  self_harm:              'Content depicting or glorifying self-inflicted injury.',
  extremist_propaganda:   'Content promoting or recruiting for violent movements.',
  weapons_contraband:     'Illegal weapons, drug manufacturing, or trafficking.',
  harassment_humiliation: 'Content degrading or threatening an identifiable person.',
};

function PolicyCard({ policy, onSaved }) {
  const [local, setLocal] = useState({ ...policy });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const isDirty = local.enabled !== policy.enabled ||
    local.confidenceThreshold !== policy.confidenceThreshold ||
    local.enforcementBehavior !== policy.enforcementBehavior;

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await client.patch(`/admin/policies/${policy.category}`, {
        enabled: local.enabled,
        confidenceThreshold: local.confidenceThreshold,
        enforcementBehavior: local.enforcementBehavior,
      });
      onSaved(res.data.policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className={`card transition-all ${!local.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-bark">{CATEGORY_LABELS[policy.category]}</h3>
          <p className="text-xs text-silver mt-0.5">{CATEGORY_DESCRIPTIONS[policy.category]}</p>
        </div>
        <button
          onClick={() => setLocal({ ...local, enabled: !local.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors flex-shrink-0 ml-4
            ${local.enabled ? 'bg-terra' : 'bg-fog'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
            ${local.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-bark-mid uppercase tracking-widest">Confidence Threshold</label>
          <span className="font-mono text-sm font-semibold text-terra">{local.confidenceThreshold}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={local.confidenceThreshold}
          onChange={(e) => setLocal({ ...local, confidenceThreshold: Number(e.target.value) })}
          disabled={!local.enabled}
          className="w-full h-1.5 rounded-full appearance-none bg-fog
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-terra [&::-webkit-slider-thumb]:cursor-pointer
            disabled:opacity-50" />
        <div className="flex justify-between text-xs text-silver mt-1">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-xs font-semibold text-bark-mid uppercase tracking-widest block mb-2">Enforcement</label>
        <div className="grid grid-cols-2 gap-2">
          {['auto_block', 'flag_review'].map((b) => (
            <button key={b} disabled={!local.enabled}
              onClick={() => setLocal({ ...local, enforcementBehavior: b })}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors
                ${local.enforcementBehavior === b
                  ? b === 'auto_block' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500'
                  : 'border-fog text-silver hover:border-bark-mid hover:text-bark'}
                disabled:opacity-50 disabled:cursor-not-allowed`}>
              {b === 'auto_block' ? '⛔ Auto-Block' : '🔍 Flag for Review'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-fog">
        <p className="text-xs text-silver">
          {policy.updatedBy ? `Last changed by ${policy.updatedBy.email}` : 'Default'}
          {policy.updatedAt && ` · ${new Date(policy.updatedAt).toLocaleDateString()}`}
        </p>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-600">{error}</span>}
          {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={12} />Saved</span>}
          <button onClick={handleSave} disabled={!isDirty || saving} className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40">
            <Save size={12} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PolicyConfig() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/policies')
      .then((res) => setPolicies(res.data.policies || []))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (updated) => {
    setPolicies((prev) => prev.map((p) => p.category === updated.category ? updated : p));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-terra border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-bark tracking-tight mb-1">Policy Config</h1>
        <p className="text-silver text-sm">Changes apply to future submissions only.</p>
      </div>
      <div className="space-y-4">
        {policies.map((p) => <PolicyCard key={p.category} policy={p} onSaved={handleSaved} />)}
      </div>
    </div>
  );
}
