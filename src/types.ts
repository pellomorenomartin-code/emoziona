export type Quadrant = 'red' | 'yellow' | 'blue' | 'green';

export interface EmotionCheckIn {
  id: string;
  uid: string;
  timestamp: number;
  quadrant: Quadrant;
  emotion: string;
  reason?: string;
  note?: string;
  energy: number; // 1-10
  pleasantness: number; // 1-10
  intensity: number; // 1-5
  bodyLocation?: string;
  bodySensation?: string;
}

export interface EmotionDefinition {
  name: string;
  quadrant: Quadrant;
  subcategories?: string[];
}

export interface UserProfile {
  uid: string;
  name: string;
  school: string;
  grade: string;
  tutor: string;
  email: string;
  avatar?: string;
  notificationsEnabled?: boolean;
  language?: 'eu' | 'es';
  sharedWith?: string[]; // Array of emails
}

export interface DailyReflection {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  content: string;
  moodSummary?: Quadrant;
}

export const EMOTIONS: EmotionDefinition[] = [
  { 
    name: 'Beldurra', 
    quadrant: 'red',
    subcategories: ['umiliatua', 'baztertua', 'menpekoa', 'ziurgabea', 'urduri', 'beldurtuta']
  },
  { 
    name: 'Haserrea', 
    quadrant: 'red',
    subcategories: ['minduta', 'mehatxatua', 'gorrotoz beteta', 'erotuta', 'erasokorra', 'frustratua', 'urruna', 'kritikoa']
  },
  { 
    name: 'Nazka', 
    quadrant: 'red',
    subcategories: ['desadostasun-sentimendua duena', 'etsita', 'izugarria', 'abstinentzia']
  },
  { 
    name: 'Tristura', 
    quadrant: 'blue',
    subcategories: ['erruduna', 'abandonatua', 'etsipenez betea', 'deprimituta', 'bakarrik', 'aspertuta']
  },
  { 
    name: 'Poza', 
    quadrant: 'yellow',
    subcategories: ['alaia', 'interesatua', 'harro', 'onartua', 'boteretsua', 'baketsua', 'intimoa', 'baikorra']
  },
  { 
    name: 'Harridura', 
    quadrant: 'yellow',
    subcategories: ['harrituta', 'nahastuta', 'txundituta', 'gogotsu']
  }
];
