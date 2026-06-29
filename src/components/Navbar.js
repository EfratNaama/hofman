import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeUnreadAnnouncementsCount } from '../services/announcementService';
import hoffmanLogo from '../logo/Hoffman.png';

function Navbar() {
  const navigate = useNavigate();
  const { authLoading, currentUser, isAdmin, signOutUser } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(currentUser));
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

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
        <NavLink
          end
          to="/"
          aria-label="בית הופמן"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            textDecoration: 'none',
          }}
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

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          <NavLink end to="/" className="navbar-link" style={navLinkStyle}>
            דף הבית
          </NavLink>

          {!authLoading && isLoggedIn && (
            <>
              {isAdmin ? (
                <>
                  <NavLink to="/admin-dashboard" className="navbar-link" style={navLinkStyle}>
                    לוח בקרה
                  </NavLink>
                  <NavLink to="/admin/activities" className="navbar-link" style={navLinkStyle}>
                    ניהול פעילויות
                  </NavLink>
                  <NavLink to="/users" className="navbar-link" style={navLinkStyle}>
                    משתמשים
                  </NavLink>
                  <NavLink to="/gallery" className="navbar-link" style={navLinkStyle}>
                    גלריה
                  </NavLink>
                  <NavLink to="/admin/announcements" className="navbar-link" style={navLinkStyle}>
                    ניהול הודעות
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/activities" className="navbar-link" style={navLinkStyle}>
                    פעילויות
                  </NavLink>
                  <NavLink to="/personal-area" className="navbar-link" style={navLinkStyle}>
                    אזור אישי
                  </NavLink>
                  <NavLink to="/gallery" className="navbar-link" style={navLinkStyle}>
                    גלריה
                  </NavLink>
                  <NavLink
                    to="/announcements"
                    className="navbar-link"
                    style={messagesLinkStyle}
                    aria-label={
                      unreadAnnouncementsCount > 0
                        ? `יש ${unreadAnnouncementsCount} הודעות חדשות`
                        : 'הודעות'
                    }
                  >
                    הודעות
                    {unreadAnnouncementsCount > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '20px',
                          height: '20px',
                          padding: '0 5px',
                          flexShrink: 0,
                          borderRadius: '999px',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: '2px solid #ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          lineHeight: '16px',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        {unreadAnnouncementsCount > 99 ? '99+' : unreadAnnouncementsCount}
                      </span>
                    )}
                  </NavLink>
                </>
              )}
              <button type="button" className="navbar-link" style={authButtonStyle} onClick={handleLogout}>
                התנתקות
              </button>
            </>
          )}

          {!authLoading && !isLoggedIn && (
            <>
              <NavLink to="/login" className="navbar-link" style={navLinkStyle}>
                כניסה
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
