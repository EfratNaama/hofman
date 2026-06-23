import { Link } from 'react-router-dom';

const links = [
  {
    title: 'הוספת פעילות',
    description: 'יצירת פעילות חדשה במערכת.',
    to: '/activities/new',
  },
  {
    title: 'פעילויות קיימות',
    description: 'צפייה, עריכה ומחיקה של פעילויות.',
    to: '/activities',
  },
  {
    title: 'נרשמים לפעילויות',
    description: 'פתיחת רשימות הנרשמים מתוך הפעילויות הקיימות.',
    to: '/activities',
  },
];

function ActivityManagementHub() {
  return (
    <main
      dir="rtl"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '32px',
      }}
    >
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: 0, color: '#1a1a2e', fontSize: '32px', fontWeight: 900 }}>
          ניהול פעילויות
        </h1>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}
      >
        {links.map((link) => (
          <Link
            key={link.title}
            to={link.to}
            style={{
              display: 'block',
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              color: '#1a1a2e',
              textDecoration: 'none',
              borderInlineStart: '4px solid #008080',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '21px' }}>{link.title}</h2>
            <p style={{ margin: '10px 0 0', color: '#64748b', lineHeight: 1.6 }}>
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default ActivityManagementHub;
