import { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import RightPanel from './RightPanel';
import { Link } from 'react-router-dom';


const HEADER_H = 60;

export default function Layout({ children }) {
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;
      const opacity = Math.max(0.15, 1 - window.scrollY / 100);
      headerRef.current.style.opacity = opacity;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f1ea', position: 'relative' }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 50, display: 'flex', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <Link
          to="/dashboard"
          style={{
            textDecoration: 'none',
            color: 'white',
          }}
        >
          <div
            ref={headerRef}
            style={{
              background: '#a56c6c',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '50px',
              paddingRight: '50px',
              width: '500px',
              height: `${HEADER_H}px`,
              borderRadius: '0 0 100px 100px',
              pointerEvents: 'auto',
              transition: 'opacity 0.1s ease',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 600,
                letterSpacing: '0.2em',
                fontSize: '26px',
              }}
            >
              CONTENT LENS AI
            </span>
          </div>
        </Link>
      </div>

      {/* Left sidebar */}
      <div style={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 40 }}>
        <Navbar />
      </div>

      {/* Right panel */}
      <div style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 40 }}>
        <RightPanel />
      </div>

      {/* Main content */}
      <main style={{
        marginLeft: '270px', marginRight: '80px',
        paddingTop: '100px', paddingBottom: '40px',
        paddingLeft: '80px', paddingRight: '40px',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
