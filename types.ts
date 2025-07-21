export interface UserProfile {
  fullName?: string;
  professionalTitle?: string;
  skills?: string;
  lastRole?: string;
  education?: string;
}

export type UserProfileKey = keyof UserProfile;

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}