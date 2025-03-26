
import { Session, User } from "@supabase/supabase-js";

export interface ProfileType {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
  updated_at: string | null;
  created_at: string;
  email: string | null;
  is_public: boolean;
  // Add the missing fields that are being used
  headline: string | null;
  location: string | null;
  language: string | null;
  timezone: string | null;
}

export interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: ProfileType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: any }>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: any }>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  updateProfile: (updates: Partial<ProfileType>) => Promise<{ success: boolean; profile?: ProfileType; error?: any }>;
  refreshSession?: () => Promise<boolean>;
  attemptSessionRecovery?: () => Promise<boolean>;
}

export type AuthActionType = 
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROFILE'; payload: ProfileType | null };
