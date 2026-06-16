import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteUser, getUsers } from '../services/usersService';

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setError('');

      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        setError('Could not load users. Please check Firebase permissions and try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  const handleDelete = async (userId) => {
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingUserId(userId);
    setError('');

    try {
      await deleteUser(userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
    } catch (err) {
      setError('Could not delete this user. Please try again.');
    } finally {
      setDeletingUserId('');
    }
  };

  return (
    <section className="rounded-lg bg-white p-5 shadow-lg">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Users</h2>
        </div>

        <Link
          className="rounded-md bg-sky-800 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-900"
          to="/users/new"
        >
          New user
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && <p className="text-slate-700">Loading users...</p>}

      {!isLoading && !error && users.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-base font-semibold text-slate-800">No users yet.</p>
          <p className="mt-2 text-sm text-slate-600">
            Create the first user profile to start managing access.
          </p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Full name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {user.fullName || '-'}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{user.email || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{user.role || '-'}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        user.status === 'active'
                          ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700'
                          : 'rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600'
                      }
                    >
                      {user.status || '-'}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        to={`/users/${user.id}`}
                      >
                        View
                      </Link>

                      <Link
                        className="rounded-md bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
                        to={`/users/${user.id}/edit`}
                      >
                        Edit
                      </Link>

                      <button
                        className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        type="button"
                        disabled={deletingUserId === user.id}
                        onClick={() => handleDelete(user.id)}
                      >
                        {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Users;