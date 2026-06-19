import { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import RightPanel from './RightPanel';

export default function Layout({ children }) {
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;
      const opacity = Math.max(0.25, 1 - window.scrollY / 110);
      headerRef.current.style.opacity = opacity;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div ref={headerRef} style={{
          background: '#a56c6c',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          fontSize: '14px',
          width: '470px',
          height: '60px',
          borderRadius: '0 0 100px 100px',
          pointerEvents: 'auto',
          transition: 'opacity 0.1s ease',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
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
