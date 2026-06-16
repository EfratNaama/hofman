import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createActivity } from '../services/activitiesService';
import ActivityForm from './ActivityForm';

function NewActivity() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const activityId = await createActivity(formData, currentUser.uid);
      navigate(`/activities/${activityId}`);
    } catch (err) {
      setError('לא ניתן ליצור את הפעילות. בדקו את הפרטים ונסו שוב.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-right" dir="rtl">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-lg font-bold text-slate-500">ניהול פעילויות</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">יצירת פעילות חדשה</h1>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
            {error}
          </div>
        )}

        <ActivityForm isSubmitting={isSubmitting} submitLabel="יצירת פעילות" onSubmit={handleSubmit} />
      </div>
    </section>
  );
}

export default NewActivity;
