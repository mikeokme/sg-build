'use client';
import React, { useState, useCallback } from 'react';

interface Dept {
  id: string;
  name: string;
  code?: string;
  leader?: string;
  memberCount?: number;
  children: Dept[];
  directMembers?: any[];
  positions?: any[];
  sortOrder?: number;
}

interface Props {
  data: Dept[];
  horizontal?: boolean;
  collapsable?: boolean;
  expandAll?: boolean;
  onSelect?: (dept: Dept) => void;
  onAdd?: (id: string) => void;
  onEdit?: (dept: Dept) => void;
  onDelete?: (dept: Dept) => void;
  onAddPosition?: (id: string) => void;
  onMove?: (dept: Dept) => void;
  canManage?: boolean;
  selectedId?: string | null;
}

function DeptCard({ dept, selected, canManage, onSelect, onAdd, onEdit, onDelete, onAddPosition, onMove }: any) {
  const hasChildren = (dept.children?.length || 0) > 0;
  return (
    <div
      onClick={() => onSelect?.(dept)}
      className={`bg-white rounded-lg shadow-sm border min-w-[180px] max-w-[210px] cursor-pointer hover:shadow-md transition-all ${selected ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200'}`}
    >
      <div className="px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center shrink-0">🏢</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">{dept.name}</div>
            {dept.leader && <div className="text-[10px] text-gray-500 truncate">负责人: {dept.leader}</div>}
          </div>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">{dept.memberCount ?? 0}人</span>
        </div>
        {dept.code && <div className="text-[9px] text-gray-400 mt-1">{dept.code}</div>}
      </div>
      {canManage && (
        <div className="flex border-t border-gray-100 text-[10px]">
          <button onClick={(e) => { e.stopPropagation(); onAdd?.(dept.id); }} className="flex-1 py-1 hover:bg-gray-50">＋子部门</button>
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(dept); }} className="flex-1 py-1 hover:bg-gray-50 border-l">编辑</button>
          <button onClick={(e) => { e.stopPropagation(); onMove?.(dept); }} className="flex-1 py-1 hover:bg-gray-50 border-l">移动</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(dept); }} className="flex-1 py-1 hover:bg-red-50 hover:text-red-600 border-l">删除</button>
        </div>
      )}
    </div>
  );
}

function TreeNode({ dept, horizontal, collapsable, canManage, selectedId, onSelect, onAdd, onEdit, onDelete, onAddPosition, onMove, expandedMap, toggle }: any) {
  const hasChildren = (dept.children?.length || 0) > 0;
  const isExpanded = expandedMap.has(dept.id) ? expandedMap.get(dept.id) : true;
  const collapsed = collapsable && hasChildren && !isExpanded;

  return (
    <div className={`org-tree-node ${hasChildren ? '' : 'is-leaf'} ${collapsed ? 'collapsed' : ''}`}>
      <div className="org-tree-node-label">
        <div className="org-tree-node-label-inner">
          <DeptCard dept={dept} selected={selectedId === dept.id} canManage={canManage} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onAddPosition={onAddPosition} onMove={onMove} />
          {collapsable && hasChildren && (
            <span className={`org-tree-node-btn ${isExpanded ? 'expanded' : ''}`} onClick={(e) => { e.stopPropagation(); toggle(dept.id); }} />
          )}
        </div>
      </div>
      {hasChildren && (!collapsable || isExpanded) && (
        <div className="org-tree-node-children">
          {dept.children.map((child: Dept) => (
            <TreeNode key={child.id} dept={child} horizontal={horizontal} collapsable={collapsable} canManage={canManage} selectedId={selectedId} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onAddPosition={onAddPosition} onMove={onMove} expandedMap={expandedMap} toggle={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgTreeView({ data, horizontal = false, collapsable = true, expandAll = true, onSelect, onAdd, onEdit, onDelete, onAddPosition, onMove, canManage, selectedId }: Props) {
  const [expandedMap, setExpandedMap] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    const walk = (list: Dept[], val: boolean) => { for (const d of list) { m.set(d.id, val); if (d.children?.length) walk(d.children, val); } };
    if (data?.length) walk(data, !!expandAll);
    return m;
  });

  const toggle = useCallback((id: string) => {
    setExpandedMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      const nv = cur === undefined ? false : !cur;
      next.set(id, nv);
      return next;
    });
  }, []);

  const setAll = (val: boolean) => {
    const m = new Map<string, boolean>();
    const walk = (list: Dept[]) => { for (const d of list) { m.set(d.id, val); if (d.children?.length) walk(d.children); } };
    walk(data);
    setExpandedMap(m);
  };

  if (!data || data.length === 0) return <div className="text-sm text-gray-400 p-8 text-center">暂无组织架构数据</div>;

  return (
    <div className="org-tree-container">
      <div className="flex gap-2 mb-2 justify-end">
        <button onClick={() => setAll(true)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">全部展开</button>
        <button onClick={() => setAll(false)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">全部折叠</button>
      </div>
      <div className={`org-tree ${horizontal ? 'horizontal' : ''} ${collapsable ? 'collapsable' : ''}`}>
        {data.map((root) => (
          <TreeNode key={root.id} dept={root} horizontal={horizontal} collapsable={collapsable} canManage={canManage} selectedId={selectedId} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onAddPosition={onAddPosition} onMove={onMove} expandedMap={expandedMap} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}
