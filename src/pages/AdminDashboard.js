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
import LogoLoader from '../components/LogoLoader';
import './AdminDashboard.css';

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
  primary: '#C99B84',
  muted: '#977665',
  accent: '#C7AB95',
  olive: '#807D6E',
  warm: '#C0977B',
  text: '#000000',
  chartText: '#807D6E',
  border: '#C7AB95',
  background: '#F4ECE6',
  surface: '#ffffff',
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

function SummaryCard({ label, value, description, tone }) {
  return (
    <article className={`admin-dashboard__summary-card admin-dashboard__summary-card--${tone}`}>
      <div>
        <p className="admin-dashboard__summary-label">{label}</p>
        <p className="admin-dashboard__summary-value">{value}</p>
        <p className="admin-dashboard__summary-description">{description}</p>
      </div>
    </article>
  );
}

function EmptyState({ children = 'אין פריטים הדורשים טיפול כרגע' }) {
  return (
    <div className="admin-dashboard__empty">
      {children}
    </div>
  );
}

function ChartCard({ title, hasData, children }) {
  return (
    <article className="admin-dashboard__chart-card">
      <h3 className="admin-dashboard__chart-title">{title}</h3>
      {hasData ? (
        <div className="admin-dashboard__chart-body">{children}</div>
      ) : (
        <EmptyState>אין מספיק נתונים להצגת התרשים.</EmptyState>
      )}
    </article>
  );
}

const pieSliceColors = [colors.primary, colors.olive];

function getPieSliceColor(index = 0) {
  return pieSliceColors[index % pieSliceColors.length];
}

function renderPieLabel({ cx, cy, midAngle, outerRadius, name, value, index }) {
  const radius = outerRadius + 34;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text
      x={x}
      y={y}
      fill={getPieSliceColor(index)}
      fontSize={12}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${name}: ${value}`}
    </text>
  );
}

function renderPieLabelLine({ cx, cy, midAngle, outerRadius, index }) {
  const startRadius = outerRadius + 2;
  const endRadius = outerRadius + 28;
  const x1 = cx + startRadius * Math.cos(-midAngle * Math.PI / 180);
  const y1 = cy + startRadius * Math.sin(-midAngle * Math.PI / 180);
  const x2 = cx + endRadius * Math.cos(-midAngle * Math.PI / 180);
  const y2 = cy + endRadius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={getPieSliceColor(index)}
      strokeWidth={1.5}
    />
  );
}

function LoadingDashboard() {
  return <LogoLoader label="טוען את נתוני לוח הבקרה..." />;
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
        <div className="admin-dashboard__shell">
        <div className="admin-dashboard__card admin-dashboard__denied">
          <h1>אין לך הרשאה לצפות בעמוד זה</h1>
          <Link
            to="/"
            className="admin-dashboard__home-link"
          >
            חזרה לעמוד הבית
          </Link>
        </div>
        </div>
      </section>
    );
  }

  const summaryCards = [
    {
      label: 'סך המשתמשים',
      value: data.users.length,
      description: 'כל המשתמשים הרשומים במערכת',
      tone: 'primary',
    },
    {
      label: 'סך הפעילויות',
      value: data.activities.length,
      description: 'כל הפעילויות הקיימות במערכת',
      tone: 'warm',
    },
    {
      label: 'הרשמות פעילות',
      value: dashboardData.registrations.length,
      description: `${dashboardData.paidPayments.length} הרשמות ששולמו`,
      tone: 'olive',
    },
  ];

  const hasAttentionItems =
    dashboardData.upcomingActivities.length > 0 ||
    dashboardData.latestGalleryItems.length > 0;

  return (
    <main className="admin-dashboard" dir="rtl">
      <div className="admin-dashboard__shell">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">ניהול מערכת</p>
          <h1 className="admin-dashboard__title">לוח בקרה</h1>
        </div>
        <time className="admin-dashboard__date">
          {new Date().toLocaleDateString('he-IL')}
        </time>
      </header>

      {error && (
        <div
          role="alert"
          className="admin-dashboard__message admin-dashboard__message--error"
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
        <h2 className="admin-dashboard__section-title">מידע קרוב וחשוב</h2>
        {!hasAttentionItems ? (
          <EmptyState />
        ) : (
          <div className="admin-dashboard__attention-grid">
            <article className="admin-dashboard__card">
              <h3 className="admin-dashboard__card-title">פעילויות בשבעת הימים הקרובים</h3>
              {dashboardData.upcomingActivities.length ? (
                <div className="admin-dashboard__list">
                  {dashboardData.upcomingActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="admin-dashboard__list-item"
                    >
                      <strong
                        title={activity.title}
                      >
                        {activity.title || 'פעילות ללא כותרת'}
                      </strong>
                      <span>
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

            <article className="admin-dashboard__card">
              <h3 className="admin-dashboard__card-title">פריטי גלריה אחרונים</h3>
              {dashboardData.latestGalleryItems.length ? (
                <div className="admin-dashboard__list">
                  {dashboardData.latestGalleryItems.map((galleryItem) => (
                    <div
                      key={galleryItem.id}
                      className="admin-dashboard__list-item"
                    >
                      <strong
                        title={galleryItem.title || galleryItem.caption}
                      >
                        {galleryItem.title || galleryItem.caption || 'פריט גלריה'}
                      </strong>
                      <span>{formatDate(galleryItem.createdAt)}</span>
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
        <h2 className="admin-dashboard__section-title">סטטיסטיקות</h2>
        <div className="admin-dashboard__charts-grid">
          <div className="admin-dashboard__chart-wide">
            <ChartCard
            title="הרשמות לפי פעילות"
            hasData={dashboardData.registrationsByActivity.some((item) => item.count > 0)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.registrationsByActivity} margin={{ left: 18, bottom: 12 }}>
                <CartesianGrid stroke={colors.accent} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="shortTitle"
                  interval={0}
                  tick={false}
                  tickLine={false}
                  height={12}
                />
                <YAxis allowDecimals={false} width={48} tickMargin={12} tick={{ fill: colors.chartText }} />
                <Tooltip cursor={false} formatter={(value) => [value, 'הרשמות']} />
                <Bar dataKey="count" name="הרשמות" fill={colors.primary} radius={[6, 6, 0, 0]} activeBar={{ stroke: colors.text, strokeWidth: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          </div>

          <ChartCard
            title="פעילויות לפי חודש"
            hasData={dashboardData.activitiesByMonth.some((item) => item.count > 0)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.activitiesByMonth} margin={{ top: 10, right: 18, left: 18, bottom: 8 }}>
                <CartesianGrid stroke={colors.accent} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" padding={{ left: 12, right: 12 }} tick={{ fill: colors.chartText }} />
                <YAxis allowDecimals={false} width={48} tickMargin={12} tick={{ fill: colors.chartText }} />
                <Tooltip formatter={(value) => [value, 'פעילויות']} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="פעילויות"
                  stroke={colors.warm}
                  strokeWidth={3}
                  dot={{ r: 4, fill: colors.warm }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
              title="משתמשים לפי תפקיד"
              hasData={dashboardData.usersByRole.some((item) => item.value > 0)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 14, right: 58, bottom: 28, left: 58 }}>
                  <Pie
                    data={dashboardData.usersByRole}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="38%"
                    outerRadius={66}
                    activeShape={{ stroke: colors.text, strokeWidth: 4 }}
                    labelLine={renderPieLabelLine}
                    label={renderPieLabel}
                  >
                    {pieSliceColors.map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend
                    verticalAlign="bottom"
                    height={42}
                    formatter={(value) => <span className="admin-dashboard__legend-label">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
        </div>
      </section>

      </div>
    </main>
  );
}

export default AdminDashboard;
