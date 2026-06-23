import React from 'react';

function ContactIcon({ type }) {
  const commonProps = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    className: 'shrink-0 text-[#d4a373]',
  };

  if (type === 'phone') {
    return (
      <svg {...commonProps}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.09 9.84a16 16 0 0 0 6.07 6.07l1.23-1.23a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CenterInfoSection({ centerInfo, loading }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" dir="rtl" id="contact">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div className="space-y-8 text-right">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.15em] text-[#d4a373]">פרטי המרכז</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">איך ליצור קשר עם בית הופמן</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-5 rounded-3xl bg-[#f8f5f0] p-6">
              <div className="flex items-start gap-3">
                <ContactIcon type="location" />
                <div>
                  <p className="font-semibold text-slate-950">כתובת</p>
                  <p className="text-slate-700">אליעזר הגדול 4, ירושלים</p>
                  <p className="text-slate-700">Waze: בית הופמן</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ContactIcon type="phone" />
                <div>
                  <p className="font-semibold text-slate-950">טלפון ראשי</p>
                  <a
                    className="text-slate-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a373]"
                    href="tel:026788848"
                    aria-label="התקשרות לבית הופמן בטלפון 02-6788848"
                  >
                    02-6788848
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ContactIcon type="phone" />
                <div>
                  <p className="font-semibold text-slate-950">אנשי קשר</p>
                  <p className="text-slate-700">
                    שירן –{' '}
                    <a
                      className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a373]"
                      href="tel:0504483859"
                      aria-label="התקשרות לשירן בטלפון 050-4483859"
                    >
                      050-4483859
                    </a>
                  </p>
                  <p className="text-slate-700">
                    סיון –{' '}
                    <a
                      className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a373]"
                      href="tel:0503082593"
                      aria-label="התקשרות לסיון בטלפון 050-3082593"
                    >
                      050-3082593
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-950">שעות פתיחה</p>
                {loading ? (
                  <p className="mt-2 text-slate-700">טוען שעות פעילות...</p>
                ) : (centerInfo?.openingHours || []).length > 0 ? (
                  <ul className="mt-2 space-y-1 text-slate-700">
                    {centerInfo.openingHours.map((slot, index) => (
                      <li key={index}>
                        {slot.day}: {slot.open} - {slot.close}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-slate-700">ראשון-חמישי, 09:00-17:00</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border-2 border-slate-200">
          <iframe
            title="מפת בית הופמן"
            src={centerInfo?.googleMapsEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d0'}
            className="h-96 w-full border-0"
            allowFullScreen=""
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export default CenterInfoSection;
