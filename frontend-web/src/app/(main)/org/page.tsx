// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Building2, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Users, X, Save, UserPlus, Search, LayoutGrid, List,
  UserMinus, UserX, Shield, Crown, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import OrgTreeView from '@/components/OrgTreeView';
import '@/components/OrgTreeView.css';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  leader: string;
  phone: string;
  description: string;
  sortOrder: number;
  children: Department[];
  positions: Position[];
  memberCount?: number;
  members?: Array<{ username: string; name: string; position: string; role: string; isHead?: boolean; isDeputy?: boolean }>;
  directMembers?: Array<{ username: string; name: string; position: string; role: string; isHead?: boolean; isDeputy?: boolean }>;
}

interface Position {
  id: string;
  name: string;
  departmentId: string;
  level: number;
  description: string;
  sortOrder: number;
}

// ── Department Node Component ──
function DepartmentNode({ data }: { data: any }) {
  const dept: Department = data.department;
  const onAdd = data.onAdd;
  const onEdit = data.onEdit;
  const onDelete = data.onDelete;
  const onAddPosition = data.onAddPosition;
  const canManage = data.canManage;
  const [membersExpanded, setMembersExpanded] = useState(false);

  const hasChildren = (dept.children?.length || 0) > 0;
  const hasMembers = (dept.directMembers?.length || 0) > 0;
  const memberCount = dept.directMembers?.length || 0;
  const leaderName = dept.leader || '';
  const leaderInitial = leaderName[0] || '';

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 min-w-[200px] max-w-[240px] hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{dept.name}</div>
            {leaderName && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">
                  {leaderInitial}
                </div>
                <span className="text-[10px] text-gray-500 truncate">{leaderName}</span>
              </div>
            )}
          </div>
          {memberCount > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">{memberCount}人</Badge>
          )}
        </div>
      </div>

      {/* Positions */}
      {dept.positions && dept.positions.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-50">
          <div className="space-y-0.5">
            {dept.positions.slice(0, 3).map((p: Position) => (
              <div key={p.id} className="flex items-center gap-1 text-[10px] text-gray-500">
                <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                <span className="truncate">{p.name}</span>
                <span className="text-gray-400 ml-auto shrink-0">L{p.level}</span>
              </div>
            ))}
            {dept.positions.length > 3 && (
              <div className="text-[10px] text-gray-400">+{dept.positions.length - 3} 岗位</div>
            )}
          </div>
        </div>
      )}

      {/* Members section */}
      {hasMembers && (
        <div className="px-3 py-2 border-b border-gray-50">
          <button
            onClick={(e) => { e.stopPropagation(); setMembersExpanded(!membersExpanded); }}
            className="flex items-center gap-1.5 w-full text-[10px] text-gray-500 hover:text-gray-700 transition"
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${membersExpanded ? 'rotate-90' : ''}`} />
            <Users className="w-3 h-3" />
            <span>本级人员 ({memberCount})</span>
          </button>
          {membersExpanded && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {dept.directMembers!.slice(0, 12).map((m: any) => (
                <div key={m.username} className="flex items-center gap-1 bg-gray-50 rounded-full px-1.5 py-0.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${m.isHead ? 'bg-amber-400 text-amber-900' : m.isDeputy ? 'bg-blue-300 text-blue-900' : 'bg-gray-200 text-gray-600'}`}>
                    {m.name?.[0] || 'U'}
                  </div>
                  <span className="text-[9px] text-gray-600">{m.name}</span>
                </div>
              ))}
              {dept.directMembers!.length > 12 && (
                <div className="text-[9px] text-gray-400 self-center">+{dept.directMembers!.length - 12}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons（权限：一般管理员及以上可操作） */}
      <div className="flex border-t border-gray-100">
        <button disabled={!canManage} onClick={() => onAdd(dept.id)} className={`flex-1 px-2 py-1.5 text-[10px] transition flex items-center justify-center gap-1 ${canManage ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}>
          <Plus className="w-3 h-3" /> 子部门
        </button>
        <div className="w-px bg-gray-100" />
        <button disabled={!canManage} onClick={() => onAddPosition(dept.id)} className={`flex-1 px-2 py-1.5 text-[10px] transition flex items-center justify-center gap-1 ${canManage ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}>
          <UserPlus className="w-3 h-3" /> 岗位
        </button>
        <div className="w-px bg-gray-100" />
        <button disabled={!canManage} onClick={() => onEdit(dept)} className={`flex-1 px-2 py-1.5 text-[10px] transition flex items-center justify-center ${canManage ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}>
          <Pencil className="w-3 h-3" />
        </button>
        <div className="w-px bg-gray-100" />
        <button disabled={!canManage} onClick={() => onDelete(dept)} className={`flex-1 px-2 py-1.5 text-[10px] transition flex items-center justify-center ${canManage ? 'text-gray-500 hover:bg-red-50 hover:text-red-600' : 'text-gray-300 cursor-not-allowed'}`}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { department: DepartmentNode };

// ── Layout helper: tree to nodes/edges with management labels ──
function layoutTree(departments: Department[], onAdd: any, onEdit: any, onDelete: any, onAddPosition: any, canManage?: boolean): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const NODE_W = 220;
  const NODE_H = 180;
  const H_GAP = 30;
  const V_GAP = 60;

  function subtreeWidth(dept: Department): number {
    if (!dept.children || dept.children.length === 0) return NODE_W;
    let w = 0;
    for (const child of dept.children) {
      w += subtreeWidth(child);
    }
    w += (dept.children.length - 1) * H_GAP;
    return Math.max(NODE_W, w);
  }

  function layout(dept: Department, depth: number, left: number): number {
    const x = left + subtreeWidth(dept) / 2 - NODE_W / 2;
    const y = depth * (NODE_H + V_GAP);

    nodes.push({
      id: dept.id,
      type: 'department',
      position: { x, y },
      data: { department: dept, onAdd, onEdit, onDelete, onAddPosition, canManage },
    });

    if (dept.children && dept.children.length > 0) {
      let childLeft = left;
      for (const child of dept.children) {
        layout(child, depth + 1, childLeft);
        edges.push({
          id: `${dept.id}-${child.id}`,
          source: dept.id,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
          label: '管理',
          labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 12, height: 12 },
        });
        childLeft += subtreeWidth(child) + H_GAP;
      }
    }

    return x + NODE_W / 2;
  }

  if (departments.length > 0) {
    layout(departments[0], 0, 0);
  }

  return { nodes, edges };
}

// ── Dialog Component ──
function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function OrgChartPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'members'>('chart');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'flow' | 'tree'>('tree');
  const [horizontal, setHorizontal] = useState(false);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberAction, setMemberAction] = useState<any>(null);

  // Dialog states
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [parentDeptId, setParentDeptId] = useState<string | null>(null);
  const [posDialogOpen, setPosDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posDeptId, setPosDeptId] = useState<string>('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberSelected, setAddMemberSelected] = useState<Set<string>>(new Set());
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [moveDept, setMoveDept] = useState<Department | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLeader, setFormLeader] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSort, setFormSort] = useState(0);
  const [formLevel, setFormLevel] = useState(40);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const currentUser = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })() : {};
  const canManageOrg = ['super_admin', 'high_admin', 'general_admin'].includes(currentUser?.role) || currentUser?.isHead;

  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/org/tree`, { headers });
      if (res.ok) {
        const tree = await res.json();
        setDepartments(tree);
      }
    } catch (e) {
      console.error('Failed to fetch org tree', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setMemberLoading(true);
    try {
      const res = await fetch(`${API_BASE}/org/members`, { headers });
      if (res.ok) {
        const list = await res.json();
        setAllMembers(list);
      }
    } catch {}
    setMemberLoading(false);
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);
  const filteredForTree = useMemo(() => {
    if (!search) return departments;
    const term = search.trim();
    function filter(list: Department[]): Department[] {
      const out: Department[] = [];
      for (const d of list) {
        const childFiltered = d.children ? filter(d.children) : [];
        if (d.name.includes(term) || childFiltered.length > 0) {
          out.push({ ...d, children: childFiltered });
        }
      }
      return out;
    }
    return filter(departments);
  }, [departments, search]);
  useEffect(() => {
    const filtered = search
      ? departments.filter((d) => d.name.includes(search))
      : departments;
    const { nodes: n, edges: e } = layoutTree(filtered, handleAdd, handleEdit, handleDelete, handleAddPosition, canManageOrg);
    setNodes(n);
    setEdges(e);
  }, [departments, search, canManageOrg]);

  function handleAdd(parentId: string) {
    setEditingDept(null);
    setParentDeptId(parentId);
    setFormName('');
    setFormCode('');
    setFormLeader('');
    setFormPhone('');
    setFormDesc('');
    setFormSort(0);
    setDeptDialogOpen(true);
  }

  function handleEdit(dept: Department) {
    setEditingDept(dept);
    setParentDeptId(dept.parentId);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormLeader(dept.leader);
    setFormPhone(dept.phone);
    setFormDesc(dept.description);
    setFormSort(dept.sortOrder);
    setDeptDialogOpen(true);
  }

  async function handleDelete(dept: Department) {
    if (!confirm(`确认删除「${dept.name}」及其所有子部门和岗位？`)) return;
    try {
      const res = await fetch(`${API_BASE}/org/departments/${dept.id}`, { method: 'DELETE', headers });
      if (res.ok) fetchTree();
    } catch {}
  }

  function handleAddPosition(deptId: string) {
    setEditingPos(null);
    setPosDeptId(deptId);
    setFormName('');
    setFormLevel(40);
    setFormDesc('');
    setFormSort(0);
    setPosDialogOpen(true);
  }

  function handleEditPos(pos: Position) {
    setEditingPos(pos);
    setPosDeptId(pos.departmentId);
    setFormName(pos.name);
    setFormLevel(pos.level);
    setFormDesc(pos.description);
    setFormSort(pos.sortOrder);
    setPosDialogOpen(true);
  }

  async function handleDeletePos(pos: Position) {
    if (!confirm(`确认删除岗位「${pos.name}」？`)) return;
    try {
      const res = await fetch(`${API_BASE}/org/positions/${pos.id}`, { method: 'DELETE', headers });
      if (res.ok) fetchTree();
    } catch {}
  }

  // 扁平化部门列表（用于父部门下拉 & 移动）
  const flatDeptList = useMemo(() => {
    const out: Array<{ id: string; name: string; depth: number }> = [];
    function walk(list: Department[], depth: number) {
      const sorted = [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      for (const d of sorted) {
        out.push({ id: d.id, name: d.name, depth });
        if (d.children?.length) walk(d.children, depth + 1);
      }
    }
    walk(departments, 0);
    return out;
  }, [departments]);

  function getDescendantIdsForMove(dept: Department): Set<string> {
    const s = new Set<string>();
    function walk(d: Department) { s.add(d.id); (d.children || []).forEach(walk); }
    walk(dept);
    return s;
  }

  async function handleMoveConfirm() {
    if (!moveDept) return;
    try {
      const res = await fetch(`${API_BASE}/org/departments/${moveDept.id}/move`, { method: 'PUT', headers, body: JSON.stringify({ parentId: moveTargetId }) });
      if (res.ok) { setMoveDialogOpen(false); setMoveDept(null); setMoveTargetId(null); fetchTree(); }
      else { const t = await res.text(); alert('移动失败: ' + t); }
    } catch {}
  }

  async function saveDept() {
    const body = {
      name: formName,
      code: formCode,
      parentId: parentDeptId,
      leader: formLeader,
      phone: formPhone,
      description: formDesc,
      sortOrder: formSort,
    };
    try {
      if (editingDept) {
        await fetch(`${API_BASE}/org/departments/${editingDept.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_BASE}/org/departments`, { method: 'POST', headers, body: JSON.stringify(body) });
      }
      setDeptDialogOpen(false);
      fetchTree();
    } catch {}
  }

  async function savePos() {
    const body = {
      name: formName,
      departmentId: posDeptId,
      level: formLevel,
      description: formDesc,
      sortOrder: formSort,
    };
    try {
      if (editingPos) {
        await fetch(`${API_BASE}/org/positions/${editingPos.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_BASE}/org/positions`, { method: 'POST', headers, body: JSON.stringify(body) });
      }
      setPosDialogOpen(false);
      fetchTree();
    } catch {}
  }

  // Find selected dept for members tab
  const selectedDept = useMemo(() => {
    if (!selectedDeptId) return departments[0] || null;
    function find(depts: Department[]): Department | null {
      for (const d of depts) {
        if (d.id === selectedDeptId) return d;
        const found = find(d.children || []);
        if (found) return found;
      }
      return null;
    }
    return find(departments);
  }, [departments, selectedDeptId]);

  // ── 成员管理 ──
  const updateMember = async (username: string, patch: any) => {
    setMemberAction(username);
    try {
      const res = await fetch(`${API_BASE}/org/members/${encodeURIComponent(username)}`, {
        method: 'PUT', headers, body: JSON.stringify(patch),
      });
      if (res.ok) {
        await fetchMembers();
        await fetchTree();
      }
    } catch {}
    setMemberAction(null);
  };

  const moveMemberToDept = async (username: string, deptId: string) => {
    const dept = findDeptById(departments, deptId);
    if (!dept) return;
    await updateMember(username, { department: dept.name });
  };

  const toggleMemberActive = async (m: any) => {
    if (!confirm(`确认${m.isActive === false ? '启用' : '停用'}「${m.name || m.username}」？停用后将自动退出所有部门群`)) return;
    await updateMember(m.username, { isActive: !(m.isActive === false) });
  };

  const openAddMember = () => {
    setAddMemberOpen(true);
    setAddMemberSearch('');
    setAddMemberSelected(new Set());
    fetchMembers();
  };

  const confirmAddMembers = async () => {
    if (!selectedDept || addMemberSelected.size === 0) return;
    for (const username of Array.from(addMemberSelected)) {
      await updateMember(username, { department: selectedDept.name });
    }
    setAddMemberOpen(false);
  };

  const unassignedMembers = useMemo(() => {
    const q = addMemberSearch.trim().toLowerCase();
    return allMembers
      .filter((m) => !m.department || m.department === '')
      .filter((m) => !q || m.username?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q));
  }, [allMembers, addMemberSearch]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!selectedDept) return [];
    return (selectedDept.directMembers || []).filter((m: any) =>
      !q || m.username?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q));
  }, [selectedDept, memberSearch]);

  function findDeptById(depts: Department[], id: string): Department | null {
    for (const d of depts) {
      if (d.id === id) return d;
      const found = findDeptById(d.children || [], id);
      if (found) return found;
    }
    return null;
  }

  // Sidebar department list（按 sortOrder 排序，hover 显示移动/编辑快捷入口）
  function DeptList({ depts, depth = 0 }: { depts: Department[]; depth?: number }) {
    const sorted = [...depts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return (
      <div>
        {sorted.map((dept) => (
          <div key={dept.id}>
            <div
              className={`group flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors ${
                selectedDeptId === dept.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => {
                setSelectedDeptId(dept.id);
                setExpandedDepts((prev) => {
                  const next = new Set(prev);
                  if (next.has(dept.id)) next.delete(dept.id);
                  else next.add(dept.id);
                  return next;
                });
              }}
            >
              {(dept.children?.length || 0) > 0 ? (
                expandedDepts.has(dept.id) ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              ) : <div className="w-3.5" />}
              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate flex-1">{dept.name}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{dept.memberCount || 0}</Badge>
              {canManageOrg && dept.id !== 'group' && (
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button onClick={(e) => { e.stopPropagation(); setMoveDept(dept); setMoveTargetId(dept.parentId); setMoveDialogOpen(true); }} className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-gray-400 hover:text-blue-600" title="移动部门"><LayoutGrid className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(dept); }} className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-gray-400 hover:text-amber-600" title="编辑"><Pencil className="w-3 h-3" /></button>
                </div>
              )}
            </div>
            {expandedDepts.has(dept.id) && dept.children?.length > 0 && (
              <DeptList depts={dept.children} depth={depth + 1} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const totalDepts = useMemo(() => {
    function count(depts: Department[]): number {
      let n = depts.length;
      for (const d of depts) n += count(d.children || []);
      return n;
    }
    return count(departments);
  }, [departments]);

  const totalMembers = departments.length > 0 ? departments[0].memberCount || 0 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">加载组织架构数据...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-gray-50">
      {/* Left sidebar: Lark-style department tree */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-gray-900">组织架构</h3>
            {canManageOrg && <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">可管理</Badge>}
            {!canManageOrg && <Badge variant="secondary" className="text-[10px]">只读</Badge>}
          </div>
          <div className="text-xs text-gray-500">
            共 {totalDepts} 个部门 · {totalMembers} 人
          </div>
          <div className="text-[10px] text-gray-400 mt-1">总经办 · 分公司/子公司/号码公司已分组 · 项目部直属集团</div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          <DeptList depts={departments} />
        </div>
        <div className="p-3 border-t border-gray-100">
          <Button size="sm" variant="outline" onClick={() => handleAdd('group')} disabled={!canManageOrg} className="w-full text-xs h-8">
            <Plus className="w-3.5 h-3.5 mr-1" /> 新建部门 {canManageOrg ? '' : '(需管理员权限)'}
          </Button>
          {!canManageOrg && <div className="text-[10px] text-gray-400 mt-1 text-center">已开放查看，增删改需管理员/部门负责人权限</div>}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with tabs */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>组织架构</span>
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-medium">成员与部门</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('chart')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chart'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5 inline" />
              图示
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4 mr-1.5 inline" />
              部门成员
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chart' ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索部门..." className="pl-8 h-8 w-48 text-xs bg-white" />
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">参考 react-org-tree：可折叠·横/纵切换·一键展开</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={chartView === 'tree' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setChartView('tree')}>组织树</Button>
                  <Button size="sm" variant={chartView === 'flow' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setChartView('flow')}>流程图</Button>
                  {chartView === 'tree' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setHorizontal((v) => !v)}>{horizontal ? '纵向' : '横向'}</Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-50">
                {chartView === 'flow' ? (
                  <div className="h-full relative">
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }} minZoom={0.2} maxZoom={2} proOptions={{ hideAttribution: true }}>
                      <Controls className="!bottom-3 !left-3 !bg-white !shadow-md !rounded-lg !border !border-gray-200" />
                      <Background gap={20} color="#f1f5f9" />
                    </ReactFlow>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* @ts-ignore */} <OrgTreeView data={departments as any} horizontal={horizontal} collapsable={true} expandAll={true} selectedId={selectedDeptId} canManage={canManageOrg} onSelect={(d) => setSelectedDeptId(d.id)} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onAddPosition={handleAddPosition} onMove={(d) => { setMoveDept(d); setMoveTargetId(d.parentId); setMoveDialogOpen(true); }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Members list tab */
            <div className="h-full overflow-auto p-6">
              {selectedDept ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{selectedDept.name}</h3>
                      <p className="text-xs text-gray-500">{selectedDept.directMembers?.length || 0} 名直属成员 · 部门群成员自动同步</p>
                    </div>
                    <Button size="sm" className="text-xs h-8" onClick={openAddMember}>
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> 添加成员
                    </Button>
                  </div>
                  <div className="relative mb-3 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="搜索部门成员..." className="pl-8 h-8 text-xs" />
                  </div>
                  {filteredMembers.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">姓名</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">职位</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">角色</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">状态</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((m: any) => (
                            <tr key={m.username} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    m.isHead ? 'bg-amber-100 text-amber-700' : m.isDeputy ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {m.name?.[0] || 'U'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{m.name}</div>
                                    <div className="text-xs text-gray-500">{m.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{m.position || '-'}</td>
                              <td className="px-4 py-3">
                                {m.isHead && <Badge className="bg-amber-100 text-amber-700 text-[10px]">负责人</Badge>}
                                {m.isDeputy && <Badge className="bg-blue-100 text-blue-700 text-[10px]">副职</Badge>}
                                {!m.isHead && !m.isDeputy && <span className="text-xs text-gray-400">-</span>}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={m.isActive === false ? 'bg-red-100 text-red-700 text-[10px]' : 'bg-emerald-100 text-emerald-700 text-[10px]'}>
                                  {m.isActive === false ? '已停用' : '正常'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-amber-600 hover:bg-amber-50"
                                    onClick={() => updateMember(m.username, { isHead: !m.isHead, isDeputy: m.isHead ? m.isDeputy : false })}
                                    disabled={memberAction === m.username} title="设/取消负责人">
                                    <Crown className="w-3.5 h-3.5 mr-1" />{m.isHead ? '取消负责人' : '设负责人'}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-blue-600 hover:bg-blue-50"
                                    onClick={() => updateMember(m.username, { isDeputy: !m.isDeputy, isHead: m.isDeputy ? m.isHead : m.isHead })}
                                    disabled={memberAction === m.username} title="设/取消副职">
                                    <Shield className="w-3.5 h-3.5 mr-1" />{m.isDeputy ? '取消副职' : '设副职'}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-gray-500 hover:bg-gray-100"
                                    onClick={() => updateMember(m.username, { department: '' })}
                                    disabled={memberAction === m.username} title="移出本部门">
                                    <UserMinus className="w-3.5 h-3.5 mr-1" />移出
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-red-600 hover:bg-red-50"
                                    onClick={() => toggleMemberActive(m)}
                                    disabled={memberAction === m.username} title={m.isActive === false ? '启用' : '停用'}>
                                    <UserX className="w-3.5 h-3.5 mr-1" />{m.isActive === false ? '启用' : '停用'}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">该部门暂无直属成员</div>
                  )}
                  {selectedDept.children && selectedDept.children.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">下级部门</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedDept.children.map((child) => (
                          <div key={child.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDeptId(child.id)}>
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-900">{child.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">{child.directMembers?.length || 0} 名直属成员</div>
                            {child.leader && (
                              <div className="flex items-center gap-1 mt-2">
                                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">
                                  {child.leader[0]}
                                </div>
                                <span className="text-[10px] text-gray-500">{child.leader}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">请在左侧选择一个部门</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Department dialog（含上级部门选择，可实现架构调整/拖拽平替） */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} title={editingDept ? '编辑部门' : '新增部门'}>
        <div className="space-y-3">
          {!canManageOrg && <div className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">当前身份为 {currentUser?.role || '未知'}，仅超级/高级/一般管理员及部门负责人可调整架构</div>}
          <div>
            <label className="text-sm font-medium">部门名称 *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="输入部门名称" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">上级部门</label>
            <select value={parentDeptId ?? ''} onChange={(e) => setParentDeptId(e.target.value || null)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">— 顶级（直属集团）—</option>
              {flatDeptList.filter(o => !editingDept || (o.id !== editingDept.id && !getDescendantIdsForMove(editingDept).has(o.id))).map(o => (
                <option key={o.id} value={o.id}>{'—'.repeat(o.depth)} {o.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">可将 副总C/分公司/项目部 等拖至新的上级，实现架构调整</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">部门编码</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="如: ENG" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">排序</label>
              <Input type="number" value={formSort} onChange={(e) => setFormSort(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">负责人</label>
              <select value={formLeader} onChange={(e) => setFormLeader(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">— 不设置 —</option>
                {(editingDept ? (editingDept.directMembers || []) : []).map((m: any) => (
                  <option key={m.username} value={m.username}>{m.name || m.username}</option>
                ))}
                {allMembers.filter((m) => m.isHead === true && (editingDept?.directMembers || []).every((d: any) => d.username !== m.username)).map((m) => (
                  <option key={m.username} value={m.username}>{m.name || m.username}（负责人）</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">负责人将自动成为部门群群主</p>
            </div>
            <div>
              <label className="text-sm font-medium">联系电话</label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="联系电话" className="mt-1" />
            </div>
          </div>
          {!editingDept && (
            <p className="text-[11px] text-blue-600 bg-blue-50 rounded-md px-3 py-2">新建部门将自动创建部门群，并与部门成员实时同步（钉钉/飞书式联动）</p>
          )}
          <div>
            <label className="text-sm font-medium">部门描述</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeptDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={saveDept} disabled={!formName.trim() || !canManageOrg}>
              <Save className="w-4 h-4 mr-1" /> {editingDept ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Move dialog（快速调整架构） */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} title={`移动「${moveDept?.name || ''}」`}>
        <div className="space-y-3">
          <p className="text-xs text-gray-500">选择新的上级部门，保存后立即生效并同步部门群</p>
          <div>
            <label className="text-sm font-medium">新的上级</label>
            <select value={moveTargetId ?? ''} onChange={(e) => setMoveTargetId(e.target.value || null)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">— 顶级（直属集团）—</option>
              {flatDeptList.filter(o => !moveDept || (o.id !== moveDept.id && !getDescendantIdsForMove(moveDept).has(o.id))).map(o => (
                <option key={o.id} value={o.id}>{'—'.repeat(o.depth)} {o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setMoveDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleMoveConfirm} disabled={!canManageOrg}><Save className="w-4 h-4 mr-1" /> 确认移动</Button>
          </div>
        </div>
      </Dialog>

      {/* Position dialog */}
      <Dialog open={posDialogOpen} onClose={() => setPosDialogOpen(false)} title={editingPos ? '编辑岗位' : '新增岗位'}>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">岗位名称 *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="输入岗位名称" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">权限级别</label>
            <select value={formLevel} onChange={(e) => setFormLevel(Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value={100}>100 - 超级管理员</option>
              <option value={80}>80 - 高权限管理员</option>
              <option value={60}>60 - 一般管理员</option>
              <option value={40}>40 - 普通职工</option>
              <option value={10}>10 - 外协人员</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">岗位描述</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPosDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={savePos} disabled={!formName.trim()}>
              <Save className="w-4 h-4 mr-1" /> {editingPos ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title={`添加成员到「${selectedDept?.name || ''}」`}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={addMemberSearch} onChange={(e) => setAddMemberSearch(e.target.value)} placeholder="搜索未分配部门成员..." className="pl-8 h-9 text-sm" />
          </div>
          {memberLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : unassignedMembers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">暂无未分配部门的成员</div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {unassignedMembers.map((m) => (
                <label key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  addMemberSelected.has(m.username) ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                  <input type="checkbox" className="w-4 h-4 accent-blue-600"
                    checked={addMemberSelected.has(m.username)}
                    onChange={(e) => {
                      const next = new Set(addMemberSelected);
                      if (e.target.checked) next.add(m.username);
                      else next.delete(m.username);
                      setAddMemberSelected(next);
                    }} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    m.isHead ? 'bg-amber-100 text-amber-700' : m.isDeputy ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>{m.name?.[0] || m.username?.[0] || 'U'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{m.name || m.username}</div>
                    <div className="text-xs text-gray-500 truncate">{m.username} · {m.position || '无岗位'}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setAddMemberOpen(false)}>取消</Button>
            <Button size="sm" onClick={confirmAddMembers} disabled={addMemberSelected.size === 0}>
              <UserPlus className="w-4 h-4 mr-1" /> 添加 {addMemberSelected.size} 人
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
