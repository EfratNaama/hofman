import React from 'react';

function CenterInfoSection({ centerInfo, loading }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" dir="rtl" id="contact">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div className="space-y-8 text-right">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.15em] text-[#d4a373]">פרטי המרכז</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">איך לתקשר עם בית הופמן</h2>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-[#f8f5f0] p-6 text-center">
              <p className="text-lg text-slate-600">טוען פרטי מרכז...</p>
            </div>
          ) : centerInfo ? (
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#f8f5f0] p-6 space-y-4">
                <div>
                  <p className="font-semibold text-slate-950">כתובת</p>
                  <p className="text-slate-700">{centerInfo.address || 'אין נתון זמין'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">טלפון</p>
                  <p className="text-slate-700">{centerInfo.phone || 'אין נתון זמין'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">אימייל</p>
                  <p className="text-slate-700">{centerInfo.email || 'אין נתון זמין'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">שעות פתיחה</p>
                  <ul className="mt-2 space-y-1 text-slate-700">
                    {(centerInfo.openingHours || []).map((slot, index) => (
                      <li key={index}>
                        {slot.day}: {slot.open} - {slot.close}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button type="button" className="rounded-2xl bg-[#d4a373] px-8 py-3 text-base font-semibold text-white shadow-md hover:bg-[#c38a5a] transition">
                צור קשר
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#f8f5f0] p-6 text-center">
              <p className="text-lg text-slate-600">אין מידע זמין כעת על המרכז.</p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border-2 border-slate-200">
          <iframe
            title="Google Map"
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
