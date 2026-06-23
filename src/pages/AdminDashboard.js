import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const collectionNames = {
  users: 'users',
  activities: 'activities',
  registrations: 'activityRegistrations',
  gallery: 'gallery',
};

const initialData = {
  users: [],
  activities: [],
  registrations: [],
  gallery: [],
};

const colors = {
  teal: '#008080',
  navy: '#0f2240',
  blue: '#5B6FE6',
  orange: '#E67E22',
  red: '#E74C3C',
  green: '#16a34a',
  text: '#1a1a2e',
  muted: '#64748b',
  border: '#e5e7eb',
  background: '#f8fafc',
};

const cardStyle = {
  minWidth: 0,
  padding: '20px',
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  backgroundColor: '#fff',
  boxShadow: '0 4px 18px rgba(15,34,64,0.07)',
};

const sectionTitleStyle = {
  margin: '0 0 18px',
  color: colors.text,
  fontSize: '20px',
  fontWeight: 900,
};

const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const toMillis = (value) => toDate(value)?.getTime() || 0;

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('he-IL') : 'תאריך לא זמין';
};

const getActivityDate = (activity) =>
  activity.activityDate || activity.date || activity.createdAt;

const truncateText = (text = '', maxLength = 14) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

const getRoleGroup = (user) => {
  const role = String(user.role || user.userType || '').trim().toLowerCase();
  return ['admin', 'manager', 'מנהל'].includes(role) ? 'מנהלים' : 'משתמשים רגילים';
};

function SummaryCard({ label, value, description, icon, color }) {
  return (
    <article
      style={{
        ...cardStyle,
        display: 'flex',
        minHeight: '146px',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        borderInlineStart: `4px solid ${color}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, color: colors.muted, fontSize: '13px', fontWeight: 800 }}>
          {label}
        </p>
        <p style={{ margin: '7px 0 0', color, fontSize: '34px', fontWeight: 950, lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ margin: '10px 0 0', color: colors.muted, fontSize: '12px', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          width: '48px',
          height: '48px',
          flexShrink: 0,
          placeItems: 'center',
          borderRadius: '50%',
          backgroundColor: `${color}18`,
          fontSize: '24px',
        }}
      >
        {icon}
      </span>
    </article>
  );
}

function EmptyState({ children = 'אין פריטים הדורשים טיפול כרגע' }) {
  return (
    <div
      style={{
        display: 'grid',
        minHeight: '130px',
        placeItems: 'center',
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: colors.background,
        color: colors.muted,
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function ChartCard({ title, hasData, children }) {
  return (
    <article style={cardStyle}>
      <h3 style={{ margin: '0 0 16px', color: colors.text, fontSize: '17px', fontWeight: 900 }}>
        {title}
      </h3>
      {hasData ? (
        <div style={{ width: '100%', height: '290px' }}>{children}</div>
      ) : (
        <EmptyState>אין מספיק נתונים להצגת התרשים.</EmptyState>
      )}
    </article>
  );
}

const dashboardCss = `
  @keyframes adminDashboardPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .admin-dashboard {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 36px 24px 64px;
  }

  .admin-dashboard__section {
    margin-bottom: 42px;
  }

  .admin-dashboard__summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .admin-dashboard__attention-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .admin-dashboard__charts-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .admin-dashboard__chart-wide {
    grid-column: 1 / -1;
  }

  .admin-dashboard__skeleton {
    width: 100%;
    border-radius: 16px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: adminDashboardPulse 1.4s ease-in-out infinite;
  }

  @media (max-width: 980px) {
    .admin-dashboard__summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .admin-dashboard {
      padding: 24px 16px 48px;
    }

    .admin-dashboard__summary-grid,
    .admin-dashboard__attention-grid,
    .admin-dashboard__charts-grid {
      grid-template-columns: 1fr;
    }

    .admin-dashboard__chart-wide {
      grid-column: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-dashboard__skeleton {
      animation: none;
    }
  }
`;

function LoadingDashboard() {
  return (
    <section className="admin-dashboard" dir="rtl" aria-label="טעינת נתוני לוח הבקרה">
      <style>{dashboardCss}</style>
      <p style={{ margin: '0 0 20px', color: colors.muted, fontWeight: 800 }}>
        טוען את נתוני לוח הבקרה...
      </p>
      <div className="admin-dashboard__summary-grid">
        {[1, 2, 3].map((item) => (
          <div key={item} className="admin-dashboard__skeleton" style={{ height: '146px' }} />
        ))}
      </div>
      <div
        className="admin-dashboard__skeleton"
        style={{ height: '330px', marginTop: '42px' }}
      />
    </section>
  );
}

function AdminDashboard() {
  const { authLoading, currentUser } = useAuth();
  const [data, setData] = useState(initialData);
  const [hasAdminAccess, setHasAdminAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setHasAdminAccess(false);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      let userSnapshot;

      try {
        userSnapshot = await getDoc(doc(db, collectionNames.users, currentUser.uid));
      } catch (queryError) {
        console.error(
          `Admin Dashboard Firestore query failed for collection "${collectionNames.users}" while checking admin access:`,
          queryError
        );

        if (isMounted) {
          setHasAdminAccess(false);
          setError('לא ניתן לאמת את הרשאת מנהל המערכת כרגע.');
          setLoading(false);
        }
        return;
      }

      const userData = userSnapshot.exists() ? userSnapshot.data() : {};
      const isActiveAdmin =
        String(userData.role || '').trim().toLowerCase() === 'admin' &&
        String(userData.status || '').trim().toLowerCase() === 'active';

      if (!isActiveAdmin) {
        if (isMounted) {
          setHasAdminAccess(false);
          setLoading(false);
        }
        return;
      }

      if (!isMounted) return;
      setHasAdminAccess(true);

      const entries = Object.entries(collectionNames);
      const results = await Promise.allSettled(
        entries.map(([, collectionName]) => getDocs(collection(db, collectionName)))
      );

      if (!isMounted) return;

      const nextData = { ...initialData };
      let hasError = false;

      results.forEach((result, index) => {
        const [key] = entries[index];

        if (result.status === 'fulfilled') {
          nextData[key] = result.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }));
        } else {
          hasError = true;
          console.error(
            `Admin Dashboard Firestore query failed for collection "${collectionNames[key]}":`,
            result.reason
          );
        }
      });

      setData(nextData);
      setError(hasError ? 'חלק מנתוני לוח הבקרה אינם זמינים כרגע. שאר הנתונים נטענו כרגיל.' : '');
      setLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [authLoading, currentUser]);

  const dashboardData = useMemo(() => {
    const activityTitles = new Map(
      data.activities.map((activity) => [activity.id, activity.title || 'פעילות ללא כותרת'])
    );

    const registrations = data.registrations.map((registration) => ({
      ...registration,
      activityTitle:
        registration.activityTitle ||
        activityTitles.get(registration.activityId) ||
        'פעילות לא ידועה',
    }));

    const pendingPayments = registrations.filter(
      (registration) => registration.paymentStatus === 'pending'
    );
    const paidPayments = registrations.filter(
      (registration) => registration.paymentStatus === 'paid'
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingActivities = data.activities
      .filter((activity) => {
        const date = toDate(activity.activityDate || activity.date);
        return date && date >= now && date <= sevenDaysFromNow;
      })
      .sort((first, second) => toMillis(getActivityDate(first)) - toMillis(getActivityDate(second)))
      .slice(0, 5);

    const latestGalleryItems = [...data.gallery]
      .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt))
      .slice(0, 5);

    const registrationCounts = new Map();
    registrations.forEach((registration) => {
      registrationCounts.set(
        registration.activityTitle,
        (registrationCounts.get(registration.activityTitle) || 0) + 1
      );
    });
    const registrationsByActivity = Array.from(registrationCounts, ([title, count]) => ({
      title,
      shortTitle: truncateText(title),
      count,
    })).sort((first, second) => second.count - first.count);

    const activityMonths = new Map();
    data.activities.forEach((activity) => {
      const date = toDate(getActivityDate(activity));
      if (!date) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      activityMonths.set(key, (activityMonths.get(key) || 0) + 1);
    });
    const activitiesByMonth = Array.from(activityMonths, ([month, count]) => {
      const [year, monthNumber] = month.split('-');
      return {
        month,
        label: `${monthNumber}/${year}`,
        count,
      };
    }).sort((first, second) => first.month.localeCompare(second.month));

    const roleCounts = data.users.reduce(
      (counts, user) => ({
        ...counts,
        [getRoleGroup(user)]: counts[getRoleGroup(user)] + 1,
      }),
      { מנהלים: 0, 'משתמשים רגילים': 0 }
    );
    const usersByRole = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

    return {
      registrations,
      pendingPayments,
      paidPayments,
      upcomingActivities,
      latestGalleryItems,
      registrationsByActivity,
      activitiesByMonth,
      usersByRole,
    };
  }, [data]);

  if (authLoading || loading || hasAdminAccess === null) {
    return <LoadingDashboard />;
  }

  if (!currentUser || !hasAdminAccess) {
    return (
      <section className="admin-dashboard" dir="rtl">
        <style>{dashboardCss}</style>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: colors.text, fontSize: '28px' }}>
            אין לך הרשאה לצפות בעמוד זה
          </h1>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              marginTop: '18px',
              padding: '11px 20px',
              borderRadius: '10px',
              backgroundColor: colors.teal,
              color: '#fff',
              fontWeight: 800,
            }}
          >
            חזרה לעמוד הבית
          </Link>
        </div>
      </section>
    );
  }

  const summaryCards = [
    {
      label: 'סך המשתמשים',
      value: data.users.length,
      description: 'כל המשתמשים הרשומים במערכת',
      icon: '👥',
      color: colors.teal,
    },
    {
      label: 'סך הפעילויות',
      value: data.activities.length,
      description: 'כל הפעילויות הקיימות במערכת',
      icon: '📅',
      color: colors.blue,
    },
    {
      label: 'הרשמות פעילות',
      value: dashboardData.registrations.length,
      description: `${dashboardData.paidPayments.length} הרשמות ששולמו`,
      icon: '📋',
      color: colors.orange,
    },
  ];

  const hasAttentionItems =
    dashboardData.upcomingActivities.length > 0 ||
    dashboardData.latestGalleryItems.length > 0;

  return (
    <main className="admin-dashboard" dir="rtl">
      <style>{dashboardCss}</style>

      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '34px',
          paddingBottom: '22px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: colors.navy, fontSize: '32px', fontWeight: 950 }}>
            לוח בקרה
          </h1>
          <p style={{ margin: '9px 0 0', color: colors.muted, fontSize: '15px', lineHeight: 1.7 }}>
            סקירה כללית של משתמשים, פעילויות, הרשמות, תשלומים והודעות
          </p>
        </div>
        <time style={{ color: colors.muted, fontSize: '14px', fontWeight: 800 }}>
          {new Date().toLocaleDateString('he-IL')}
        </time>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            ...cardStyle,
            marginBottom: '24px',
            borderColor: '#fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      )}

      <section className="admin-dashboard__section" aria-label="נתוני סיכום">
        <div className="admin-dashboard__summary-grid">
          {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
        </div>
      </section>

      <section className="admin-dashboard__section">
        <h2 style={sectionTitleStyle}>מידע קרוב וחשוב</h2>
        {!hasAttentionItems ? (
          <EmptyState />
        ) : (
          <div className="admin-dashboard__attention-grid">
            <article style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: colors.text, fontSize: '17px' }}>
                פעילויות בשבעת הימים הקרובים
              </h3>
              {dashboardData.upcomingActivities.length ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {dashboardData.upcomingActivities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: colors.background,
                      }}
                    >
                      <strong
                        title={activity.title}
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          color: colors.text,
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {activity.title || 'פעילות ללא כותרת'}
                      </strong>
                      <span style={{ color: colors.muted, fontSize: '13px' }}>
                        {formatDate(activity.activityDate || activity.date)}
                        {activity.location ? ` · ${activity.location}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </article>

            <article style={cardStyle}>
              <h3 style={{ margin: '0 0 15px', color: colors.text, fontSize: '17px' }}>
                פריטי גלריה אחרונים
              </h3>
              {dashboardData.latestGalleryItems.length ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {dashboardData.latestGalleryItems.map((galleryItem) => (
                    <div
                      key={galleryItem.id}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: colors.background,
                      }}
                    >
                      <strong
                        title={galleryItem.title || galleryItem.caption}
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          color: colors.text,
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {galleryItem.title || galleryItem.caption || 'פריט גלריה'}
                      </strong>
                      <span style={{ color: colors.muted, fontSize: '13px' }}>
                        {formatDate(galleryItem.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </article>
          </div>
        )}
      </section>

      <section className="admin-dashboard__section">
        <h2 style={sectionTitleStyle}>סטטיסטיקות</h2>
        <div className="admin-dashboard__charts-grid">
          <ChartCard
            title="הרשמות לפי פעילות"
            hasData={dashboardData.registrationsByActivity.some((item) => item.count > 0)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.registrationsByActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortTitle" interval={0} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'הרשמות']} />
                <Bar dataKey="count" name="הרשמות" fill={colors.teal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="פעילויות לפי חודש"
            hasData={dashboardData.activitiesByMonth.some((item) => item.count > 0)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.activitiesByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'פעילויות']} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="פעילויות"
                  stroke={colors.blue}
                  strokeWidth={3}
                  dot={{ r: 4, fill: colors.blue }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="admin-dashboard__chart-wide">
            <ChartCard
              title="משתמשים לפי תפקיד"
              hasData={dashboardData.usersByRole.some((item) => item.value > 0)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.usersByRole}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    outerRadius={92}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  >
                    <Cell fill={colors.teal} />
                    <Cell fill={colors.blue} />
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'משתמשים']} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </section>

    </main>
  );
}

export default AdminDashboard;
