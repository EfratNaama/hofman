import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeUnreadAnnouncementsCount } from '../services/announcementService';

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
    padding: '0.75rem 1.25rem',
    borderRadius: '999px',
    textDecoration: 'none',
    fontSize: '1.125rem',
    fontWeight: 800,
    color: isActive ? '#ffffff' : '#0f2240',
    backgroundColor: isActive ? '#0f2240' : 'transparent',
    border: `1px solid ${isActive ? '#0f2240' : '#e5e7eb'}`,
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
  });

  const authButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px',
    padding: '0.75rem 1.25rem',
    borderRadius: '999px',
    border: '1px solid #0f2240',
    backgroundColor: '#0f2240',
    color: '#ffffff',
    fontSize: '1.125rem',
    fontWeight: 800,
    cursor: 'pointer',
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
    position: 'relative',
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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: '#0f2240', fontSize: '1.35rem', fontWeight: 900 }}>
          בית הופמן
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
          <NavLink end to="/" style={navLinkStyle}>
            דף הבית
          </NavLink>

          {!authLoading && isLoggedIn && (
            <>
              {isAdmin ? (
                <>
                  <NavLink to="/admin-dashboard" style={navLinkStyle}>
                    לוח בקרה
                  </NavLink>
                  <NavLink to="/admin/activities" style={navLinkStyle}>
                    ניהול פעילויות
                  </NavLink>
                  <NavLink to="/users" style={navLinkStyle}>
                    משתמשים
                  </NavLink>
                  <NavLink to="/gallery" style={navLinkStyle}>
                    גלריה
                  </NavLink>
                  <NavLink to="/admin/announcements" style={navLinkStyle}>
                    ניהול הודעות
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/activities" style={navLinkStyle}>
                    פעילויות
                  </NavLink>
                  <NavLink to="/personal-area" style={navLinkStyle}>
                    אזור אישי
                  </NavLink>
                  <NavLink to="/gallery" style={navLinkStyle}>
                    גלריה
                  </NavLink>
                  <NavLink
                    to="/announcements"
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
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          minWidth: '20px',
                          height: '20px',
                          padding: '0 5px',
                          borderRadius: '999px',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: '2px solid #ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 900,
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
              <button type="button" style={authButtonStyle} onClick={handleLogout}>
                התנתקות
              </button>
            </>
          )}

          {!authLoading && !isLoggedIn && (
            <>
              <NavLink to="/login" style={navLinkStyle}>
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
