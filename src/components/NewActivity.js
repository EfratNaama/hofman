import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createActivity } from '../services/activitiesService';
import ActivityForm from './ActivityForm';

function NewActivity() {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await createActivity(formData, currentUser?.uid || currentUser?.email || '');
      setSuccessMessage('הפעילות נשמרה בהצלחה.');
      setResetKey((currentKey) => currentKey + 1);
    } catch (err) {
      console.error('Failed to create activity', err);
      setError('לא ניתן ליצור את הפעילות. בדקו את הפרטים ונסו שוב.');
    } finally {
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

        {successMessage && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-lg font-semibold text-green-700">
            {successMessage}
          </div>
        )}

        <ActivityForm
          isSubmitting={isSubmitting}
          resetKey={resetKey}
          submitLabel="יצירת פעילות"
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

export default NewActivity;
