import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { authLoading, currentUser, signOutUser } = useAuth();

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
    await signOutUser();
  };

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
            בית
          </NavLink>
          <NavLink to="/events" style={navLinkStyle}>
            פעילויות
          </NavLink>
          <NavLink to="/gallery" style={navLinkStyle}>
            גלריה
          </NavLink>
          <NavLink to="/users" style={navLinkStyle}>
            משתמשים
          </NavLink>
          {!authLoading && !currentUser && (
            <NavLink to="/login" style={navLinkStyle}>
              כניסה
            </NavLink>
          )}
          {!authLoading && currentUser && (
            <button type="button" style={authButtonStyle} onClick={handleLogout}>
              התנתקות
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
