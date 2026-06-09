import { Copy, Edit2, GripVertical, Trash2 } from 'lucide-react';
import { Prompt } from '../types';
import { type Key, useState } from 'react';

interface PromptCardProps {
  key?: Key;
  prompt: Prompt;
  canManage: boolean;
  canDrag?: boolean;
  isDragging?: boolean;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDropBefore?: (id: string) => void;
}

export function PromptCard({
  prompt,
  canManage,
  canDrag = false,
  isDragging = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropBefore,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', prompt.id);
        onDragStart?.(prompt.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (canDrag) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!canDrag) return;
        event.preventDefault();
        onDropBefore?.(prompt.id);
      }}
      className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col h-full transition-all relative ${
        isDragging ? 'opacity-50 border-indigo-300 shadow-md' : 'border-slate-200 hover:shadow-md'
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-start gap-2 min-w-0">
          {canDrag && <GripVertical size={18} className="text-slate-300 mt-1 shrink-0" />}
          <h3 className="font-semibold text-lg text-slate-800 line-clamp-1" title={prompt.title}>
            {prompt.title}
          </h3>
        </div>
        <div className="flex gap-1 -mt-1 -mr-2">
          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Copy Prompt"
          >
            <Copy size={16} />
          </button>
          {canManage && (
            <>
              <button
                onClick={() => onEdit(prompt)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                title="Edit Prompt"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this prompt?')) {
                    onDelete(prompt.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-md transition-colors"
                title="Delete Prompt"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-500 mb-2">
        By {prompt.authorName || 'Anonymous'} · {prompt.category === 'research' ? '投研' : '产品'}
      </div>

      {prompt.description && (
        <div className="text-sm text-slate-600 mb-3 line-clamp-2">
          {prompt.description}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
        {prompt.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="relative flex-grow">
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 h-full overflow-hidden">
           <pre className="text-sm font-mono text-slate-600 whitespace-pre-wrap line-clamp-4 font-normal">
             {prompt.content}
           </pre>
        </div>
      </div>
      
      {copied && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl z-10">
            <span className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Copy size={14} />
              Copied!
            </span>
        </div>
      )}
    </div>
  );
}
