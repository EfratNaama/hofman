import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteUser, getUserById } from '../services/usersService';
import { formatDisplayDate } from '../utils/dateUtils';

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteUser(id);
      navigate('/users');
    } catch (err) {
      setError('Could not delete this user. Please try again.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <section className="rounded-lg bg-white p-5 shadow-lg text-slate-700">Loading user...</section>;
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

  return (
    <section className="rounded-lg bg-white p-5 shadow-lg">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">User details</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{user.fullName}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-md bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200" to="/users">
            Back
          </Link>
          <Link className="rounded-md bg-sky-800 px-4 py-2 font-semibold text-white hover:bg-sky-900" to={`/users/${id}/edit`}>
            Edit
          </Link>
          <button
            className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <dl className="grid gap-4 md:grid-cols-2">
        <DetailItem label="Email" value={user.email} />
        <DetailItem label="Phone" value={user.phone} />
        <DetailItem label="Role" value={user.role} />
        <DetailItem label="Status" value={user.status} />
        <DetailItem label="Created at" value={formatDisplayDate(user.createdAt)} />
        <DetailItem label="Updated at" value={formatDisplayDate(user.updatedAt)} />
      </dl>
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-slate-900">{value || '-'}</dd>
    </div>
  );
}

export default UserDetails;
