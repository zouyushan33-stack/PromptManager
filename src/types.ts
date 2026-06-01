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
