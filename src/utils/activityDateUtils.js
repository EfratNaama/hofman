export function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatActivityDate(value) {
  const date = toDate(value);
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatActivityDateInput(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export const ACTIVITY_WEEKDAYS = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
];

export function getActivityType(activity) {
  return activity?.type || 'קבוע';
}

export function getActivityDaysOfWeek(activity) {
  if (Array.isArray(activity?.daysOfWeek) && activity.daysOfWeek.length) {
    return activity.daysOfWeek;
  }

  return activity?.dayOfWeek ? [activity.dayOfWeek] : [];
}

export function getRecurringActivityStartDate(activity) {
  return toDate(activity?.startDate || activity?.activityDate);
}

export function getRecurringActivityEndDate(activity) {
  return toDate(activity?.endDate);
}

function toDateOnly(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const date = toDate(value);
  if (!date) return null;

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  return dateOnly;
}

export function generateActivityOccurrences(activity) {
  if (!activity) return [];

  if (getActivityType(activity) === 'חד פעמי') {
    const date = toDateOnly(activity.date || activity.activityDate);
    return date ? [date] : [];
  }

  const startDate = toDateOnly(activity.startDate || activity.activityDate);
  const endDate = toDateOnly(activity.endDate);
  const daysOfWeek = getActivityDaysOfWeek(activity);

  if (!startDate || !daysOfWeek.length) return [];

  const selectedDayIndexes = new Set(
    daysOfWeek
      .map((day) => ACTIVITY_WEEKDAYS.indexOf(day))
      .filter((dayIndex) => dayIndex >= 0)
  );

  if (!endDate) {
    return selectedDayIndexes.has(startDate.getDay()) ? [startDate] : [];
  }

  if (endDate < startDate) return [];

  const occurrences = [];
  const currentDate = new Date(startDate);
  const maximumDays = 3660;
  let checkedDays = 0;

  while (currentDate <= endDate && checkedDays < maximumDays) {
    if (selectedDayIndexes.has(currentDate.getDay())) {
      occurrences.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
    checkedDays += 1;
  }

  return occurrences;
}
