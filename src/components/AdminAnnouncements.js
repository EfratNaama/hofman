import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../services/announcementService';
import './AdminAnnouncements.css';

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
    <section className="admin-announcements-page" dir="rtl">
      <div className="admin-announcements-header">
        <p>ניהול אתר</p>
        <h1>הודעות חשובות</h1>
      </div>

      {(error || message) && (
        <div className={error ? 'admin-announcements-alert admin-announcements-alert--error' : 'admin-announcements-alert admin-announcements-alert--success'}>
          {error || message}
        </div>
      )}

      <div className="admin-announcements-layout">
        <form className="admin-announcements-form" onSubmit={handleSubmit}>
          <h2>
            {editingId ? 'עריכת הודעה' : 'הודעה חדשה'}
          </h2>

          <div className="admin-announcements-form__fields">
            <label className="admin-announcements-field">
              <span>כותרת</span>
              <input
                className="admin-announcements-input"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
              />
            </label>

            <label className="admin-announcements-field">
              <span>תוכן ההודעה</span>
              <textarea
                className="admin-announcements-textarea"
                name="content"
                value={formData.content}
                onChange={handleChange}
              />
            </label>

            <label className="admin-announcements-checkbox">
              <input
                className="admin-announcements-checkbox__input"
                checked={formData.isActive}
                name="isActive"
                type="checkbox"
                onChange={handleChange}
              />
              הצגה באתר
            </label>
          </div>

          <div className="admin-announcements-actions">
            <button
              className="admin-announcements-button admin-announcements-button--primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'שומר...' : editingId ? 'שמירת שינויים' : 'פרסום הודעה'}
            </button>
            {editingId && (
              <button
                className="admin-announcements-button admin-announcements-button--secondary"
                type="button"
                onClick={resetForm}
              >
                ביטול עריכה
              </button>
            )}
          </div>
        </form>

        <section className="admin-announcements-list-panel">
          <h2>כל ההודעות</h2>

          {isLoading && <p className="admin-announcements-state">טוען הודעות...</p>}

          {!isLoading && announcements.length === 0 && (
            <p className="admin-announcements-empty">
              אין הודעות עדיין.
            </p>
          )}

          {!isLoading && announcements.length > 0 && (
            <div className="admin-announcements-list">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="admin-announcements-card">
                  <div className="admin-announcements-card__header">
                    <div>
                      <p className="admin-announcements-card__date">
                        {announcement.createdAt?.toDate
                          ? announcement.createdAt.toDate().toLocaleDateString('he-IL')
                          : 'תאריך לא זמין'}
                      </p>
                      <h3>{announcement.title}</h3>
                    </div>
                    <span className={announcement.isActive ? 'admin-announcements-status admin-announcements-status--active' : 'admin-announcements-status admin-announcements-status--inactive'}>
                      {announcement.isActive ? 'פעילה' : 'לא פעילה'}
                    </span>
                  </div>

                  <p className="admin-announcements-card__content">
                    {announcement.content || announcement.message || ''}
                  </p>

                  <div className="admin-announcements-card__actions">
                    <button
                      className="admin-announcements-action admin-announcements-action--edit"
                      type="button"
                      onClick={() => handleEdit(announcement)}
                    >
                      עריכה
                    </button>
                    <button
                      className="admin-announcements-action admin-announcements-action--toggle"
                      type="button"
                      disabled={actionId === announcement.id}
                      onClick={() => handleToggleActive(announcement)}
                    >
                      {announcement.isActive ? 'השבתה' : 'הפעלה'}
                    </button>
                    <button
                      className="admin-announcements-action admin-announcements-action--delete"
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
