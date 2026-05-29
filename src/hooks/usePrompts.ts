import { useState, useEffect } from 'react';
import { Prompt } from '../types';

const STORAGE_KEY = 'prompt-manager-data';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPrompts(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse prompts from local storage', e);
      }
    }
  }, []);

  const savePrompts = (newPrompts: Prompt[]) => {
    setPrompts(newPrompts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrompts));
  };

  const addPrompt = (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPrompt: Prompt = {
      ...prompt,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    savePrompts([newPrompt, ...prompts]);
  };

  const updatePrompt = (id: string, updatedFields: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>>) => {
    savePrompts(
      prompts.map((p) =>
        p.id === id
          ? { ...p, ...updatedFields, updatedAt: Date.now() }
          : p
      )
    );
  };

  const deletePrompt = (id: string) => {
    savePrompts(prompts.filter((p) => p.id !== id));
  };

  return {
    prompts,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };
}
