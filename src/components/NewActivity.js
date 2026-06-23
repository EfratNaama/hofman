import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createActivity } from '../services/activitiesService';
import ActivityForm from './ActivityForm';
import './NewActivity.css';

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
    <section className="admin-activities-page" dir="rtl">
      <div className="activity-form-card">
        <div className="activity-form-header">
          <p>ניהול פעילויות</p>
          <h1>יצירת פעילות חדשה</h1>
        </div>

        {error && (
          <div className="activity-form-alert activity-form-alert--error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="activity-form-alert activity-form-alert--success">
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
