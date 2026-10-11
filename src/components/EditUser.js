import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import UserForm from './UserForm';
import LogoLoader from './LogoLoader';
import { getUserById, updateUser } from '../services/usersService';
import { formatDateTimeInput } from '../utils/dateUtils';

/*
 * Page shell styles, scoped under .aue (same look as the user details page).
 * The form itself is styled inside UserForm.js.
 */
const PAGE_STYLES = `
.aue * { font-size: inherit; box-sizing: border-box; }
.aue {
  min-height: calc(100vh - 96px); padding: 28px 20px 64px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.aue-shell { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; animation: aue-in .5s cubic-bezier(.2,.7,.2,1) both; }
.aue a:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
.aue-back { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; color: #3f6b5f; font-weight: 700; text-decoration: none; }
.aue-back:hover { color: #2c4d44; text-decoration: underline; text-underline-offset: 4px; }
.aue-head { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border-radius: 22px; background: linear-gradient(135deg, #f6eee8 0%, #e6efec 100%); border: 1px solid #ece3da; }
.aue-head__icon { width: 64px; height: 64px; flex: 0 0 auto; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #a84f3d; color: #fff; font-size: 1.5rem; font-weight: 800; border: 3px solid #fff; box-shadow: 0 6px 16px rgba(90,51,39,.15); }
.aue-head__eyebrow { margin: 0; font-size: 0.85rem; font-weight: 700; color: #a84f3d; }
.aue-head__title { margin: 2px 0 0; font-size: clamp(1.6rem, 3vw, 2rem); font-weight: 800; line-height: 1.15; overflow-wrap: anywhere; }
.aue-error { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }
.aue-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 28px; border-radius: 20px; background: #fff; border: 1px solid #ece3da; }
.aue-btn { display: inline-flex; align-items: center; min-height: 46px; padding: 0 18px; border-radius: 12px; border: 1px solid #e3d7cc; background: #fff; color: #2b211c; font-weight: 800; text-decoration: none; }
@keyframes aue-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .aue-shell { animation: none; } }
`;

const getInitials = (user) => {
  const name = String(user.fullName || user.email || '?').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 1);
};

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      setError('');

      try {
        const userData = await getUserById(id);
        setUser(userData);
      } catch (err) {
        setError('לא ניתן לטעון את המשתמש.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [id]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await updateUser(id, formData);
      navigate(`/users/${id}`);
    } catch (err) {
      setError('לא ניתן לעדכן את המשתמש. נסו שוב.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LogoLoader label="טוען משתמש..." />;
  }

  if (!user) {
    return (
      <section className="aue" dir="rtl">
        <style>{PAGE_STYLES}</style>
        <div className="aue-shell">
          <div className="aue-empty">
            <strong style={{ fontSize: '1.2rem' }}>{error || 'המשתמש לא נמצא.'}</strong>
            <Link className="aue-btn" to="/users">חזרה למשתמשים</Link>
          </div>
        </div>
      </section>
    );
  }

  const initialValues = {
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'resident',
    status: user.status || 'active',
    createdAt: formatDateTimeInput(user.createdAt),
  };

  return (
    <section className="aue" dir="rtl">
      <style>{PAGE_STYLES}</style>
      <div className="aue-shell">
        <Link className="aue-back" to={`/users/${id}`}>
          <ArrowRight size={18} aria-hidden="true" />
          חזרה לפרטי המשתמש
        </Link>

        <header className="aue-head">
          <span className="aue-head__icon" aria-hidden="true">{getInitials(user)}</span>
          <div>
            <p className="aue-head__eyebrow">עריכת משתמש</p>
            <h1 className="aue-head__title">{user.fullName || user.email || 'משתמש'}</h1>
          </div>
        </header>

        {error && <div className="aue-error" role="alert">{error}</div>}

        <UserForm initialValues={initialValues} isSubmitting={isSubmitting} submitLabel="שמירת שינויים" onSubmit={handleSubmit} />
      </div>
    </section>
  );
}

export default EditUser;
