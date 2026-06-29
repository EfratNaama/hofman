import { Link } from 'react-router-dom';
import { CalendarPlus, ClipboardList } from 'lucide-react';

const links = [
  {
    title: 'הוספת פעילות',
    description: 'יצירת פעילות חדשה במערכת.',
    to: '/activities/new',
    icon: CalendarPlus,
  },
  {
    title: 'ניהול פעילויות',
    description: 'צפייה, עריכה, מחיקה וניהול נרשמים לפעילויות.',
    to: '/activities',
    icon: ClipboardList,
  },
];

function ActivityManagementHub() {
  return (
    <main
      className="activity-management-hub"
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 96px)',
        padding: 'clamp(28px, 5vw, 64px) 20px',
        background:
          'radial-gradient(circle at 18% 16%, rgba(212, 163, 115, 0.16), transparent 18rem), #f8f5f0',
      }}
    >
      <style>{`
        .activity-management-hub__shell {
          width: min(100%, 980px);
          margin: 0 auto;
        }

        .activity-management-hub__header {
          margin: 0 auto 30px;
          padding: clamp(24px, 4vw, 34px);
          border: 1px solid rgba(205, 178, 165, 0.7);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 18px 44px rgba(15, 34, 64, 0.08);
          text-align: center;
        }

        .activity-management-hub__header h1 {
          margin: 0;
          color: #0f2240;
          font-size: clamp(2.1rem, 5vw, 3.25rem);
          font-weight: 800;
          line-height: 1.1;
        }

        .activity-management-hub__header p {
          max-width: 560px;
          margin: 14px auto 0;
          color: #5f5047;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          line-height: 1.7;
          font-weight: 500;
        }

        .activity-management-hub__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(18px, 3vw, 26px);
        }

        .activity-management-hub__card {
          position: relative;
          display: grid;
          gap: 18px;
          min-height: 230px;
          padding: clamp(24px, 4vw, 32px);
          overflow: hidden;
          border: 1px solid rgba(205, 178, 165, 0.72);
          border-radius: 26px;
          background: #ffffff;
          box-shadow: 0 16px 38px rgba(90, 51, 39, 0.1);
          color: #0f2240;
          text-decoration: none;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          cursor: pointer;
        }

        .activity-management-hub__card::before {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212, 163, 115, 0.18), rgba(248, 245, 240, 0));
          content: "";
          pointer-events: none;
        }

        .activity-management-hub__card:hover,
        .activity-management-hub__card:focus-visible {
          transform: translateY(-5px);
          border-color: rgba(168, 79, 61, 0.34);
          box-shadow: 0 24px 56px rgba(90, 51, 39, 0.16);
        }

        .activity-management-hub__icon {
          position: relative;
          display: inline-flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: #f8f5f0;
          color: #9a6b3f;
          border: 1px solid rgba(212, 163, 115, 0.45);
        }

        .activity-management-hub__card h2,
        .activity-management-hub__card p {
          position: relative;
        }

        .activity-management-hub__card h2 {
          margin: 0;
          font-size: clamp(1.35rem, 2.5vw, 1.75rem);
          font-weight: 800;
        }

        .activity-management-hub__card p {
          margin: 0;
          color: #5f5047;
          font-size: 1.08rem;
          line-height: 1.7;
          font-weight: 500;
        }

        @media (max-width: 720px) {
          .activity-management-hub__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="activity-management-hub__shell">
        <header className="activity-management-hub__header">
          <h1>ניהול פעילויות</h1>
          <p>בחרי פעולה לניהול הפעילויות באתר</p>
        </header>

        <div className="activity-management-hub__grid">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.title}
                to={link.to}
                className="activity-management-hub__card"
              >
                <span className="activity-management-hub__icon" aria-hidden="true">
                  <Icon size={30} strokeWidth={1.9} />
                </span>
                <h2>{link.title}</h2>
                <p>{link.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default ActivityManagementHub;
