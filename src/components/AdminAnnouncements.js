import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Megaphone, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../services/announcementService';
import LogoLoader from './LogoLoader';
import './AdminAnnouncements.css';

const emptyForm = {
  title: '',
  content: '',
  isActive: true,
};

const TITLE_MAX = 80;

const FILTERS = [
  { key: 'all', label: 'הכל' },
  { key: 'active', label: 'מוצגות באתר' },
  { key: 'inactive', label: 'מושבתות' },
];

const formatDate = (value) => (
  value?.toDate ? value.toDate().toLocaleDateString('he-IL') : 'תאריך לא זמין'
);

/*
 * All styles for this page live here, scoped under .aan, in the same visual
 * language as the admin dashboard. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const PAGE_STYLES = `
.aan * { font-size: inherit; box-sizing: border-box; }
.aan {
  min-height: calc(100vh - 96px); padding: 32px 20px 64px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.aan-shell { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.aan a:focus-visible, .aan button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
.aan-in { animation: aan-in .55s cubic-bezier(.2,.7,.2,1) both; }

.aan-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.aan-title { margin: 0; font-size: clamp(1.8rem, 3vw, 2.2rem); font-weight: 800; line-height: 1.15; color: #2b211c; }
.aan-subtitle { margin: 4px 0 0; color: #6b5a50; }
.aan-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.aan-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; background: #fff; border: 1px solid #ece3da; font-size: 0.9rem; font-weight: 700; color: #5c4a40; }
.aan-pill b { font-size: 1rem; color: #2b211c; }

.aan-alert { padding: 12px 16px; border-radius: 12px; font-weight: 600; animation: aan-in .3s ease both; }
.aan-alert--error { background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; }
.aan-alert--success { background: #e6efec; border: 1px solid #c3d8d1; color: #2c4d44; }

.aan-layout { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 20px; align-items: start; }

/* composer */
.aan-composer {
  position: sticky; top: 112px; display: flex; flex-direction: column; gap: 16px; padding: 22px;
  background: #fff; border: 1px solid #ece3da; border-radius: 22px;
}
.aan-composer.is-editing { border-color: #e2b8a6; box-shadow: 0 0 0 4px #fbf1ec; }
.aan-composer__head { display: flex; align-items: center; gap: 12px; }
.aan-composer__icon { width: 44px; height: 44px; flex: 0 0 auto; border-radius: 14px; background: #f6eee8; color: #a84f3d; display: flex; align-items: center; justify-content: center; }
.aan-composer__title { margin: 0; font-size: 1.25rem; font-weight: 800; }
.aan-composer__hint { margin: 0; font-size: 0.875rem; color: #6b5a50; }
.aan-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.95rem; font-weight: 700; color: #2b211c; }
.aan-field__row { display: flex; justify-content: space-between; align-items: baseline; }
.aan-counter { font-size: 0.8rem; font-weight: 600; color: #6b5a50; }
.aan-input, .aan-textarea {
  width: 100%; border: 1px solid #e3d7cc; border-radius: 12px; background: #fbf8f4; color: #2b211c;
  font: inherit; font-size: 1rem; font-weight: 400;
}
.aan-input { height: 48px; padding: 0 14px; }
.aan-textarea { min-height: 140px; padding: 12px 14px; resize: vertical; line-height: 1.6; }
.aan-input:focus, .aan-textarea:focus { outline: 2px solid #3f6b5f; outline-offset: 1px; border-color: #3f6b5f; background: #fff; }

.aan-switch { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #fbf8f4; border: 1px solid #f0e8df; cursor: pointer; }
.aan-switch__label { font-weight: 700; }
.aan-switch__hint { display: block; font-size: 0.8rem; font-weight: 400; color: #6b5a50; }
.aan-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.aan-switch__track { position: relative; width: 48px; height: 28px; flex: 0 0 auto; border-radius: 999px; background: #d6ccc3; transition: background-color .2s ease; }
.aan-switch__thumb { position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .2s ease; }
.aan-switch input:checked + .aan-switch__track { background: #00846f; }
.aan-switch input:checked + .aan-switch__track .aan-switch__thumb { transform: translateX(-20px); }
.aan-switch input:focus-visible + .aan-switch__track { outline: 3px solid #d4a373; outline-offset: 2px; }

.aan-preview { padding: 14px; border-radius: 16px; background: #f6f2ec; border: 1px dashed #dccbbe; }
.aan-preview__label { margin: 0 0 8px; font-size: 0.8rem; font-weight: 700; color: #6b5a50; }
.aan-preview__card { padding: 14px 16px; border-radius: 14px; background: #fff; border-inline-start: 4px solid #a84f3d; box-shadow: 0 6px 16px rgba(60,40,25,.06); }
.aan-preview__card.is-off { opacity: .55; }
.aan-preview__title { margin: 0; font-size: 1.05rem; font-weight: 800; }
.aan-preview__text { margin: 4px 0 0; color: #5c4a40; white-space: pre-line; overflow-wrap: anywhere; }
.aan-preview__empty { color: #b0a297; }

.aan-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.aan-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 48px; padding: 0 20px;
  border-radius: 12px; border: 1px solid transparent; font: inherit; font-size: 1rem; font-weight: 800; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.aan-btn--primary { flex: 1; background: #a84f3d; color: #fff; }
.aan-btn--primary:hover:not(:disabled) { background: #93422f; }
.aan-btn--ghost { background: #fff; border-color: #e3d7cc; color: #2b211c; }
.aan-btn--ghost:hover { border-color: #c9b6a8; }
.aan-btn:disabled { opacity: .65; cursor: wait; }

/* list */
.aan-list-panel { display: flex; flex-direction: column; gap: 14px; }
.aan-list-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.aan-list-title { margin: 0; font-size: 1.25rem; font-weight: 800; }
.aan-tabs { display: inline-flex; padding: 4px; border-radius: 14px; background: #fff; border: 1px solid #ece3da; }
.aan-tab {
  min-height: 38px; padding: 0 14px; border: 0; border-radius: 10px; background: transparent; color: #5c4a40;
  font: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: background-color .15s ease, color .15s ease;
}
.aan-tab[aria-pressed="true"] { background: #2c4d44; color: #fff; }

.aan-list { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
.aan-card {
  position: relative; display: flex; flex-direction: column; gap: 10px; padding: 18px 20px;
  background: #fff; border: 1px solid #ece3da; border-radius: 18px; border-inline-start: 5px solid #00846f;
  animation: aan-in .4s cubic-bezier(.2,.7,.2,1) both;
  transition: box-shadow .25s ease, border-color .25s ease;
}
.aan-card:hover { box-shadow: 0 12px 26px rgba(90,51,39,.08); }
.aan-card.is-off { border-inline-start-color: #c9bfb6; background: #fcfaf8; }
.aan-card.is-editing { border-color: #e2b8a6; border-inline-start-color: #a84f3d; box-shadow: 0 0 0 4px #fbf1ec; }
.aan-card__head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 8px; }
.aan-card__date { margin: 0; font-size: 0.8rem; font-weight: 600; color: #6b5a50; }
.aan-card__title { margin: 2px 0 0; font-size: 1.15rem; font-weight: 800; line-height: 1.3; }
.aan-status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.aan-status__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.aan-status--on { background: #e6efec; color: #2c4d44; }
.aan-status--off { background: #efebe6; color: #5c524c; }
.aan-card__content { margin: 0; color: #5c4a40; line-height: 1.65; white-space: pre-line; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.aan-card__actions { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 10px; border-top: 1px solid #f3ede6; }
.aan-act {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 10px;
  border: 1px solid #e3d7cc; background: #fbf8f4; color: #2b211c; font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.aan-act:hover:not(:disabled) { background: #fff; border-color: #c9b6a8; }
.aan-act--danger { margin-inline-start: auto; background: #fff; border-color: #f1c4bf; color: #b42318; }
.aan-act--danger:hover:not(:disabled) { background: #fdf0ee; }
.aan-act:disabled { opacity: .6; cursor: wait; }
.aan-empty { padding: 32px 20px; border-radius: 18px; background: #fff; border: 1px dashed #e3d7cc; color: #6b5a50; text-align: center; }

@keyframes aan-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (max-width: 900px) {
  .aan-layout { grid-template-columns: 1fr; }
  .aan-composer { position: static; }
}
@media (prefers-reduced-motion: reduce) {
  .aan-in, .aan-card, .aan-alert { animation: none; }
  .aan-switch__track, .aan-switch__thumb { transition: none; }
}
`;

function AdminAnnouncements() {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  async function loadAnnouncements() {
    setIsLoading(true);
    setError('');

    try {
      const announcementsData = await getAnnouncements();
      setAnnouncements(announcementsData);
    } catch (err) {
      console.error('Firestore "announcements" query failed while loading admin announcements:', err);
      setError(`לא ניתן לטעון את ההודעות כרגע. ${err.message || ''}`.trim());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const counts = useMemo(() => ({
    all: announcements.length,
    active: announcements.filter((item) => item.isActive).length,
    inactive: announcements.filter((item) => !item.isActive).length,
  }), [announcements]);

  const visibleAnnouncements = useMemo(() => announcements.filter((item) => (
    filter === 'all' || (filter === 'active' ? item.isActive : !item.isActive)
  )), [announcements, filter]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId('');
    setError('');
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title || '',
      content: announcement.content || announcement.message || '',
      isActive: Boolean(announcement.isActive),
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isAdmin) {
      setError('אין לך הרשאה לבצע פעולה זו');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('יש להזין כותרת ותוכן הודעה.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        await updateAnnouncement(editingId, formData);
        setMessage('ההודעה עודכנה בהצלחה.');
      } else {
        await createAnnouncement(formData);
        setMessage('ההודעה פורסמה בהצלחה.');
      }

      resetForm();
      await loadAnnouncements();
    } catch (err) {
      console.error('Firestore "announcements" write failed while saving announcement:', err);
      setError(`שמירת ההודעה נכשלה. ${err.message || ''}`.trim());
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (announcement) => {
    setError('');
    setMessage('');

    if (!isAdmin) {
      setError('אין לך הרשאה לבצע פעולה זו');
      return;
    }

    setActionId(announcement.id);

    try {
      await updateAnnouncement(announcement.id, {
        title: announcement.title || '',
        content: announcement.content || announcement.message || '',
        isActive: !announcement.isActive,
      });
      setMessage(!announcement.isActive ? 'ההודעה הופעלה.' : 'ההודעה הושבתה.');
      await loadAnnouncements();
    } catch (err) {
      console.error('Firestore "announcements" write failed while changing announcement status:', err);
      setError(`עדכון מצב ההודעה נכשל. ${err.message || ''}`.trim());
    } finally {
      setActionId('');
    }
  };

  const handleDelete = async (announcement) => {
    setError('');
    setMessage('');

    if (!isAdmin) {
      setError('אין לך הרשאה לבצע פעולה זו');
      return;
    }

    const confirmed = window.confirm('האם למחוק את ההודעה החשובה?');
    if (!confirmed) {
      return;
    }

    setActionId(announcement.id);

    try {
      await deleteAnnouncement(announcement.id);
      setMessage('ההודעה נמחקה בהצלחה.');
      if (editingId === announcement.id) {
        resetForm();
      }
      await loadAnnouncements();
    } catch (err) {
      console.error('Firestore "announcements" delete failed:', err);
      setError(`מחיקת ההודעה נכשלה. ${err.message || ''}`.trim());
    } finally {
      setActionId('');
    }
  };

  return (
    <section className="aan" dir="rtl">
      <style>{PAGE_STYLES}</style>
      <div className="aan-shell">
        <header className="aan-header aan-in">
          <div>
            <h1 className="aan-title">ניהול הודעות</h1>
            <p className="aan-subtitle">הודעות חשובות שמוצגות למשתמשי האתר</p>
          </div>
        </header>

        {(error || message) && (
          <div className={`aan-alert ${error ? 'aan-alert--error' : 'aan-alert--success'}`} role={error ? 'alert' : 'status'}>
            {error || message}
          </div>
        )}

        <div className="aan-layout">
          <form
            className={`aan-composer aan-in${editingId ? ' is-editing' : ''}`}
            style={{ animationDelay: '.05s' }}
            onSubmit={handleSubmit}
          >
            <div className="aan-composer__head">
              <span className="aan-composer__icon" aria-hidden="true">
                {editingId ? <Pencil size={20} /> : <Megaphone size={20} />}
              </span>
              <div>
                <h2 className="aan-composer__title">{editingId ? 'עריכת הודעה' : 'הודעה חדשה'}</h2>
                <p className="aan-composer__hint">
                  {editingId ? 'השינויים יופיעו באתר מיד אחרי השמירה' : 'כתבו הודעה קצרה וברורה'}
                </p>
              </div>
            </div>

            <label className="aan-field">
              <span className="aan-field__row">
                כותרת
                <span className="aan-counter">{formData.title.length}/{TITLE_MAX}</span>
              </span>
              <input
                className="aan-input"
                name="title"
                type="text"
                maxLength={TITLE_MAX}
                value={formData.title}
                onChange={handleChange}
                placeholder="לדוגמה: שינוי בשעות הפעילות"
              />
            </label>

            <label className="aan-field">
              תוכן ההודעה
              <textarea
                className="aan-textarea"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="מה חשוב שהמשתמשים יידעו?"
              />
            </label>

            <label className="aan-switch">
              <span>
                <span className="aan-switch__label">הצגה באתר</span>
                <span className="aan-switch__hint">
                  {formData.isActive ? 'ההודעה תוצג למשתמשים' : 'ההודעה תישמר בלי להופיע באתר'}
                </span>
              </span>
              <input checked={formData.isActive} name="isActive" type="checkbox" onChange={handleChange} />
              <span className="aan-switch__track" aria-hidden="true"><span className="aan-switch__thumb" /></span>
            </label>

            <div className="aan-preview" aria-label="תצוגה מקדימה">
              <p className="aan-preview__label">תצוגה מקדימה</p>
              <div className={`aan-preview__card${formData.isActive ? '' : ' is-off'}`}>
                <p className={`aan-preview__title${formData.title ? '' : ' aan-preview__empty'}`}>
                  {formData.title || 'כותרת ההודעה'}
                </p>
                <p className={`aan-preview__text${formData.content ? '' : ' aan-preview__empty'}`}>
                  {formData.content || 'כאן יופיע תוכן ההודעה'}
                </p>
              </div>
            </div>

            <div className="aan-actions">
              <button className="aan-btn aan-btn--primary" type="submit" disabled={isSaving}>
                {isSaving ? 'שומר...' : editingId ? 'שמירת שינויים' : 'פרסום הודעה'}
              </button>
              {editingId && (
                <button className="aan-btn aan-btn--ghost" type="button" onClick={resetForm}>
                  <X size={16} aria-hidden="true" />
                  ביטול עריכה
                </button>
              )}
            </div>
          </form>

          <section className="aan-list-panel aan-in" style={{ animationDelay: '.1s' }} aria-labelledby="aan-list-title">
            <div className="aan-list-head">
              <h2 id="aan-list-title" className="aan-list-title">כל ההודעות</h2>
              <div className="aan-tabs" role="group" aria-label="סינון הודעות">
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="aan-tab"
                    aria-pressed={filter === item.key}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label} ({counts[item.key]})
                  </button>
                ))}
              </div>
            </div>

            {isLoading && <LogoLoader label="טוען הודעות..." />}

            {!isLoading && visibleAnnouncements.length === 0 && (
              <div className="aan-empty">
                {announcements.length === 0 ? 'אין הודעות עדיין. ההודעה הראשונה שתפרסמו תופיע כאן.' : 'אין הודעות בקטגוריה הזאת.'}
              </div>
            )}

            {!isLoading && visibleAnnouncements.length > 0 && (
              <ul className="aan-list">
                {visibleAnnouncements.map((announcement, index) => {
                  const isOn = Boolean(announcement.isActive);
                  const isBusy = actionId === announcement.id;
                  return (
                    <li
                      key={announcement.id}
                      className={`aan-card${isOn ? '' : ' is-off'}${editingId === announcement.id ? ' is-editing' : ''}`}
                      style={{ animationDelay: `${Math.min(index, 10) * 0.04}s` }}
                    >
                      <div className="aan-card__head">
                        <div>
                          <p className="aan-card__date">{formatDate(announcement.createdAt)}</p>
                          <h3 className="aan-card__title">{announcement.title}</h3>
                        </div>
                        <span className={`aan-status ${isOn ? 'aan-status--on' : 'aan-status--off'}`}>
                          <span className="aan-status__dot" aria-hidden="true" />
                          {isOn ? 'מוצגת באתר' : 'מושבתת'}
                        </span>
                      </div>

                      <p className="aan-card__content">{announcement.content || announcement.message || ''}</p>

                      <div className="aan-card__actions">
                        <button className="aan-act" type="button" onClick={() => handleEdit(announcement)}>
                          <Pencil size={15} aria-hidden="true" />
                          עריכה
                        </button>
                        <button
                          className="aan-act"
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(announcement)}
                        >
                          {isOn ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                          {isOn ? 'הסתרה מהאתר' : 'הצגה באתר'}
                        </button>
                        <button
                          className="aan-act aan-act--danger"
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(announcement)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          מחיקה
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

export default AdminAnnouncements;
