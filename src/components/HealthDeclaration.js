import { useEffect, useState } from 'react';
import { Check, ChevronDown, ClipboardList, X } from 'lucide-react';

/*
 * הצהרת בריאות — "הצהרת מבקש הבדיקה" from the paper form.
 * Each question is answered כן (✓) / לא (✗). Questions with `detail` need a text answer when the answer is כן.
 * Stored on the user document as `healthDeclaration`:
 *   { applicant: { a1: { answer: 'yes'|'no', details }, ... }, applicantConfirmed, applicantSignedAt }
 */

export const APPLICANT_QUESTIONS = [
  { id: 'a1', text: 'האם עברת אירוע של איבוד הכרה ב־5 השנים האחרונות?', detail: 'אם כן, מתי?' },
  { id: 'a2', text: 'האם הינך סובל מסחרחורות וחוסר שיווי משקל?' },
  { id: 'a3', text: 'האם אתה סובל מאפילפסיה (מחלת הכיפיון)?', detail: 'אם כן, מתי היה ההתקף האחרון?' },
  { id: 'a4', text: 'האם אתה מקבל בקביעות תרופות?', detail: 'אם כן, פרט:' },
  { id: 'a5', text: 'האם עברת אי פעם אירוע מוחי (שבץ מוחי)?', detail: 'אם כן, מתי?' },
  { id: 'a6', text: 'האם הינך סובל ממחלת לב?', detail: 'אם כן, פרט:' },
  { id: 'a7', text: 'האם אתה סובל מסכרת?', detail: 'אם כן, מהו סוג הטיפול שהנך מקבל לאיזון הסוכרת?' },
  { id: 'a8', text: 'האם עברת התקפים של ירידה חדה ברמת הסוכר בדם?' },
  { id: 'a9', text: 'האם יש הפרעות במהירות תגובה: זיכרון, התמצאות בזמן ובמקום?' },
  { id: 'a10', text: 'האם אתה סובל מבעיות נפשיות?', detail: 'אם כן, האם טופלת או הינך מטופל? פרט:' },
  { id: 'a11', text: 'האם אתה נוטל או נטלת בעבר תרופות המיועדות לטיפול במחלת נפש, מצבי רוח, ערנות ובעיות שינה?' },
  { id: 'a12', text: 'האם אתה נוטל סמים או תרופות העלולות להשפיע על מצב ההכרה או יכולת שיפוט?' },
  { id: 'a13', text: 'האם אתה צורך משקאות חריפים?' },
  { id: 'a14', text: 'האם אושפזת בעבר במוסד לגמילה או במוסד פסיכיאטרי?', detail: 'אם כן, פרט:' },
];

const CONFIRM_TEXT = 'אני החתום מטה מצהיר שכל תשובותיי בטופס זה תואמות את האמת';

const todayInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function createEmptyHealthDeclaration({ withToday = false } = {}) {
  return {
    applicant: Object.fromEntries(APPLICANT_QUESTIONS.map((question) => [question.id, { answer: '', details: '' }])),
    applicantConfirmed: false,
    applicantSignedAt: withToday ? todayInput() : '',
  };
}

// Fills in anything missing, so users without a declaration (or with partial data) still work.
export function normalizeHealthDeclaration(value, options) {
  const empty = createEmptyHealthDeclaration(options);
  if (!value || typeof value !== 'object') return empty;
  return {
    applicant: Object.fromEntries(
      Object.entries(empty.applicant).map(([id, item]) => {
        const saved = value.applicant?.[id];
        return [id, {
          answer: ['yes', 'no'].includes(saved?.answer) ? saved.answer : item.answer,
          details: typeof saved?.details === 'string' ? saved.details : item.details,
        }];
      })
    ),
    applicantConfirmed: Boolean(value.applicantConfirmed),
    applicantSignedAt: value.applicantSignedAt || empty.applicantSignedAt,
  };
}

// What gets saved: details only for "כן" answers, trimmed.
export function cleanHealthDeclaration(value) {
  const data = normalizeHealthDeclaration(value);
  return {
    applicant: Object.fromEntries(
      Object.entries(data.applicant).map(([id, item]) => [
        id,
        { answer: item.answer, details: item.answer === 'yes' ? item.details.trim() : '' },
      ])
    ),
    applicantConfirmed: data.applicantConfirmed,
    applicantSignedAt: data.applicantSignedAt,
  };
}

export function hasHealthDeclaration(value) {
  return Boolean(value?.applicant && Object.values(value.applicant).some((item) => item?.answer));
}

/*
 * Required: every question answered, details for "כן" where the form asks for them,
 * the confirmation box ticked and a valid date that is not in the future.
 * Returns { [fieldKey]: message } in form order; fieldKey is the question id, `${id}-details`, 'confirmed' or 'signedAt'.
 */
export function validateHealthDeclaration(value) {
  const data = normalizeHealthDeclaration(value);
  const errors = {};
  APPLICANT_QUESTIONS.forEach((question) => {
    const item = data.applicant[question.id];
    if (!item.answer) {
      errors[question.id] = 'יש לסמן כן או לא';
    } else if (question.detail && item.answer === 'yes' && !item.details.trim()) {
      errors[`${question.id}-details`] = 'יש למלא פירוט לתשובה "כן"';
    }
  });
  if (!data.applicantConfirmed) {
    errors.confirmed = 'יש לאשר שהתשובות תואמות את האמת';
  }
  if (!data.applicantSignedAt) {
    errors.signedAt = 'יש להזין את תאריך ההצהרה';
  } else if (data.applicantSignedAt > todayInput()) {
    errors.signedAt = 'תאריך ההצהרה לא יכול להיות בעתיד';
  }
  return errors;
}

// The DOM id to focus for an error key from validateHealthDeclaration.
export const healthFieldDomId = (key) => {
  if (key === 'confirmed') return 'ahd-confirmed';
  if (key === 'signedAt') return 'ahd-signed-at';
  if (key.endsWith('-details')) return `ahd-${key}`;
  return `ahd-${key}-yes`;
};

const countAnswered = (answers) => Object.values(answers).filter((item) => item.answer).length;
const countYes = (answers) => Object.values(answers).filter((item) => item.answer === 'yes').length;

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${Number(day)}.${Number(month)}.${year}` : value;
};

/* Shared styles, scoped under .ahd; sizes in rem so the accessibility font scale applies. */
export const HEALTH_STYLES = `
.ahd * { font-size: inherit; box-sizing: border-box; }
.ahd { background: #fff; border: 1px solid #ece3da; border-radius: 22px; overflow: hidden; font-size: 1rem; color: #2b211c; text-align: right; }
.ahd.has-errors { border-color: #f1c4bf; }
.ahd-heading { margin: 0; font-size: 1rem; font-weight: 400; }
.ahd-toggle { display: flex; align-items: center; gap: 14px; width: 100%; padding: 20px 24px; border: 0; background: #fff; font: inherit; color: inherit; text-align: right; cursor: pointer; }
.ahd-toggle:hover { background: #fbf8f4; }
.ahd-toggle__icon { flex: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f8e9e4; color: #a84f3d; }
.ahd-toggle__text { flex: 1; min-width: 0; }
.ahd-title { display: block; font-size: 1.15rem; font-weight: 800; }
.ahd-sub { display: block; margin-top: 2px; font-size: 0.875rem; font-weight: 400; color: #6b5a50; }
.ahd-req { color: #a84f3d; }
.ahd-chev { flex: none; color: #6b5a50; transition: transform .2s ease; }
.ahd-chev.is-open { transform: rotate(180deg); }
.ahd-body { padding: 0 24px 24px; }
.ahd-alert { margin: 0 0 12px; padding: 10px 14px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-size: 0.9rem; font-weight: 700; }
.ahd-part { border: 1px solid #ece3da; border-radius: 18px; overflow: hidden; }
.ahd-list { margin: 0; padding: 0; list-style: none; }
.ahd-q { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 14px; align-items: start; padding: 12px 18px; border-top: 1px solid #ece3da; background: #fff; }
.ahd-q:first-child { border-top: 0; }
.ahd-q.is-yes { background: #fffaf3; }
.ahd-q.is-invalid { background: #fdf6f5; box-shadow: inset -4px 0 0 #b42318; }
.ahd-q__text { margin: 0; font-size: 0.95rem; line-height: 1.5; }
.ahd-q__num { font-weight: 800; color: #a84f3d; margin-inline-end: 4px; }
.ahd-yn { display: inline-flex; gap: 6px; margin: 0; padding: 0; border: 0; }
.ahd-yn button { display: inline-flex; align-items: center; gap: 4px; min-width: 64px; min-height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #e3d7cc; background: #fff; color: #5c4a40; font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; transition: background-color .15s ease, border-color .15s ease, color .15s ease; }
.ahd-yn button:hover:not(:disabled) { border-color: #c9b6a8; }
.ahd-yn button.is-yes[aria-pressed="true"] { background: #2f8f5b; border-color: #2f8f5b; color: #fff; }
.ahd-yn button.is-no[aria-pressed="true"] { background: #b42318; border-color: #b42318; color: #fff; }
.ahd-err { grid-column: 1 / -1; margin: 0; font-size: 0.85rem; font-weight: 700; color: #b42318; }
.ahd-detail { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 700; color: #5c4a40; }
.ahd-input, .ahd-textarea { width: 100%; padding: 10px 12px; border: 1px solid #e3d7cc; border-radius: 10px; background: #fbf8f4; color: #2b211c; font: inherit; font-size: 0.95rem; font-weight: 400; }
.ahd-input { height: 44px; padding-block: 0; }
.ahd-textarea { min-height: 64px; resize: vertical; line-height: 1.5; }
.ahd-input[aria-invalid="true"], .ahd-textarea[aria-invalid="true"] { border-color: #b42318; background: #fff; }
.ahd-input:focus, .ahd-textarea:focus { outline: 2px solid #3f6b5f; outline-offset: 1px; border-color: #3f6b5f; background: #fff; }
.ahd-foot { display: flex; flex-direction: column; gap: 12px; padding: 14px 18px; border-top: 1px solid #ece3da; background: #fbf8f4; }
.ahd-confirm { display: flex; align-items: flex-start; gap: 10px; font-size: 0.92rem; font-weight: 700; line-height: 1.5; cursor: pointer; }
.ahd-confirm input { flex: none; width: 20px; height: 20px; margin-top: 2px; accent-color: #3f6b5f; }
.ahd-field { display: flex; flex-direction: column; gap: 4px; max-width: 240px; font-size: 0.85rem; font-weight: 700; color: #5c4a40; }
.ahd button:focus-visible, .ahd input:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
.ahd button:disabled { opacity: .6; cursor: not-allowed; }

/* read-only view */
.ahd-view { font-size: 1rem; color: #2b211c; text-align: right; }
.ahd-view * { font-size: inherit; box-sizing: border-box; }
.ahd-view__summary { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px; padding: 0; list-style: none; }
.ahd-pill { padding: 4px 12px; border-radius: 999px; background: #f3ede6; color: #5c4a40; font-size: 0.85rem; font-weight: 800; }
.ahd-pill--yes { background: #fdf6ea; color: #7a5512; }
.ahd-pill--ok { background: #e3f1e8; color: #1f6b3a; }
.ahd-pill--bad { background: #fdf0ee; color: #b42318; }
.ahd-view .ahd-q { grid-template-columns: minmax(0, 1fr) auto; }
.ahd-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 0.85rem; font-weight: 800; white-space: nowrap; }
.ahd-badge--yes { background: #2f8f5b; color: #fff; }
.ahd-badge--no { background: #f3ede6; color: #5c4a40; }
.ahd-badge--none { background: #fff; border: 1px dashed #c9b6a8; color: #8a7a70; }
.ahd-view__detail { grid-column: 1 / -1; margin: 0; padding: 8px 12px; border-radius: 10px; background: #fff; border: 1px solid #ece3da; font-size: 0.92rem; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; }
.ahd-view__detail b { color: #5c4a40; }
.ahd-view__foot { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 0.92rem; font-weight: 700; }

@media (max-width: 520px) {
  .ahd-toggle { padding: 16px; }
  .ahd-body { padding: 0 12px 16px; }
  .ahd-q { grid-template-columns: 1fr; padding: 12px 14px; }
}
`;

function YesNo({ questionId, value, onChange, disabled, label, invalid }) {
  const pick = (next) => onChange(value === next ? '' : next); // clicking the chosen answer again clears it
  return (
    <fieldset className="ahd-yn" aria-label={label} aria-invalid={invalid || undefined} disabled={disabled}>
      <button id={`ahd-${questionId}-yes`} type="button" className="is-yes" aria-pressed={value === 'yes'} onClick={() => pick('yes')}>
        <Check size={16} aria-hidden="true" /> כן
      </button>
      <button type="button" className="is-no" aria-pressed={value === 'no'} onClick={() => pick('no')}>
        <X size={16} aria-hidden="true" /> לא
      </button>
    </fieldset>
  );
}

/* Editable section used inside UserForm. `errors` comes from validateHealthDeclaration (empty until a submit attempt). */
function HealthDeclarationSection({ value, onChange, errors = {}, disabled = false, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const data = normalizeHealthDeclaration(value);
  const errorCount = Object.keys(errors).length;

  // A failed submit must show the fields that need attention.
  useEffect(() => {
    if (errorCount > 0) setIsOpen(true);
  }, [errorCount]);

  const update = (patch) => onChange({ ...data, ...patch });
  const answer = (questionId, patch) =>
    update({ applicant: { ...data.applicant, [questionId]: { ...data.applicant[questionId], ...patch } } });

  const answered = countAnswered(data.applicant);
  const yesCount = countYes(data.applicant);
  const summary = answered === 0
    ? 'לא מולא עדיין'
    : `נענו ${answered} מתוך ${APPLICANT_QUESTIONS.length}${yesCount ? ` · ${yesCount} תשובות "כן"` : ''}`;

  return (
    <section className={`ahd${errorCount ? ' has-errors' : ''}`} aria-labelledby="ahd-title">
      <style>{HEALTH_STYLES}</style>
      <h2 id="ahd-title" className="ahd-heading">
        <button type="button" className="ahd-toggle" aria-expanded={isOpen} aria-controls="ahd-body" onClick={() => setIsOpen((current) => !current)}>
          <span className="ahd-toggle__icon" aria-hidden="true"><ClipboardList size={22} /></span>
          <span className="ahd-toggle__text">
            <span className="ahd-title">הצהרת בריאות <span className="ahd-req">*</span></span>
            <span className="ahd-sub">{summary}</span>
          </span>
          <ChevronDown className={`ahd-chev${isOpen ? ' is-open' : ''}`} size={22} aria-hidden="true" />
        </button>
      </h2>

      {isOpen && (
        <div id="ahd-body" className="ahd-body">
          {errorCount > 0 && (
            <p className="ahd-alert" role="alert">יש להשלים {errorCount === 1 ? 'שדה אחד' : `${errorCount} שדות`} בהצהרת הבריאות</p>
          )}
          <div className="ahd-part">
            <ol className="ahd-list">
              {APPLICANT_QUESTIONS.map((question, index) => {
                const item = data.applicant[question.id];
                const answerError = errors[question.id];
                const detailsError = errors[`${question.id}-details`];
                const textId = `ahd-text-${question.id}`;
                return (
                  <li key={question.id} className={`ahd-q${item.answer === 'yes' ? ' is-yes' : ''}${answerError || detailsError ? ' is-invalid' : ''}`}>
                    <p id={textId} className="ahd-q__text">
                      <span className="ahd-q__num">{index + 1}.</span>
                      {question.text}
                    </p>
                    <YesNo
                      questionId={question.id}
                      value={item.answer}
                      disabled={disabled}
                      invalid={Boolean(answerError)}
                      label={`${index + 1}. ${question.text}`}
                      onChange={(next) => answer(question.id, { answer: next })}
                    />
                    {answerError && <p className="ahd-err">{answerError}</p>}
                    {question.detail && item.answer === 'yes' && (
                      <label className="ahd-detail">
                        <span>{question.detail} <span className="ahd-req">*</span></span>
                        <textarea
                          id={`ahd-${question.id}-details`}
                          className="ahd-textarea"
                          value={item.details}
                          disabled={disabled}
                          aria-invalid={Boolean(detailsError)}
                          aria-describedby={textId}
                          onChange={(event) => answer(question.id, { details: event.target.value })}
                        />
                        {detailsError && <span className="ahd-err">{detailsError}</span>}
                      </label>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="ahd-foot">
              <label className="ahd-confirm">
                <input
                  id="ahd-confirmed"
                  type="checkbox"
                  checked={data.applicantConfirmed}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.confirmed)}
                  onChange={(event) => update({ applicantConfirmed: event.target.checked })}
                />
                <span>{CONFIRM_TEXT} <span className="ahd-req">*</span></span>
              </label>
              {errors.confirmed && <p className="ahd-err">{errors.confirmed}</p>}
              <label className="ahd-field">
                <span>תאריך ההצהרה <span className="ahd-req">*</span></span>
                <input
                  id="ahd-signed-at"
                  className="ahd-input"
                  type="date"
                  max={todayInput()}
                  value={data.applicantSignedAt}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.signedAt)}
                  onChange={(event) => update({ applicantSignedAt: event.target.value })}
                />
                {errors.signedAt && <span className="ahd-err">{errors.signedAt}</span>}
              </label>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* Read-only view for the user's details page. */
export function HealthDeclarationView({ value }) {
  const data = normalizeHealthDeclaration(value);
  const answered = countAnswered(data.applicant);
  const yesCount = countYes(data.applicant);
  return (
    <div className="ahd-view">
      <style>{HEALTH_STYLES}</style>
      <ul className="ahd-view__summary">
        <li className="ahd-pill">נענו {answered} מתוך {APPLICANT_QUESTIONS.length}</li>
        <li className={`ahd-pill${yesCount ? ' ahd-pill--yes' : ''}`}>{yesCount ? `${yesCount} תשובות "כן"` : 'אין תשובות "כן"'}</li>
        <li className={`ahd-pill ${data.applicantConfirmed ? 'ahd-pill--ok' : 'ahd-pill--bad'}`}>
          {data.applicantConfirmed ? 'ההצהרה אושרה' : 'ההצהרה לא אושרה'}
        </li>
      </ul>
      <div className="ahd-part">
        <ol className="ahd-list">
          {APPLICANT_QUESTIONS.map((question, index) => {
            const item = data.applicant[question.id];
            return (
              <li key={question.id} className={`ahd-q${item.answer === 'yes' ? ' is-yes' : ''}`}>
                <p className="ahd-q__text">
                  <span className="ahd-q__num">{index + 1}.</span>
                  {question.text}
                </p>
                {item.answer === 'yes' && <span className="ahd-badge ahd-badge--yes"><Check size={14} aria-hidden="true" /> כן</span>}
                {item.answer === 'no' && <span className="ahd-badge ahd-badge--no"><X size={14} aria-hidden="true" /> לא</span>}
                {!item.answer && <span className="ahd-badge ahd-badge--none">לא נענה</span>}
                {item.answer === 'yes' && item.details && (
                  <p className="ahd-view__detail"><b>{question.detail}</b> {item.details}</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <p className="ahd-view__foot">
        {data.applicantSignedAt ? `תאריך ההצהרה: ${formatDate(data.applicantSignedAt)}` : 'לא הוזן תאריך הצהרה'}
      </p>
    </div>
  );
}

export default HealthDeclarationSection;
