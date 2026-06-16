import { useEffect, useState } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, adminAuth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const sectionStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '24px',
  boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
  maxWidth: '680px',
  margin: '0 auto 24px',
};

const buttonStyle = {
  display: 'inline-block',
  marginTop: '16px',
  padding: '12px 20px',
  borderRadius: '16px',
  background: '#3f6378',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '1rem',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #d2d6dc',
  fontSize: '1rem',
  color: '#0f172a',
};

const formButton = {
  ...buttonStyle,
  width: '100%',
};

const errorStyle = {
  color: '#991b1b',
  fontSize: '0.95rem',
  minHeight: '24px',
  marginTop: '12px',
};

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');

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

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (userId) => {
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

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

  const { currentUser } = useAuth();
  const [identityNumber, setIdentityNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createUserProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('משתמש לא מאומת. יש להתחבר מחדש.');
      }

      const newUser = await createUserWithEmailAndPassword(adminAuth, email, '123456');
      const authUid = newUser.user.uid;

      await setDoc(doc(db, 'user_profiles', authUid), {
        authUid,
        identityNumber,
        fullName,
        phone,
        email,
        role,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await signOut(adminAuth);

      setMessage('פרופיל משתמש נוצר בהצלחה עם חשבון Auth.');
      setIdentityNumber('');
      setFullName('');
      setPhone('');
      setEmail('');
      setRole('member');
    } catch (err) {
      console.error('createUserProfile error', err);
      setError(err?.message || 'אירעה שגיאה בזמן יצירת פרופיל המשתמש. נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg bg-white p-5 shadow-lg">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Users</h2>
        </div>
        <Link className="rounded-md bg-sky-800 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-900" to="/users/new">
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
          <p className="mt-2 text-sm text-slate-600">Create the first user profile to start managing access.</p>
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
                  <td className="px-4 py-4 font-semibold text-slate-900">{user.fullName || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{user.email || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{user.role || '-'}</td>
                  <td className="px-4 py-4">
                    <span className={user.status === 'active' ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700' : 'rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600'}>
                      {user.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200" to={`/users/${user.id}`}>
                        View
                      </Link>
                      <Link className="rounded-md bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200" to={`/users/${user.id}/edit`}>
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
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>משתמשים</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>
        פרופילי משתמשים נוצרים רק על ידי מנהלים. הזינו את פרטי המשתמש כדי לשמור אותו ב-`user_profiles`.
      </p>

      <form onSubmit={createUserProfile} style={{ display: 'grid', gap: '16px' }}>
        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>תעודת זהות</span>
          <input
            type="text"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>שם מלא</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>טלפון</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>אימייל</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>תפקיד</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <button type="submit" style={formButton} disabled={loading}>
          {loading ? 'שומר...' : 'צור פרופיל משתמש'}
        </button>
      </form>

      {message && <div style={{ color: '#064e3b', fontSize: '0.95rem', marginTop: '12px' }}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

export default Users;
