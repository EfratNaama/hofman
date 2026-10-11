import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Pencil } from 'lucide-react';
import ActivityForm from './ActivityForm';
import LogoLoader from './LogoLoader';
import { getActivityById, updateActivity } from '../services/activitiesService';
import { getActivityRegistrations } from '../services/activityRegistrationsService';
import { formatActivityDateInput } from '../utils/activityDateUtils';

/*
 * Page shell styles, scoped under .aap (same look as the user pages).
 * The form itself is styled inside ActivityForm.js.
 */
const PAGE_STYLES = `
.aap * { font-size: inherit; box-sizing: border-box; }
.aap {
  min-height: calc(100vh - 96px); padding: 28px 20px 24px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.aap-shell { max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; animation: aap-in .5s cubic-bezier(.2,.7,.2,1) both; }
.aap a:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
.aap-back { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; color: #3f6b5f; font-weight: 700; text-decoration: none; }
.aap-back:hover { color: #2c4d44; text-decoration: underline; text-underline-offset: 4px; }
.aap-head { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border-radius: 22px; background: linear-gradient(135deg, #f6eee8 0%, #e6efec 100%); border: 1px solid #ece3da; }
.aap-head__icon { width: 60px; height: 60px; flex: 0 0 auto; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: #a84f3d; color: #fff; box-shadow: 0 6px 16px rgba(90,51,39,.15); }
.aap-head__eyebrow { margin: 0; font-size: 0.85rem; font-weight: 700; color: #a84f3d; }
.aap-head__title { margin: 2px 0 0; font-size: clamp(1.6rem, 3vw, 2rem); font-weight: 800; line-height: 1.15; overflow-wrap: anywhere; }
.aap-alert { padding: 12px 16px; border-radius: 12px; font-weight: 600; }
.aap-alert--error { background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; }
.aap-alert--success { background: #e6efec; border: 1px solid #c3d8d1; color: #2c4d44; }
.aap-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 28px; border-radius: 20px; background: #fff; border: 1px solid #ece3da; }
.aap-btn { display: inline-flex; align-items: center; min-height: 46px; padding: 0 18px; border-radius: 12px; border: 1px solid #e3d7cc; background: #fff; color: #2b211c; font-weight: 800; text-decoration: none; }
@keyframes aap-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .aap-shell { animation: none; } }
`;

function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [registrationsCount, setRegistrationsCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadActivity() {
      setIsLoading(true);
      setError('');

      try {
        const [activityData, registrations] = await Promise.all([
          getActivityById(id),
          getActivityRegistrations(id),
        ]);
        setActivity(activityData);
        setRegistrationsCount(registrations.length);
      } catch (err) {
        setError('לא ניתן לטעון את פרטי הפעילות לעריכה.');
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [id]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await updateActivity(id, formData);
      navigate(`/activities/${id}`);
    } catch (err) {
      setError('לא ניתן לעדכן את הפעילות. נסו שוב.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LogoLoader label="טוען פעילות..." />;
  }

  if (!activity) {
    return (
      <section className="aap" dir="rtl">
        <style>{PAGE_STYLES}</style>
        <div className="aap-shell">
          <div className="aap-empty">
            <strong style={{ fontSize: '1.2rem' }}>{error || 'הפעילות לא נמצאה.'}</strong>
            <Link className="aap-btn" to="/activities">חזרה לפעילויות</Link>
          </div>
        </div>
      </section>
    );
  }

  const initialValues = {
    ...activity,
    activityDate: formatActivityDateInput(activity.activityDate),
    startDate: formatActivityDateInput(activity.startDate || activity.activityDate),
    endDate: formatActivityDateInput(activity.endDate),
    daysOfWeek:
      Array.isArray(activity.daysOfWeek) && activity.daysOfWeek.length
        ? activity.daysOfWeek
        : activity.dayOfWeek
          ? [activity.dayOfWeek]
          : [],
    maxParticipants: activity.maxParticipants ?? '',
    currentParticipants: registrationsCount ?? activity.currentParticipants ?? 0,
    paymentRequired: activity.paymentRequired ?? activity.requiresPayment ?? false,
    price: activity.price ?? '',
    paymentLink: activity.paymentLink || '',
    whatsappLink: activity.whatsappLink || '',
  };

  return (
    <section className="aap" dir="rtl">
      <style>{PAGE_STYLES}</style>
      <div className="aap-shell">
        <Link className="aap-back" to={`/activities/${id}`}>
          <ArrowRight size={18} aria-hidden="true" />
          חזרה לעמוד הפעילות
        </Link>

        <header className="aap-head">
          <span className="aap-head__icon" aria-hidden="true"><Pencil size={26} /></span>
          <div>
            <p className="aap-head__eyebrow">עריכת פעילות</p>
            <h1 className="aap-head__title">{activity.title || 'פעילות ללא שם'}</h1>
          </div>
        </header>

        {error && <div className="aap-alert aap-alert--error" role="alert">{error}</div>}

        <ActivityForm
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          submitLabel="שמירת שינויים"
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

export default EditActivity;
