'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

export function ProjectSwitcher() {
  const { projects, loading, selectedId, selectedProject, setSelectedId } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block w-full sm:w-72" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm hover:border-blue-300 transition-colors"
      >
        <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="flex-1 text-left truncate">
          {loading ? '项目加载中...' : selectedProject ? selectedProject.name : '全部项目'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            onClick={() => { setSelectedId(''); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-blue-50"
          >
            <span className="flex-1 text-left">全部项目</span>
            {!selectedId && <Check className="w-4 h-4 text-blue-600" />}
          </button>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />加载中...
            </div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50"
              >
                <span className="flex-1 text-left truncate">{p.name}</span>
                {p.status && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{p.status}</span>}
                {selectedId === p.id && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}