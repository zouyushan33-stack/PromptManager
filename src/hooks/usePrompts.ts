import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { User } from '@supabase/supabase-js';

type PromptRow = {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  author_name?: string | null;
};

const formatPrompt = (item: PromptRow): Prompt => ({
  id: item.id,
  title: item.title,
  description: item.description || '',
  content: item.content,
  tags: item.tags || [],
  createdAt: new Date(item.created_at).getTime(),
  updatedAt: new Date(item.updated_at).getTime(),
  userId: item.user_id,
  authorName: item.author_name || 'Anonymous',
});

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch prompts
  useEffect(() => {
    fetchPrompts();
    
    // Subscribe to changes
    const channel = supabase
      .channel('public:prompts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompts' }, payload => {
        fetchPrompts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }
      
      const formattedData = (data || []).map((item) => formatPrompt(item as PromptRow));

      setPrompts(formattedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addPrompt = async (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>) => {
    if (!user) {
      throw new Error('You must be logged in to create a prompt.');
    }
    
    try {
      const now = new Date().toISOString();
      const payload = {
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        tags: prompt.tags,
        created_at: now,
        updated_at: now,
        user_id: user.id,
        author_name: user.user_metadata?.full_name || localStorage.getItem('user_nickname') || 'Anonymous',
      };
      
      const { error } = await supabase
        .from('prompts')
        .insert([payload]);
        
      if (error) throw error;
      await fetchPrompts();
      return true;
    } catch (e: any) {
       console.error("Error creating prompt:", e.message);
       throw new Error(e?.message || 'Failed to create prompt.');
    }
  };

  const updatePrompt = async (id: string, updatedFields: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>>) => {
    if (!user) {
      throw new Error('You must be logged in to update a prompt.');
    }
    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          title: updatedFields.title,
          description: updatedFields.description,
          content: updatedFields.content,
          tags: updatedFields.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (error) throw error;
      await fetchPrompts();
      return true;
    } catch (e: any) {
      console.error("Error updating prompt:", e.message);
      throw new Error(e?.message || 'Failed to update prompt.');
    }
  };

  const deletePrompt = async (id: string) => {
    if (!user) throw new Error("Must be logged in to delete prompt");
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (e: any) {
      console.error("Error deleting prompt:", e.message);
      alert("Failed to delete prompt: " + e.message);
    }
  };

  return {
    prompts,
    user,
    loading,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };
}
