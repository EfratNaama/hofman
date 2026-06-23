import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const USERS_COLLECTION = 'users';
const ACTIVITIES_COLLECTION = 'activities';
const REGISTRATIONS_COLLECTION = 'activityRegistrations';

const getCollectionDocuments = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

const getActivityTitleMap = (activities) =>
  new Map(activities.map((activity) => [activity.id, activity.title || 'פעילות ללא כותרת']));

const toDate = (value) => {
  if (value?.toDate) return value.toDate();

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export async function getTotalUsers() {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('שגיאה בטעינת מספר המשתמשים:', error);
    throw error;
  }
}

export async function getTotalActivities() {
  try {
    const snapshot = await getDocs(collection(db, ACTIVITIES_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('שגיאה בטעינת מספר הפעילויות:', error);
    throw error;
  }
}

export async function getTotalRegistrations() {
  try {
    const snapshot = await getDocs(collection(db, REGISTRATIONS_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('שגיאה בטעינת מספר ההרשמות:', error);
    throw error;
  }
}

export async function getPaidRegistrations() {
  try {
    const paidRegistrationsQuery = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('paymentStatus', '==', 'paid')
    );
    const snapshot = await getDocs(paidRegistrationsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('שגיאה בטעינת ההרשמות ששולמו:', error);
    throw error;
  }
}

export async function getRegistrationsPerActivity() {
  try {
    const [registrations, activities] = await Promise.all([
      getCollectionDocuments(REGISTRATIONS_COLLECTION),
      getCollectionDocuments(ACTIVITIES_COLLECTION),
    ]);
    const activityTitles = getActivityTitleMap(activities);
    const counts = new Map();

    registrations.forEach((registration) => {
      if (!registration.activityId) return;
      counts.set(registration.activityId, (counts.get(registration.activityId) || 0) + 1);
    });

    return Array.from(counts, ([activityId, count]) => ({
      activityId,
      activityTitle: activityTitles.get(activityId) || 'פעילות לא ידועה',
      count,
    })).sort((first, second) => second.count - first.count);
  } catch (error) {
    console.error('שגיאה בטעינת הרשמות לפי פעילות:', error);
    throw error;
  }
}

export async function getActivityTypeDistribution() {
  try {
    const activities = await getCollectionDocuments(ACTIVITIES_COLLECTION);
    const distribution = {
      activity: 0,
      course: 0,
    };

    activities.forEach((activity) => {
      const type = String(activity.type || '').trim().toLowerCase();
      const isCourse = type === 'course' || type === 'קורס';
      distribution[isCourse ? 'course' : 'activity'] += 1;
    });

    return [
      { type: 'פעילות', count: distribution.activity },
      { type: 'קורס', count: distribution.course },
    ];
  } catch (error) {
    console.error('שגיאה בטעינת התפלגות סוגי הפעילויות:', error);
    throw error;
  }
}

export async function getRegistrationsOverTime() {
  try {
    const registrations = await getCollectionDocuments(REGISTRATIONS_COLLECTION);
    const monthlyCounts = new Map();

    registrations.forEach((registration) => {
      const registeredAt = toDate(registration.registeredAt);
      if (!registeredAt) return;

      const month = `${registeredAt.getFullYear()}-${String(registeredAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
    });

    return Array.from(monthlyCounts, ([month, count]) => ({ month, count }))
      .sort((first, second) => first.month.localeCompare(second.month));
  } catch (error) {
    console.error('שגיאה בטעינת ההרשמות לאורך זמן:', error);
    throw error;
  }
}

export async function getPaidVsPendingPerActivity() {
  try {
    const [registrations, activities] = await Promise.all([
      getCollectionDocuments(REGISTRATIONS_COLLECTION),
      getCollectionDocuments(ACTIVITIES_COLLECTION),
    ]);
    const activityTitles = getActivityTitleMap(activities);
    const statusByActivity = new Map();

    registrations.forEach((registration) => {
      if (!registration.activityId) return;

      const current = statusByActivity.get(registration.activityId) || { paid: 0, pending: 0 };
      if (registration.paymentStatus === 'paid') {
        current.paid += 1;
      } else if (registration.paymentStatus === 'pending') {
        current.pending += 1;
      }
      statusByActivity.set(registration.activityId, current);
    });

    return Array.from(statusByActivity, ([activityId, statuses]) => ({
      activityTitle: activityTitles.get(activityId) || 'פעילות לא ידועה',
      ...statuses,
    }));
  } catch (error) {
    console.error('שגיאה בטעינת סטטוסי תשלום לפי פעילות:', error);
    throw error;
  }
}
