import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fileToBase64 } from '../services/galleryService';
import { formatActivityDateInput } from '../utils/activityDateUtils';

const otherCategory = 'אחר';
const categoryGroups = [
  {
    category: 'חוגים',
    subCategories: ['עיוני', 'ספורט', 'אומנות'],
  },
  {
    category: 'תרבות ופנאי',
    subCategories: ['מופעים', 'הרצאות', 'פרויקטים', 'טיולים', 'סדנאות'],
  },
  {
    category: 'מועדונים חברתיים',
    subCategories: ['מועדון מפגש', 'שני שני', 'נשים באמצע החיים'],
  },
];
const mainCategoryOptions = [...categoryGroups.map((group) => group.category), otherCategory];
const subCategoryToMainCategory = categoryGroups.reduce((lookup, group) => {
  group.subCategories.forEach((subCategory) => {
    lookup[subCategory] = group.category;
  });
  return lookup;
}, {});
const dayOptions = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const typeOptions = ['קבוע', 'חד פעמי'];

const initialFormState = {
  title: '',
  description: '',
  type: 'קבוע',
  location: '',
  whatsappLink: '',
  imageUrl: '',
  lecturer: {
    name: '',
    description: '',
    imageBase64: '',
  },
  category: '',
  subCategory: '',
  customCategory: '',
  dayOfWeek: '',
  daysOfWeek: [],
  date: '',
  activityDate: '',
  startDate: '',
  endDate: '',
  time: '',
  maxParticipants: '',
  currentParticipants: 0,
  isActive: true,
  requiresPayment: false,
  price: '',
  paymentLink: '',
};

function normalizeCategoryFields(initialValues) {
  const category = String(initialValues?.category || '').trim();
  const subCategory = String(initialValues?.subCategory || '').trim();

  if (!category) {
    return { category: '', subCategory: '', customCategory: '' };
  }

  if (category === otherCategory) {
    return { category, subCategory, customCategory: subCategory };
  }

  if (mainCategoryOptions.includes(category)) {
    return { category, subCategory, customCategory: '' };
  }

  if (subCategoryToMainCategory[category]) {
    return {
      category: subCategoryToMainCategory[category],
      subCategory: category,
      customCategory: '',
    };
  }

  return { category: otherCategory, subCategory: category, customCategory: category };
}

function buildFormState(initialValues) {
  const type = initialValues?.type || 'קבוע';
  const date = formatActivityDateInput(initialValues?.date || initialValues?.activityDate);
  const startDate = formatActivityDateInput(
    initialValues?.startDate || (type === 'קבוע' ? initialValues?.activityDate : '')
  );
  const endDate = formatActivityDateInput(initialValues?.endDate);
  const daysOfWeek = Array.isArray(initialValues?.daysOfWeek) && initialValues.daysOfWeek.length
    ? initialValues.daysOfWeek
    : initialValues?.dayOfWeek
      ? [initialValues.dayOfWeek]
      : [];
  const requiresPayment = Boolean(
    initialValues?.paymentRequired ?? initialValues?.requiresPayment
  );
  const categoryFields = normalizeCategoryFields(initialValues);

  return {
    ...initialFormState,
    ...initialValues,
    ...categoryFields,
    lecturer: {
      ...initialFormState.lecturer,
      ...(initialValues?.lecturer || {}),
    },
    type,
    date: type === 'חד פעמי' ? date : '',
    activityDate: type === 'חד פעמי' ? date : startDate,
    startDate: type === 'קבוע' ? startDate : '',
    endDate: type === 'קבוע' ? endDate : '',
    daysOfWeek: type === 'קבוע' ? daysOfWeek : [],
    requiresPayment,
    price: requiresPayment ? (initialValues?.price ?? '') : '',
    dayOfWeek: type === 'קבוע' ? (daysOfWeek[0] || '') : '',
  };
}

/*
 * Form styles, scoped under .aaf. Used by "יצירת פעילות" and "עריכת פעילות".
 * Sizes are in rem so the site's accessibility font scale still applies.
 */
const FORM_STYLES = `
.aaf * { font-size: inherit; box-sizing: border-box; }
.aaf { display: flex; flex-direction: column; gap: 16px; font-size: 1rem; color: #2b211c; text-align: right; }
.aaf-section { padding: 22px 24px; background: #fff; border: 1px solid #ece3da; border-radius: 22px; }
.aaf-section__head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
.aaf-step { width: 34px; height: 34px; flex: 0 0 auto; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f6eee8; color: #a84f3d; font-weight: 800; }
.aaf-section__title { margin: 0; font-size: 1.2rem; font-weight: 800; line-height: 1.3; }
.aaf-section__sub { margin: 2px 0 0; font-size: 0.875rem; color: #6b5a50; }
.aaf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.aaf-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 16px; }
.aaf-span-2 { grid-column: 1 / -1; }
.aaf-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: 0.95rem; font-weight: 700; }
.aaf-label { padding: 0; font-size: 0.95rem; font-weight: 700; }
.aaf-req { color: #a84f3d; }
.aaf-opt { font-weight: 400; color: #8a7b70; font-size: 0.85rem; }
.aaf-input {
  width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid #e3d7cc; border-radius: 12px;
  background: #fbf8f4; color: #2b211c; font: inherit; font-size: 1rem; font-weight: 400;
  transition: border-color .15s ease, background-color .15s ease;
}
.aaf-input--lg { min-height: 54px; font-size: 1.15rem; font-weight: 600; }
.aaf-input:focus { outline: 2px solid #3f6b5f; outline-offset: 1px; border-color: #3f6b5f; background: #fff; }
.aaf-textarea { min-height: 120px; padding: 12px 14px; line-height: 1.6; resize: vertical; }
.aaf-textarea--sm { min-height: 90px; }
.aaf-ltr { direction: ltr; text-align: right; }
select.aaf-input { cursor: pointer; }

.aaf-seg { display: inline-flex; padding: 4px; margin: 0; border: 0; border-radius: 14px; background: #f3ede6; }
.aaf-seg__opt { position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 10px; font-weight: 700; color: #5c4a40; cursor: pointer; transition: background-color .15s ease, color .15s ease; }
.aaf-seg__opt input, .aaf-day input, .aaf-switch input, .aaf-drop input, .aaf-avatar input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.aaf-seg__opt.is-on { background: #fff; color: #2b211c; box-shadow: 0 2px 6px rgba(60,40,25,.1); }
.aaf-seg__opt:focus-within, .aaf-day:focus-within, .aaf-drop:focus-within, .aaf-avatar:focus-within { outline: 3px solid #d4a373; outline-offset: 2px; }

.aaf-days { margin: 18px 0 0; padding: 0; border: 0; }
.aaf-days__row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.aaf-day {
  position: relative; display: inline-flex; align-items: center; justify-content: center; min-width: 64px; min-height: 44px; padding: 0 14px;
  border-radius: 999px; border: 1px solid #e3d7cc; background: #fff; font-weight: 700; cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.aaf-day:hover { border-color: #3f6b5f; }
.aaf-day.is-on { background: #2c4d44; border-color: #2c4d44; color: #fff; }

.aaf-media { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: stretch; }
.aaf-media__preview { aspect-ratio: 16 / 10; border-radius: 16px; overflow: hidden; background: #f3ede6; display: flex; align-items: center; justify-content: center; }
.aaf-media__preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.aaf-media__empty { color: #8a7b70; font-weight: 600; }
.aaf-media__controls { display: flex; flex-direction: column; gap: 12px; }
.aaf-drop {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  min-height: 96px; padding: 12px; border: 2px dashed #d9cec2; border-radius: 16px; background: #fbf8f4; text-align: center; cursor: pointer;
  transition: border-color .15s ease, background-color .15s ease;
}
.aaf-drop:hover { border-color: #3f6b5f; background: #f2f8f6; }
.aaf-drop__title { font-weight: 800; overflow-wrap: anywhere; }
.aaf-drop__hint { font-size: 0.85rem; color: #6b5a50; }

.aaf-lecturer { display: flex; gap: 18px; align-items: flex-start; }
.aaf-avatar {
  position: relative; width: 104px; height: 104px; flex: 0 0 auto; border-radius: 50%; overflow: hidden; cursor: pointer;
  display: flex; align-items: center; justify-content: center; background: #f3ede6; border: 2px dashed #d9cec2;
}
.aaf-avatar img { width: 100%; height: 100%; object-fit: cover; }
.aaf-avatar__plus { font-size: 2rem; color: #a84f3d; font-weight: 300; }
.aaf-avatar__label { position: absolute; bottom: 0; inset-inline: 0; padding: 2px 0 6px; background: rgba(43,33,28,.55); color: #fff; font-size: 0.75rem; font-weight: 700; text-align: center; }
.aaf-lecturer__fields { flex: 1; }

.aaf-spots { display: flex; flex-direction: column; justify-content: center; padding: 8px 16px; border-radius: 14px; background: #e6efec; }
.aaf-spots__label { font-size: 0.85rem; font-weight: 700; color: #2c4d44; }
.aaf-spots__value { font-size: 1.8rem; font-weight: 800; line-height: 1.1; color: #2c4d44; }

.aaf-switches { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
.aaf-switch { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 14px; background: #fbf8f4; border: 1px solid #f0e8df; cursor: pointer; }
.aaf-switch__title { display: block; font-weight: 800; }
.aaf-switch__hint { display: block; font-size: 0.82rem; color: #6b5a50; }
.aaf-switch__track { position: relative; width: 48px; height: 28px; flex: 0 0 auto; border-radius: 999px; background: #d6ccc3; transition: background-color .2s ease; }
.aaf-switch__thumb { position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .2s ease; }
.aaf-switch input:checked + .aaf-switch__track { background: #00846f; }
.aaf-switch input:checked + .aaf-switch__track .aaf-switch__thumb { transform: translateX(-20px); }
.aaf-switch input:focus-visible + .aaf-switch__track { outline: 3px solid #d4a373; outline-offset: 2px; }
.aaf-pay { margin-top: 14px; padding: 14px; border-radius: 14px; background: #fdf6ea; border: 1px solid #f1e0be; }

.aaf-error { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }
.aaf-inline-error { margin: 6px 0 0; color: #b42318; font-size: 0.9rem; font-weight: 600; }
.aaf-actions {
  position: sticky; bottom: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 0;
  background: linear-gradient(to top, #f6f2ec 70%, rgba(246,242,236,0));
}
.aaf-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 28px;
  border-radius: 14px; border: 1px solid transparent; font: inherit; font-size: 1.05rem; font-weight: 800; text-decoration: none; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.aaf-btn--primary { background: #a84f3d; color: #fff; box-shadow: 0 10px 22px rgba(168,79,61,.22); }
.aaf-btn--primary:hover:not(:disabled) { background: #93422f; color: #fff; }
.aaf-btn--ghost { background: #fff; border-color: #e3d7cc; color: #2b211c; }
.aaf-btn--ghost:hover { border-color: #c9b6a8; color: #2b211c; }
.aaf-btn:disabled { opacity: .65; cursor: wait; }
.aaf a:focus-visible, .aaf button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }

@media (max-width: 720px) {
  .aaf-grid, .aaf-grid--3, .aaf-media, .aaf-switches { grid-template-columns: 1fr; }
  .aaf-section { padding: 18px; }
  .aaf-lecturer { flex-direction: column; }
  .aaf-btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .aaf-switch__track, .aaf-switch__thumb { transition: none; }
}
`;

function ActivityForm({ initialValues, isSubmitting, resetKey, submitLabel, onSubmit }) {
  const [formData, setFormData] = useState(buildFormState(initialValues));
  const [validationError, setValidationError] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState('');
  const [lecturerImageUploadError, setLecturerImageUploadError] = useState('');
  const [selectedLecturerImageFile, setSelectedLecturerImageFile] = useState(null);
  const [selectedLecturerImagePreviewUrl, setSelectedLecturerImagePreviewUrl] = useState('');
  const isOneTime = formData.type === 'חד פעמי';
  const selectedCategoryGroup = categoryGroups.find((group) => group.category === formData.category);
  const hasListedSubCategory = Boolean(
    selectedCategoryGroup?.subCategories.includes(formData.subCategory)
  );

  useEffect(() => {
    setFormData(buildFormState(initialValues));
    setValidationError('');
    setImageUploadError('');
    setLecturerImageUploadError('');
    setIsReadingImage(false);
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl('');
    setSelectedLecturerImageFile(null);
    setSelectedLecturerImagePreviewUrl('');
  }, [initialValues, resetKey]);

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImageFile]);

  useEffect(() => {
    if (!selectedLecturerImageFile) {
      setSelectedLecturerImagePreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedLecturerImageFile);
    setSelectedLecturerImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedLecturerImageFile]);

  const availableSpots = useMemo(() => {
    const maxParticipants = Number(formData.maxParticipants || 0);
    const currentParticipants = Number(formData.currentParticipants || 0);
    return maxParticipants - currentParticipants;
  }, [formData.maxParticipants, formData.currentParticipants]);
  const imagePreviewUrl = selectedImagePreviewUrl || formData.imageUrl?.trim();
  const lecturerImagePreviewUrl = selectedLecturerImagePreviewUrl || formData.lecturer?.imageBase64?.trim();

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    if (name === 'imageUrl') {
      setSelectedImageFile(null);
      setImageUploadError('');
    }

    setFormData((currentData) => {
      const nextData = {
        ...currentData,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'type') {
        return {
          ...nextData,
          date: value === 'חד פעמי' ? nextData.date : '',
          activityDate: value === 'חד פעמי' ? nextData.date : nextData.startDate,
          startDate: value === 'קבוע' ? nextData.startDate : '',
          endDate: value === 'קבוע' ? nextData.endDate : '',
          dayOfWeek: value === 'קבוע' ? (nextData.daysOfWeek[0] || '') : '',
          daysOfWeek: value === 'קבוע' ? nextData.daysOfWeek : [],
        };
      }

      if (name === 'category') {
        return {
          ...nextData,
          subCategory: '',
          customCategory: '',
        };
      }

      if (name === 'customCategory') {
        return {
          ...nextData,
          subCategory: value,
        };
      }

      if (name === 'date') {
        return {
          ...nextData,
          activityDate: value,
        };
      }

      if (name === 'startDate') {
        return {
          ...nextData,
          activityDate: value,
        };
      }

      if (name === 'requiresPayment' && !checked) {
        return {
          ...nextData,
          price: '',
        };
      }

      return nextData;
    });
  };

  const handleLecturerChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      lecturer: {
        ...currentData.lecturer,
        [name]: value,
      },
    }));
  };

  const handleWeekdayChange = (day) => {
    setFormData((currentData) => {
      const isSelected = currentData.daysOfWeek.includes(day);
      const daysOfWeek = isSelected
        ? currentData.daysOfWeek.filter((selectedDay) => selectedDay !== day)
        : [...currentData.daysOfWeek, day];

      return {
        ...currentData,
        daysOfWeek,
        dayOfWeek: daysOfWeek[0] || '',
      };
    });
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    setImageUploadError('');
    setSelectedImageFile(null);

    if (!file) {
      return;
    }

    if (!file.type?.startsWith('image/')) {
      setImageUploadError('יש לבחור קובץ תמונה תקין.');
      event.target.value = '';
      return;
    }

    setSelectedImageFile(file);
  };

  const handleLecturerImageFileChange = (event) => {
    const file = event.target.files?.[0];
    setLecturerImageUploadError('');
    setSelectedLecturerImageFile(null);

    if (!file) {
      return;
    }

    if (!file.type?.startsWith('image/')) {
      setLecturerImageUploadError('יש לבחור קובץ תמונה תקין.');
      event.target.value = '';
      return;
    }

    setSelectedLecturerImageFile(file);
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'יש להזין שם פעילות.';
    if (!formData.description.trim()) return 'יש להזין תיאור פעילות.';
    if (!formData.location.trim()) return 'יש להזין מקום פעילות.';
    if (!formData.category) return 'יש לבחור קטגוריה.';
    if (formData.category === otherCategory && !formData.customCategory.trim()) {
      return 'יש להזין קטגוריה מותאמת.';
    }
    if (formData.category !== otherCategory && !formData.subCategory) {
      return 'יש לבחור תת קטגוריה.';
    }
    if (!formData.type) return 'יש לבחור סוג פעילות.';
    if (formData.type === 'קבוע') {
      if (!formData.startDate) return 'יש לבחור תאריך התחלה.';
      if (!formData.endDate) return 'יש לבחור תאריך סיום.';
      if (formData.endDate < formData.startDate) {
        return 'תאריך הסיום לא יכול להיות לפני תאריך ההתחלה.';
      }
      if (!formData.daysOfWeek.length) return 'יש לבחור לפחות יום אחד בשבוע.';
    }
    if (formData.type === 'חד פעמי' && !formData.date) return 'יש לבחור תאריך פעילות.';
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

    if (formData.requiresPayment) {
      if (formData.price === '') return 'כאשר הפעילות בתשלום יש להזין מחיר.';

      const price = Number(formData.price);
      if (!Number.isFinite(price) || price < 0) {
        return 'מחיר הפעילות חייב להיות מספר גדול או שווה לאפס.';
      }
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isReadingImage) {
      return;
    }

    const errorMessage = validateForm();
    setValidationError(errorMessage);

    if (errorMessage) {
      return;
    }

    const subCategory = formData.category === otherCategory
      ? formData.customCategory.trim()
      : formData.subCategory;

    let imageUrl = formData.imageUrl;
    let lecturerImageBase64 = formData.lecturer?.imageBase64 || '';

    if (selectedImageFile || selectedLecturerImageFile) {
      setIsReadingImage(true);
      setImageUploadError('');
      setLecturerImageUploadError('');

      try {
        if (selectedImageFile) {
          imageUrl = await fileToBase64(selectedImageFile, { resize: true });
        }

        if (selectedLecturerImageFile) {
          lecturerImageBase64 = await fileToBase64(selectedLecturerImageFile, { resize: true });
        }
      } catch (error) {
        const errorMessage = error.message || 'לא ניתן לטעון את קובץ התמונה.';
        if (selectedImageFile) {
          setImageUploadError(errorMessage);
        }
        if (selectedLecturerImageFile) {
          setLecturerImageUploadError(errorMessage);
        }
        setIsReadingImage(false);
        return;
      }

      setIsReadingImage(false);
    }

    onSubmit({
      ...formData,
      imageUrl,
      lecturer: {
        name: formData.lecturer?.name?.trim() || '',
        description: formData.lecturer?.description?.trim() || '',
        imageBase64: lecturerImageBase64,
      },
      subCategory,
      type: formData.type || 'קבוע',
      dayOfWeek: isOneTime ? '' : (formData.daysOfWeek[0] || ''),
      daysOfWeek: isOneTime ? [] : formData.daysOfWeek,
      date: isOneTime ? formData.date : '',
      activityDate: isOneTime ? formData.date : formData.startDate,
      startDate: isOneTime ? '' : formData.startDate,
      endDate: isOneTime ? '' : formData.endDate,
      maxParticipants: Number(formData.maxParticipants),
      currentParticipants: Number(formData.currentParticipants || 0),
      availableSpots,
      paymentRequired: Boolean(formData.requiresPayment),
      price: formData.requiresPayment ? Number(formData.price) : 0,
    });
  };

  return (
    <form className="aaf" dir="rtl" onSubmit={handleSubmit} noValidate>
      <style>{FORM_STYLES}</style>

      {validationError && <div className="aaf-error" role="alert">{validationError}</div>}

      {/* 1. details */}
      <section className="aaf-section" aria-labelledby="aaf-s1">
        <header className="aaf-section__head">
          <span className="aaf-step" aria-hidden="true">1</span>
          <div>
            <h2 id="aaf-s1" className="aaf-section__title">פרטי הפעילות</h2>
            <p className="aaf-section__sub">שם, תיאור וקטגוריה, כפי שיופיעו באתר</p>
          </div>
        </header>

        <div className="aaf-grid">
          <label className="aaf-field aaf-span-2">
            <span>שם הפעילות <span className="aaf-req">*</span></span>
            <input className="aaf-input aaf-input--lg" name="title" type="text" value={formData.title} onChange={handleChange} placeholder="לדוגמה: סדנת ציור" />
          </label>

          <label className="aaf-field aaf-span-2">
            <span>תיאור <span className="aaf-req">*</span></span>
            <textarea className="aaf-input aaf-textarea" name="description" value={formData.description} onChange={handleChange} placeholder="מה עושים, למי זה מתאים ומה כדאי להביא" />
          </label>

          <label className="aaf-field">
            <span>קטגוריה <span className="aaf-req">*</span></span>
            <select className="aaf-input" name="category" value={formData.category} onChange={handleChange}>
              <option value="">בחרו קטגוריה</option>
              {mainCategoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          {selectedCategoryGroup && (
            <label className="aaf-field">
              <span>תת קטגוריה <span className="aaf-req">*</span></span>
              <select className="aaf-input" name="subCategory" value={formData.subCategory} onChange={handleChange}>
                <option value="">בחרו תת קטגוריה</option>
                {formData.subCategory && !hasListedSubCategory && (
                  <option value={formData.subCategory}>{formData.subCategory}</option>
                )}
                {selectedCategoryGroup.subCategories.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>{subCategory}</option>
                ))}
              </select>
            </label>
          )}

          {formData.category === otherCategory && (
            <label className="aaf-field">
              <span>קטגוריה מותאמת <span className="aaf-req">*</span></span>
              <input className="aaf-input" name="customCategory" type="text" value={formData.customCategory} onChange={handleChange} />
            </label>
          )}

          <label className="aaf-field">
            <span>מקום <span className="aaf-req">*</span></span>
            <input className="aaf-input" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="לדוגמה: בית הופמן" />
          </label>

          <label className="aaf-field">
            <span>קישור לקבוצת וואטסאפ <span className="aaf-opt">(לא חובה)</span></span>
            <input className="aaf-input aaf-ltr" name="whatsappLink" type="url" value={formData.whatsappLink} placeholder="https://chat.whatsapp.com/..." onChange={handleChange} />
          </label>
        </div>
      </section>

      {/* 2. when */}
      <section className="aaf-section" aria-labelledby="aaf-s2">
        <header className="aaf-section__head">
          <span className="aaf-step" aria-hidden="true">2</span>
          <div>
            <h2 id="aaf-s2" className="aaf-section__title">מתי</h2>
            <p className="aaf-section__sub">פעילות קבועה חוזרת כל שבוע. חד־פעמית מתקיימת בתאריך אחד</p>
          </div>
        </header>

        <fieldset className="aaf-seg" aria-label="סוג פעילות">
          {typeOptions.map((typeOption) => (
            <label key={typeOption} className={`aaf-seg__opt${formData.type === typeOption ? ' is-on' : ''}`}>
              <input type="radio" name="type" value={typeOption} checked={formData.type === typeOption} onChange={handleChange} />
              {typeOption === 'קבוע' ? 'פעילות קבועה' : 'פעילות חד־פעמית'}
            </label>
          ))}
        </fieldset>

        <div className="aaf-grid aaf-grid--3">
          {isOneTime ? (
            <label className="aaf-field">
              <span>תאריך <span className="aaf-req">*</span></span>
              <input className="aaf-input" name="date" type="date" value={formData.date} onChange={handleChange} />
            </label>
          ) : (
            <>
              <label className="aaf-field">
                <span>מתאריך <span className="aaf-req">*</span></span>
                <input className="aaf-input" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
              </label>
              <label className="aaf-field">
                <span>עד תאריך <span className="aaf-req">*</span></span>
                <input className="aaf-input" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
              </label>
            </>
          )}
          <label className="aaf-field">
            <span>שעה <span className="aaf-req">*</span></span>
            <input className="aaf-input" name="time" type="time" value={formData.time} onChange={handleChange} />
          </label>
        </div>

        {!isOneTime && (
          <fieldset className="aaf-days">
            <legend className="aaf-label">ימים בשבוע <span className="aaf-req">*</span></legend>
            <div className="aaf-days__row">
              {dayOptions.map((day) => {
                const isOn = formData.daysOfWeek.includes(day);
                return (
                  <label key={day} className={`aaf-day${isOn ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={isOn} onChange={() => handleWeekdayChange(day)} />
                    {day}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </section>

      {/* 3. image */}
      <section className="aaf-section" aria-labelledby="aaf-s3">
        <header className="aaf-section__head">
          <span className="aaf-step" aria-hidden="true">3</span>
          <div>
            <h2 id="aaf-s3" className="aaf-section__title">תמונה</h2>
            <p className="aaf-section__sub">תמונה לרוחב נראית הכי טוב בכרטיס הפעילות</p>
          </div>
        </header>

        <div className="aaf-media">
          <div className="aaf-media__preview">
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="תצוגה מקדימה של תמונת הפעילות" />
            ) : (
              <span className="aaf-media__empty">אין תמונה עדיין</span>
            )}
          </div>
          <div className="aaf-media__controls">
            <label className="aaf-drop">
              <input type="file" accept="image/*" onChange={handleImageFileChange} />
              <span className="aaf-drop__title">{selectedImageFile ? selectedImageFile.name : 'העלאת תמונה מהמחשב'}</span>
              <span className="aaf-drop__hint">{isReadingImage ? 'טוען תמונה...' : 'לחצו לבחירת קובץ'}</span>
            </label>
            {imageUploadError && <p className="aaf-inline-error">{imageUploadError}</p>}
            <label className="aaf-field">
              <span>או קישור לתמונה <span className="aaf-opt">(לא חובה)</span></span>
              <input className="aaf-input aaf-ltr" name="imageUrl" type="text" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
            </label>
          </div>
        </div>
      </section>

      {/* 4. lecturer */}
      <section className="aaf-section" aria-labelledby="aaf-s4">
        <header className="aaf-section__head">
          <span className="aaf-step" aria-hidden="true">4</span>
          <div>
            <h2 id="aaf-s4" className="aaf-section__title">מרצה / מדריך <span className="aaf-opt">(לא חובה)</span></h2>
            <p className="aaf-section__sub">יופיע בעמוד הפעילות מעל פרטי הפעילות</p>
          </div>
        </header>

        <div className="aaf-lecturer">
          <label className="aaf-avatar" title="בחירת תמונת מרצה">
            <input type="file" accept="image/*" onChange={handleLecturerImageFileChange} />
            {lecturerImagePreviewUrl ? (
              <img src={lecturerImagePreviewUrl} alt="תצוגה מקדימה של המרצה" />
            ) : (
              <span className="aaf-avatar__plus" aria-hidden="true">+</span>
            )}
            <span className="aaf-avatar__label">תמונה</span>
          </label>
          <div className="aaf-grid aaf-lecturer__fields">
            <label className="aaf-field aaf-span-2">
              <span>שם המרצה</span>
              <input className="aaf-input" name="name" type="text" value={formData.lecturer?.name || ''} onChange={handleLecturerChange} />
            </label>
            <label className="aaf-field aaf-span-2">
              <span>כמה מילים על המרצה</span>
              <textarea className="aaf-input aaf-textarea aaf-textarea--sm" name="description" value={formData.lecturer?.description || ''} onChange={handleLecturerChange} />
            </label>
          </div>
        </div>
        {lecturerImageUploadError && <p className="aaf-inline-error">{lecturerImageUploadError}</p>}
      </section>

      {/* 5. registration & payment */}
      <section className="aaf-section" aria-labelledby="aaf-s5">
        <header className="aaf-section__head">
          <span className="aaf-step" aria-hidden="true">5</span>
          <div>
            <h2 id="aaf-s5" className="aaf-section__title">הרשמה ותשלום</h2>
            <p className="aaf-section__sub">מכסת משתתפים, מצב הפעילות ותשלום</p>
          </div>
        </header>

        <div className="aaf-grid aaf-grid--3">
          <label className="aaf-field">
            <span>מכסת משתתפים <span className="aaf-req">*</span></span>
            <input className="aaf-input" min="1" name="maxParticipants" type="number" value={formData.maxParticipants} onChange={handleChange} />
          </label>
          <label className="aaf-field">
            <span>משתתפים רשומים</span>
            <input className="aaf-input" min="0" name="currentParticipants" type="number" value={formData.currentParticipants} onChange={handleChange} />
          </label>
          <div className="aaf-spots" aria-live="polite">
            <span className="aaf-spots__label">מקומות פנויים</span>
            <span className="aaf-spots__value">{Number.isFinite(availableSpots) ? availableSpots : 0}</span>
          </div>
        </div>

        <div className="aaf-switches">
          <label className="aaf-switch">
            <span>
              <span className="aaf-switch__title">הפעילות פעילה</span>
              <span className="aaf-switch__hint">{formData.isActive ? 'מוצגת באתר ופתוחה להרשמה' : 'מוסתרת מהאתר'}</span>
            </span>
            <input checked={formData.isActive} name="isActive" type="checkbox" onChange={handleChange} />
            <span className="aaf-switch__track" aria-hidden="true"><span className="aaf-switch__thumb" /></span>
          </label>
          <label className="aaf-switch">
            <span>
              <span className="aaf-switch__title">נדרש תשלום</span>
              <span className="aaf-switch__hint">{formData.requiresPayment ? 'יש להזין מחיר וקישור לתשלום' : 'הפעילות ללא תשלום'}</span>
            </span>
            <input checked={formData.requiresPayment} name="requiresPayment" type="checkbox" onChange={handleChange} />
            <span className="aaf-switch__track" aria-hidden="true"><span className="aaf-switch__thumb" /></span>
          </label>
        </div>

        {formData.requiresPayment && (
          <div className="aaf-grid aaf-pay">
            <label className="aaf-field">
              <span>מחיר (₪) <span className="aaf-req">*</span></span>
              <input className="aaf-input" min="0" name="price" type="number" step="0.01" value={formData.price} placeholder="50" onChange={handleChange} />
            </label>
            <label className="aaf-field">
              <span>קישור לתשלום <span className="aaf-req">*</span></span>
              <input className="aaf-input aaf-ltr" name="paymentLink" type="url" value={formData.paymentLink} onChange={handleChange} placeholder="https://..." />
            </label>
          </div>
        )}
      </section>

      <div className="aaf-actions">
        <button className="aaf-btn aaf-btn--primary" type="submit" disabled={isSubmitting || isReadingImage}>
          {isSubmitting ? 'שומר...' : submitLabel}
        </button>
        <Link className="aaf-btn aaf-btn--ghost" to="/activities">ביטול</Link>
      </div>
    </form>
  );
}

export default ActivityForm;
