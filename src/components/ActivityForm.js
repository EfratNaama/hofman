import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const categoryOptions = ['ספורט', 'אמנות', 'הרצאה', 'מוזיקה', 'חברה', 'בריאות', 'אחר'];
const dayOptions = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const initialFormState = {
  title: '',
  description: '',
  category: '',
  dayOfWeek: '',
  activityDate: '',
  time: '',
  maxParticipants: '',
  currentParticipants: 0,
  isActive: true,
  requiresPayment: false,
  paymentLink: '',
};

function ActivityForm({ initialValues, isSubmitting, submitLabel, onSubmit }) {
  const [formData, setFormData] = useState({
    ...initialFormState,
    ...initialValues,
  });
  const [validationError, setValidationError] = useState('');

  const availableSpots = useMemo(() => {
    const maxParticipants = Number(formData.maxParticipants || 0);
    const currentParticipants = Number(formData.currentParticipants || 0);
    return maxParticipants - currentParticipants;
  }, [formData.maxParticipants, formData.currentParticipants]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'יש להזין שם פעילות.';
    if (!formData.category) return 'יש לבחור קטגוריה.';
    if (!formData.dayOfWeek) return 'יש לבחור יום בשבוע.';
    if (!formData.activityDate) return 'יש לבחור תאריך פעילות.';
    if (!formData.time) return 'יש להזין שעת פעילות.';

    const maxParticipants = Number(formData.maxParticipants);
    const currentParticipants = Number(formData.currentParticipants || 0);

    if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
      return 'מספר המשתתפים המקסימלי חייב להיות מספר חיובי.';
    }

    if (!Number.isFinite(currentParticipants) || currentParticipants < 0) {
      return 'מספר המשתתפים הנוכחי לא יכול להיות שלילי.';
    }

    if (currentParticipants > maxParticipants) {
      return 'מספר המשתתפים הנוכחי לא יכול להיות גדול מהמכסה.';
    }

    if (formData.requiresPayment && !formData.paymentLink.trim()) {
      return 'כאשר הפעילות בתשלום יש להזין קישור לתשלום.';
    }

    return '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errorMessage = validateForm();
    setValidationError(errorMessage);

    if (errorMessage) {
      return;
    }

    onSubmit({
      ...formData,
      maxParticipants: Number(formData.maxParticipants),
      currentParticipants: Number(formData.currentParticipants || 0),
      availableSpots,
    });
  };

  return (
    <form className="space-y-6 text-right" dir="rtl" onSubmit={handleSubmit}>
      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700" role="alert">
          {validationError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">שם הפעילות</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">קטגוריה</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">בחרו קטגוריה</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-2 block text-lg font-bold text-slate-800">תיאור</span>
          <textarea
            className="min-h-36 w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">יום בשבוע</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="dayOfWeek"
            value={formData.dayOfWeek}
            onChange={handleChange}
          >
            <option value="">בחרו יום</option>
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">תאריך</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="activityDate"
            type="date"
            value={formData.activityDate}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">שעה</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">מכסת משתתפים</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            min="1"
            name="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">משתתפים רשומים</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            min="0"
            name="currentParticipants"
            type="number"
            value={formData.currentParticipants}
            onChange={handleChange}
          />
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-base font-bold text-slate-500">מקומות פנויים</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{Number.isFinite(availableSpots) ? availableSpots : 0}</p>
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <label className="flex items-center gap-3 text-lg font-bold text-slate-800">
            <input
              className="h-6 w-6 rounded border-slate-300 text-sky-800 focus:ring-sky-700"
              checked={formData.isActive}
              name="isActive"
              type="checkbox"
              onChange={handleChange}
            />
            פעילות פעילה
          </label>
          <label className="flex items-center gap-3 text-lg font-bold text-slate-800">
            <input
              className="h-6 w-6 rounded border-slate-300 text-sky-800 focus:ring-sky-700"
              checked={formData.requiresPayment}
              name="requiresPayment"
              type="checkbox"
              onChange={handleChange}
            />
            נדרש תשלום
          </label>
        </div>

        {formData.requiresPayment && (
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-lg font-bold text-slate-800">קישור לתשלום</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
              name="paymentLink"
              type="url"
              value={formData.paymentLink}
              onChange={handleChange}
            />
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-sky-800 px-7 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'שומר...' : submitLabel}
        </button>
        <Link className="rounded-lg bg-slate-100 px-7 py-4 text-lg font-bold text-slate-700 hover:bg-slate-200" to="/activities">
          ביטול
        </Link>
      </div>
    </form>
  );
}

export default ActivityForm;
