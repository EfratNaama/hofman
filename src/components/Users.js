import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActivityById } from '../services/activitiesService';
import { getUserActivityRegistrations } from '../services/activityRegistrationsService';
import { deleteUser, getUsers } from '../services/usersService';
import { formatActivityDate } from '../utils/activityDateUtils';

const roleLabels = {
  admin: 'מנהל',
  manager: 'מנהל מערכת',
  resident: 'משתמש',
  volunteer: 'מתנדב',
};

const statusLabels = {
  active: 'פעיל',
  inactive: 'לא פעיל',
};

const paymentStatusLabels = {
  paid: 'שולם',
  pending: 'ממתין',
  cancelled: 'בוטל',
};

const formatRole = (role) => roleLabels[role] || role || '-';
const formatStatus = (status) => statusLabels[status] || status || '-';
const formatPaymentStatus = (status) => paymentStatusLabels[status] || status || '-';
const missingActivityLabel = 'הפעילות לא נמצאה';

const getUniqueValues = (values) => (
  Array.from(new Set(values.filter(Boolean)))
);

const getRegistrationActivityId = (registration) => (
  registration.activityId || registration.activityID || ''
);

const formatPrice = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setError('');

      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        setError('לא ניתן לטעון את המשתמשים. בדקו את הרשאות Firebase ונסו שוב.');
      } finally {
        setIsLoading(false);
      }
    }


    loadUsers();
  }, []);

  const handleDelete = async (userId) => {
    const confirmed = window.confirm('למחוק את המשתמש? לא ניתן לבטל פעולה זו.');
    if (!confirmed) return;

    setDeletingUserId(userId);
    setError('');

    try {
      await deleteUser(userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
    } catch (err) {
      setError('לא ניתן למחוק את המשתמש. נסו שוב.');
    } finally {
      setDeletingUserId('');
    }
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    setSelectedUserActivities([]);
    setActivitiesError('');
    setIsLoadingActivities(true);

    try {
      const userIds = getUniqueValues([user.id, user.uid]);
      const registrationGroups = await Promise.all(
        userIds.map((userId) => getUserActivityRegistrations(userId))
      );
      const registrationsById = new Map();

      registrationGroups.flat().forEach((registration) => {
        registrationsById.set(registration.id, registration);
      });

      const registrationsData = Array.from(registrationsById.values());
      const activityIds = getUniqueValues(registrationsData.map(getRegistrationActivityId));
      const activityPairs = await Promise.all(
        activityIds.map(async (activityId) => [
          activityId,
          await getActivityById(activityId),
        ])
      );
      const activitiesById = new Map(activityPairs);

      setSelectedUserActivities(
        registrationsData.map((registration) => {
          const activity = activitiesById.get(getRegistrationActivityId(registration)) || null;

          return {
            registration: activity
              ? registration
              : { ...registration, activityTitle: missingActivityLabel },
            activity,
          };
        })
      );
    } catch (err) {
      console.error('Failed to load user registered activities:', err);
      setActivitiesError('לא ניתן לטעון את הפעילויות של המשתמש כרגע.');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const closeActivitiesModal = () => {
    setSelectedUser(null);
    setSelectedUserActivities([]);
    setActivitiesError('');
  };

  return (
    <section className="rounded-lg bg-white p-5 text-right shadow-lg" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">ניהול מערכת</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">משתמשים</h2>
        </div>

        <Link
          className="rounded-md bg-sky-800 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-900"
          to="/users/new"
        >
          הוספת משתמש
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && <p className="text-slate-700">טוען משתמשים...</p>}

      {!isLoading && !error && users.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-base font-semibold text-slate-800">לא נמצאו משתמשים.</p>
          <p className="mt-2 text-sm text-slate-600">
            צרו את פרופיל המשתמש הראשון כדי להתחיל לנהל גישה.
          </p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-right">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-4 py-3 font-semibold">שם מלא</th>
                <th className="px-4 py-3 font-semibold">אימייל</th>
                <th className="px-4 py-3 font-semibold">תפקיד</th>
                <th className="px-4 py-3 font-semibold">סטטוס</th>
                <th className="px-4 py-3 font-semibold">פעולות</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {user.fullName || '-'}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{user.email || '-'}</td>
                  <td className="px-4 py-4 text-slate-700">{formatRole(user.role)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        user.status === 'active'
                          ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700'
                          : 'rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600'
                      }
                    >
                      {formatStatus(user.status)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        to={`/users/${user.id}`}
                      >
                        צפייה
                      </Link>

                      <Link
                        className="rounded-md bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
                        to={`/users/${user.id}/edit`}
                      >
                        עריכה
                      </Link>

                      <button
                        className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                        type="button"
                        onClick={() => handleViewActivities(user)}
                      >
                        פעילויות
                      </button>

                      <button
                        className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        type="button"
                        disabled={deletingUserId === user.id}
                        onClick={() => handleDelete(user.id)}
                      >
                        {deletingUserId === user.id ? 'מוחק...' : 'מחיקה'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 text-right shadow-xl" dir="rtl">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">פעילויות שנרשם אליהן</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedUser.fullName || selectedUser.email || 'משתמש'}
                </h3>
              </div>
              <button
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                type="button"
                onClick={closeActivitiesModal}
              >
                סגירה
              </button>
            </div>

            {isLoadingActivities && (
              <p className="rounded-md bg-slate-50 p-4 font-semibold text-slate-700">
                טוען פעילויות...
              </p>
            )}

            {!isLoadingActivities && activitiesError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {activitiesError}
              </div>
            )}

            {!isLoadingActivities && !activitiesError && selectedUserActivities.length === 0 && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-base font-semibold text-slate-800">
                  המשתמש לא נרשם לפעילויות עדיין
                </p>
              </div>
            )}

            {!isLoadingActivities && !activitiesError && selectedUserActivities.length > 0 && (
              <div className="grid gap-4">
                {selectedUserActivities.map(({ registration, activity }) => (
                  <article
                    key={registration.id}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  >
                    <h4 className="text-lg font-bold text-slate-900">
                      {activity?.title || registration.activityTitle || 'פעילות לא נמצאה'}
                    </h4>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ActivityDetail
                        label="שם פעילות"
                        value={activity?.title || registration.activityTitle || 'פעילות לא נמצאה'}
                      />
                      <ActivityDetail
                        label="תאריך"
                        value={formatActivityDate(activity?.activityDate || activity?.date || registration.activityDate || registration.date)}
                      />
                      <ActivityDetail
                        label="שעה"
                        value={activity?.time || registration.time}
                      />
                      <ActivityDetail
                        label="מיקום"
                        value={activity?.location || registration.location}
                      />
                      <ActivityDetail
                        label="מחיר"
                        value={formatPrice(activity?.price)}
                      />
                      <ActivityDetail
                        label="סטטוס הרשמה / תשלום"
                        value={formatPaymentStatus(registration.paymentStatus)}
                      />
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ActivityDetail({ label, value }) {
  return (
    <div className="rounded-md bg-white p-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value || '-'}</dd>
    </div>
  );
}

export default Users;
