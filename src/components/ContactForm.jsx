import React, { useState } from 'react';
import { submitContactMessage } from '../services/contactService';

function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('אנא מלא את כל השדות לפני השליחה.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('אנא הזן אימייל תקין.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;
    setLoading(true);
    try {
      await submitContactMessage(formData);
      setSuccess('ההודעה נשלחה בהצלחה. נחזור אליך בקרוב.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (submitError) {
      setError('אירעה שגיאה בשליחת ההודעה. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" dir="rtl">
      <div className="rounded-3xl bg-[#e8dcc8] p-8 sm:p-12">
        <div className="mb-10 text-right">
          <p className="text-base font-semibold uppercase tracking-[0.15em] text-slate-900">צור קשר</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">נשמח לשמוע ממך</h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            מלא את הטופס ונציג של בית הופמן יחזור אליך בהקדם.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-base font-semibold text-slate-900 mb-2">שם</label>
              <input
                type="text"
                value={formData.name}
                onChange={handleChange('name')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg text-slate-900 outline-none focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/20"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-900 mb-2">אימייל</label>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg text-slate-900 outline-none focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-900 mb-2">נושא</label>
            <input
              type="text"
              value={formData.subject}
              onChange={handleChange('subject')}
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg text-slate-900 outline-none focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/20"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-900 mb-2">הודעה</label>
            <textarea
              value={formData.message}
              onChange={handleChange('message')}
              rows="6"
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg text-slate-900 outline-none focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/20"
            />
          </div>

          <div className="space-y-4 text-right">
            {error && (
              <div className="rounded-2xl bg-red-100 border border-red-300 p-4 text-base text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl bg-emerald-100 border border-emerald-300 p-4 text-base text-emerald-700">
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex rounded-2xl bg-[#d4a373] px-8 py-3 text-base font-semibold text-white shadow-md hover:bg-[#c38a5a] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              שלח הודעה
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default ContactForm;
