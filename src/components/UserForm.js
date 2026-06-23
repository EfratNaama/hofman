import { useState } from 'react';
import { Link } from 'react-router-dom';

const roleOptions = ['admin', 'manager', 'resident', 'volunteer'];
const statusOptions = ['active', 'inactive'];

const roleLabels = {
  admin: 'מנהל',
  manager: 'מנהל מערכת',
  resident: 'משתמש',
  volunteer: 'מתנדב',
};

const statusLabels = {
  active: 'פעיל',
  inactive: 'לא פעיל',
};

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  role: 'resident',
  status: 'active',
  createdAt: '',
};

function UserForm({ initialValues, isSubmitting, submitLabel, onSubmit }) {
  const [formData, setFormData] = useState({
    ...initialFormState,
    ...initialValues,
  });
  const [validationError, setValidationError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setValidationError('שם מלא, אימייל וטלפון הם שדות חובה.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">שם מלא</span>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">אימייל</span>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">טלפון</span>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">נוצר בתאריך</span>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
            name="createdAt"
            type="datetime-local"
            value={formData.createdAt}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">תפקיד</span>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">סטטוס</span>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-md bg-sky-800 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'שומר...' : submitLabel}
        </button>
        <Link className="rounded-md bg-slate-100 px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-200" to="/users">
          ביטול
        </Link>
      </div>
    </form>
  );
}

export default UserForm;
