import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole | null;
  created_at: string;
  updated_at: string;
};

const formatProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  email: row.email || '',
  displayName: row.display_name || row.email || 'User',
  role: row.role || 'user',
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
});

export function AdminManagerModal({ isOpen, onClose }: AdminManagerModalProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id,email,display_name,role,created_at,updated_at')
        .order('email', { ascending: true });

      if (fetchError) throw fetchError;
      setProfiles((data || []).map((row) => formatProfile(row as ProfileRow)));
    } catch (err: any) {
      setError(err?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter(
      (profile) =>
        profile.email.toLowerCase().includes(query) ||
        profile.displayName.toLowerCase().includes(query) ||
        profile.role.includes(query)
    );
  }, [profiles, searchQuery]);

  const updateRole = async (profile: UserProfile, role: Exclude<UserRole, 'owner'>) => {
    setSavingUserId(profile.id);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      await fetchProfiles();
    } catch (err: any) {
      setError(err?.message || 'Unable to update this user.');
    } finally {
      setSavingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">管理人管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="按邮箱、名称或角色搜索"
              className="w-full sm:max-w-sm px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={fetchProfiles}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              刷新
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.3fr_1fr_110px_180px] gap-3 px-4 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <div>用户</div>
              <div className="hidden sm:block">显示名称</div>
              <div className="hidden sm:block">角色</div>
              <div className="text-right">操作</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">正在加载用户...</div>
            ) : filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => {
                const isOwner = profile.role === 'owner';
                const isSaving = savingUserId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.3fr_1fr_110px_180px] gap-3 px-4 py-3 border-t border-slate-100 items-center text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">{profile.email || 'No email'}</div>
                      <div className="sm:hidden text-xs text-slate-500 mt-1">
                        {profile.displayName} · {profile.role}
                      </div>
                    </div>
                    <div className="hidden sm:block text-slate-600 truncate">{profile.displayName}</div>
                    <div className="hidden sm:block">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                        {profile.role}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      {isOwner ? (
                        <span className="text-xs text-slate-400">创始人</span>
                      ) : profile.role === 'admin' ? (
                        <button
                          type="button"
                          onClick={() => updateRole(profile, 'user')}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                          取消管理人
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateRole(profile, 'admin')}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                        >
                          设为管理人
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">没有找到用户</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
