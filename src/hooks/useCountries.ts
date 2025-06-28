import { useState, useEffect } from 'react';

interface Country {
    name: {
        common: string;
        official: string;
    };
    flags: {
        png: string;
        svg: string;
    };
    cca2: string;
}

export const useCountries = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2');

                if (!response.ok) {
                    throw new Error('Failed to fetch countries');
                }

                const data = await response.json();
                const sortedCountries = data.sort((a: Country, b: Country) =>
                    a.name.common.localeCompare(b.name.common)
                );

                setCountries(sortedCountries);
                setError(null);
            } catch (err) {
                console.error('Error fetching countries:', err);
                setError('Failed to load countries');
                // Fallback to some basic countries
                setCountries([
                    { name: { common: 'Nigeria', official: 'Federal Republic of Nigeria' }, flags: { png: '', svg: '' }, cca2: 'NG' },
                    { name: { common: 'Ghana', official: 'Republic of Ghana' }, flags: { png: '', svg: '' }, cca2: 'GH' },
                    { name: { common: 'United Kingdom', official: 'United Kingdom of Great Britain and Northern Ireland' }, flags: { png: '', svg: '' }, cca2: 'GB' },
                    { name: { common: 'United States', official: 'United States of America' }, flags: { png: '', svg: '' }, cca2: 'US' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    return { countries, loading, error };
};
