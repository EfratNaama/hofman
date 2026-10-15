import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, User, HeartHandshake, ShieldCheck } from 'lucide-react';
import { formatDateTimeInput } from '../utils/dateUtils';
import './UserForm.css';

const roleOptions = [
  { value: 'resident', label: 'משתמש', description: 'צפייה והרשמה לפעילויות', Icon: User },
  { value: 'volunteer', label: 'מתנדב', description: 'השתתפות בפעילות התנדבותית', Icon: HeartHandshake },
  { value: 'admin', label: 'מנהל', description: 'ניהול משתמשים ופעילויות', Icon: ShieldCheck },
];
const statusOptions = ['active', 'inactive'];

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

const validateField = (name, value) => {
  const trimmed = value.trim();
  if (name === 'fullName' && !/\p{L}/u.test(trimmed)) {
    return 'יש להזין שם מלא תקין';
  }
  if (name === 'email') {
    const parts = trimmed.split('@');
    const local = parts[0];
    const domain = parts[1];
    if (parts.length !== 2 || /\s/u.test(trimmed) ||
        !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) ||
        local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
        !domain || domain.split('.').length < 2 ||
        !domain.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))) {
      return 'יש להזין כתובת אימייל תקינה';
    }
  }
  if (name === 'phone') {
    // Validate a normalized copy; preserve the user's displayed formatting.
    const phone = trimmed.replace(/[ -]/g, '').replace(/^\+972/, '0');
    if (!/^(?:05[0-58]\d{7}|0[23489]\d{7}|07[2-46789]\d{7})$/.test(phone)) {
      return 'יש להזין מספר טלפון תקין';
    }
  }
  if (name === 'createdAt' && trimmed && Number.isNaN(new Date(trimmed).getTime())) {
    return 'יש להזין תאריך תקין';
  }
  return '';
};

/*
 * Form styles, scoped under .auf. Used by both "הוספת משתמש" and "עריכת משתמש".
 * Sizes are in rem so the site's accessibility font scale still applies.
 */
const FORM_STYLES = `
.auf * { font-size: inherit; box-sizing: border-box; }
.auf { display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #2b211c; text-align: right; }
.auf-section { padding: 22px 24px; background: #fff; border: 1px solid #ece3da; border-radius: 22px; }
.auf-section__title { margin: 0; font-size: 1.15rem; font-weight: 800; }
.auf-section__sub { margin: 2px 0 16px; font-size: 0.875rem; color: #6b5a50; }
.auf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 14px 16px; }
.auf-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.95rem; font-weight: 700; }
.auf-req { color: #a84f3d; }
.auf-input {
  width: 100%; height: 48px; padding: 0 14px; border: 1px solid #e3d7cc; border-radius: 12px;
  background: #fbf8f4; color: #2b211c; font: inherit; font-size: 1rem; font-weight: 400;
  transition: border-color .15s ease, background-color .15s ease;
}
.auf-input:focus { outline: 2px solid #3f6b5f; outline-offset: 1px; border-color: #3f6b5f; background: #fff; }
.auf-input--ltr { direction: ltr; text-align: right; }


.auf-status { display: inline-flex; padding: 4px; border-radius: 14px; background: #f3ede6; margin: 0; border: 0; }
.auf-status__opt { position: relative; display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 18px; border-radius: 10px; font-weight: 700; color: #5c4a40; cursor: pointer; transition: background-color .15s ease, color .15s ease; }
.auf-status__opt input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.auf-status__dot { width: 9px; height: 9px; border-radius: 50%; background: #b9b0a8; }
.auf-status__opt.is-on { background: #fff; color: #2b211c; box-shadow: 0 2px 6px rgba(60,40,25,.1); }
.auf-status__opt.is-on.is-active .auf-status__dot { background: #00846f; }
.auf-status__opt:focus-within { outline: 3px solid #d4a373; outline-offset: 2px; }
.auf-row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-top: 14px; }

.auf-error { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }
.auf-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.auf-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 0 24px;
  border-radius: 14px; border: 1px solid transparent; font: inherit; font-size: 1rem; font-weight: 800; text-decoration: none; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.auf-btn--primary { background: #a84f3d; color: #fff; }
.auf-btn--primary:hover:not(:disabled) { background: #93422f; color: #fff; }
.auf-btn--ghost { background: #fff; border-color: #e3d7cc; color: #2b211c; }
.auf-btn--ghost:hover { border-color: #c9b6a8; color: #2b211c; }
.auf-btn:disabled { opacity: .65; cursor: wait; }
.auf a:focus-visible, .auf button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
`;

function UserForm({ isCreating = false, initialValues, isSubmitting, submitLabel, onSubmit }) {
  const [formData, setFormData] = useState(() => ({
    ...initialFormState,
    createdAt: isCreating ? formatDateTimeInput(new Date()) : '',
    ...initialValues,
  }));
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
    if (isCreating && fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError('');

    if (isCreating) {
      const errors = Object.fromEntries(
        ['fullName', 'email', 'phone', 'createdAt'].map((name) => [name, validateField(name, formData[name])])
      );
      setFieldErrors(errors);
      const firstInvalid = Object.keys(errors).find((name) => errors[name]);
      if (firstInvalid) {
        event.currentTarget.elements.namedItem(firstInvalid).focus();
        return;
      }
    }

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setValidationError('שם מלא, אימייל וטלפון הם שדות חובה.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="auf" dir="rtl" noValidate={isCreating}>
      <style>{FORM_STYLES}</style>

      {validationError && <div className="auf-error" role="alert">{validationError}</div>}

      <section className="auf-section" aria-labelledby="auf-personal">
        <h2 id="auf-personal" className="auf-section__title">פרטים אישיים</h2>
        <p className="auf-section__sub">שדות המסומנים ב־<span className="auf-req">*</span> הם חובה</p>
        <div className="auf-grid">
          <label className="auf-field">
            <span>שם מלא <span className="auf-req">*</span></span>
            <input
              className="auf-input"
              name="fullName"
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'auf-fullName-error' : undefined}
              type="text"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            {fieldErrors.fullName && <span id="auf-fullName-error" className="auf-error" role="alert">{fieldErrors.fullName}</span>}
          </label>

          <label className="auf-field">
            <span>אימייל <span className="auf-req">*</span></span>
            <input
              className="auf-input auf-input--ltr"
              name="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'auf-email-error' : undefined}
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && <span id="auf-email-error" className="auf-error" role="alert">{fieldErrors.email}</span>}
          </label>

          <label className="auf-field">
            <span>טלפון <span className="auf-req">*</span></span>
            <input
              className="auf-input auf-input--ltr"
              name="phone"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'auf-phone-error' : undefined}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            {fieldErrors.phone && <span id="auf-phone-error" className="auf-error" role="alert">{fieldErrors.phone}</span>}
          </label>
        </div>
      </section>

      <section className="auf-section" aria-labelledby="auf-access">
        <h2 id="auf-access" className="auf-section__title">תפקיד והרשאות</h2>
        <p className="auf-section__sub">התפקיד קובע מה המשתמש יכול לראות ולעשות באתר</p>

        {isCreating && (
          <fieldset className="auf-roles" aria-labelledby="auf-access" disabled={isSubmitting}>
            {roleOptions.map(({ value, label, description, Icon }) => (
              <label key={value} className={`auf-role${formData.role === value ? ' is-selected' : ''}`}>
                <input type="radio" name="role" value={value} checked={formData.role === value} onChange={handleChange} />
                <Icon size={24} aria-hidden="true" />
                <span className="auf-role__title">{label}</span>
                <span className="auf-role__description">{description}</span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="auf-row">
          <div className="auf-field">
            <span id="auf-status-label">סטטוס</span>
            <fieldset className="auf-status" aria-labelledby="auf-status-label">
              {statusOptions.map((status) => {
                const isOn = formData.status === status;
                return (
                  <label
                    key={status}
                    className={`auf-status__opt${isOn ? ' is-on' : ''}${status === 'active' ? ' is-active' : ''}`}
                  >
                    <input type="radio" name="status" value={status} checked={isOn} onChange={handleChange} />
                    <span className="auf-status__dot" aria-hidden="true" />
                    {statusLabels[status]}
                  </label>
                );
              })}
            </fieldset>
          </div>

          <label className="auf-field" style={{ flex: '0 1 280px' }}>
            נוצר בתאריך
            <input
              className="auf-input"
              name="createdAt"
              aria-invalid={Boolean(fieldErrors.createdAt)}
              aria-describedby={fieldErrors.createdAt ? 'auf-createdAt-error' : undefined}
              type="datetime-local"
              value={formData.createdAt}
              onChange={handleChange}
            />
            {fieldErrors.createdAt && <span id="auf-createdAt-error" className="auf-error" role="alert">{fieldErrors.createdAt}</span>}
          </label>
        </div>
      </section>

      <div className="auf-actions">
        <button className="auf-btn auf-btn--primary" type="submit" disabled={isSubmitting}>
          <Save size={18} aria-hidden="true" />
          {isSubmitting ? 'שומר...' : submitLabel}
        </button>
        <Link className="auf-btn auf-btn--ghost" to="/users">ביטול</Link>
      </div>
    </form>
  );
}

export default UserForm;
