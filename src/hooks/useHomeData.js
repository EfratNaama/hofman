import { useEffect, useState } from 'react';
import { getCenterInfo } from '../services/homeService';

export default function useHomeData() {
  const [centerInfo, setCenterInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        const info = await getCenterInfo();

        if (!active) return;
        setCenterInfo(info);
      } catch (fetchError) {
        if (!active) return;
        setCenterInfo(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  return { centerInfo, loading };
}
