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
      setError('Could not create the user. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg bg-white p-5 shadow-lg">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Users</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Create user</h2>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserForm isSubmitting={isSubmitting} submitLabel="Create user" onSubmit={handleSubmit} />
    </section>
  );
}

export default NewUser;
