import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import RightPanel from './RightPanel';

const COLORS = { user: '#c8976a', admin: '#6a8fc8' };

// SVG viewBox internal coords
const VB_TOP    = 28;   // top of USER lobe
const VB_BOT    = 172;  // bottom of ADMIN lobe
const VB_HEIGHT = VB_BOT - VB_TOP; // 144 units — the actual shape height
const BRIDGE_TOP    = 82;
const BRIDGE_BOTTOM = 118;
const BRIDGE_H      = BRIDGE_BOTTOM - BRIDGE_TOP; // 36 units

// As fractions of VB_HEIGHT (144):
// USER lobe:   28→82  = 54 units = 37.5%
// Bridge:      82→118 = 36 units = 25%
// ADMIN lobe: 118→172 = 54 units = 37.5%
//
// We want click zones 45% / 10% / 45% of TOGGLE_H.
// The SVG renders at TOGGLE_H pixels tall with viewBox cropped to 144 units,
// so 1 pixel = 144/TOGGLE_H units.
// Zone boundaries in pixels:
//   USER zone:   0  → TOGGLE_H * 0.45
//   Bridge zone: TOGGLE_H * 0.45 → TOGGLE_H * 0.55
//   ADMIN zone:  TOGGLE_H * 0.55 → TOGGLE_H

const HEADER_H = 72;
const TOGGLE_W  = 60;
const TOGGLE_H  = HEADER_H - 16; // 56px

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function RoleToggle({ isAdmin, onToggle }) {
  const fillFromRef   = useRef(null);
  const fillBridgeRef = useRef(null);
  const fillToRef     = useRef(null);
  const bridgeRectRef = useRef(null);
  const labelUserRef  = useRef(null);
  const labelAdminRef = useRef(null);
  const animatingRef  = useRef(false);
  const stateRef      = useRef(isAdmin ? 'admin' : 'user');

  function resetStatic(state) {
    const fFrom   = fillFromRef.current;
    const fBridge = fillBridgeRef.current;
    const fTo     = fillToRef.current;
    const bRect   = bridgeRectRef.current;
    const lUser   = labelUserRef.current;
    const lAdmin  = labelAdminRef.current;
    if (!fFrom) return;

    fFrom.setAttribute('clip-path', state === 'user' ? 'url(#rclipUser)' : 'url(#rclipAdmin)');
    fFrom.style.fill    = COLORS[state];
    fFrom.style.opacity = '1';

    fBridge.style.opacity = '0';
    fTo.style.opacity     = '0';
    bRect.setAttribute('y', BRIDGE_TOP);
    bRect.setAttribute('height', 0);

    lUser.setAttribute('fill',  state === 'user'  ? '#ffffff' : 'rgba(255,255,255,0.4)');
    lAdmin.setAttribute('fill', state === 'admin' ? '#ffffff' : 'rgba(255,255,255,0.4)');
  }

  useEffect(() => {
    stateRef.current = isAdmin ? 'admin' : 'user';
    resetStatic(stateRef.current);
  }, [isAdmin]);

  function runTransition(targetOverride) {
    if (animatingRef.current) return;
    if (targetOverride && targetOverride === stateRef.current) return;

    animatingRef.current = true;
    const currentState = stateRef.current;
    const goingToAdmin = targetOverride ? targetOverride === 'admin' : currentState === 'user';
    const toColor      = goingToAdmin ? COLORS.admin : COLORS.user;
    const targetState  = goingToAdmin ? 'admin' : 'user';

    const fFrom   = fillFromRef.current;
    const fBridge = fillBridgeRef.current;
    const fTo     = fillToRef.current;
    const bRect   = bridgeRectRef.current;
    const lUser   = labelUserRef.current;
    const lAdmin  = labelAdminRef.current;

    fFrom.style.fill      = COLORS[currentState];
    fFrom.style.opacity   = '1';
    fBridge.style.fill    = toColor;
    fBridge.style.opacity = '1';
    fTo.style.fill        = toColor;
    fTo.setAttribute('clip-path', goingToAdmin ? 'url(#rclipAdmin)' : 'url(#rclipUser)');
    fTo.style.opacity = '0';
    bRect.setAttribute('height', 0);
    bRect.setAttribute('y', goingToAdmin ? BRIDGE_TOP : BRIDGE_BOTTOM);

    const duration = 480;
    const start = performance.now();

    function step(now) {
      const t     = Math.min(1, (now - start) / duration);
      const eased = easeInOutQuad(t);
      const h     = BRIDGE_H * eased;

      if (goingToAdmin) {
        bRect.setAttribute('y', BRIDGE_TOP);
        bRect.setAttribute('height', h);
      } else {
        bRect.setAttribute('y', BRIDGE_BOTTOM - h);
        bRect.setAttribute('height', h);
      }

      if (t >= 0.5) {
        lUser.setAttribute('fill',  goingToAdmin ? 'rgba(255,255,255,0.4)' : '#ffffff');
        lAdmin.setAttribute('fill', goingToAdmin ? '#ffffff' : 'rgba(255,255,255,0.4)');
      }

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        fTo.style.opacity    = '1';
        stateRef.current     = targetState;
        animatingRef.current = false;
        resetStatic(targetState);
        onToggle(targetState);
      }
    }
    requestAnimationFrame(step);
  }

  // Click zone heights in px (45 / 10 / 45 of TOGGLE_H)
  const userZoneH   = TOGGLE_H * 0.45;
  const bridgeZoneH = TOGGLE_H * 0.10;
  const adminZoneH  = TOGGLE_H * 0.45;

  return (
    // Outer wrapper: relative so SVG can overlay exactly
    <div style={{ position: 'relative', width: TOGGLE_W, height: TOGGLE_H, flexShrink: 0 }}>

      {/* Click zones — stacked, full width, no pointer-events on SVG */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {/* USER zone — top 45% */}
        <div
          onClick={() => runTransition('user')}
          style={{ height: userZoneH, cursor: 'pointer' }}
        />
        {/* Bridge zone — middle 10%, inert */}
        <div style={{ height: bridgeZoneH }} />
        {/* ADMIN zone — bottom 45% */}
        <div
          onClick={() => runTransition('admin')}
          style={{ height: adminZoneH, cursor: 'pointer' }}
        />
      </div>

      {/* SVG — pointer-events none, sits on top visually but not for clicks */}
      {/*
        viewBox crops to the exact shape bounds: y=28 to y=172 (144 units tall, 280 wide).
        Rendered at TOGGLE_W × TOGGLE_H pixels.
        This means:
          - USER lobe (28→82, 54 units) renders as 54/144 * 56px ≈ 21px  (37.5%)
          - Bridge   (82→118, 36 units) renders as 36/144 * 56px ≈ 14px  (25%)
          - ADMIN lobe(118→172,54 units) renders as 54/144 * 56px ≈ 21px (37.5%)
        Click zones are 45/10/45% = 25.2 / 5.6 / 25.2px — slightly larger than
        the visual lobes, giving comfortable tap targets that still feel precise.
      */}
      <svg
        viewBox={`0 ${VB_TOP} 280 ${VB_HEIGHT}`}
        width={TOGGLE_W}
        height={TOGGLE_H}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 2 }}
      >
        <defs>
          <path id="rp" d="
            M 30 28 L 215 28
            C 232 28 245 40 245 55
            C 245 70 232 82 215 82
            L 175 82 C 160 82 145 90 145 100
            C 145 110 160 118 175 118
            L 215 118 C 232 118 245 130 245 145
            C 245 160 232 172 215 172
            L 30 172 C 13 172 0 160 0 145
            C 0 130 13 118 30 118
            L 70 118 C 85 118 100 110 100 100
            C 100 90 85 82 70 82
            L 30 82 C 13 82 0 70 0 55
            C 0 40 13 28 30 28 Z
          "/>
          {/* clipUser covers the USER lobe in viewBox coords */}
          <clipPath id="rclipUser">
            <rect x="0" y="0" width="280" height="100"/>
          </clipPath>
          {/* clipAdmin covers the ADMIN lobe in viewBox coords */}
          <clipPath id="rclipAdmin">
            <rect x="0" y="100" width="280" height="220"/>
          </clipPath>
          <clipPath id="rclipBridge">
            <rect ref={bridgeRectRef} x="0" y="82" width="280" height="0"/>
          </clipPath>
        </defs>

        {/* Base outline */}
        <use href="#rp" style={{ fill: 'rgba(255,255,255,0.1)', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 6, strokeLinejoin: 'round' }} />
        {/* Animated fills */}
        <use href="#rp" ref={fillFromRef}   clipPath="url(#rclipUser)"   style={{ fill: COLORS.user }} />
        <use href="#rp" ref={fillBridgeRef} clipPath="url(#rclipBridge)" style={{ fill: COLORS.user, opacity: 0 }} />
        <use href="#rp" ref={fillToRef}     clipPath="url(#rclipAdmin)"  style={{ fill: COLORS.admin, opacity: 0 }} />

        {/* Labels — centered in each lobe's viewBox coord space */}
        <text ref={labelUserRef}  x="140" y="55"  style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '0.04em', textAnchor: 'middle', dominantBaseline: 'middle', fill: '#ffffff' }}>USER</text>
        <text ref={labelAdminRef} x="140" y="145" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '0.04em', textAnchor: 'middle', dominantBaseline: 'middle', fill: 'rgba(255,255,255,0.4)' }}>ADMIN</text>
      </svg>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export default function Layout({ children }) {
  const headerRef = useRef(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;
      const opacity = Math.max(0.25, 1 - window.scrollY / 110);
      headerRef.current.style.opacity = opacity;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggle = (targetState) => {
    navigate(targetState === 'admin' ? '/admin/analytics' : '/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f1ea', position: 'relative' }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 50, display: 'flex', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div ref={headerRef} style={{
          background: '#a56c6c',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '50px',
          paddingRight: '50px',
          width: '500px',
          height: `${HEADER_H}px`,
          borderRadius: '0 0 100px 100px',
          pointerEvents: 'auto',
          transition: 'opacity 0.1s ease',
          overflow: 'hidden',
        }}>

          {/* Brand text — 65% of inner width */}
          <span style={{
            flex: '0 0 65%',
            fontWeight: 700,
            letterSpacing: '0.18em',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            MODERATE AI
          </span>

          {/* Divider — 50% of header height, vertically centered */}
          <div style={{
            width: '1.5px',
            height: '45%',
            background: 'rgba(255,255,255,0.35)',
            flexShrink: 0,
            marginRight: '16px',
          }} />

          {/* Toggle */}
          <RoleToggle isAdmin={isAdmin} onToggle={handleToggle} />
        </div>
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
