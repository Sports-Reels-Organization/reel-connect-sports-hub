
interface Sport {
  idSport: string;
  strSport: string;
  strSportDescription: string;
  strSportThumb: string;
}

interface SportsResponse {
  sports: Sport[];
}

export interface FormattedSport {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  value: string;
  label: string;
  supportsFifaId: boolean;
  supportsFootPreference: boolean;
}

const SUPPORTED_SPORTS = [
  'Soccer', 'Basketball', 'Volleyball', 'Tennis', 'Rugby'
];

export const fetchSportsFromAPI = async (): Promise<FormattedSport[]> => {
  try {
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/all_sports.php');
    const data: SportsResponse = await response.json();
    
    // Filter and format supported sports
    const formattedSports = data.sports
      .filter(sport => SUPPORTED_SPORTS.includes(sport.strSport))
      .map(sport => ({
        id: sport.idSport,
        name: sport.strSport,
        description: sport.strSportDescription || '',
        thumbnail: sport.strSportThumb || '',
        value: sport.strSport.toLowerCase().replace(' ', '_'),
        label: sport.strSport === 'Soccer' ? 'Football ⚽' : 
               sport.strSport === 'Basketball' ? 'Basketball 🏀' :
               sport.strSport === 'Volleyball' ? 'Volleyball 🏐' :
               sport.strSport === 'Tennis' ? 'Tennis 🎾' :
               sport.strSport === 'Rugby' ? 'Rugby 🏈' : sport.strSport,
        supportsFifaId: sport.strSport === 'Soccer',
        supportsFootPreference: sport.strSport === 'Soccer'
      }));

    return formattedSports;
  } catch (error) {
    console.error('Error fetching sports from API:', error);
    // Fallback to hardcoded sports if API fails
    return [
      {
        id: '1',
        name: 'Soccer',
        description: 'Association Football',
        thumbnail: '',
        value: 'football',
        label: 'Football ⚽',
        supportsFifaId: true,
        supportsFootPreference: true
      },
      {
        id: '2',
        name: 'Basketball',
        description: 'Indoor Basketball',
        thumbnail: '',
        value: 'basketball',
        label: 'Basketball 🏀',
        supportsFifaId: false,
        supportsFootPreference: false
      },
      {
        id: '3',
        name: 'Volleyball',
        description: 'Indoor Volleyball',
        thumbnail: '',
        value: 'volleyball',
        label: 'Volleyball 🏐',
        supportsFifaId: false,
        supportsFootPreference: false
      },
      {
        id: '4',
        name: 'Tennis',
        description: 'Lawn Tennis',
        thumbnail: '',
        value: 'tennis',
        label: 'Tennis 🎾',
        supportsFifaId: false,
        supportsFootPreference: false
      },
      {
        id: '5',
        name: 'Rugby',
        description: 'Rugby Union',
        thumbnail: '',
        value: 'rugby',
        label: 'Rugby 🏈',
        supportsFifaId: false,
        supportsFootPreference: false
      }
    ];
  }
};
