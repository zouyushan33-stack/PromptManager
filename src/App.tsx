/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { LogIn, LogOut, MessageSquareQuote, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { usePrompts } from './hooks/usePrompts';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { Prompt, PromptCategory, PromptInput, PromptReorderUpdate } from './types';
import { LoginModal } from './components/LoginModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { TrashModal } from './components/TrashModal';
import { supabase } from './lib/supabase';

const categories: Array<{ id: PromptCategory; label: string; helper: string }> = [
  { id: 'research', label: '投研', helper: '行业研究、公司分析、投后跟踪' },
    { id: 'product', label: '产品', helper: '基金产品同业研究、周报撰写、会议纪要' },
];

const normalizeOrder = (items: Prompt[], category: PromptCategory) => {
  let order = 0;
  return items
    .filter((item) => item.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      order += 10;
      return { id: item.id, category, sortOrder: order };
    });
};

export default function App() {
  const {
    prompts,
    trashedPrompts,
    user,
    profile,
    isAdmin,
    isOwner,
    loading,
    canManagePrompt,
    addPrompt,
    updatePrompt,
    movePromptToTrash,
    restorePrompt,
    permanentlyDeletePrompt,
    reorderPrompts,
    fetchTrashPrompts,
  } = usePrompts();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');

  const filteredPrompts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sortedPrompts = [...prompts].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.createdAt - a.createdAt;
    });

    if (!query) return sortedPrompts;

    return sortedPrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [prompts, searchQuery]);

  const groupedPrompts = useMemo(
    () =>
      categories.reduce<Record<PromptCategory, Prompt[]>>(
        (groups, category) => {
          groups[category.id] = filteredPrompts.filter((prompt) => prompt.category === category.id);
          return groups;
        },
        { product: [], research: [] }
      ),
    [filteredPrompts]
  );

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
      alert('请先登录后再上传 Prompt。');
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

  const handleSave = async (promptData: PromptInput) => {
    if (editingPrompt) {
      return updatePrompt(editingPrompt.id, promptData);
    }

    return addPrompt(promptData);
  };

  const openTrash = async () => {
    setIsTrashOpen(true);
    await fetchTrashPrompts();
  };

  const saveOrder = async (updates: PromptReorderUpdate[]) => {
    if (!updates.length) return;

    setOrderStatus('Saving order...');
    try {
      await reorderPrompts(updates);
      setOrderStatus(`Order saved at ${new Date().toLocaleTimeString()}`);
    } catch (error: any) {
      setOrderStatus('');
      alert(error?.message || 'Failed to save prompt order.');
    }
  };

  const movePrompt = (promptId: string, targetCategory: PromptCategory, beforeId: string | null) => {
    if (!isAdmin || promptId === beforeId) return;

    const movingPrompt = prompts.find((prompt) => prompt.id === promptId);
    if (!movingPrompt) return;

    const promptsWithoutMoving = prompts.filter((prompt) => prompt.id !== promptId);
    const targetPrompts = promptsWithoutMoving
      .filter((prompt) => prompt.category === targetCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const insertIndex = beforeId
      ? Math.max(
          0,
          targetPrompts.findIndex((prompt) => prompt.id === beforeId)
        )
      : targetPrompts.length;

    const nextTargetPrompts = [
      ...targetPrompts.slice(0, insertIndex),
      { ...movingPrompt, category: targetCategory },
      ...targetPrompts.slice(insertIndex),
    ].map((prompt, index) => ({ ...prompt, sortOrder: (index + 1) * 10 }));

    const nextTargetIds = new Set(nextTargetPrompts.map((prompt) => prompt.id));
    const untouchedPrompts = promptsWithoutMoving.filter((prompt) => !nextTargetIds.has(prompt.id));
    const nextPrompts = [...untouchedPrompts, ...nextTargetPrompts];
    const updates = [...normalizeOrder(nextPrompts, targetCategory)];

    if (movingPrompt.category !== targetCategory) {
      updates.push(...normalizeOrder(nextPrompts, movingPrompt.category));
    }

    saveOrder(updates);
  };

  const handleMoveToTrash = async (id: string) => {
    if (window.confirm('确定要把这个 Prompt 移入回收站吗？')) {
      await movePromptToTrash(id);
    }
  };

  const handleRestore = async (prompt: Prompt) => {
    try {
      await restorePrompt(prompt);
    } catch (error: any) {
      alert(error?.message || 'Failed to restore prompt.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await permanentlyDeletePrompt(id);
    } catch (error: any) {
      alert(error?.message || 'Failed to permanently delete prompt.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <MessageSquareQuote size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Shared Prompts</h1>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="text-sm font-medium text-slate-600 hidden sm:block">
                    {profile?.displayName || user.email || 'User'}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={openTrash}
                      className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-sm transition-colors"
                      title="回收站"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">回收站</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">
                        {trashedPrompts.length}
                      </span>
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setIsAdminModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-sm transition-colors"
                      title="管理员管理"
                    >
                      <ShieldCheck size={16} />
                      <span className="hidden sm:inline">管理员</span>
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 font-medium">Loading prompts...</div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
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
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'} found
                </span>
                {isAdmin && orderStatus && <span className="text-indigo-600">{orderStatus}</span>}
              </div>
            </div>

            {filteredPrompts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 items-start">
                {categories.map((category) => (
                  <section
                    key={category.id}
                    className="bg-white/60 border border-slate-200 rounded-2xl p-4 sm:p-5 min-h-[260px]"
                    onDragOver={(event) => {
                      if (isAdmin && draggingId) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingId) {
                        movePrompt(draggingId, category.id, null);
                        setDraggingId(null);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{category.label}</h2>
                        <p className="text-sm text-slate-500 mt-1">{category.helper}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {groupedPrompts[category.id].length}
                      </span>
                    </div>

                    {groupedPrompts[category.id].length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedPrompts[category.id].map((prompt) => (
                          <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            canManage={canManagePrompt(prompt)}
                            canDrag={isAdmin}
                            isDragging={draggingId === prompt.id}
                            onEdit={handleEdit}
                            onDelete={handleMoveToTrash}
                            onDragStart={setDraggingId}
                            onDragEnd={() => setDraggingId(null)}
                            onDropBefore={(beforeId) => {
                              if (draggingId) {
                                movePrompt(draggingId, category.id, beforeId);
                                setDraggingId(null);
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400 bg-white">
                        {draggingId ? '拖到这里放入该分类' : '当前分类暂无匹配 Prompt'}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-2xl p-6">
                <MessageSquareQuote size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No prompts found</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {searchQuery
                    ? "We couldn't find any prompts matching your search."
                    : 'There are no shared prompts yet. Start by creating a new one!'}
                </p>
                {!searchQuery &&
                  (user ? (
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
                  ))}
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
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <AdminManagerModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
      <TrashModal
        isOpen={isTrashOpen}
        prompts={trashedPrompts}
        onClose={() => setIsTrashOpen(false)}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
    </div>
  );
}
