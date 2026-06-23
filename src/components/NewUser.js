import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from './UserForm';
import { createUser } from '../services/usersService';

function NewUser() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const userId = await createUser(formData);
      navigate(`/users/${userId}`);
    } catch (err) {
      setError('לא ניתן ליצור את המשתמש. נסו שוב.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg bg-white p-5 text-right shadow-lg" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">משתמשים</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">הוספת משתמש</h2>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserForm isSubmitting={isSubmitting} submitLabel="יצירת משתמש" onSubmit={handleSubmit} />
    </section>
  );
}

export default NewUser;
