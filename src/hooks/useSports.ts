
import { useState, useEffect } from 'react';
import { fetchSportsFromAPI, FormattedSport } from '@/services/sportsService';

export const useSports = () => {
  const [sports, setSports] = useState<FormattedSport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSports = async () => {
      try {
        setLoading(true);
        setError(null);
        const sportsData = await fetchSportsFromAPI();
        setSports(sportsData);
      } catch (err) {
        console.error('Error loading sports:', err);
        setError('Failed to load sports data');
      } finally {
        setLoading(false);
      }
    };

    loadSports();
  }, []);

  const getSportById = (sportValue: string) => {
    return sports.find(sport => sport.value === sportValue);
  };

  const isFootballSport = (sportValue: string) => {
    const sport = getSportById(sportValue);
    return sport?.supportsFifaId || false;
  };

  return {
    sports,
    loading,
    error,
    getSportById,
    isFootballSport
  };
};
