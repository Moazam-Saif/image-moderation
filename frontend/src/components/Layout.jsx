import Navbar from './Navbar';
import RightPanel from './RightPanel';

export default function Layout({ children }) {
  return (
    <div
      className="min-h-screen bg-parchment"
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 80px',
        gridTemplateRows: '60px 1fr',
        minHeight: '100vh',
      }}
    >
      {/* Header capsule — spans ALL 3 columns so it centers over the full page */}
      <div
        style={{ gridColumn: '1 / 4', gridRow: '1' }}
        className="flex items-end justify-center"
      >
        <div
          className="bg-terra text-white flex items-center justify-center gap-3 font-semibold tracking-[0.2em] text-sm"
          style={{
            width: '280px',
            height: '70px',
            borderRadius: '0 0 100px 100px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          MODERATE AI
        </div>
      </div>

      {/* Left sidebar — floating capsule */}
      <div
        style={{ gridColumn: '1', gridRow: '2' }}
        className="flex items-center"
      >
        <Navbar />
      </div>

      {/* Main content */}
      <main
        style={{ gridColumn: '2', gridRow: '2' }}
        className="px-10 py-10 overflow-y-auto"
      >
        {children}
      </main>

      {/* Right sidebar — user avatar + logout */}
      <div
        style={{ gridColumn: '3', gridRow: '2' }}
        className="flex items-end justify-end pb-10"
      >
        <RightPanel />
      </div>
    </div>
  );
}