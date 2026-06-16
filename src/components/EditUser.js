import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UserForm from './UserForm';
import { getUserById, updateUser } from '../services/usersService';
import { formatDateTimeInput } from '../utils/dateUtils';

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
        setError('Could not load this user.');
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
      setError('Could not update this user. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <section className="rounded-lg bg-white p-5 shadow-lg text-slate-700">Loading user...</section>;
  }

  if (error && !user) {
    return (
      <section className="rounded-lg bg-white p-5 shadow-lg">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        <Link className="mt-4 inline-block rounded-md bg-slate-100 px-5 py-3 font-semibold text-slate-700" to="/users">
          Back to users
        </Link>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-lg bg-white p-5 shadow-lg">
        <p className="text-slate-700">User was not found.</p>
        <Link className="mt-4 inline-block rounded-md bg-slate-100 px-5 py-3 font-semibold text-slate-700" to="/users">
          Back to users
        </Link>
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
    <section className="rounded-lg bg-white p-5 shadow-lg">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Users</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Edit user</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserForm initialValues={initialValues} isSubmitting={isSubmitting} submitLabel="Save changes" onSubmit={handleSubmit} />
    </section>
  );
}

export default EditUser;
