export type PromptCategory = 'product' | 'research';

export interface Prompt {
  id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  category: PromptCategory;
  sortOrder: number;
  deletedAt?: number | null;
  autoDeleteAt?: number | null;
  createdAt: number;
  updatedAt: number;
  userId: string;
  authorName?: string;
}

export interface PromptInput {
  title: string;
  description?: string;
  content: string;
  tags: string[];
  category: PromptCategory;
}

export interface PromptReorderUpdate {
  id: string;
  category: PromptCategory;
  sortOrder: number;
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
