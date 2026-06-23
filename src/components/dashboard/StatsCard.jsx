function StatsCard({ title, value, icon, color, loading }) {
  return (
    <article
      dir="rtl"
      style={{
        display: 'flex',
        minHeight: '138px',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '18px',
        padding: '20px',
        borderInlineStart: `5px solid ${color}`,
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div>
        {loading ? (
          <div
            aria-label="טוען נתון"
            style={{
              width: '82px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#e5e7eb',
              animation: 'dashboardPulse 1.5s ease-in-out infinite',
            }}
          />
        ) : (
          <p style={{ margin: 0, color: '#172033', fontSize: '2.25rem', fontWeight: 900 }}>
            {value}
          </p>
        )}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '1rem', fontWeight: 700 }}>
          {title}
        </p>
      </div>
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          width: '52px',
          height: '52px',
          flexShrink: 0,
          placeItems: 'center',
          borderRadius: '14px',
          backgroundColor: `${color}18`,
          fontSize: '1.7rem',
        }}
      >
        {icon}
      </span>
    </article>
  );
}

export default StatsCard;
