import { create } from 'zustand';

export type AppSection = 
  | 'home' 
  | 'dashboard' 
  | 'body-scan' 
  | 'live-coach'
  | 'exercises' 
  | 'adaptive-workout'
  | 'mind-gym'
  | 'breathing' 
  | 'mood' 
  | 'nutrition' 
  | 'community' 
  | 'wearable'
  | 'crisis';

interface AppState {
  activeSection: AppSection;
  setActiveSection: (section: AppSection) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  userProfile: {
    disability: string;
    injuryType: string;
    athleteCategory: string;
    age: number;
    weight: number;
    height: number;
    allergies: string;
    dietPreference: string;
    avatarEmoji: string;
    targetGoals: string;
    emergencyContact: string;
    userType: string;
  };
  setUserProfile: (profile: Partial<AppState['userProfile']>) => void;
  profileSetupComplete: boolean;
  setProfileSetupComplete: (complete: boolean) => void;
  profileSetupOpen: boolean;
  setProfileSetupOpen: (open: boolean) => void;
  isTracking: boolean;
  setIsTracking: (tracking: boolean) => void;
  motionFeedback: string;
  setMotionFeedback: (feedback: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'home',
  setActiveSection: (section) => set({ activeSection: section }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  userName: 'Alex',
  setUserName: (name) => set({ userName: name }),
  userProfile: {
    disability: '',
    injuryType: '',
    athleteCategory: '',
    age: 0,
    weight: 0,
    height: 0,
    allergies: '',
    dietPreference: '',
    avatarEmoji: '💪',
    targetGoals: '',
    emergencyContact: '',
    userType: '',
  },
  setUserProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),
  profileSetupComplete: typeof window !== 'undefined' ? localStorage.getItem('adaptifit-profile-complete') === 'true' : false,
  setProfileSetupComplete: (complete) => {
    if (typeof window !== 'undefined') localStorage.setItem('adaptifit-profile-complete', String(complete));
    set({ profileSetupComplete: complete });
  },
  profileSetupOpen: false,
  setProfileSetupOpen: (open) => set({ profileSetupOpen: open }),
  isTracking: false,
  setIsTracking: (tracking) => set({ isTracking: tracking }),
  motionFeedback: '',
  setMotionFeedback: (feedback) => set({ motionFeedback: feedback }),
}));
