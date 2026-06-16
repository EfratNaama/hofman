import { useEffect, useState } from 'react';
import { subscribeActivities } from '../services/activitiesService';

export function useActivities() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeActivities(
      (activitiesData) => {
        setActivities(activitiesData);
        setError('');
        setIsLoading(false);
      },
      () => {
        setError('לא ניתן לטעון את רשימת הפעילויות. נסו שוב מאוחר יותר.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { activities, isLoading, error };
}
