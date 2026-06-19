import Navbar from './Navbar';
import RightPanel from './RightPanel';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f1ea', position: 'relative' }}>

      {/* Header — fixed to top, full width, centered */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: '#a56c6c',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          fontSize: '14px',
          width: '480px',
          height: '60px',
          borderRadius: '0 0 100px 100px',
          pointerEvents: 'auto',
        }}>
          MODERATE AI
        </div>
      </div>

      {/* Left sidebar — fixed, vertically centered, flush left */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
      }}>
        <Navbar />
      </div>

      {/* Right panel — fixed, bottom, flush right */}
      <div style={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        zIndex: 40,
      }}>
        <RightPanel />
      </div>

      {/* Main content */}
      <main style={{
        marginLeft: '270px',
        marginRight: '80px',
        paddingTop: '90px',
        paddingBottom: '40px',
        paddingLeft: '80px',
        paddingRight: '40px',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
