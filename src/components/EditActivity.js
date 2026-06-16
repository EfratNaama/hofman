import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ActivityForm from './ActivityForm';
import { getActivityById, updateActivity } from '../services/activitiesService';
import { formatActivityDateInput } from '../utils/activityDateUtils';

function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadActivity() {
      setIsLoading(true);
      setError('');

      try {
        const activityData = await getActivityById(id);
        setActivity(activityData);
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
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 text-right" dir="rtl">
        <div className="rounded-lg bg-white p-6 text-xl font-semibold text-slate-700 shadow-sm">טוען פעילות...</div>
      </section>
    );
  }

  if (!activity) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 text-right" dir="rtl">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <p className="text-2xl font-black text-slate-900">הפעילות לא נמצאה.</p>
          <Link className="mt-5 inline-block rounded-lg bg-slate-100 px-6 py-3 text-lg font-bold text-slate-700 hover:bg-slate-200" to="/activities">
            חזרה לפעילויות
          </Link>
        </div>
      </section>
    );
  }

  const initialValues = {
    ...activity,
    activityDate: formatActivityDateInput(activity.activityDate),
    maxParticipants: activity.maxParticipants ?? '',
    currentParticipants: activity.currentParticipants ?? 0,
    paymentLink: activity.paymentLink || '',
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-right" dir="rtl">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-lg font-bold text-slate-500">ניהול פעילויות</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">עריכת פעילות</h1>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
            {error}
          </div>
        )}

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
