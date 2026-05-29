import { Copy, Edit2, Trash2 } from 'lucide-react';
import { Prompt } from '../types';
import { useState } from 'react';

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
}

export function PromptCard({ prompt, onEdit, onDelete }: PromptCardProps) {
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full transition-shadow hover:shadow-md relative">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-slate-800 line-clamp-1" title={prompt.title}>
          {prompt.title}
        </h3>
        <div className="flex gap-1 -mt-1 -mr-2">
          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Copy Prompt"
          >
            <Copy size={16} />
          </button>
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
        </div>
      </div>
      
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
