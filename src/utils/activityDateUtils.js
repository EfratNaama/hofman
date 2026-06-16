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
