import { NavLink } from 'react-router-dom';

const navLinkStyle = ({ isActive }) => ({
  display: 'inline-block',
  padding: '12px 18px',
  margin: '4px',
  borderRadius: '14px',
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: isActive ? 700 : 600,
  color: isActive ? '#1b3f5b' : '#0d1f2f',
  background: isActive ? '#f0d1a2' : '#e9e5df',
});

function Navbar() {
  return (
    <nav aria-label="תפריט ראשי" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px', padding: '24px 0 18px', maxWidth: '1080px', margin: '0 auto' }}>
        <NavLink end to="/" style={navLinkStyle}>בית</NavLink>
        <NavLink to="/users" style={navLinkStyle}>משתמשים</NavLink>
        <NavLink to="/events" style={navLinkStyle}>אירועים</NavLink>
        <NavLink to="/gallery" style={navLinkStyle}>גלריה</NavLink>
        <NavLink to="/login" style={navLinkStyle}>כניסה</NavLink>
      </nav>
  );
}

export default Navbar;
