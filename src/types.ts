export interface Prompt {
  id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  userId: string;
  authorName?: string;
}

export type UserRole = 'user' | 'admin' | 'owner';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}
