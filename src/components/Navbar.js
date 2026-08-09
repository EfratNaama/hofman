import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeUnreadAnnouncementsCount } from '../services/announcementService';
import hoffmanLogo from '../logo/Hoffman.png';

function Navbar() {
  const navigate = useNavigate();
  const { authLoading, currentUser, isAdmin, signOutUser } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(currentUser));
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadAnnouncementsCount(0);
      return undefined;
    }

    return subscribeUnreadAnnouncementsCount(
      currentUser.uid,
      setUnreadAnnouncementsCount,
      () => setUnreadAnnouncementsCount(0)
    );
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const mobileMediaQuery = window.matchMedia('(max-width: 760px)');
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const handleBreakpointChange = (event) => {
      if (!event.matches) setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    mobileMediaQuery.addEventListener('change', handleBreakpointChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      mobileMediaQuery.removeEventListener('change', handleBreakpointChange);
    };
  }, [isMobileMenuOpen]);

  const navLinkStyle = ({ isActive }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px',
    padding: '0.75rem 0',
    textDecoration: 'none',
    textDecorationLine: isActive ? 'underline' : 'none',
    textDecorationThickness: '2px',
    textUnderlineOffset: '8px',
    fontSize: '1.125rem',
    fontWeight: 500,
    color: isActive ? '#0f2240' : '#334155',
    backgroundColor: 'transparent',
    border: '0',
    transition: 'color 0.2s ease, text-decoration-color 0.2s ease',
  });

  const authButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px',
    padding: '0.75rem 0',
    border: '0',
    backgroundColor: 'transparent',
    color: '#334155',
    fontSize: '1.125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s ease, text-decoration-color 0.2s ease',
  };

  const handleLogout = async () => {
    try {
      await signOutUser?.();
      setIsLoggedIn(false);
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const messagesLinkStyle = ({ isActive }) => ({
    ...navLinkStyle({ isActive }),
    flexDirection: 'row-reverse',
    gap: '6px',
  });

  const renderNavigationItems = () => (
    <>
      <NavLink end to="/" className="navbar-link" style={navLinkStyle}>דף הבית</NavLink>

      {!authLoading && isLoggedIn && (
        <>
          {isAdmin ? (
            <>
              <NavLink to="/admin-dashboard" className="navbar-link" style={navLinkStyle}>לוח בקרה</NavLink>
              <NavLink to="/admin/activities" className="navbar-link" style={navLinkStyle}>ניהול פעילויות</NavLink>
              <NavLink to="/users" className="navbar-link" style={navLinkStyle}>משתמשים</NavLink>
              <NavLink to="/gallery" className="navbar-link" style={navLinkStyle}>גלריה</NavLink>
              <NavLink to="/admin/announcements" className="navbar-link" style={navLinkStyle}>ניהול הודעות</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/activities" className="navbar-link" style={navLinkStyle}>פעילויות</NavLink>
              <NavLink to="/gallery" className="navbar-link" style={navLinkStyle}>גלריה</NavLink>
              <NavLink
                to="/announcements"
                className="navbar-link"
                style={messagesLinkStyle}
                aria-label={unreadAnnouncementsCount > 0 ? `יש ${unreadAnnouncementsCount} הודעות חדשות` : 'הודעות'}
              >
                הודעות
                {unreadAnnouncementsCount > 0 && (
                  <span className="navbar-notification-badge">
                    {unreadAnnouncementsCount > 99 ? '99+' : unreadAnnouncementsCount}
                  </span>
                )}
              </NavLink>
            </>
          )}
          <button type="button" className="navbar-link" style={authButtonStyle} onClick={handleLogout}>התנתקות</button>
          {!isAdmin && (
            <NavLink to="/personal-area" className="navbar-link navbar-link--personal-area" style={navLinkStyle}>אזור אישי</NavLink>
          )}
        </>
      )}

      {!authLoading && !isLoggedIn && (
        <NavLink to="/login" className="navbar-link" style={navLinkStyle}>כניסה</NavLink>
      )}
    </>
  );

  return (
    <nav
      aria-label="תפריט ראשי"
      dir="rtl"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        boxShadow: '0 8px 24px rgba(15, 34, 64, 0.08)',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div
        className="navbar-inner"
        style={{
          width: '100%',
          margin: '0 auto',
          padding: '16px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="navbar-menu-button"
          aria-label={isMobileMenuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <Menu aria-hidden="true" />
        </button>

        <NavLink
          end
          to="/"
          aria-label="בית הופמן"
          style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}
        >
          <img
            src={hoffmanLogo}
            alt="בית הופמן"
            style={{
              display: 'block',
              width: 'auto',
              height: '56px',
              maxWidth: '170px',
              objectFit: 'contain',
              transform: 'scale(1.18)',
              transformOrigin: 'right center',
            }}
          />
        </NavLink>

        <div className="navbar-desktop-links" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {renderNavigationItems()}
        </div>
      </div>

      <div
        className={`navbar-drawer-overlay${isMobileMenuOpen ? ' is-open' : ''}`}
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside
        id="mobile-navigation-drawer"
        className={`navbar-drawer${isMobileMenuOpen ? ' is-open' : ''}`}
        aria-label="תפריט ניווט"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="navbar-drawer-header">
          <span>תפריט</span>
          <button type="button" className="navbar-drawer-close" aria-label="סגירת תפריט" onClick={() => setIsMobileMenuOpen(false)}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="navbar-drawer-links" onClick={() => setIsMobileMenuOpen(false)}>
          {renderNavigationItems()}
        </div>
      </aside>
    </nav>
  );
}

export default Navbar;
