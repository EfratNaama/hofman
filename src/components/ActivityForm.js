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

function ActivityForm({ initialValues, isSubmitting, resetKey, submitLabel, onSubmit }) {
  const [formData, setFormData] = useState(buildFormState(initialValues));
  const [validationError, setValidationError] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState('');
  const isOneTime = formData.type === 'חד פעמי';
  const selectedCategoryGroup = categoryGroups.find((group) => group.category === formData.category);
  const hasListedSubCategory = Boolean(
    selectedCategoryGroup?.subCategories.includes(formData.subCategory)
  );

  useEffect(() => {
    setFormData(buildFormState(initialValues));
    setValidationError('');
    setImageUploadError('');
    setIsReadingImage(false);
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl('');
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

  const availableSpots = useMemo(() => {
    const maxParticipants = Number(formData.maxParticipants || 0);
    const currentParticipants = Number(formData.currentParticipants || 0);
    return maxParticipants - currentParticipants;
  }, [formData.maxParticipants, formData.currentParticipants]);
  const imagePreviewUrl = selectedImagePreviewUrl || formData.imageUrl?.trim();

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

    if (selectedImageFile) {
      setIsReadingImage(true);
      setImageUploadError('');

      try {
        imageUrl = await fileToBase64(selectedImageFile, { resize: true });
      } catch (error) {
        setImageUploadError(error.message || 'לא ניתן לטעון את קובץ התמונה.');
        setIsReadingImage(false);
        return;
      }

      setIsReadingImage(false);
    }

    onSubmit({
      ...formData,
      imageUrl,
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
            {mainCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        {selectedCategoryGroup && (
          <label className="block">
            <span className="mb-2 block text-lg font-bold text-slate-800">תת קטגוריה</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
            >
              <option value="">בחרו תת קטגוריה</option>
              {formData.subCategory && !hasListedSubCategory && (
                <option value={formData.subCategory}>{formData.subCategory}</option>
              )}
              {selectedCategoryGroup.subCategories.map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </select>
          </label>
        )}

        {formData.category === otherCategory && (
          <label className="block">
            <span className="mb-2 block text-lg font-bold text-slate-800">קטגוריה מותאמת</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
              name="customCategory"
              type="text"
              value={formData.customCategory}
              onChange={handleChange}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">סוג פעילות</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            {typeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">מקום</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">קישור לוואטסאפ (אופציונלי)</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="whatsappLink"
            type="url"
            value={formData.whatsappLink}
            placeholder="https://chat.whatsapp.com/... או https://wa.me/..."
            onChange={handleChange}
          />
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
          <span className="mb-2 block text-lg font-bold text-slate-800">קישור לתמונה (אופציונלי)</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            name="imageUrl"
            type="text"
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-bold text-slate-800">העלאת תמונה מהמחשב (אופציונלי)</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
          />
          {isReadingImage && (
            <p className="mt-2 text-base font-semibold text-slate-500">טוען תמונה...</p>
          )}
          {selectedImageFile && !isReadingImage && (
            <p className="mt-2 text-base font-semibold text-slate-500">{selectedImageFile.name}</p>
          )}
          {imageUploadError && (
            <p className="mt-2 text-base font-semibold text-red-700">{imageUploadError}</p>
          )}
        </label>

        {imagePreviewUrl && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
            <img
              src={imagePreviewUrl}
              alt="Activity preview"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '260px',
                objectFit: 'contain',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
              }}
            />
          </div>
        )}

        {isOneTime ? (
          <label className="block">
            <span className="mb-2 block text-lg font-bold text-slate-800">תאריך פעילות</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
            />
          </label>
        ) : (
          <>
            <label className="block">
              <span className="mb-2 block text-lg font-bold text-slate-800">תאריך התחלה</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-bold text-slate-800">תאריך סיום</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </label>

            <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
              <legend className="px-2 text-lg font-bold text-slate-800">ימים בשבוע</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {dayOptions.map((day) => (
                  <label
                    key={day}
                    className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-800"
                  >
                    <input
                      className="h-6 w-6 rounded border-slate-300 text-sky-800 focus:ring-sky-700"
                      type="checkbox"
                      checked={formData.daysOfWeek.includes(day)}
                      onChange={() => handleWeekdayChange(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

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
            נדרש תשלום? {formData.requiresPayment ? 'כן' : 'לא'}
          </label>
        </div>

        {formData.requiresPayment && (
          <>
            <label className="block">
              <span className="mb-2 block text-lg font-bold text-slate-800">מחיר</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                min="0"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                placeholder="50"
                onChange={handleChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-lg font-bold text-slate-800">קישור לתשלום</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm focus:border-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                name="paymentLink"
                type="url"
                value={formData.paymentLink}
                onChange={handleChange}
              />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-sky-800 px-7 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isSubmitting || isReadingImage}
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
