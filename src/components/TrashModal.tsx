import { ArchiveRestore, Trash2, X } from 'lucide-react';
import { Prompt } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

interface TrashModalProps {
  isOpen: boolean;
  prompts: Prompt[];
  onClose: () => void;
  onRestore: (prompt: Prompt) => void;
  onPermanentDelete: (id: string) => void;
}

const categoryLabel = (prompt: Prompt) => (prompt.category === 'research' ? '投研' : '产品');

export function TrashModal({ isOpen, prompts, onClose, onRestore, onPermanentDelete }: TrashModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">回收站</h2>
            <p className="text-sm text-slate-500 mt-1">已删除 Prompt 默认保留 7 天，管理员可恢复或彻底删除。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {prompts.length > 0 ? (
            <div className="space-y-3">
              {prompts.map((prompt) => {
                const remainingDays = Math.max(
                  0,
                  Math.ceil(((prompt.autoDeleteAt || Date.now()) - Date.now()) / DAY_MS)
                );

                return (
                  <div
                    key={prompt.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{prompt.title}</h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
                          {categoryLabel(prompt)}
                        </span>
                      </div>
                      {prompt.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{prompt.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">剩余 {remainingDays} 天后自动删除</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRestore(prompt)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium"
                      >
                        <ArchiveRestore size={16} />
                        恢复
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('确定要彻底删除这个 Prompt 吗？此操作不可恢复。')) {
                            onPermanentDelete(prompt.id);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium"
                      >
                        <Trash2 size={16} />
                        彻底删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
              回收站为空。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
