import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Prompt, UserProfile, UserRole } from '../types';
import { User } from '@supabase/supabase-js';

const OWNER_EMAIL = 'zou_yushan@163.com';

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

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole | null;
  created_at: string;
  updated_at: string;
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

const formatProfile = (item: ProfileRow): UserProfile => ({
  id: item.id,
  email: item.email || '',
  displayName: item.display_name || item.email || 'User',
  role: item.role || 'user',
  createdAt: new Date(item.created_at).getTime(),
  updatedAt: new Date(item.updated_at).getTime(),
});

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    fetchProfile(user);
  }, [user?.id]);

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

  const fetchProfile = async (currentUser = user) => {
    if (!currentUser) return null;

    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,display_name,role,created_at,updated_at')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const formattedProfile = formatProfile(data as ProfileRow);
        setProfile(formattedProfile);
        return formattedProfile;
      }

      const fallbackProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        displayName: currentUser.user_metadata?.display_name || currentUser.email || 'User',
        role: currentUser.email?.toLowerCase() === OWNER_EMAIL ? 'owner' : 'user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProfile(fallbackProfile);
      return fallbackProfile;
    } catch (e) {
      console.error('Error fetching profile:', e);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

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
      const authorName = profile?.displayName || user.user_metadata?.display_name || user.email || 'Anonymous';
      const payload = {
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        tags: prompt.tags,
        created_at: now,
        updated_at: now,
        user_id: user.id,
        author_name: authorName,
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
    if (!user) throw new Error('You must be logged in to delete a prompt.');
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      await fetchPrompts();
      return true;
    } catch (e: any) {
      console.error("Error deleting prompt:", e.message);
      alert("Failed to delete prompt: " + e.message);
      return false;
    }
  };

  const role: UserRole = profile?.role || (user?.email?.toLowerCase() === OWNER_EMAIL ? 'owner' : 'user');
  const isOwner = !!user && role === 'owner';
  const isAdmin = !!user && (role === 'admin' || role === 'owner');
  const canManagePrompt = (prompt: Prompt) => !!user && (prompt.userId === user.id || isAdmin);

  return {
    prompts,
    user,
    profile,
    role,
    isAdmin,
    isOwner,
    loading,
    profileLoading,
    canManagePrompt,
    fetchProfile,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };
}
