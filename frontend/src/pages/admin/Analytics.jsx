import { useEffect, useState } from 'react';
import client from '../../api/client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const CATEGORY_LABELS = {
  graphic_violence:       'Graphic Violence',
  hate_symbols:           'Hate Symbols',
  self_harm:              'Self-Harm',
  extremist_propaganda:   'Extremist Propaganda',
  weapons_contraband:     'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

const P = {
  terra:   '#a56c6c',
  sand:    '#b49d6f',
  bark:    '#2c2416',
  fog:     '#e8e4db',
  silver:  '#9a9080',
  red:     '#dc2626',
  amber:   '#d97706',
  emerald: '#059669',
};

const PIE_COLORS = { approved: P.emerald, flagged: P.amber, blocked: P.red, pending: P.silver };
const APPEAL_COLORS = { accepted: P.emerald, rejected: P.red, pending: P.amber };

function StatCard({ label, value, color = 'text-bark' }) {
  return (
    <div className="card text-center">
      <div className={`text-5xl font-bold ${color} mb-1`}>{value ?? '—'}</div>
      <div className="text-xs text-silver uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [volume, setVolume] = useState([]);
  const [categories, setCategories] = useState([]);
  const [appealStats, setAppealStats] = useState(null);
  const [topSubs, setTopSubs] = useState([]);
  const [topViolations, setTopViolations] = useState([]);
  const [granularity, setGranularity] = useState('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/admin/analytics/overview'),
      client.get(`/admin/analytics/volume?granularity=${granularity}`),
      client.get('/admin/analytics/categories'),
      client.get('/admin/analytics/appeals'),
      client.get('/admin/analytics/users?rankBy=submissions&limit=10'),
      client.get('/admin/analytics/users?rankBy=violations&limit=10'),
    ]).then(([ov, vol, cats, apps, subs, viols]) => {
      setOverview(ov.data);
      setVolume(vol.data.data || []);
      setCategories(cats.data.data || []);
      setAppealStats(apps.data);
      setTopSubs(subs.data.data || []);
      setTopViolations(viols.data.data || []);
    }).finally(() => setLoading(false));
  }, [granularity]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-terra border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const verdictPieData = overview ? Object.entries(overview.verdicts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v })) : [];
  const appealPieData  = appealStats ? Object.entries(appealStats.breakdown).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-bark tracking-tight mb-1">Analytics</h1>
        <p className="text-silver text-sm">Platform-wide moderation activity</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Images" value={overview?.totalImages} />
        <StatCard label="Approved"     value={overview?.verdicts?.approved} color="text-emerald-600" />
        <StatCard label="Flagged"      value={overview?.verdicts?.flagged}  color="text-amber-600" />
        <StatCard label="Blocked"      value={overview?.verdicts?.blocked}  color="text-red-600" />
      </div>

      {/* Volume */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-bark">Submission Volume</h2>
          <div className="flex gap-1">
            {['day', 'week', 'month'].map((g) => (
              <button key={g} onClick={() => setGranularity(g)}
                className={`px-4 py-1.5 text-xs rounded-pill font-medium capitalize transition-colors
                  ${granularity === g ? 'bg-terra text-white' : 'bg-fog text-silver hover:text-bark'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        {volume.length === 0 ? (
          <p className="text-silver text-sm py-8 text-center">No data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={volume}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.fog} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: P.silver }} />
              <YAxis tick={{ fontSize: 11, fill: P.silver }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderColor: P.fog, borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke={P.terra} strokeWidth={2} dot={false} name="Submissions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold text-bark mb-4">Verdict Distribution</h2>
          {verdictPieData.length === 0 ? <p className="text-silver text-sm py-4 text-center">No data.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={verdictPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {verdictPieData.map((entry) => <Cell key={entry.name} fill={PIE_COLORS[entry.name] || P.silver} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-bark mb-1">Appeals</h2>
          <p className="text-xs text-silver mb-4">
            {appealStats?.total ?? 0} total · {appealStats?.resolutionRate ?? 0}% resolved
          </p>
          {appealPieData.length === 0 ? <p className="text-silver text-sm py-4 text-center">No data.</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={appealPieData} cx="50%" cy="50%" outerRadius={65} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {appealPieData.map((entry) => <Cell key={entry.name} fill={APPEAL_COLORS[entry.name] || P.silver} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-bark mb-4">Violations by Category</h2>
        {categories.length === 0 ? <p className="text-silver text-sm py-4 text-center">No data.</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories.map((c) => ({ ...c, label: CATEGORY_LABELS[c.category] ?? c.category }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.fog} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: P.silver }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: P.silver }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderColor: P.fog, borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="violationCount" fill={P.terra} radius={[6, 6, 0, 0]} name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { title: 'Top by Submissions', data: topSubs,       key: 'submissions' },
          { title: 'Top by Violations',  data: topViolations, key: 'violations' },
        ].map(({ title, data, key }) => (
          <div key={key} className="card">
            <h2 className="font-semibold text-bark mb-4">{title}</h2>
            {data.length === 0 ? <p className="text-silver text-sm">No data.</p> : (
              <ol className="space-y-2">
                {data.map((u, i) => (
                  <li key={u.userId} className="flex items-center gap-2 text-sm">
                    <span className="text-silver font-mono text-xs w-5">{i + 1}.</span>
                    <span className="flex-1 text-bark truncate">{u.email}</span>
                    <span className={`font-semibold font-mono ${key === 'violations' ? 'text-terra' : 'text-sand'}`}>{u.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
