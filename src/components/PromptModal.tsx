import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Prompt, PromptCategory, PromptInput } from '../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: PromptInput) => Promise<boolean | void>;
  editingPrompt: Prompt | null;
}

export function PromptModal({ isOpen, onClose, onSave, editingPrompt }: PromptModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [category, setCategory] = useState<PromptCategory>('research');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPrompt) {
      setTitle(editingPrompt.title);
      setDescription(editingPrompt.description || '');
      setContent(editingPrompt.content);
      setTagsStr(editingPrompt.tags.join(', '));
      setCategory(editingPrompt.category || 'research');
    } else {
      setTitle('');
      setDescription('');
      setContent('');
      setTagsStr('');
      setCategory('research');
    }
    setError(null);
    setSaving(false);
  }, [editingPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || saving) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSaving(true);
    setError(null);

    try {
      const saved = await onSave({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        tags,
        category,
      });

      if (saved !== false) {
        onClose();
      } else {
        setError('Unable to save this prompt. Please check the message above and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to save this prompt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">
            {editingPrompt ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form id="prompt-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code Review Assistant"
                className="w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Use this prompt for code review tasks"
                className="w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="research">投研</option>
                <option value="product">产品</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="e.g., coding, react, review"
                className="w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                Prompt Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your prompt template here..."
                rows={8}
                className="w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm resize-y"
                required
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 focus:outline-none transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="prompt-form"
            disabled={saving || !title.trim() || !content.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {saving ? 'Saving...' : 'Save Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
