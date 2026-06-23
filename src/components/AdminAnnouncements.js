import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../services/announcementService';

const emptyForm = {
  title: '',
  content: '',
  isActive: true,
};

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
    <section className="mx-auto max-w-7xl px-4 py-8 text-right" dir="rtl">
      <div className="mb-6">
        <p className="text-lg font-bold text-slate-500">ניהול אתר</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">הודעות חשובות</h1>
      </div>

      {(error || message) && (
        <div className={error ? 'mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700' : 'mb-5 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-lg font-semibold text-green-700'}>
          {error || message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-black text-slate-900">
            {editingId ? 'עריכת הודעה' : 'הודעה חדשה'}
          </h2>

          <div className="mt-5 grid gap-5">
            <label className="block">
              <span className="mb-2 block text-lg font-bold text-slate-800">כותרת</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-bold text-slate-800">תוכן ההודעה</span>
              <textarea
                className="min-h-36 w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                name="content"
                value={formData.content}
                onChange={handleChange}
              />
            </label>

            <label className="flex items-center gap-3 text-lg font-bold text-slate-800">
              <input
                className="h-6 w-6 rounded border-slate-300 text-sky-800 focus:ring-sky-700"
                checked={formData.isActive}
                name="isActive"
                type="checkbox"
                onChange={handleChange}
              />
              הצגה באתר
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-sky-800 px-7 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'שומר...' : editingId ? 'שמירת שינויים' : 'פרסום הודעה'}
            </button>
            {editingId && (
              <button
                className="rounded-lg bg-slate-100 px-7 py-4 text-lg font-bold text-slate-700 hover:bg-slate-200"
                type="button"
                onClick={resetForm}
              >
                ביטול עריכה
              </button>
            )}
          </div>
        </form>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">כל ההודעות</h2>

          {isLoading && <p className="mt-5 text-lg font-semibold text-slate-700">טוען הודעות...</p>}

          {!isLoading && announcements.length === 0 && (
            <p className="mt-5 rounded-lg bg-slate-50 p-5 text-lg font-semibold text-slate-700">
              אין הודעות עדיין.
            </p>
          )}

          {!isLoading && announcements.length > 0 && (
            <div className="mt-5 grid gap-4">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-500">
                        {announcement.createdAt?.toDate
                          ? announcement.createdAt.toDate().toLocaleDateString('he-IL')
                          : 'תאריך לא זמין'}
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-900">{announcement.title}</h3>
                    </div>
                    <span className={announcement.isActive ? 'rounded-full bg-green-100 px-4 py-2 text-base font-bold text-green-700' : 'rounded-full bg-slate-100 px-4 py-2 text-base font-bold text-slate-600'}>
                      {announcement.isActive ? 'פעילה' : 'לא פעילה'}
                    </span>
                  </div>

                  <p className="mt-4 text-lg leading-8 text-slate-700">
                    {announcement.content || announcement.message || ''}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className="rounded-lg bg-sky-100 px-5 py-3 text-lg font-bold text-sky-800 hover:bg-sky-200"
                      type="button"
                      onClick={() => handleEdit(announcement)}
                    >
                      עריכה
                    </button>
                    <button
                      className="rounded-lg bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      type="button"
                      disabled={actionId === announcement.id}
                      onClick={() => handleToggleActive(announcement)}
                    >
                      {announcement.isActive ? 'השבתה' : 'הפעלה'}
                    </button>
                    <button
                      className="rounded-lg bg-red-50 px-5 py-3 text-lg font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      type="button"
                      disabled={actionId === announcement.id}
                      onClick={() => handleDelete(announcement)}
                    >
                      מחיקה
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default AdminAnnouncements;
