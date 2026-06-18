export default function OutcomeBadge({ outcome }) {
  const map = {
    approved: 'badge-approved',
    flagged:  'badge-flagged',
    blocked:  'badge-blocked',
    pending:  'badge-pending',
  };
  return (
    <span className={map[outcome] || 'badge-pending'}>
      {outcome?.toUpperCase() ?? 'UNKNOWN'}
    </span>
  );
}
