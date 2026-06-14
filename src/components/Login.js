import { Link } from 'react-router-dom';
import { auth } from '../firebase';

const sectionStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '24px',
  boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
};

const buttonStyle = {
  display: 'inline-block',
  marginTop: '16px',
  padding: '12px 20px',
  borderRadius: '16px',
  background: '#3f6378',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '1rem',
};

function Login() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>כניסה</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>
        התחברו באמצעות פרטי משתמש מנהל. אין רישום עצמי באתר.
      </p>
      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

export default Login;
