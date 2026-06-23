import { useEffect, useState } from 'react';
import {
  getActivityTypeDistribution,
  getPaidRegistrations,
  getPaidVsPendingPerActivity,
  getRegistrationsOverTime,
  getRegistrationsPerActivity,
  getTotalActivities,
  getTotalRegistrations,
  getTotalUsers,
} from '../../services/dashboardService';
import DashboardCharts from './DashboardCharts';
import StatsCard from './StatsCard';

const initialData = {
  totalUsers: 0,
  totalActivities: 0,
  totalRegistrations: 0,
  paidRegistrations: 0,
  registrationsPerActivity: [],
  activityTypeDistribution: [],
  registrationsOverTime: [],
  paidVsPendingPerActivity: [],
};

const chartSkeletonStyle = {
  height: '340px',
  borderRadius: '12px',
  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
  backgroundSize: '200% 100%',
  animation: 'dashboardPulse 1.5s ease-in-out infinite',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function DashboardStats() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadStatistics() {
      try {
        const [
          totalUsers,
          totalActivities,
          totalRegistrations,
          paidRegistrations,
          registrationsPerActivity,
          activityTypeDistribution,
          registrationsOverTime,
          paidVsPendingPerActivity,
        ] = await Promise.all([
          getTotalUsers(),
          getTotalActivities(),
          getTotalRegistrations(),
          getPaidRegistrations(),
          getRegistrationsPerActivity(),
          getActivityTypeDistribution(),
          getRegistrationsOverTime(),
          getPaidVsPendingPerActivity(),
        ]);

        if (!isMounted) return;

        setData({
          totalUsers,
          totalActivities,
          totalRegistrations,
          paidRegistrations,
          registrationsPerActivity,
          activityTypeDistribution,
          registrationsOverTime,
          paidVsPendingPerActivity,
        });
      } catch (loadError) {
        console.error('שגיאה בטעינת נתוני לוח הניהול:', loadError);
        if (isMounted) {
          setError('לא ניתן היה לטעון את הסטטיסטיקות. נסו שוב מאוחר יותר.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStatistics();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    { title: 'סך משתמשים', value: data.totalUsers, icon: '👥', color: '#008080' },
    { title: 'סך פעילויות', value: data.totalActivities, icon: '📅', color: '#2563eb' },
    { title: 'סך הרשמות', value: data.totalRegistrations, icon: '📋', color: '#7c3aed' },
    { title: 'הרשמות ששולמו', value: data.paidRegistrations, icon: '✅', color: '#16a34a' },
  ];

  return (
    <section dir="rtl" style={{ marginTop: '40px' }}>
      <style>
        {'@keyframes dashboardPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }'}
      </style>
      <h2
        style={{
          margin: '0 0 24px',
          color: '#172033',
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 900,
        }}
      >
        סטטיסטיקות ונתונים
      </h2>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} loading={loading} />
        ))}
      </div>

      {loading ? (
        <div
          aria-label="טוען תרשימים"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '24px',
          }}
        >
          {[1, 2, 3, 4].map((item) => <div key={item} style={chartSkeletonStyle} />)}
        </div>
      ) : (
        !error && (
          <DashboardCharts
            registrationsPerActivity={data.registrationsPerActivity}
            activityTypeDistribution={data.activityTypeDistribution}
            registrationsOverTime={data.registrationsOverTime}
            paidVsPendingPerActivity={data.paidVsPendingPerActivity}
          />
        )
      )}
    </section>
  );
}

export default DashboardStats;
