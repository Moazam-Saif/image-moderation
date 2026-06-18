import { useEffect, useState } from 'react';
import client from '../../api/client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const CATEGORY_LABELS = {
  graphic_violence:       'Graphic Violence',
  hate_symbols:           'Hate Symbols',
  self_harm:              'Self-Harm',
  extremist_propaganda:   'Extremist Propaganda',
  weapons_contraband:     'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

const PALETTE = {
  gold:    '#ac956a',
  bark:    '#6a5b40',
  fog:     '#e2e2e2',
  silver:  '#c2c2c2',
  red:     '#dc2626',
  amber:   '#d97706',
  emerald: '#059669',
};

const PIE_COLORS = {
  approved: PALETTE.emerald,
  flagged:  PALETTE.amber,
  blocked:  PALETTE.red,
  pending:  PALETTE.silver,
};

const APPEAL_COLORS = {
  accepted: PALETTE.emerald,
  rejected: PALETTE.red,
  pending:  PALETTE.amber,
};

function StatCard({ label, value, sub, color = 'text-bark' }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold ${color}`}>{value ?? '—'}</div>
      <div className="text-xs text-silver uppercase tracking-wide mt-1">{label}</div>
      {sub && <div className="text-xs text-silver mt-0.5">{sub}</div>}
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
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const verdictPieData = overview ? Object.entries(overview.verdicts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v })) : [];

  const appealPieData = appealStats ? Object.entries(appealStats.breakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bark">Analytics Dashboard</h1>
        <p className="text-sm text-silver mt-1">Platform-wide moderation activity</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Images" value={overview?.totalImages} />
        <StatCard label="Approved" value={overview?.verdicts?.approved} color="text-emerald-600" />
        <StatCard label="Flagged" value={overview?.verdicts?.flagged} color="text-amber-600" />
        <StatCard label="Blocked" value={overview?.verdicts?.blocked} color="text-red-600" />
      </div>

      {/* Volume chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-bark">Submission Volume</h2>
          <div className="flex gap-1">
            {['day', 'week', 'month'].map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 text-xs rounded font-medium capitalize transition-colors
                  ${granularity === g ? 'bg-gold text-white' : 'bg-fog text-silver hover:text-bark'}`}
              >
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
              <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.fog} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: PALETTE.silver }} />
              <YAxis tick={{ fontSize: 11, fill: PALETTE.silver }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderColor: PALETTE.fog, borderRadius: 6, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="count" stroke={PALETTE.gold} strokeWidth={2} dot={false} name="Submissions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Verdict distribution pie */}
        <div className="card">
          <h2 className="font-semibold text-bark mb-4">Verdict Distribution</h2>
          {verdictPieData.length === 0 ? (
            <p className="text-silver text-sm py-4 text-center">No verdict data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={verdictPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {verdictPieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || PALETTE.silver} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Appeals pie */}
        <div className="card">
          <h2 className="font-semibold text-bark mb-1">Appeals Overview</h2>
          <p className="text-xs text-silver mb-4">
            {appealStats?.total ?? 0} total · {appealStats?.resolutionRate ?? 0}% resolved
            {appealStats?.avgResolutionHours != null && ` · avg ${appealStats.avgResolutionHours}h`}
          </p>
          {appealPieData.length === 0 ? (
            <p className="text-silver text-sm py-4 text-center">No appeal data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={appealPieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {appealPieData.map((entry) => (
                    <Cell key={entry.name} fill={APPEAL_COLORS[entry.name] || PALETTE.silver} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category violations bar chart */}
      <div className="card mb-6">
        <h2 className="font-semibold text-bark mb-4">Violations by Category</h2>
        {categories.length === 0 ? (
          <p className="text-silver text-sm py-4 text-center">No violation data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories.map((c) => ({ ...c, label: CATEGORY_LABELS[c.category] ?? c.category }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.fog} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: PALETTE.silver }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: PALETTE.silver }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderColor: PALETTE.fog, borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="violationCount" fill={PALETTE.bark} radius={[4, 4, 0, 0]} name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top users */}
      <div className="grid grid-cols-2 gap-6">
        {[
          { title: 'Top Users by Submissions', data: topSubs, key: 'submissions' },
          { title: 'Top Users by Violations',  data: topViolations, key: 'violations' },
        ].map(({ title, data, key }) => (
          <div key={key} className="card">
            <h2 className="font-semibold text-bark mb-4">{title}</h2>
            {data.length === 0 ? (
              <p className="text-silver text-sm">No data.</p>
            ) : (
              <ol className="space-y-2">
                {data.map((u, i) => (
                  <li key={u.userId} className="flex items-center justify-between text-sm">
                    <span className="text-silver font-mono text-xs mr-2 w-4">{i + 1}.</span>
                    <span className="flex-1 text-bark truncate">{u.email}</span>
                    <span className={`font-semibold font-mono ml-3 ${key === 'violations' ? 'text-red-600' : 'text-gold'}`}>
                      {u.count}
                    </span>
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
