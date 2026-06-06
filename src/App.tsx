/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Plus, Search, MessageSquareQuote, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { usePrompts } from './hooks/usePrompts';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { Prompt } from './types';
import { LoginModal } from './components/LoginModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { supabase } from './lib/supabase';

export default function App() {
  const {
    prompts,
    user,
    profile,
    isOwner,
    loading,
    canManagePrompt,
    addPrompt,
    updatePrompt,
    deletePrompt,
  } = usePrompts();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const query = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [prompts, searchQuery]);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleAddNew = () => {
    if (!user) {
      alert('请先登录后再上传 prompt。');
      setIsLoginModalOpen(true);
      return;
    }
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleSave = async (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>) => {
    if (editingPrompt) {
      return updatePrompt(editingPrompt.id, promptData);
    } else {
      return addPrompt(promptData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <MessageSquareQuote size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Shared Prompts
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="text-sm font-medium text-slate-600 hidden sm:block">
                    {profile?.displayName || user.email || 'User'}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => setIsAdminModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-sm transition-colors"
                      title="管理人管理"
                    >
                      <ShieldCheck size={16} />
                      <span className="hidden sm:inline">管理人</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Log Out"
                  >
                    <LogOut size={18} />
                  </button>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ml-2"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">New</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  <LogIn size={16} />
                  Log In to Create
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 font-medium">Loading prompts...</div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search public prompts by title, tag, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm text-slate-900"
                />
              </div>
              <div className="text-sm text-slate-500 whitespace-nowrap">
                {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'} found
              </div>
            </div>

            {/* Grid */}
            {filteredPrompts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPrompts.map((prompt) => (
                  <div key={prompt.id} className="relative group">
                    <PromptCard
                      prompt={prompt}
                      canManage={canManagePrompt(prompt)}
                      onEdit={handleEdit}
                      onDelete={deletePrompt}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-2xl p-6">
                <MessageSquareQuote size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No prompts found</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {searchQuery 
                    ? "We couldn't find any prompts matching your search." 
                    : "There are no shared prompts yet. Start by creating a new one!"}
                </p>
                {!searchQuery && (
                   user ? (
                     <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                      >
                        <Plus size={16} />
                        Create your first prompt
                      </button>
                   ) : (
                     <button
                        onClick={handleLogin}
                        className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                      >
                        <LogIn size={16} />
                        Log In to create one
                      </button>
                   )
                )}
              </div>
            )}
          </>
        )}
      </main>

      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingPrompt={editingPrompt}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
}
