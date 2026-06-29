import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActivityById } from '../services/activitiesService';
import { getUserActivityRegistrations } from '../services/activityRegistrationsService';
import { deleteUser, getUsers } from '../services/usersService';
import { formatActivityDate } from '../utils/activityDateUtils';
import './Users.css';

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
    <section className="admin-users-page" dir="rtl">
      <div className="admin-users-page__shell">
      <div className="admin-users-page__header">
        <div>
          <p className="admin-users-page__eyebrow">ניהול מערכת</p>
          <h2 className="admin-users-page__title">משתמשים</h2>
        </div>

        <Link
          className="admin-users-page__add-link"
          to="/users/new"
        >
          הוספת משתמש
        </Link>
      </div>

      {error && (
        <div className="admin-users-page__notice admin-users-page__notice--error">
          {error}
        </div>
      )}

      {isLoading && <p className="admin-users-page__notice">טוען משתמשים...</p>}

      {!isLoading && !error && users.length === 0 && (
        <div className="admin-users-page__empty">
          <p className="text-base font-semibold text-slate-800">לא נמצאו משתמשים.</p>
          <p className="mt-2 text-sm text-slate-600">
            צרו את פרופיל המשתמש הראשון כדי להתחיל לנהל גישה.
          </p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="admin-users-page__table-card">
        <div className="admin-users-page__table-scroll">
          <table className="admin-users-page__table">
            <thead>
              <tr>
                <th>שם מלא</th>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="admin-users-page__name">
                    {user.fullName || '-'}
                  </td>
                  <td>{user.email || '-'}</td>
                  <td>{formatRole(user.role)}</td>
                  <td>
                    <span
                      className={
                        user.status === 'active'
                          ? 'admin-users-page__status admin-users-page__status--active'
                          : 'admin-users-page__status admin-users-page__status--inactive'
                      }
                    >
                      {formatStatus(user.status)}
                    </span>
                  </td>

                  <td>
                    <div className="admin-users-page__actions">
                      <Link
                        className="admin-users-page__action admin-users-page__action--view"
                        to={`/users/${user.id}`}
                      >
                        צפייה
                      </Link>

                      <Link
                        className="admin-users-page__action admin-users-page__action--edit"
                        to={`/users/${user.id}/edit`}
                      >
                        עריכה
                      </Link>

                      <button
                        className="admin-users-page__action admin-users-page__action--activities"
                        type="button"
                        onClick={() => handleViewActivities(user)}
                      >
                        פעילויות
                      </button>

                      <button
                        className="admin-users-page__action admin-users-page__action--delete"
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
        </div>
      )}
      </div>

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
