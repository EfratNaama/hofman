import {
  getActivityType,
  getRecurringActivityEndDate,
  getRecurringActivityStartDate,
  toDate,
} from './activityDateUtils';

export const isOneTimeActivity = (activity) => getActivityType(activity) === 'חד פעמי';

export const getRecurringStartDate = getRecurringActivityStartDate;

export const getRecurringEndDate = getRecurringActivityEndDate;

export const getActivityDate = (activity) => (
  isOneTimeActivity(activity)
    ? toDate(activity.date || activity.activityDate)
    : getRecurringStartDate(activity)
);

export const isOneTimeActivityExpired = (activity) => {
  if (!isOneTimeActivity(activity)) return false;

  const activityDate = toDate(activity.date || activity.activityDate);
  if (!activityDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activityDay = new Date(activityDate);
  activityDay.setHours(0, 0, 0, 0);

  return activityDay < today;
};

export const getRecurringActivityStatus = (activity) => {
  if (isOneTimeActivity(activity)) return 'active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = getRecurringStartDate(activity);
  const endDate = getRecurringEndDate(activity);

  if (endDate) {
    const endDay = new Date(endDate);
    endDay.setHours(0, 0, 0, 0);
    if (endDay < today) return 'ended';
  }

  if (startDate) {
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    if (today < startDay) return 'upcoming';
  }

  return 'active';
};

export const isActivityRegistrationClosed = (activity) =>
  isOneTimeActivityExpired(activity) || getRecurringActivityStatus(activity) === 'ended';

export const getRegistrationPresentation = (registration, wasJustRegistered = false) => {
  if (!registration) {
    return {
      label: 'הרשמה',
      badgeLabel: 'פתוח להרשמה',
      color: '#006b6b',
      backgroundColor: '#ccfbf1',
    };
  }

  if (wasJustRegistered) {
    return {
      label: 'נרשמת בהצלחה',
      badgeLabel: 'נרשמת בהצלחה',
      color: '#15803d',
      backgroundColor: '#dcfce7',
    };
  }

  return {
    label: 'כבר נרשמת',
    badgeLabel: 'כבר נרשמת',
    color: '#475569',
    backgroundColor: '#e2e8f0',
  };
};
