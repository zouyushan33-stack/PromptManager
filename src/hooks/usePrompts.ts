import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { User } from '@supabase/supabase-js';

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
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }
      
      const formattedData = (data || []).map(item => ({
        ...item,
        createdAt: new Date(item.createdAt).getTime(),
        updatedAt: new Date(item.updatedAt).getTime()
      }));

      setPrompts(formattedData as Prompt[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addPrompt = async (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>) => {
    if (!user) throw new Error("Must be logged in to create prompt");
    
    try {
      const payload = {
        ...prompt,
        userId: user.id,
        authorName: user.email?.split('@')[0] || 'Anonymous',
      };
      
      const { error } = await supabase
        .from('prompts')
        .insert([payload]);
        
      if (error) throw error;
    } catch (e: any) {
       console.error("Error creating prompt:", e.message);
       alert("Failed to create prompt: " + e.message);
    }
  };

  const updatePrompt = async (id: string, updatedFields: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>>) => {
    if (!user) throw new Error("Must be logged in to update prompt");
    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          ...updatedFields,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
    } catch (e: any) {
      console.error("Error updating prompt:", e.message);
      alert("Failed to update prompt: " + e.message);
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
