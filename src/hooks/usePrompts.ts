import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Prompt, PromptCategory, PromptInput, PromptReorderUpdate, UserProfile, UserRole } from '../types';

const OWNER_EMAIL = 'zou_yushan@163.com';
const TRASH_RETENTION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type PromptRow = {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  tags: string[] | null;
  category?: PromptCategory | null;
  sort_order?: number | null;
  deleted_at?: string | null;
  auto_delete_at?: string | null;
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

const toTime = (value?: string | null) => (value ? new Date(value).getTime() : null);

const formatPrompt = (item: PromptRow): Prompt => ({
  id: item.id,
  title: item.title,
  description: item.description || '',
  content: item.content,
  tags: item.tags || [],
  category: item.category || 'research',
  sortOrder: item.sort_order ?? 0,
  deletedAt: toTime(item.deleted_at),
  autoDeleteAt: toTime(item.auto_delete_at),
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
  const [trashedPrompts, setTrashedPrompts] = useState<Prompt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const role: UserRole = profile?.role || (user?.email?.toLowerCase() === OWNER_EMAIL ? 'owner' : 'user');
  const isOwner = !!user && role === 'owner';
  const isAdmin = !!user && (role === 'admin' || role === 'owner');
  const canManagePrompt = (prompt: Prompt) => !!user && (prompt.userId === user.id || isAdmin);

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
      setTrashedPrompts([]);
      return;
    }

    fetchProfile(user);
  }, [user?.id]);

  useEffect(() => {
    fetchPrompts();

    const channel = supabase
      .channel('public:prompts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompts' }, () => {
        fetchPrompts();
        if (isAdmin) {
          fetchTrashPrompts();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTrashPrompts();
    } else {
      setTrashedPrompts([]);
    }
  }, [isAdmin]);

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
        .is('deleted_at', null)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }

      setPrompts((data || []).map((item) => formatPrompt(item as PromptRow)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredTrash = async () => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .not('deleted_at', 'is', null)
        .lte('auto_delete_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning expired trash:', error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrashPrompts = async () => {
    if (!isAdmin) {
      setTrashedPrompts([]);
      return;
    }

    await cleanupExpiredTrash();

    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .not('deleted_at', 'is', null)
        .gt('auto_delete_at', new Date().toISOString())
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching trash prompts:', error);
        return;
      }

      setTrashedPrompts((data || []).map((item) => formatPrompt(item as PromptRow)));
    } catch (e) {
      console.error(e);
    }
  };

  const getNextSortOrder = (category: PromptCategory) => {
    const categoryPrompts = prompts.filter((prompt) => prompt.category === category);
    return categoryPrompts.reduce((max, prompt) => Math.max(max, prompt.sortOrder || 0), 0) + 10;
  };

  const addPrompt = async (prompt: PromptInput) => {
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
        category: prompt.category,
        sort_order: getNextSortOrder(prompt.category),
        deleted_at: null,
        auto_delete_at: null,
        created_at: now,
        updated_at: now,
        user_id: user.id,
        author_name: authorName,
      };

      const { error } = await supabase.from('prompts').insert([payload]);

      if (error) throw error;
      await fetchPrompts();
      return true;
    } catch (e: any) {
      console.error('Error creating prompt:', e.message);
      throw new Error(e?.message || 'Failed to create prompt.');
    }
  };

  const updatePrompt = async (id: string, updatedFields: Partial<PromptInput>) => {
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
          category: updatedFields.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) throw error;
      await fetchPrompts();
      return true;
    } catch (e: any) {
      console.error('Error updating prompt:', e.message);
      throw new Error(e?.message || 'Failed to update prompt.');
    }
  };

  const movePromptToTrash = async (id: string) => {
    if (!user) throw new Error('You must be logged in to delete a prompt.');

    try {
      const now = new Date();
      const autoDeleteAt = new Date(now.getTime() + TRASH_RETENTION_DAYS * DAY_MS);
      const { error } = await supabase
        .from('prompts')
        .update({
          deleted_at: now.toISOString(),
          auto_delete_at: autoDeleteAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) throw error;
      await fetchPrompts();
      if (isAdmin) await fetchTrashPrompts();
      return true;
    } catch (e: any) {
      console.error('Error moving prompt to trash:', e.message);
      alert('Failed to move prompt to trash: ' + e.message);
      return false;
    }
  };

  const restorePrompt = async (prompt: Prompt) => {
    if (!isAdmin) throw new Error('Only admins can restore prompts.');

    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          deleted_at: null,
          auto_delete_at: null,
          sort_order: getNextSortOrder(prompt.category),
          updated_at: new Date().toISOString(),
        })
        .eq('id', prompt.id);

      if (error) throw error;
      await fetchPrompts();
      await fetchTrashPrompts();
      return true;
    } catch (e: any) {
      console.error('Error restoring prompt:', e.message);
      throw new Error(e?.message || 'Failed to restore prompt.');
    }
  };

  const permanentlyDeletePrompt = async (id: string) => {
    if (!isAdmin) throw new Error('Only admins can permanently delete prompts.');

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);

      if (error) throw error;
      await fetchTrashPrompts();
      return true;
    } catch (e: any) {
      console.error('Error permanently deleting prompt:', e.message);
      throw new Error(e?.message || 'Failed to permanently delete prompt.');
    }
  };

  const reorderPrompts = async (updates: PromptReorderUpdate[]) => {
    if (!isAdmin) throw new Error('Only admins can reorder prompts.');

    try {
      const updatedAt = new Date().toISOString();
      const results = await Promise.all(
        updates.map((item) =>
          supabase
            .from('prompts')
            .update({
              category: item.category,
              sort_order: item.sortOrder,
              updated_at: updatedAt,
            })
            .eq('id', item.id)
            .is('deleted_at', null)
        )
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      await fetchPrompts();
      return true;
    } catch (e: any) {
      console.error('Error reordering prompts:', e.message);
      throw new Error(e?.message || 'Failed to save prompt order.');
    }
  };

  return {
    prompts,
    trashedPrompts,
    user,
    profile,
    role,
    isAdmin,
    isOwner,
    loading,
    profileLoading,
    canManagePrompt,
    fetchProfile,
    fetchPrompts,
    fetchTrashPrompts,
    addPrompt,
    updatePrompt,
    movePromptToTrash,
    restorePrompt,
    permanentlyDeletePrompt,
    reorderPrompts,
  };
}
