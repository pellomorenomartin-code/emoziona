import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, 
  Bell, 
  Bolt, 
  Lightbulb, 
  Waves, 
  Accessibility, 
  Edit3, 
  LayoutGrid, 
  Brain, 
  User as UserIcon,
  ChevronRight,
  History,
  TrendingUp,
  CheckCircle2,
  FileDown,
  Moon,
  Coffee,
  Dumbbell,
  Sparkles,
  BarChart3,
  Angry,
  Frown,
  Ghost,
  Sun,
  CloudRain,
  Flame,
  Activity,
  Zap,
  Droplets,
  ArrowDown,
  Anchor,
  Wind,
  Plus,
  Calendar,
  LineChart,
  MessageSquare,
  LogOut,
  LogIn,
  AlertCircle,
  Gamepad2,
  Volume2,
  Play,
  ThermometerSnowflake,
  Footprints,
  BookOpen,
  Heart,
  ArrowLeft,
  School
} from 'lucide-react';
import { 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { EMOTIONS, Quadrant, EmotionCheckIn, UserProfile, DailyReflection } from './types';
import { getEmotionalInsight, getHealthRecommendations, getJournalFeedback, getEmpathyFeedback } from './services/geminiService';
import { translations, Language } from './i18n';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  handleFirestoreError,
  OperationType,
  User
} from './firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ane',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jon',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maialen',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mikel',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Uxue',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Iker',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nerea',
];

export default function App() {
  return (
    <AppContent />
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'mood' | 'tools' | 'reflect' | 'profile'>('mood');
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [customEmotion, setCustomEmotion] = useState('');
  const [intensity, setIntensity] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [pleasantness, setPleasantness] = useState<number>(5);
  const [moodReason, setMoodReason] = useState('');
  const [selectedBodyLocation, setSelectedBodyLocation] = useState<string | null>(null);
  const [selectedBodySensation, setSelectedBodySensation] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<EmotionCheckIn[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [recommendedToolId, setRecommendedToolId] = useState<'body-scan' | 'square-breathing' | 'positive-visualization' | 'anger-management' | 'sensory-reset' | 'emotional-journal' | 'empathy-exercise' | 'sadness-management' | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'body-scan' | 'square-breathing' | 'positive-visualization' | 'anger-management' | 'anger-timer' | 'breathing-exercise' | 'counting-to-10' | 'positive-thought' | 'sensory-reset' | 'sensory-reset-game' | 'scent-memory' | 'cold-touch' | 'emotional-journal' | 'empathy-exercise' | 'sadness-management'>('main');
  const [reflectView, setReflectView] = useState<'history' | 'journal' | 'trends'>('history');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [newReflection, setNewReflection] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const getQuadrantFromScores = (e: number, p: number): Quadrant => {
    if (e >= 6 && p >= 6) return 'yellow';
    if (e >= 6 && p < 6) return 'red';
    if (e < 6 && p >= 6) return 'green';
    return 'blue';
  };

  // Health Data States
  const [healthData, setHealthData] = useState<{steps: number, sleepHours: number, date: string} | null>(null);
  const [healthRecommendation, setHealthRecommendation] = useState<string>('');
  const [isFetchingHealth, setIsFetchingHealth] = useState(false);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);

  // Sharing & Tutor Mode States
  const [sharingEmail, setSharingEmail] = useState('');
  const [tutorMode, setTutorMode] = useState(false);
  const [tutorStudentEmail, setTutorStudentEmail] = useState('');
  const [tutorStudentProfile, setTutorStudentProfile] = useState<UserProfile | null>(null);
  const [tutorStudentCheckIns, setTutorStudentCheckIns] = useState<EmotionCheckIn[]>([]);
  const [tutorStudentReflections, setTutorStudentReflections] = useState<DailyReflection[]>([]);
  const [tutorError, setTutorError] = useState('');
  const [sharingError, setSharingError] = useState('');

  // Anger Management States
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [breathingStep, setBreathingStep] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [breathingTimer, setBreathingTimer] = useState(5);
  const [countTo10, setCountTo10] = useState(0);
  const [negThought, setNegThought] = useState('');
  const [posAffirmation, setPosAffirmation] = useState('');
  const [exerciseIntensityAfter, setExerciseIntensityAfter] = useState<number>(5);
  const [showExerciseFeedback, setShowExerciseFeedback] = useState(false);
  const [showAngerRedirect, setShowAngerRedirect] = useState(false);
  const [showDisgustRedirect, setShowDisgustRedirect] = useState(false);
  const [selectedSensoryItem, setSelectedSensoryItem] = useState<any | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  
  // Sadness Tools States
  const [journalWhy, setJournalWhy] = useState('');
  const [journalWhen, setJournalWhen] = useState('');
  const [journalWhat, setJournalWhat] = useState('');
  const [journalFeedback, setJournalFeedback] = useState('');
  const [isGeneratingJournalFeedback, setIsGeneratingJournalFeedback] = useState(false);
  
  const [empathyFriend, setEmpathyFriend] = useState('');
  const [empathyAsk, setEmpathyAsk] = useState('');
  const [empathyFeedback, setEmpathyFeedback] = useState('');
  const [isGeneratingEmpathyFeedback, setIsGeneratingEmpathyFeedback] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (selectedSensoryItem && videoRef.current && audioRef.current) {
      const playMedia = async () => {
        try {
          await videoRef.current?.play();
          await audioRef.current?.play();
        } catch (err) {
          console.error("Autoplay failed:", err);
          // If it fails, maybe it needs a user gesture or is muted
        }
      };
      playMedia();
    } else if (!selectedSensoryItem) {
      videoRef.current?.pause();
      audioRef.current?.pause();
    }
  }, [selectedSensoryItem]);

  const handleGetJournalFeedback = async () => {
    if (!journalWhy && !journalWhen && !journalWhat) return;
    setIsGeneratingJournalFeedback(true);
    try {
      const content = `Arrazoia: ${journalWhy}. Noiz: ${journalWhen}. Zer egin dut: ${journalWhat}`;
      const feedback = await getJournalFeedback(content, userProfile?.language || 'eu');
      setJournalFeedback(feedback);
    } catch (error) {
      console.error("Error generating journal feedback:", error);
    } finally {
      setIsGeneratingJournalFeedback(false);
    }
  };

  const handleGetEmpathyFeedback = async () => {
    if (!empathyFriend && !empathyAsk) return;
    setIsGeneratingEmpathyFeedback(true);
    try {
      const content = `Lagunari esango niokeena: ${empathyFriend}. Galdetuko nukeena: ${empathyAsk}`;
      const feedback = await getEmpathyFeedback(content, userProfile?.language || 'eu');
      setEmpathyFeedback(feedback);
    } catch (error) {
      console.error("Error generating empathy feedback:", error);
    } finally {
      setIsGeneratingEmpathyFeedback(false);
    }
  };

  const t = (key: keyof typeof translations.eu) => {
    const lang = userProfile?.language || 'eu';
    return translations[lang][key] || translations.eu[key];
  };

  const BODY_PARTS = useMemo(() => [
    t('head'), t('face'), t('throat'), t('chest'), t('shoulders'), 
    t('neck'), t('stomach'), t('arms'), t('hands'), t('legs'), t('feet')
  ], [userProfile?.language]);

  const SENSATIONS = useMemo(() => [
    { label: t('tension'), icon: <Bolt size={18} /> },
    { label: t('pain'), icon: <Activity size={18} /> },
    { label: t('knot'), icon: <Brain size={18} /> },
    { label: t('emptiness'), icon: <Waves size={18} /> },
    { label: t('heat'), icon: <Flame size={18} /> },
    { label: t('cold'), icon: <CloudRain size={18} /> },
    { label: t('trembling'), icon: <Zap size={18} /> },
    { label: t('sweat'), icon: <Droplets size={18} /> },
    { label: t('pressure'), icon: <ArrowDown size={18} /> },
    { label: t('restlessness'), icon: <TrendingUp size={18} /> },
    { label: t('heaviness'), icon: <Anchor size={18} /> },
    { label: t('lightness'), icon: <Wind size={18} /> }
  ], [userProfile?.language]);

  const isIncompleteProfile = useMemo(() => {
    if (!userProfile) return false;
    return !userProfile.school || !userProfile.grade || !userProfile.tutor;
  }, [userProfile]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user || !isAuthReady) {
      setCheckIns([]);
      setReflections([]);
      setUserProfile(null);
      return;
    }

    // User Profile Listener
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        // Initialize profile if it doesn't exist
        const initialProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'Ikaslea',
          email: user.email || '',
          school: '',
          grade: '',
          tutor: '',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          notificationsEnabled: true,
          language: 'eu'
        };
        setDoc(userDocRef, initialProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    // Check-ins Listener
    const checkInsQuery = query(
      collection(db, 'checkins'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeCheckIns = onSnapshot(checkInsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as EmotionCheckIn);
      setCheckIns(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'checkins'));

    // Reflections Listener
    const reflectionsQuery = query(
      collection(db, 'reflections'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeReflections = onSnapshot(reflectionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as DailyReflection);
      setReflections(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reflections'));

    return () => {
      unsubscribeUser();
      unsubscribeCheckIns();
      unsubscribeReflections();
    };
  }, [user, isAuthReady]);

  // Anger Management Timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && currentView === 'anger-timer' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      setShowExerciseFeedback(true);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds, currentView]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentView === 'breathing-exercise' && breathingCycle < 3) {
      interval = setInterval(() => {
        setBreathingTimer(t => {
          if (t > 1) return t - 1;
          
          // Step transition
          if (breathingStep === 'inhale') {
            setBreathingStep('hold');
            return 5;
          } else if (breathingStep === 'hold') {
            setBreathingStep('exhale');
            return 5;
          } else {
            setBreathingStep('inhale');
            setBreathingCycle(c => c + 1);
            return 5;
          }
        });
      }, 1000);
    } else if (breathingCycle === 3 && currentView === 'breathing-exercise') {
      setShowExerciseFeedback(true);
    }
    return () => clearInterval(interval);
  }, [currentView, breathingStep, breathingCycle]);

  const resetAngerExercises = () => {
    setTimerSeconds(60);
    setIsTimerActive(false);
    setBreathingStep('inhale');
    setBreathingCycle(0);
    setBreathingTimer(5);
    setCountTo10(0);
    setNegThought('');
    setPosAffirmation('');
    setShowExerciseFeedback(false);
    setSelectedSensoryItem(null);
    setIsMediaPlaying(false);
    setIsMediaLoading(false);
  };

  const handleFinishExercise = async () => {
    const isSensory = currentView.startsWith('sensory-reset') || currentView === 'scent-memory' || currentView === 'cold-touch';
    resetAngerExercises();
    if (isSensory) {
      setCurrentView('sensory-reset');
    } else {
      setCurrentView('anger-management');
    }
  };

  const getPositiveAffirmation = (thought: string) => {
    const affirmations = [
      "Lasai nago eta nire emozioak kontrolatzen ditut.",
      "Haserrea pasatuko da, bakea geratuko da.",
      "Nire buruaren jabe naiz.",
      "Arnasa hartzen dut eta tentsioa askatzen dut.",
      "Egoera hau kudeatzeko gai naiz.",
      "Nire bakea garrantzitsuagoa da."
    ];
    const affirmationsEs = [
      "Estoy tranquilo/a y controlo mis emociones.",
      "La ira pasará, la paz se quedará.",
      "Soy dueño/a de mis pensamientos.",
      "Respiro y suelto la tensión.",
      "Soy capaz de gestionar esta situación.",
      "Mi paz es lo más importante."
    ];
    const lang = userProfile?.language || 'eu';
    const list = lang === 'eu' ? affirmations : affirmationsEs;
    setPosAffirmation(list[Math.floor(Math.random() * list.length)]);
  };

  const handleSaveReflection = async () => {
    if (!newReflection.trim() || !user) return;
    
    setIsSavingReflection(true);
    const id = Math.random().toString(36).substr(2, 9);
    const reflection: DailyReflection = {
      id,
      uid: user.uid,
      date: new Date().toLocaleDateString('en-CA'),
      timestamp: Date.now(),
      content: newReflection,
    };
    
    try {
      await setDoc(doc(db, 'reflections', id), reflection);
      setNewReflection('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reflections/${id}`);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedQuadrant || (!selectedEmotion && !customEmotion) || !user) return;

    setIsSubmitting(true);
    const emotion = customEmotion || selectedSubcategory || selectedEmotion;
    const id = Math.random().toString(36).substr(2, 9);
    
    const newCheckIn: EmotionCheckIn = {
      id,
      uid: user.uid,
      timestamp: Date.now(),
      quadrant: selectedQuadrant,
      emotion: emotion,
      energy: energy,
      pleasantness: pleasantness,
      intensity: intensity,
    };

    if (moodReason) newCheckIn.reason = moodReason;
    if (selectedBodyLocation) newCheckIn.bodyLocation = selectedBodyLocation;
    if (selectedBodySensation) newCheckIn.bodySensation = selectedBodySensation;

    try {
      await setDoc(doc(db, 'checkins', id), newCheckIn);
      
      // Get AI Insight
      const insight = await getEmotionalInsight(emotion, selectedQuadrant);
      setAiInsight(insight);
      
      // Recommend Tool based on quadrant and emotion
      if (emotion === 'Haserrea' || selectedEmotion === 'Haserrea' || (EMOTIONS.find(e => e.name === 'Haserrea')?.subcategories?.includes(emotion))) {
        setRecommendedToolId('anger-management');
        setShowAngerRedirect(true);
      } else if (emotion === 'Nazka' || selectedEmotion === 'Nazka' || (EMOTIONS.find(e => e.name === 'Nazka')?.subcategories?.includes(emotion))) {
        setRecommendedToolId('sensory-reset');
        setShowDisgustRedirect(true);
      } else if (selectedQuadrant === 'red') {
        setRecommendedToolId('square-breathing');
      } else if (selectedQuadrant === 'blue') {
        setRecommendedToolId('body-scan');
      } else if (selectedQuadrant === 'yellow' || selectedQuadrant === 'green') {
        setRecommendedToolId('positive-visualization');
      }

      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setShowSuccess(false);
        setRecommendedToolId(null);
        setSelectedQuadrant(null);
        setSelectedEmotion('');
        setSelectedSubcategory('');
        setCustomEmotion('');
        setMoodReason('');
        setIntensity(5);
        setEnergy(5);
        setPleasantness(5);
        setSelectedBodyLocation(null);
        setSelectedBodySensation(null);
      }, 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `checkins/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !userProfile) return;

    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleAddSharingEmail = async () => {
    if (!user || !userProfile || !sharingEmail.trim()) return;
    setSharingError('');

    if (!sharingEmail.includes('@')) {
      setSharingError(t('invalidEmail'));
      return;
    }
    
    const currentShared = userProfile.sharedWith || [];
    if (currentShared.includes(sharingEmail.trim())) {
      setSharingError(t('alreadyShared'));
      return;
    }

    const updatedProfile = {
      ...userProfile,
      sharedWith: [...currentShared, sharingEmail.trim()]
    };

    try {
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setUserProfile(updatedProfile);
      setSharingEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleRemoveSharingEmail = async (emailToRemove: string) => {
    if (!user || !userProfile) return;

    const updatedProfile = {
      ...userProfile,
      sharedWith: (userProfile.sharedWith || []).filter(e => e !== emailToRemove)
    };

    try {
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleEnterTutorMode = async () => {
    if (!tutorStudentEmail.trim()) return;
    setTutorError('');
    
    try {
      // Find student by email
      const q = query(collection(db, 'users'), where('email', '==', tutorStudentEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setTutorError(t('noSharedData'));
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentProfile = studentDoc.data() as UserProfile;
      
      // Check if shared with current user
      if (!studentProfile.sharedWith?.includes(user?.email || '')) {
        setTutorError(t('noSharedData'));
        return;
      }

      setTutorStudentProfile(studentProfile);
      
      // Fetch student data
      const checkinsQ = query(
        collection(db, 'checkins'), 
        where('uid', '==', studentProfile.uid),
        orderBy('timestamp', 'desc')
      );
      const checkinsSnap = await getDocs(checkinsQ);
      setTutorStudentCheckIns(checkinsSnap.docs.map(d => d.data() as EmotionCheckIn));

      const reflectionsQ = query(
        collection(db, 'reflections'), 
        where('uid', '==', studentProfile.uid),
        orderBy('timestamp', 'desc')
      );
      const reflectionsSnap = await getDocs(reflectionsQ);
      setTutorStudentReflections(reflectionsSnap.docs.map(d => d.data() as DailyReflection));

      setTutorMode(true);
      setActiveTab('reflect');
    } catch (error) {
      console.error("Error entering tutor mode:", error);
      setTutorError(t('noSharedData'));
    }
  };

  const handleExitTutorMode = () => {
    setTutorMode(false);
    setTutorStudentProfile(null);
    setTutorStudentCheckIns([]);
    setTutorStudentReflections([]);
    setTutorStudentEmail('');
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Test notification
        new Notification(t('notificationsTitle'), {
          body: t('notificationsEnabledMsg'),
          icon: '/favicon.ico'
        });
        
        // Update profile
        if (user && userProfile) {
          const updatedProfile = { ...userProfile, notificationsEnabled: true };
          setUserProfile(updatedProfile);
          await setDoc(doc(db, 'users', user.uid), updatedProfile);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const connectGoogleFit = async () => {
    try {
      const response = await fetch('/api/health/auth-url');
      const { url } = await response.json();
      window.open(url, 'google_fit_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  const fetchHealthData = async (tokens: any) => {
    setIsFetchingHealth(true);
    try {
      const response = await fetch('/api/health/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens })
      });
      const data = await response.json();
      setHealthData(data);
      localStorage.setItem('health_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsFetchingHealth(false);
    }
  };

  const generateHealthRecommendations = async () => {
    if (!healthData) return;
    setIsGeneratingRecommendation(true);
    try {
      const insight = await getHealthRecommendations(
        healthData.steps, 
        healthData.sleepHours, 
        userProfile?.language || 'eu'
      );
      setHealthRecommendation(insight);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchHealthData(event.data.tokens);
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Auto-fetch if tokens exist
    const savedTokens = localStorage.getItem('health_tokens');
    if (savedTokens) {
      fetchHealthData(JSON.parse(savedTokens));
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendDailyReminder = () => {
    if (notificationPermission === 'granted') {
      new Notification(t('dailyReminderTitle'), {
        body: t('dailyReminderBody'),
        icon: '/favicon.ico',
        tag: 'daily-reflection-reminder'
      });
    }
  };

  // Check for daily reflection and send notification if needed
  useEffect(() => {
    if (isAuthReady && user && userProfile?.notificationsEnabled && notificationPermission === 'granted') {
      const today = new Date().toISOString().split('T')[0];
      const hasReflectedToday = reflections.some(r => r.date === today);
      
      if (!hasReflectedToday) {
        // Check if we already sent it today to avoid spamming
        const lastReminderDate = localStorage.getItem('last_reflection_reminder');
        if (lastReminderDate !== today) {
          // Send reminder after a short delay
          const timer = setTimeout(() => {
            sendDailyReminder();
            localStorage.setItem('last_reflection_reminder', today);
          }, 5000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isAuthReady, user, userProfile, reflections, notificationPermission]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/10 overflow-hidden border border-primary/10">
          <img 
            src="/logo.png" 
            alt="EmoziONA Logo" 
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              // Fallback to Brain icon if logo.png is not found
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 5.586 4 4 0 0 0 6.826 3.311 4 4 0 0 0 6.826-3.311 4 4 0 0 0 .52-5.586 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M15 13a4.5 4.5 0 0 1-3-4"/><path d="M12 13V8"/></svg></div>';
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">EmoziONA</h1>
          <p className="text-on-surface-variant max-w-xs mx-auto">{t('loginDescription')}</p>
        </div>
        <button 
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-surface-container-lowest text-on-surface px-8 py-4 rounded-full font-bold shadow-xl border border-outline-variant/10 hover:bg-surface-container-low transition-all active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          {t('loginWithGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 h-16 border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center overflow-hidden border border-primary/10">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 5.586 4 4 0 0 0 6.826 3.311 4 4 0 0 0 6.826-3.311 4 4 0 0 0 .52-5.586 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M15 13a4.5 4.5 0 0 1-3-4"/><path d="M12 13V8"/></svg></div>';
                }
              }}
            />
          </div>
          <h1 className="font-headline font-extrabold text-primary tracking-tighter text-xl">EmoziONA</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
            <Bell size={20} />
          </button>
          <button 
            onClick={logout}
            className="p-2 rounded-full hover:bg-red-500/10 transition-colors text-red-500"
            title={t('logout')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 pt-20 pb-24 px-6 max-w-2xl mx-auto w-full">
        {tutorMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-6 bg-primary text-on-primary p-4 rounded-3xl flex items-center justify-between shadow-lg shadow-primary/20"
          >
            <div className="flex items-center gap-3">
              <UserIcon size={20} />
              <span className="text-sm font-bold">{t('tutorModeActive')}: {tutorStudentProfile?.name}</span>
            </div>
            <button 
              onClick={handleExitTutorMode}
              className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
            >
              {t('backToStudent')}
            </button>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'mood' && (
            <motion.div
              key="mood-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">{t('howDoYouFeel')}</h2>
                <p className="text-on-surface-variant font-medium opacity-80">{t('locateState')}</p>
              </header>

              {/* Basic Emotions Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <EmotionButton 
                  emotion="Haserrea" 
                  icon={<Flame size={32} />} 
                  color="bg-red-500/10 text-red-600 border-red-500/20"
                  activeColor="bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30"
                  active={selectedEmotion === 'Haserrea'}
                  t={t}
                  onClick={() => {
                    setSelectedEmotion('Haserrea');
                    setSelectedSubcategory('');
                    setSelectedQuadrant('red');
                    setCustomEmotion('');
                    setEnergy(8);
                    setPleasantness(2);
                  }}
                />
                <EmotionButton 
                  emotion="Nazka" 
                  icon={<Frown size={32} />} 
                  color="bg-orange-500/10 text-orange-600 border-orange-500/20"
                  activeColor="bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                  active={selectedEmotion === 'Nazka'}
                  t={t}
                  onClick={() => {
                    setSelectedEmotion('Nazka');
                    setSelectedSubcategory('');
                    setSelectedQuadrant('red');
                    setCustomEmotion('');
                    setEnergy(7);
                    setPleasantness(3);
                  }}
                />
                <EmotionButton 
                  emotion="Beldurra" 
                  icon={<Ghost size={32} />} 
                  color="bg-purple-500/10 text-purple-600 border-purple-500/20"
                  activeColor="bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/30"
                  active={selectedEmotion === 'Beldurra'}
                  t={t}
                  onClick={() => {
                    setSelectedEmotion('Beldurra');
                    setSelectedSubcategory('');
                    setSelectedQuadrant('red');
                    setCustomEmotion('');
                    setEnergy(6);
                    setPleasantness(2);
                  }}
                />
                <EmotionButton 
                  emotion="Harridura" 
                  icon={<Sparkles size={32} />} 
                  color="bg-amber-500/10 text-amber-600 border-amber-500/20"
                  activeColor="bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30"
                  active={selectedEmotion === 'Harridura'}
                  t={t}
                  onClick={() => {
                    setSelectedEmotion('Harridura');
                    setSelectedSubcategory('');
                    setSelectedQuadrant('yellow');
                    setCustomEmotion('');
                    setEnergy(7);
                    setPleasantness(7);
                  }}
                />
                <EmotionButton 
                  emotion="Poza" 
                  icon={<Sun size={32} />} 
                  color="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                  activeColor="bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30"
                  active={selectedEmotion === 'Poza'}
                  t={t}
                  onClick={() => {
                    setSelectedEmotion('Poza');
                    setSelectedSubcategory('');
                    setSelectedQuadrant('yellow');
                    setCustomEmotion('');
                    setEnergy(8);
                    setPleasantness(9);
                  }}
                />
                <EmotionButton 
                  emotion="Tristura" 
                  icon={<CloudRain size={32} />} 
                  color="bg-blue-500/10 text-blue-600 border-blue-500/20"
                  activeColor="bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30"
                  active={selectedEmotion === 'Tristura'}
                  t={t}
                  onClick={() => {
                    setSelectedEmotion('Tristura');
                    setSelectedSubcategory('');
                    setSelectedQuadrant('blue');
                    setCustomEmotion('');
                    setEnergy(2);
                    setPleasantness(2);
                  }}
                />
              </div>

              {/* Subcategories Selection */}
              {selectedEmotion && !customEmotion && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <label className="block font-headline font-bold text-on-surface px-1">{t('specifyMore')}</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.find(e => e.name === selectedEmotion)?.subcategories?.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubcategory(sub)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          selectedSubcategory === sub
                            ? "bg-primary text-on-primary border-primary shadow-md"
                            : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20"
                        )}
                      >
                        {t(sub as any)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Visual Axes Selection */}
              <div className="bg-surface-container-low p-6 rounded-3xl space-y-6 border border-outline-variant/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <BarChart3 size={14} />
                  {t('emotionAxes')}
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{t('energy')}</p>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{energy}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={energy}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEnergy(val);
                        setSelectedQuadrant(getQuadrantFromScores(val, pleasantness));
                      }}
                      className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center justify-between text-[10px] font-bold text-outline-variant px-1">
                      <span>{t('low')}</span>
                      <span>{t('high')}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{t('pleasantness')}</p>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{pleasantness}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={pleasantness}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPleasantness(val);
                        setSelectedQuadrant(getQuadrantFromScores(energy, val));
                      }}
                      className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center justify-between text-[10px] font-bold text-outline-variant px-1">
                      <span>{t('unpleasant')}</span>
                      <span>{t('pleasant')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intensity and Custom Emotion */}
              {(selectedEmotion || customEmotion) && (
                <motion.section 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block font-headline font-bold text-on-surface mb-3 px-1">{t('otherName')}</label>
                    <div className="relative group">
                      <input 
                        type="text"
                        value={customEmotion}
                        onChange={(e) => {
                          setCustomEmotion(e.target.value);
                          setSelectedSubcategory('');
                        }}
                        className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all placeholder:text-outline-variant font-medium"
                        placeholder={t('writeYourWord')}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                        <Edit3 size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Intensity Scale */}
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-end px-1">
                      <label className="block font-headline font-bold text-on-surface">{t('intensity')}</label>
                      <span className="text-2xl font-extrabold text-primary">{intensity}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => setIntensity(num)}
                          className={cn(
                            "flex-1 aspect-square rounded-xl font-bold transition-all duration-200 border flex items-center justify-center text-sm",
                            intensity === num
                              ? "bg-primary text-on-primary border-primary shadow-md scale-110 z-10"
                              : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-outline-variant">
                      <span>{t('soft')}</span>
                      <span>{t('veryStrong')}</span>
                    </div>
                  </div>

                  {/* Reason for Emotion */}
                  <div className="space-y-3 pt-4">
                    <label className="block font-headline font-bold text-on-surface px-1">{t('whatCausedIt')}</label>
                    <div className="relative group">
                      <textarea 
                        value={moodReason}
                        onChange={(e) => setMoodReason(e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all placeholder:text-outline-variant font-medium min-h-[100px] resize-none"
                        placeholder={t('writeReason')}
                      />
                    </div>
                  </div>

                  {/* Body Scan Integration */}
                  <div className="space-y-6 pt-4">
                    <div className="px-1">
                      <label className="block font-headline font-bold text-on-surface mb-1">{t('whereBody')}</label>
                      <p className="text-xs text-on-surface-variant font-medium">{t('chooseArea')}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="relative w-full aspect-[4/3] bg-surface-container-low rounded-[32px] overflow-hidden flex items-center justify-center border border-outline-variant/10">
                        <svg className="h-[90%] w-auto text-surface-container-highest fill-current" viewBox="0 0 200 400">
                          <path d="M100,20 C115,20 125,30 125,45 C125,60 115,70 100,70 C85,70 75,60 75,45 C75,30 85,20 100,20 M100,75 C80,75 70,85 65,100 L55,160 C53,170 58,180 68,180 L75,180 L75,260 L85,380 C86,390 95,390 95,380 L100,310 L105,380 C105,390 114,390 115,380 L125,260 L125,180 L132,180 C142,180 147,170 145,160 L135,100 C130,85 120,75 100,75"></path>
                        </svg>
                        
                        {/* Interactive Hotspots for main areas */}
                        <button type="button" onClick={() => setSelectedBodyLocation('Burua')} className="absolute top-[8%] left-[45%] w-10 h-10 rounded-full flex items-center justify-center">
                          <div className={cn("w-3 h-3 rounded-full transition-all", selectedBodyLocation === 'Burua' ? "bg-red-500 scale-150" : "bg-red-500/30")}></div>
                        </button>
                        <button type="button" onClick={() => setSelectedBodyLocation('Bularra')} className="absolute top-[28%] left-[45%] w-12 h-12 rounded-full flex items-center justify-center">
                          <div className={cn("w-4 h-4 rounded-full transition-all", selectedBodyLocation === 'Bularra' ? "bg-primary scale-150" : "bg-primary/30")}></div>
                        </button>
                        <button type="button" onClick={() => setSelectedBodyLocation('Sabela')} className="absolute top-[45%] left-[45%] w-10 h-10 rounded-full flex items-center justify-center">
                          <div className={cn("w-3 h-3 rounded-full transition-all", selectedBodyLocation === 'Sabela' ? "bg-amber-500 scale-150" : "bg-amber-500/30")}></div>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {BODY_PARTS.map(part => (
                          <button
                            key={part}
                            type="button"
                            onClick={() => setSelectedBodyLocation(part)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                              selectedBodyLocation === part
                                ? "bg-primary text-on-primary border-primary shadow-sm"
                                : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-primary/5"
                            )}
                          >
                            {part}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {SENSATIONS.map(sensation => (
                        <SensationButton 
                          key={sensation.label}
                          icon={sensation.icon} 
                          label={sensation.label} 
                          active={selectedBodySensation === sensation.label}
                          onClick={() => setSelectedBodySensation(sensation.label)}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckIn}
                    disabled={isSubmitting || (!selectedEmotion && !customEmotion)}
                    className="w-full bg-primary text-on-primary py-5 rounded-full font-headline font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isSubmitting ? t('registering') : t('register')}
                  </button>
                </motion.section>
              )}

              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-secondary-container/30 border border-secondary/20 p-6 rounded-3xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-secondary">
                    <CheckCircle2 size={24} />
                    <h3 className="font-headline font-bold text-lg">{t('stateRegistered')}</h3>
                  </div>
                  {aiInsight && (
                    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
                      <p className="text-on-surface italic leading-relaxed">"{aiInsight}"</p>
                      <p className="text-[10px] uppercase tracking-widest text-outline-variant mt-3 font-bold">{t('aiAdvice')}</p>
                    </div>
                  )}

                  {recommendedToolId && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">{t('recommendedTool')}</p>
                      <p className="text-xs text-on-surface-variant px-1">{t('tryThisTool')}</p>
                      {recommendedToolId === 'anger-management' && (
                        <ToolCard 
                          title={t('angerManagement')}
                          description={t('angerManagementIntro')}
                          duration="1-5 min"
                          icon={<Angry className="text-red-500" />}
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('anger-management');
                            setShowSuccess(false);
                            setShowAngerRedirect(false);
                          }}
                        />
                      )}
                      {recommendedToolId === 'square-breathing' && (
                        <ToolCard 
                          title={t('squareBreathing')}
                          description={t('squareBreathingDesc')}
                          duration="3 min"
                          icon={<Waves className="text-blue-500" />}
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('square-breathing');
                            setShowSuccess(false);
                          }}
                        />
                      )}
                      {recommendedToolId === 'body-scan' && (
                        <ToolCard 
                          title={t('bodyScan')}
                          description={t('bodyScanDesc')}
                          duration="5 min"
                          icon={<Accessibility className="text-emerald-500" />}
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('body-scan');
                            setShowSuccess(false);
                          }}
                        />
                      )}
                      {recommendedToolId === 'positive-visualization' && (
                        <ToolCard 
                          title={t('positiveVisualization')}
                          description={t('positiveVisualizationDesc')}
                          duration="4 min"
                          icon={<Lightbulb className="text-amber-500" />}
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('positive-visualization');
                            setShowSuccess(false);
                          }}
                        />
                      )}
                      {recommendedToolId === 'sensory-reset' && (
                        <ToolCard 
                          title={t('sensoryReset')}
                          description={t('sensoryResetDesc')}
                          duration="2-5 min"
                          icon={<Wind className="text-purple-500" />}
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('sensory-reset');
                            setShowSuccess(false);
                            setShowDisgustRedirect(false);
                          }}
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              <AnimatePresence>
                {showAngerRedirect && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center"
                    >
                      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Angry size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">{t('anger')}</h3>
                        <p className="text-on-surface-variant">{t('angerDetected')}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('anger-management');
                            setShowAngerRedirect(false);
                            setShowSuccess(false);
                          }}
                          className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                          {t('manageAngerNow')}
                        </button>
                        <button 
                          onClick={() => setShowAngerRedirect(false)}
                          className="w-full bg-surface-container-low text-on-surface-variant py-4 rounded-full font-bold active:scale-95 transition-all"
                        >
                          {t('notNow')}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {showDisgustRedirect && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center"
                    >
                      <div className="w-20 h-20 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto">
                        <Wind size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">{t('disgust')}</h3>
                        <p className="text-on-surface-variant">{t('disgustDetected')}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => {
                            setActiveTab('tools');
                            setCurrentView('sensory-reset');
                            setShowDisgustRedirect(false);
                            setShowSuccess(false);
                          }}
                          className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                          {t('manageDisgustNow')}
                        </button>
                        <button 
                          onClick={() => setShowDisgustRedirect(false)}
                          className="w-full bg-surface-container-low text-on-surface-variant py-4 rounded-full font-bold active:scale-95 transition-all"
                        >
                          {t('notNow')}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'reflect' && (
            <motion.div
              key="reflect-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest mb-1">{t('analytics')}</p>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
                    {reflectView === 'history' ? t('yourHistory') : t('weeklyInsights')}
                  </h2>
                </div>
                <div className="flex gap-2 bg-surface-container-low p-1 rounded-full overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setReflectView('history')}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      reflectView === 'history' ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"
                    )}
                  >
                    {t('history')}
                  </button>
                  <button 
                    onClick={() => setReflectView('journal')}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      reflectView === 'journal' ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"
                    )}
                  >
                    {t('journal')}
                  </button>
                  <button 
                    onClick={() => setReflectView('trends')}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                      reflectView === 'trends' ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"
                    )}
                  >
                    {t('evolution')}
                  </button>
                </div>
              </header>

              {reflectView === 'history' && (
                <div className="space-y-4">
                  {(tutorMode ? tutorStudentCheckIns : checkIns).length === 0 ? (
                    <div className="text-center py-12 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
                      <History size={48} className="mx-auto text-outline-variant mb-4 opacity-50" />
                      <p className="text-on-surface-variant">Oraindik ez duzu erregistrorik. Hasi gaur!</p>
                    </div>
                  ) : (
                    (tutorMode ? tutorStudentCheckIns : checkIns).map((checkIn) => (
                      <div key={checkIn.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-black/5 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            checkIn.quadrant === 'red' && "bg-red-500/10 text-red-500",
                            checkIn.quadrant === 'yellow' && "bg-amber-500/10 text-amber-500",
                            checkIn.quadrant === 'blue' && "bg-blue-500/10 text-blue-500",
                            checkIn.quadrant === 'green' && "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {checkIn.quadrant === 'red' && <Bolt size={24} />}
                            {checkIn.quadrant === 'yellow' && <Lightbulb size={24} />}
                            {checkIn.quadrant === 'blue' && <Waves size={24} />}
                            {checkIn.quadrant === 'green' && <Accessibility size={24} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-on-surface">{t(checkIn.emotion as any)}</h4>
                              <span className="text-[10px] font-bold bg-surface-container-high px-1.5 py-0.5 rounded text-primary">
                                {checkIn.intensity}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs text-on-surface-variant">
                                {new Date(checkIn.timestamp).toLocaleDateString()} • {new Date(checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {(checkIn.bodyLocation || checkIn.bodySensation) && (
                                <p className="text-[10px] text-primary font-medium">
                                  {checkIn.bodyLocation && `📍 ${checkIn.bodyLocation}`}
                                  {checkIn.bodyLocation && checkIn.bodySensation && ' • '}
                                  {checkIn.bodySensation && `✨ ${checkIn.bodySensation}`}
                                </p>
                              )}
                              {checkIn.reason && (
                                <p className="text-[10px] text-on-surface-variant italic mt-1 line-clamp-1">
                                  "{checkIn.reason}"
                                </p>
                              )}
                              <div className="flex gap-3 mt-4">
                                <div className="flex items-center gap-2.5 bg-surface-container-high px-3.5 py-2 rounded-2xl border border-outline-variant/20 shadow-sm">
                                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Zap size={14} className="text-amber-500 fill-amber-500/20" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant leading-none mb-1">{t('energy')}</span>
                                    <span className="text-sm font-black text-on-surface leading-none">{checkIn.energy || '-'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 bg-surface-container-high px-3.5 py-2 rounded-2xl border border-outline-variant/20 shadow-sm">
                                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <Heart size={14} className="text-red-400 fill-red-400/20" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant leading-none mb-1">{t('pleasantness')}</span>
                                    <span className="text-sm font-black text-on-surface leading-none">{checkIn.pleasantness || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {reflectView === 'journal' && (
                <div className="space-y-8">
                  {!tutorMode && (
                    <section className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Plus size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-on-surface">{t('todayReflection')}</h3>
                      </div>
                      <textarea
                        value={newReflection}
                        onChange={(e) => setNewReflection(e.target.value)}
                        placeholder={t('placeholderReflection')}
                        className="w-full min-h-[120px] bg-surface-container-low rounded-2xl p-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                      <button
                        onClick={handleSaveReflection}
                        disabled={isSavingReflection || !newReflection.trim()}
                        className="w-full bg-primary text-on-primary py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSavingReflection ? t('saving') : t('saveReflection')}
                      </button>
                    </section>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('previousReflections')}</h3>
                    {(tutorMode ? tutorStudentReflections : reflections).length === 0 ? (
                      <div className="text-center py-12 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
                        <MessageSquare size={48} className="mx-auto text-outline-variant mb-4 opacity-50" />
                        <p className="text-on-surface-variant">{t('noReflections')}</p>
                      </div>
                    ) : (
                      (tutorMode ? tutorStudentReflections : reflections).map((reflection) => (
                        <div key={reflection.id} className="bg-surface-container-lowest p-6 rounded-3xl border border-black/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary">
                              <Calendar size={16} />
                              <span className="text-xs font-bold">{new Date(reflection.timestamp).toLocaleDateString()}</span>
                            </div>
                            <span className="text-[10px] font-bold text-on-surface-variant opacity-50">
                              {new Date(reflection.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-on-surface-variant leading-relaxed">{reflection.content}</p>
                          
                          {/* Associated Emotions for that day */}
                          {(() => {
                            const reflectionDate = reflection.date || new Date(reflection.timestamp).toLocaleDateString('en-CA');
                            const dayEmotions = (tutorMode ? tutorStudentCheckIns : checkIns).filter(c => 
                              new Date(c.timestamp).toLocaleDateString('en-CA') === reflectionDate
                            );
                            
                            if (dayEmotions.length === 0) return null;
                            
                            return (
                              <div className="pt-4 mt-2 border-t border-outline-variant/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                                  <Activity size={12} className="text-primary" />
                                  {t('dayEmotions')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {dayEmotions.map((c, i) => (
                                    <div key={i} className={cn(
                                      "px-3 py-1.5 rounded-xl text-[10px] font-bold border shadow-sm flex items-center gap-2",
                                      c.quadrant === 'red' && "bg-red-500/5 text-red-600 border-red-500/10",
                                      c.quadrant === 'yellow' && "bg-amber-500/5 text-amber-600 border-amber-500/10",
                                      c.quadrant === 'blue' && "bg-blue-500/5 text-blue-600 border-blue-500/10",
                                      c.quadrant === 'green' && "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                                    )}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                      {t(c.emotion as any)}
                                      <span className="opacity-50 font-black">|</span>
                                      <span className="flex items-center gap-0.5">
                                        <Zap size={8} /> {c.energy || '-'}
                                      </span>
                                      <span className="flex items-center gap-0.5">
                                        <Heart size={8} /> {c.pleasantness || '-'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {reflectView === 'trends' && (
                <div className="space-y-8">
                  <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-on-surface">{t('intensityLevel')}</h3>
                        <p className="text-xs text-on-surface-variant">{t('sadnessManagementDesc')}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {['Haserrea', 'Beldurra', 'Tristura', 'Harridura', 'Nazka', 'Poza'].map(emotion => {
                          const color = emotion === 'Haserrea' ? '#ef4444' : // Gorria
                                        emotion === 'Nazka' ? '#c2410c' :    // Laranja iluna
                                        emotion === 'Beldurra' ? '#a855f7' : // Morea
                                        emotion === 'Harridura' ? '#fb923c' : // Laranja argia
                                        emotion === 'Poza' ? '#facc15' :      // Horia
                                        emotion === 'Tristura' ? '#3b82f6' :  // Urdina
                                        '#10b981';
                          
                          // Only show if there's data for this main emotion or its subcategories
                          const currentData = tutorMode ? tutorStudentCheckIns : checkIns;
                          const hasData = currentData.some(c => {
                            if (c.emotion === emotion) return true;
                            const def = EMOTIONS.find(e => e.name === emotion);
                            return def?.subcategories?.includes(c.emotion);
                          });

                          if (!hasData) return null;

                          return (
                            <div key={emotion} className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                              {t(emotion as any)}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={(tutorMode ? tutorStudentCheckIns : checkIns).slice().reverse().map(c => {
                          // Find which main emotion this check-in belongs to
                          const mainEmotion = EMOTIONS.find(e => 
                            e.name === c.emotion || e.subcategories?.includes(c.emotion)
                          )?.name || c.emotion;

                          return {
                            displayTime: new Date(c.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
                            timestamp: c.timestamp,
                            [mainEmotion]: c.intensity,
                            emotion: c.emotion,
                            mainEmotion: mainEmotion,
                            intensity: c.intensity,
                            energy: c.energy,
                            pleasantness: c.pleasantness,
                            quadrant: c.quadrant,
                            fullTime: new Date(c.timestamp).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis 
                            dataKey="timestamp" 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(ts) => new Date(ts).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                            tick={{fontSize: 10, fill: 'var(--color-on-surface-variant)', fontWeight: 'bold'}} 
                            minTickGap={30}
                          />
                          <YAxis 
                            domain={[0, 5]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: 'var(--color-on-surface-variant)'}} 
                            ticks={[0, 1, 2, 3, 4, 5]}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const quadrantColor = data.quadrant === 'red' ? 'text-red-500' : 
                                                      data.quadrant === 'yellow' ? 'text-amber-500' : 
                                                      data.quadrant === 'blue' ? 'text-blue-500' : 'text-emerald-500';
                                return (
                                  <div className="bg-surface-container-highest p-4 rounded-2xl shadow-2xl border border-outline-variant/10 text-xs min-w-[160px]">
                                    <p className="font-bold text-on-surface mb-3 pb-2 border-b border-outline-variant/10">{data.fullTime}</p>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 opacity-50">{t('emotion')}</p>
                                        <p className={cn("font-bold text-sm capitalize", quadrantColor)}>
                                          {t(data.mainEmotion as any)} 
                                          {data.emotion !== data.mainEmotion && (
                                            <span className="text-[10px] opacity-60 ml-1">({t(data.emotion as any)})</span>
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 opacity-50">{t('intensity')}</p>
                                        <p className="text-on-surface font-bold text-lg">{data.intensity}<span className="text-xs font-normal opacity-50">/5</span></p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/10">
                                        <div>
                                          <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-0.5 opacity-50">{t('energy')}</p>
                                          <p className="text-on-surface font-bold">{data.energy || '-'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-0.5 opacity-50">{t('pleasantness')}</p>
                                          <p className="text-on-surface font-bold">{data.pleasantness || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {['Haserrea', 'Beldurra', 'Tristura', 'Harridura', 'Nazka', 'Poza'].map(emotion => {
                            const color = emotion === 'Haserrea' ? '#ef4444' : // Gorria
                                          emotion === 'Nazka' ? '#c2410c' :    // Laranja iluna
                                          emotion === 'Beldurra' ? '#a855f7' : // Morea
                                          emotion === 'Harridura' ? '#fb923c' : // Laranja argia
                                          emotion === 'Poza' ? '#facc15' :      // Horia
                                          emotion === 'Tristura' ? '#3b82f6' :  // Urdina
                                          '#10b981';
                            return (
                              <Line 
                                key={emotion}
                                type="monotone" 
                                dataKey={emotion} 
                                stroke={color} 
                                strokeWidth={4} 
                                connectNulls
                                dot={{ r: 6, fill: color, strokeWidth: 2, stroke: 'white' }}
                                activeDot={{ r: 8, strokeWidth: 0 }} 
                                animationDuration={1000}
                              />
                            );
                          })}
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm">
                      <h3 className="text-sm font-bold text-on-surface mb-4">{t('mainEmotions')}</h3>
                      <div className="space-y-3">
                        {(() => {
                          const currentData = tutorMode ? tutorStudentCheckIns : checkIns;
                          return currentData.length > 0 ? (
                            ['Haserrea', 'Beldurra', 'Tristura', 'Harridura', 'Nazka', 'Poza'].map(mainEmotion => {
                              const count = currentData.filter(c => 
                                c.emotion === mainEmotion || 
                                EMOTIONS.find(e => e.name === mainEmotion)?.subcategories?.includes(c.emotion)
                              ).length;
                              
                              if (count === 0) return null;
                              
                              const percentage = Math.round((count / currentData.length) * 100);
                              const color = mainEmotion === 'Haserrea' ? '#ef4444' : 
                                            mainEmotion === 'Nazka' ? '#c2410c' : 
                                            mainEmotion === 'Beldurra' ? '#a855f7' : 
                                            mainEmotion === 'Harridura' ? '#fb923c' : 
                                            mainEmotion === 'Poza' ? '#facc15' : 
                                            mainEmotion === 'Tristura' ? '#3b82f6' : '#10b981';

                              return (
                                <div key={mainEmotion} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-on-surface capitalize">{t(mainEmotion as any)}</span>
                                    <span className="text-on-surface-variant">{percentage}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-1000" 
                                      style={{ width: `${percentage}%`, backgroundColor: color }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-on-surface-variant italic">{t('noDataYet')}</p>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm">
                      <h3 className="text-sm font-bold text-on-surface mb-4">{t('moodDistribution')}</h3>
                      <div className="h-48 w-full">
                        {(() => {
                          const currentData = tutorMode ? tutorStudentCheckIns : checkIns;
                          return currentData.length > 0 ? (() => {
                            const pieData = ['Haserrea', 'Beldurra', 'Tristura', 'Harridura', 'Nazka', 'Poza'].map(mainEmotion => {
                              const count = currentData.filter(c => 
                                c.emotion === mainEmotion || 
                                EMOTIONS.find(e => e.name === mainEmotion)?.subcategories?.includes(c.emotion)
                              ).length;
                              
                              const color = mainEmotion === 'Haserrea' ? '#ef4444' : 
                                            mainEmotion === 'Nazka' ? '#c2410c' : 
                                            mainEmotion === 'Beldurra' ? '#a855f7' : 
                                            mainEmotion === 'Harridura' ? '#fb923c' : 
                                            mainEmotion === 'Poza' ? '#facc15' : 
                                            mainEmotion === 'Tristura' ? '#3b82f6' : '#10b981';
                              
                              return { name: mainEmotion, value: count, color };
                            }).filter(d => d.value > 0);

                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const percentage = Math.round((Number(data.value) / currentData.length) * 100);
                                        return (
                                          <div className="bg-surface-container-highest p-3 rounded-2xl shadow-2xl border border-outline-variant/10 text-[10px] min-w-[120px]">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 opacity-50">{t('emotion')}</p>
                                            <div className="flex items-center justify-between gap-4">
                                              <p className="font-bold text-on-surface capitalize">{t(data.name as any)}</p>
                                              <p className="text-primary font-black text-xs">{percentage}%</p>
                                            </div>
                                            <div className="mt-2 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
                                              <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })() : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-xs text-on-surface-variant opacity-50 italic">{t('noDataYet')}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'main' && (
            <motion.div
              key="tools-tab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">{t('tools')}</h2>
                <p className="text-on-surface-variant font-medium opacity-80">{t('toolsDescription')}</p>
              </header>

              <div className="grid grid-cols-1 gap-4">
                <ToolCard 
                  title={t('angerManagement')}
                  description={t('angerManagementIntro')}
                  duration="1-5 min"
                  icon={<Angry className="text-red-500" />}
                  onClick={() => setCurrentView('anger-management')}
                />
                <ToolCard 
                  title={t('squareBreathing')}
                  description={t('squareBreathingDesc')}
                  duration="3 min"
                  icon={<Waves className="text-blue-500" />}
                  onClick={() => setCurrentView('square-breathing')}
                />
                <ToolCard 
                  title={t('bodyScan')}
                  description={t('bodyScanDesc')}
                  duration="5 min"
                  icon={<Accessibility className="text-emerald-500" />}
                  onClick={() => setCurrentView('body-scan')}
                />
                <ToolCard 
                  title={t('positiveVisualization')}
                  description={t('positiveVisualizationDesc')}
                  duration="4 min"
                  icon={<Lightbulb className="text-amber-500" />}
                  onClick={() => setCurrentView('positive-visualization')}
                />
                <ToolCard 
                  title={t('sensoryReset')}
                  description={t('sensoryResetDesc')}
                  duration="2-5 min"
                  icon={<Wind className="text-purple-500" />}
                  onClick={() => setCurrentView('sensory-reset')}
                />
                <ToolCard 
                  title={t('sadnessManagement')}
                  description={t('sadnessManagementDesc')}
                  duration="5-10 min"
                  icon={<Frown className="text-blue-400" />}
                  onClick={() => setCurrentView('sadness-management')}
                />

                {/* Health Data Section */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-bold text-on-surface px-1">{t('healthTitle')}</h3>
                  <div className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 space-y-6">
                    {!healthData ? (
                      <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                          <Activity size={32} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-on-surface">{t('healthTitle')}</p>
                          <p className="text-sm text-on-surface-variant">{t('healthDesc')}</p>
                        </div>
                        <button 
                          onClick={connectGoogleFit}
                          disabled={isFetchingHealth}
                          className="px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isFetchingHealth ? t('fetchingHealth') : t('connectGoogleFit')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-black/5 flex flex-col items-center text-center">
                            <Footprints className="text-orange-500 mb-2" size={24} />
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase">{t('steps')}</p>
                            <p className="text-xl font-black text-on-surface">{healthData.steps}</p>
                          </div>
                          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-black/5 flex flex-col items-center text-center">
                            <Moon className="text-indigo-500 mb-2" size={24} />
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase">{t('sleep')}</p>
                            <p className="text-xl font-black text-on-surface">{healthData.sleepHours} <span className="text-xs font-normal">{t('hours')}</span></p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-on-surface">{t('healthRecommendations')}</h4>
                            <button 
                              onClick={generateHealthRecommendations}
                              disabled={isGeneratingRecommendation}
                              className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
                            >
                              {isGeneratingRecommendation ? '...' : t('getRecommendations')}
                            </button>
                          </div>
                          
                          {healthRecommendation ? (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-primary/5 border border-primary/10 p-4 rounded-2xl"
                            >
                              <div className="prose prose-sm text-on-surface-variant text-sm leading-relaxed">
                                <Markdown>{healthRecommendation}</Markdown>
                              </div>
                            </motion.div>
                          ) : (
                            <p className="text-xs text-on-surface-variant italic">{t('noHealthData')}</p>
                          )}
                        </div>

                        <button 
                          onClick={connectGoogleFit}
                          className="w-full py-2 text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors"
                        >
                          Eguneratu datuak / Actualizar datos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'positive-visualization' && (
            <motion.div
              key="positive-visualization-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('main')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">{t('positiveVisualization')}</h2>
                  <p className="text-on-surface-variant font-medium opacity-80 text-sm">Bistaratze Positiboa: Energia eta motibazioa hobetzeko</p>
                </div>
              </header>

              <div className="space-y-6">
                <section className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10">
                  <p className="text-on-surface leading-relaxed italic">
                    "Bistaratze positiboa zure buruan irudi atseginak eta arrakastatsuak sortzean datza, zure aldartea eta konfiantza hobetzeko."
                  </p>
                </section>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-primary" />
                      Nola praktikatu
                    </h3>
                    <div className="space-y-4">
                      <StepItem number="1" title="Erlaxatu" description="Itxi begiak eta hartu hiru arnasketa sakon." />
                      <StepItem number="2" title="Leku Segurua" description="Imajinatu leku lasai eta eder bat (hondartza, mendia, etab.)." />
                      <StepItem number="3" title="Xehetasunak" description="Erabili zentzumen guztiak: Zer ikusten duzu? Zer entzuten duzu? Zer usaintzen duzu?" />
                      <StepItem number="4" title="Sentimendua" description="Sentitu leku horrek ematen dizun bakea eta poztasuna." />
                      <StepItem number="5" title="Itzulera" description="Poliki-poliki, ireki begiak eta eraman sentimendu hori zurekin." />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'square-breathing' && (
            <motion.div
              key="square-breathing-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('main')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Arnasketa Karratua</h2>
                  <p className="text-on-surface-variant font-medium opacity-80 text-sm">Box Breathing: Erlaxazio teknika eraginkorra</p>
                </div>
              </header>

              <div className="space-y-6">
                <section className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10">
                  <p className="text-on-surface leading-relaxed italic">
                    "Arnasketa karratua erlaxazio-teknika eraginkorra da. Arnasa hartu, birikak beteta eutsi, arnasa bota eta aire gabe mantentzean datza, urrats bakoitza 4 segundoz eginez."
                  </p>
                </section>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-primary" />
                      Nola praktikatu (Urratsz urrats)
                    </h3>
                    <div className="space-y-4">
                      <StepItem number="1" title="Prestaketa" description="Eseri zuzen aulki eroso batean, oinak lurrean jarrita eta eskuak erlaxatuta." />
                      <StepItem number="2" title="Arnasa hartu (4s)" description="Hartu arnasa poliki sudurretik, toraxa eta sabelaldea puztuz, lauraino kontatuz." />
                      <StepItem number="3" title="Eutsi (4s)" description="Mantendu airea biriketan lauraino kontatuz." />
                      <StepItem number="4" title="Arnasa bota (4s)" description="Bota airea poliki, lauraino kontatuz." />
                      <StepItem number="5" title="Atsedenaldia (4s)" description="Mantendu birikak hutsik lauraino kontatuz hurrengo arnasketara arte." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                      <h3 className="font-bold text-on-surface mb-3">Onura nagusiak</h3>
                      <ul className="space-y-2 text-sm text-on-surface-variant">
                        <li className="flex gap-2"><span>•</span> <span><strong>Estresa murriztea:</strong> Sistema nerbiosoa erregulatzen du.</span></li>
                        <li className="flex gap-2"><span>•</span> <span><strong>Kontzentrazioa:</strong> Argitasun mentala hobetzen du.</span></li>
                        <li className="flex gap-2"><span>•</span> <span><strong>Oxigenazioa:</strong> Energia hobetzen du.</span></li>
                      </ul>
                    </div>
                    <div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10">
                      <h3 className="font-bold text-on-surface mb-3">Kontraindikazioak</h3>
                      <ul className="space-y-2 text-sm text-on-surface-variant">
                        <li className="flex gap-2"><span>•</span> <span>Haurdunaldian aireari eustea saihestu.</span></li>
                        <li className="flex gap-2"><span>•</span> <span>Ez gomendatua odol-presio ezegonkorra baduzu.</span></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 p-6 rounded-3xl text-center">
                  <p className="text-sm font-bold text-primary">
                    Gomendioa: Egin ziklo hau gutxienez 4 aldiz jarraian erlaxazio sakona lortzeko.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'body-scan' && (
            <motion.div
              key="body-scan-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('main')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Gorputz-Eskaneatzea</h2>
                  <p className="text-on-surface-variant font-medium opacity-80 text-sm">Non bizi da zure emozioa oraintxe bertan?</p>
                </div>
              </header>

              <div className="flex flex-col gap-8">
                {/* Silhouette Container */}
                <div className="space-y-4">
                  <div className="relative w-full aspect-[3/4] bg-surface-container-low rounded-[32px] overflow-hidden flex items-center justify-center border border-outline-variant/10">
                    <svg className="h-[90%] w-auto text-surface-container-highest fill-current" viewBox="0 0 200 400">
                      <path d="M100,20 C115,20 125,30 125,45 C125,60 115,70 100,70 C85,70 75,60 75,45 C75,30 85,20 100,20 M100,75 C80,75 70,85 65,100 L55,160 C53,170 58,180 68,180 L75,180 L75,260 L85,380 C86,390 95,390 95,380 L100,310 L105,380 C105,390 114,390 115,380 L125,260 L125,180 L132,180 C142,180 147,170 145,160 L135,100 C130,85 120,75 100,75"></path>
                    </svg>
                    
                    {/* Interactive Hotspots */}
                    <button type="button" onClick={() => setSelectedBodyLocation('Burua')} className="absolute top-[8%] left-[45%] w-10 h-10 rounded-full flex items-center justify-center">
                      <div className={cn("w-3 h-3 rounded-full transition-all", selectedBodyLocation === 'Burua' ? "bg-red-500 scale-150" : "bg-red-500/30")}></div>
                    </button>
                    <button type="button" onClick={() => setSelectedBodyLocation('Bularra')} className="absolute top-[28%] left-[45%] w-12 h-12 rounded-full flex items-center justify-center">
                      <div className={cn("w-4 h-4 rounded-full transition-all", selectedBodyLocation === 'Bularra' ? "bg-primary scale-150" : "bg-primary/30")}></div>
                    </button>
                    <button type="button" onClick={() => setSelectedBodyLocation('Sabela')} className="absolute top-[45%] left-[45%] w-10 h-10 rounded-full flex items-center justify-center">
                      <div className={cn("w-3 h-3 rounded-full transition-all", selectedBodyLocation === 'Sabela' ? "bg-amber-500 scale-150" : "bg-amber-500/30")}></div>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {BODY_PARTS.map(part => (
                      <button
                        key={part}
                        type="button"
                        onClick={() => setSelectedBodyLocation(part)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                          selectedBodyLocation === part
                            ? "bg-primary text-on-primary border-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-primary/5"
                        )}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sensation Menu */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">Sentsazioak</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SENSATIONS.map(sensation => (
                      <SensationButton 
                        key={sensation.label}
                        icon={sensation.icon} 
                        label={sensation.label} 
                        active={selectedBodySensation === sensation.label}
                        onClick={() => setSelectedBodySensation(sensation.label)}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowSuccess(true);
                    setCurrentView('main');
                    setTimeout(() => setShowSuccess(false), 3000);
                  }}
                  className="w-full bg-primary text-on-primary py-5 rounded-full font-headline font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Bidali Eskaneatzea
                  <CheckCircle2 size={24} />
                </button>
              </div>
            </motion.div>
          )}
          {activeTab === 'tools' && currentView === 'sensory-reset' && (
            <motion.div
              key="sensory-reset-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('main')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">{t('sensoryReset')}</h2>
                  <p className="text-on-surface-variant font-medium opacity-80 text-sm">{t('sensoryResetIntro')}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-4">
                <ToolCard 
                  title={t('sensoryResetGame')}
                  description={t('sensoryResetGameDesc')}
                  duration="2 min"
                  icon={<Gamepad2 className="text-purple-500" />}
                  onClick={() => setCurrentView('sensory-reset-game')}
                />
                <ToolCard 
                  title={t('scentMemory')}
                  description={t('scentMemoryDesc')}
                  duration="2 min"
                  icon={<Wind className="text-blue-500" />}
                  onClick={() => setCurrentView('scent-memory')}
                />
                <ToolCard 
                  title={t('coldTouch')}
                  description={t('coldTouchDesc')}
                  duration="1 min"
                  icon={<ThermometerSnowflake className="text-cyan-500" />}
                  onClick={() => setCurrentView('cold-touch')}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'sensory-reset-game' && (
            <motion.div
              key="sensory-reset-game-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('sensory-reset')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('sensoryResetGame')}</h2>
                </div>
              </header>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      id: 1, 
                      seed: 'forest', 
                      label: 'Basoa / Bosque', 
                      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
                      audioUrl: 'https://www.soundjay.com/nature/forest-1.mp3'
                    },
                    { 
                      id: 2, 
                      seed: 'ocean', 
                      label: 'Ozeanoa / Océano', 
                      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-1175-large.mp4',
                      audioUrl: 'https://www.soundjay.com/nature/ocean-wave-1.mp3'
                    },
                    { 
                      id: 3, 
                      seed: 'mountain', 
                      label: 'Mendia / Montaña', 
                      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mountain-landscape-with-a-lake-1170-large.mp4',
                      audioUrl: 'https://www.soundjay.com/nature/wind-1.mp3'
                    },
                    { 
                      id: 4, 
                      seed: 'river', 
                      label: 'Ibaia / Río', 
                      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-river-flowing-through-the-forest-1171-large.mp4',
                      audioUrl: 'https://www.soundjay.com/nature/river-1.mp3'
                    }
                  ].map((item) => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSensoryItem(item)}
                      className="relative aspect-video rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
                    >
                      <img 
                        src={`https://picsum.photos/seed/${item.seed}/800/450`} 
                        alt={item.label}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                        <div className="flex items-center gap-3 text-white">
                          <Volume2 size={20} />
                          <span className="font-bold">{item.label}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setShowExerciseFeedback(true)}
                    className="bg-primary text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                  >
                    {t('finish')}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {selectedSensoryItem && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
                  >
                    <button 
                      onClick={() => setSelectedSensoryItem(null)}
                      className="absolute top-6 left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
                    >
                      <ChevronRight className="rotate-180" size={24} />
                    </button>
                    
                    <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl relative bg-neutral-900 flex items-center justify-center">
                      <video 
                        key={`video-${selectedSensoryItem.id}`}
                        ref={videoRef}
                        src={selectedSensoryItem.videoUrl} 
                        autoPlay 
                        loop 
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        onLoadStart={() => setIsMediaLoading(true)}
                        onCanPlay={() => setIsMediaLoading(false)}
                        onPlay={() => {
                          setIsMediaPlaying(true);
                          setIsMediaLoading(false);
                        }}
                      />
                      <audio 
                        key={`audio-${selectedSensoryItem.id}`}
                        ref={audioRef}
                        src={selectedSensoryItem.audioUrl} 
                        autoPlay 
                        loop 
                        onPlay={() => setIsMediaPlaying(true)}
                      />
                      
                      {isMediaLoading && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}

                      {!isMediaPlaying && !isMediaLoading && (
                        <button 
                          onClick={() => {
                            videoRef.current?.play();
                            audioRef.current?.play();
                            setIsMediaPlaying(true);
                          }}
                          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 group transition-all"
                        >
                          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-4">
                            <Play size={48} fill="currentColor" />
                          </div>
                          <span className="text-white font-bold text-lg tracking-wide animate-pulse">
                            Sakatu erreproduzitzeko / Pulsa para reproducir
                          </span>
                        </button>
                      )}

                      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 z-10">
                        <div className="flex items-center gap-3 text-white">
                          <Volume2 size={24} className="animate-pulse" />
                          <span className="font-bold text-lg">{selectedSensoryItem.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-12">
                      <button 
                        onClick={() => {
                          setSelectedSensoryItem(null);
                          setShowExerciseFeedback(true);
                        }}
                        className="bg-white text-black px-12 py-4 rounded-full font-bold shadow-xl"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'scent-memory' && (
            <motion.div
              key="scent-memory-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('sensory-reset')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('scentMemory')}</h2>
                </div>
              </header>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 1, seed: 'lavender', label: 'Labanda / Lavanda' },
                    { id: 2, seed: 'bread', label: 'Ogi berria / Pan recién hecho' },
                    { id: 3, seed: 'coffee', label: 'Kafea / Café' },
                    { id: 4, seed: 'rain', label: 'Euria / Lluvia' }
                  ].map((item) => (
                    <div key={item.id} className="space-y-2 text-center">
                      <div className="aspect-square rounded-full overflow-hidden border-4 border-white shadow-md">
                        <img 
                          src={`https://picsum.photos/seed/${item.seed}/400/400`} 
                          alt={item.label}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-xs font-bold text-on-surface-variant">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 text-center italic">
                  <p className="text-on-surface leading-relaxed">
                    "Imajinatu usain horietako bat. Nola sentiarazten zaitu? Utzi usain horrek zure sentsazioak berritzen."
                  </p>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setShowExerciseFeedback(true)}
                    className="bg-primary text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                  >
                    {t('finish')}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'empathy-exercise' && (
            <motion.div
              key="empathy-exercise"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button onClick={() => setCurrentView('sadness-management')} className="p-2 rounded-full bg-surface-container-low text-on-surface">
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">{t('empathyExercise')}</h2>
                  <p className="text-on-surface-variant text-sm">{t('empathyExerciseDesc')}</p>
                </div>
              </header>

              <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('friendSad')}</label>
                    <textarea 
                      value={empathyFriend}
                      onChange={(e) => setEmpathyFriend(e.target.value)}
                      className="w-full bg-surface-container-low rounded-2xl p-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('askOthers')}</label>
                    <textarea 
                      value={empathyAsk}
                      onChange={(e) => setEmpathyAsk(e.target.value)}
                      className="w-full bg-surface-container-low rounded-2xl p-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[100px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleGetEmpathyFeedback}
                  disabled={isGeneratingEmpathyFeedback || (!empathyFriend && !empathyAsk)}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingEmpathyFeedback ? t('loadingAi') : t('getFeedback')}
                </button>

                {empathyFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/10 p-6 rounded-3xl"
                  >
                    <div className="prose prose-sm text-on-surface-variant text-sm leading-relaxed">
                      <Markdown>{empathyFeedback}</Markdown>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'emotional-journal' && (
            <motion.div
              key="emotional-journal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button onClick={() => setCurrentView('sadness-management')} className="p-2 rounded-full bg-surface-container-low text-on-surface">
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">{t('emotionalExpressionJournal')}</h2>
                  <p className="text-on-surface-variant text-sm">{t('emotionalExpressionJournalDesc')}</p>
                </div>
              </header>

              <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('whySad')}</label>
                    <textarea 
                      value={journalWhy}
                      onChange={(e) => setJournalWhy(e.target.value)}
                      className="w-full bg-surface-container-low rounded-2xl p-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('whenStarted')}</label>
                    <textarea 
                      value={journalWhen}
                      onChange={(e) => setJournalWhen(e.target.value)}
                      className="w-full bg-surface-container-low rounded-2xl p-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('whatDone')}</label>
                    <textarea 
                      value={journalWhat}
                      onChange={(e) => setJournalWhat(e.target.value)}
                      className="w-full bg-surface-container-low rounded-2xl p-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[80px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleGetJournalFeedback}
                  disabled={isGeneratingJournalFeedback || (!journalWhy && !journalWhen && !journalWhat)}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingJournalFeedback ? t('loadingAi') : t('getFeedback')}
                </button>

                {journalFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/10 p-6 rounded-3xl"
                  >
                    <div className="prose prose-sm text-on-surface-variant text-sm leading-relaxed">
                      <Markdown>{journalFeedback}</Markdown>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'sadness-management' && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('main')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">{t('sadnessManagement')}</h2>
                  <p className="text-on-surface-variant font-medium opacity-80 text-sm">{t('sadnessManagementDesc')}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-4">
                <ToolCard 
                  title={t('emotionalExpressionJournal')}
                  description={t('emotionalExpressionJournalDesc')}
                  duration="5-10 min"
                  icon={<BookOpen className="text-blue-400" />}
                  onClick={() => setCurrentView('emotional-journal')}
                />
                <ToolCard 
                  title={t('empathyExercise')}
                  description={t('empathyExerciseDesc')}
                  duration="5 min"
                  icon={<Heart className="text-pink-400" />}
                  onClick={() => setCurrentView('empathy-exercise')}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'cold-touch' && (
            <motion.div
              key="cold-touch-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('sensory-reset')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('coldTouch')}</h2>
                </div>
              </header>

              <div className="flex flex-col items-center justify-center space-y-12 min-h-[50vh]">
                <div className="relative w-48 h-48 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-cyan-500"
                  >
                    <Waves size={80} />
                  </motion.div>
                  <div className="absolute -bottom-4 bg-white px-4 py-2 rounded-full shadow-md border border-cyan-100">
                    <span className="text-xs font-bold text-cyan-600">UR HOTZA / AGUA FRÍA</span>
                  </div>
                </div>

                <div className="text-center space-y-6 max-w-xs">
                  <p className="text-on-surface-variant font-medium leading-relaxed">
                    Sartu eskuak ur hotzean edo jarri zerbait hotza zure azalean. Sentitu hotzak nola arintzen duen sentsazio desatsegina.
                  </p>
                  
                  <div className="bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 text-xs text-cyan-700 font-bold">
                    TEKNIKA: "Cold Water Face Wash" edo "Ice Cube Hold"
                  </div>
                </div>

                <button 
                  onClick={() => setShowExerciseFeedback(true)}
                  className="bg-primary text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                >
                  {t('finish')}
                </button>
              </div>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {activeTab === 'tools' && currentView === 'anger-management' && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('main')}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">{t('angerManagement')}</h2>
                  <p className="text-on-surface-variant font-medium opacity-80 text-sm">{t('angerManagementIntro')}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-4">
                <ToolCard 
                  title={t('angerTimer')}
                  description={t('angerTimerDesc')}
                  duration="60s"
                  icon={<Activity className="text-red-500" />}
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('anger-timer');
                  }}
                />
                <ToolCard 
                  title={t('breathingExercise')}
                  description={t('breathingExerciseDesc')}
                  duration="1 min"
                  icon={<Wind className="text-blue-500" />}
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('breathing-exercise');
                  }}
                />
                <ToolCard 
                  title={t('countingTo10')}
                  description={t('countingTo10Desc')}
                  duration="30s"
                  icon={<LayoutGrid className="text-amber-500" />}
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('counting-to-10');
                  }}
                />
                <ToolCard 
                  title={t('positiveThoughtReplacement')}
                  description={t('positiveThoughtReplacementDesc')}
                  duration="2 min"
                  icon={<Sparkles className="text-purple-500" />}
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('positive-thought');
                  }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'anger-timer' && (
            <motion.div
              key="anger-timer-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('anger-management');
                  }}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('angerTimer')}</h2>
                </div>
              </header>

              <div className="flex flex-col items-center justify-center space-y-12 min-h-[50vh]">
                <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-surface-container-high"
                  />
                  <motion.circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 120}
                    initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - timerSeconds / 60) }}
                    className="text-red-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-on-surface">{timerSeconds}</span>
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{t('seconds')}</span>
                </div>
              </div>

              <div className="text-center space-y-4 max-w-xs">
                <p className="text-on-surface-variant font-medium">
                  {isTimerActive ? "Arnasa hartu poliki eta pentsatu zerbait positiboa." : "Prest zaudenean, hasi timerra."}
                </p>
                <button 
                  onClick={() => setIsTimerActive(!isTimerActive)}
                  className={cn(
                    "px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg",
                    isTimerActive ? "bg-surface-container-high text-on-surface" : "bg-red-500 text-white shadow-red-500/20"
                  )}
                >
                  {isTimerActive ? t('stopTimer') : t('startTimer')}
                </button>
              </div>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'breathing-exercise' && (
            <motion.div
              key="breathing-exercise-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('anger-management');
                  }}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('breathingExercise')}</h2>
                </div>
              </header>

              <div className="flex flex-col items-center justify-center space-y-12 min-h-[50vh]">
                <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-on-surface">
                  {breathingStep === 'inhale' ? t('breatheIn') : breathingStep === 'hold' ? t('hold') : t('breatheOut')}
                </h3>
                <p className="text-on-surface-variant font-bold uppercase tracking-widest">
                  Zikloa: {breathingCycle + 1} / 3
                </p>
              </div>

              <motion.div 
                animate={{ 
                  scale: breathingStep === 'inhale' ? 1.5 : breathingStep === 'hold' ? 1.5 : 1,
                  opacity: breathingStep === 'hold' ? 0.8 : 1
                }}
                transition={{ duration: 5, ease: "easeInOut" }}
                className="w-48 h-48 bg-blue-500/20 rounded-full flex items-center justify-center border-4 border-blue-500"
              >
                <span className="text-5xl font-black text-blue-600">{breathingTimer}</span>
              </motion.div>

              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn("w-3 h-3 rounded-full transition-all", i < breathingCycle ? "bg-blue-500" : "bg-surface-container-high")} />
                ))}
              </div>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'counting-to-10' && (
            <motion.div
              key="counting-to-10-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('anger-management');
                  }}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('countingTo10')}</h2>
                </div>
              </header>

              <div className="flex flex-col items-center justify-center space-y-12 min-h-[50vh]">
                <div className="text-center space-y-4">
                <h3 className="text-4xl font-black text-on-surface">{countTo10}</h3>
                <p className="text-on-surface-variant font-medium max-w-xs">
                  Sakatu botoia eta kontatu poliki 10era arte, arnasa hartzen duzun bitartean.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                  <button
                    key={val}
                    disabled={val !== countTo10 + 1}
                    onClick={() => {
                      setCountTo10(val);
                      if (val === 10) {
                        setTimeout(() => setShowExerciseFeedback(true), 500);
                      }
                    }}
                    className={cn(
                      "w-12 h-12 rounded-2xl font-black text-lg transition-all flex items-center justify-center",
                      val <= countTo10 ? "bg-amber-500 text-white" : val === countTo10 + 1 ? "bg-surface-container-high text-on-surface animate-pulse" : "bg-surface-container-low text-outline-variant opacity-50"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && currentView === 'positive-thought' && (
            <motion.div
              key="positive-thought-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    resetAngerExercises();
                    setCurrentView('anger-management');
                  }}
                  className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-on-surface">{t('positiveThoughtReplacement')}</h2>
                </div>
              </header>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">{t('negativeThought')}</label>
                  <textarea 
                    value={negThought}
                    onChange={(e) => setNegThought(e.target.value)}
                    placeholder={t('typeNegativeThought')}
                    className="w-full bg-surface-container-low p-4 rounded-3xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px] text-on-surface"
                  />
                </div>

                <button 
                  onClick={() => getPositiveAffirmation(negThought)}
                  disabled={!negThought.trim()}
                  className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {t('suggestAffirmation')}
                </button>

                <AnimatePresence>
                  {posAffirmation && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-3xl space-y-4"
                    >
                      <div className="flex items-center gap-3 text-purple-600">
                        <Sparkles size={24} />
                        <h3 className="font-bold text-lg">{t('positiveAffirmation')}</h3>
                      </div>
                      <p className="text-on-surface font-medium italic text-lg leading-relaxed">
                        "{posAffirmation}"
                      </p>
                      <button 
                        onClick={() => setShowExerciseFeedback(true)}
                        className="w-full bg-purple-500 text-white py-3 rounded-full font-bold text-sm"
                      >
                        {t('finish')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {showExerciseFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <div className="bg-surface-container-lowest p-8 rounded-[40px] shadow-2xl border border-outline-variant/10 max-w-sm w-full space-y-8 text-center">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-on-surface">Ondo egina!</h3>
                        <p className="text-on-surface-variant">{t('intensityAfter')}</p>
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setExerciseIntensityAfter(val)}
                            className={cn(
                              "w-10 h-10 rounded-full text-sm font-bold transition-all",
                              exerciseIntensityAfter === val ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={handleFinishExercise}
                        className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20"
                      >
                        {t('finish')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            !userProfile ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-on-surface-variant font-medium">Profila kargatzen...</p>
              </div>
            ) : (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-center">
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">{t('yourProfile')}</h2>
                  <div className="flex gap-2">
                    {isEditingProfile && (
                      <button 
                        onClick={handleUpdateProfile}
                        className="p-3 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-90 shadow-md"
                        title="Gorde"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className={cn(
                        "p-3 rounded-full transition-all active:scale-90",
                        isEditingProfile ? "bg-surface-container-high text-on-surface-variant" : "bg-surface-container-low text-primary hover:bg-surface-container-high"
                      )}
                    >
                      {isEditingProfile ? <Plus className="rotate-45" size={20} /> : <Edit3 size={20} />}
                    </button>
                  </div>
                </header>

                {isIncompleteProfile && !isEditingProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-900">{t('incompleteProfile')}</p>
                      <p className="text-xs text-amber-700">{t('fillProfileInfo')}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition-all"
                    >
                      {t('completeNow')}
                    </button>
                  </motion.div>
                )}

                <div className="bg-surface-container-lowest rounded-[32px] p-8 border border-outline-variant/10 shadow-sm space-y-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-primary-container overflow-hidden border-4 border-white shadow-xl">
                          <img 
                            src={userProfile.avatar} 
                            alt={userProfile.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {isEditingProfile && (
                          <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-[2px]">
                            <UserIcon size={32} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      {isEditingProfile && (
                        <div className="w-full space-y-3">
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('chooseAvatar')}</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {AVATAR_OPTIONS.map((avatarUrl) => (
                              <button
                                key={avatarUrl}
                                onClick={() => setUserProfile(prev => prev ? {...prev, avatar: avatarUrl} : null)}
                                className={cn(
                                  "w-12 h-12 rounded-full overflow-hidden border-2 transition-all active:scale-90",
                                  userProfile.avatar === avatarUrl ? "border-primary scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                                )}
                              >
                                <img src={avatarUrl} alt="Avatar option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isEditingProfile && (
                        <div>
                          <h3 className="text-2xl font-extrabold text-on-surface">{userProfile.name}</h3>
                          <p className="text-on-surface-variant font-medium">{userProfile.email}</p>
                        </div>
                      )}
                    </div>

                  <div className="grid grid-cols-1 gap-4">
                    <ProfileField 
                      label={t('school')} 
                      value={userProfile.school} 
                      icon={<School size={18} />} 
                      isEditing={isEditingProfile}
                      onChange={(val: string) => setUserProfile(prev => prev ? {...prev, school: val} : null)}
                    />
                    <ProfileField 
                      label={t('grade')} 
                      value={userProfile.grade} 
                      icon={<LayoutGrid size={18} />} 
                      isEditing={isEditingProfile}
                      onChange={(val: string) => setUserProfile(prev => prev ? {...prev, grade: val} : null)}
                    />
                    <ProfileField 
                      label={t('tutor')} 
                      value={userProfile.tutor} 
                      icon={<UserIcon size={18} />} 
                      isEditing={isEditingProfile}
                      onChange={(val: string) => setUserProfile(prev => prev ? {...prev, tutor: val} : null)}
                    />
                  </div>

                  {isEditingProfile && (
                    <button 
                      onClick={handleUpdateProfile}
                      className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      {t('saveChanges')}
                    </button>
                  )}
                </div>

                {/* Sharing Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('sharingTitle')}</h4>
                  <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 space-y-6">
                    <p className="text-xs text-on-surface-variant leading-relaxed">{t('sharingDesc')}</p>
                    
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        value={sharingEmail}
                        onChange={(e) => setSharingEmail(e.target.value)}
                        placeholder="tutorea@eskola.eus"
                        className="flex-1 bg-surface-container-lowest px-4 py-3 rounded-xl text-sm border border-outline-variant/10 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button 
                        onClick={handleAddSharingEmail}
                        className="bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
                      >
                        {t('addEmail')}
                      </button>
                    </div>
                    {sharingError && <p className="text-xs text-red-500 font-medium px-1">{sharingError}</p>}

                    {userProfile.sharedWith && userProfile.sharedWith.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('sharedWithLabel')}</p>
                        <div className="space-y-2">
                          {userProfile.sharedWith.map(email => (
                            <div key={email} className="flex items-center justify-between bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/5">
                              <span className="text-xs font-medium text-on-surface">{email}</span>
                              <button 
                                onClick={() => handleRemoveSharingEmail(email)}
                                className="text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Plus className="rotate-45" size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tutor View Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('tutorView')}</h4>
                  <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 space-y-4">
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        value={tutorStudentEmail}
                        onChange={(e) => setTutorStudentEmail(e.target.value)}
                        placeholder={t('studentEmail')}
                        className="flex-1 bg-surface-container-lowest px-4 py-3 rounded-xl text-sm border border-outline-variant/10 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button 
                        onClick={handleEnterTutorMode}
                        className="bg-secondary text-on-secondary px-4 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
                      >
                        {t('viewData')}
                      </button>
                    </div>
                    {tutorError && <p className="text-xs text-red-500 font-medium px-1">{tutorError}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('notificationsTitle')}</h4>
                  <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        notificationPermission === 'granted' ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"
                      )}>
                        <Bell size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-on-surface">{t('notificationsTitle')}</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{t('notificationsDesc')}</p>
                      </div>
                    </div>
                    
                    {notificationPermission === 'default' ? (
                      <button 
                        onClick={requestNotificationPermission}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
                      >
                        {t('enableNotifications')}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          notificationPermission === 'granted' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <p className="text-xs font-medium text-on-surface-variant">
                          {notificationPermission === 'granted' ? t('notificationsEnabledMsg') : t('notificationsBlockedMsg')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('settings')}</h4>
                  <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
                    <SettingsItem 
                      icon={<LayoutGrid size={18} />} 
                      label={t('language')} 
                      value={userProfile.language === 'es' ? 'Castellano' : 'Euskara'} 
                      last 
                      onClick={() => {
                        const newLang: Language = userProfile.language === 'es' ? 'eu' : 'es';
                        const updatedProfile = {...userProfile, language: newLang};
                        setUserProfile(updatedProfile);
                        setDoc(doc(db, 'users', user.uid), updatedProfile)
                          .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
                      }}
                    />
                  </div>
                </div>

                <button 
                  onClick={logout}
                  className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                >
                  {t('logout')}
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-surface/80 backdrop-blur-xl border-t border-black/5">
        <NavButton 
          active={activeTab === 'mood'} 
          onClick={() => setActiveTab('mood')} 
          icon={<Brain size={24} />} 
          label={t('mood')} 
        />
        <NavButton 
          active={activeTab === 'reflect'} 
          onClick={() => setActiveTab('reflect')} 
          icon={<History size={24} />} 
          label={t('reflect')} 
        />
        <NavButton 
          active={activeTab === 'tools'} 
          onClick={() => setActiveTab('tools')} 
          icon={<LayoutGrid size={24} />} 
          label={t('tools')} 
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<UserIcon size={24} />} 
          label={t('profile')} 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center transition-all duration-300 px-4 py-1 rounded-2xl",
        active ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-primary"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
    </button>
  );
}

function EmotionButton({ emotion, icon, color, activeColor, active, onClick, t }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all duration-300",
        active ? activeColor : color,
        !active && "hover:scale-[1.02] active:scale-95"
      )}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-xs font-bold leading-tight">{t ? t(emotion as any) : emotion}</span>
    </button>
  );
}

function ToolCard({ title, description, duration, icon, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="bg-surface-container-lowest p-6 rounded-3xl border border-black/5 flex items-start gap-4 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-headline font-bold text-on-surface">{title}</h4>
          <span className="text-[10px] font-bold bg-surface-container-high px-2 py-1 rounded-full text-on-surface-variant">{duration}</span>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepItem({ number, title, description }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-on-surface text-sm">{title}</h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SensationButton({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl shadow-sm transition-all text-left border active:scale-[0.98]",
        active 
          ? "bg-primary-container text-on-primary-container border-primary/10" 
          : "bg-surface-container-lowest border-outline-variant/15 hover:bg-surface-container"
      )}
    >
      {icon}
      <span className={cn("text-sm", active ? "font-semibold" : "font-medium")}>{label}</span>
    </button>
  );
}

function FactorItem({ icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{label}</p>
        <p className="text-sm font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function ProfileField({ label, value, icon, isEditing, onChange }: any) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/5">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">{label}</p>
        {isEditing ? (
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${label} idatzi...`}
            className="w-full bg-white border-none rounded-lg py-1 px-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <p className={cn("text-sm font-bold", value ? "text-on-surface" : "text-on-surface-variant/40 italic")}>
            {value || 'Zehaztu gabe'}
          </p>
        )}
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, value, last, onClick, isToggle, active }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer",
        !last && "border-b border-outline-variant/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-on-surface-variant opacity-70">{icon}</div>
        <span className="text-sm font-medium text-on-surface">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isToggle ? (
          <div className={cn(
            "w-10 h-6 rounded-full p-1 transition-all duration-300",
            active ? "bg-primary" : "bg-outline-variant/30"
          )}>
            <div className={cn(
              "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
              active ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        ) : (
          <>
            <span className="text-xs font-bold text-primary">{value}</span>
            <ChevronRight size={16} className="text-outline-variant" />
          </>
        )}
      </div>
    </div>
  );
}
