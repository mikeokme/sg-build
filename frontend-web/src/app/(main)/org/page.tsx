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
  type OnNodesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Building2, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Users, Phone, X, Save, UserPlus, GripVertical, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const API_BASE = 'http://localhost:3000';

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

  const levelColors: Record<number, string> = {
    100: 'bg-gradient-to-br from-blue-600 to-blue-800',
    80: 'bg-gradient-to-br from-blue-500 to-blue-700',
    60: 'bg-gradient-to-br from-blue-400 to-blue-600',
    40: 'bg-gradient-to-br from-blue-300 to-blue-500',
  };

  const topLevel = dept.positions?.length > 0
    ? Math.max(...dept.positions.map((p: Position) => p.level))
    : 40;

  return (
    <div className={`rounded-xl shadow-lg border-2 border-white/20 min-w-[220px] ${levelColors[topLevel] || levelColors[40]} text-white`}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 opacity-80" />
          <span className="font-bold text-sm">{dept.name}</span>
        </div>
        {dept.code && <p className="text-[10px] opacity-70 mb-1">{dept.code}</p>}
        {dept.leader && (
          <div className="flex items-center gap-1.5 mt-2 bg-white/10 rounded-lg px-2 py-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
              {dept.leader[0]}
            </div>
            <span className="text-xs">{dept.leader}</span>
          </div>
        )}
        {dept.positions?.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {dept.positions.slice(0, 3).map((p: Position) => (
              <div key={p.id} className="flex items-center gap-1 text-[10px] opacity-80">
                <div className="w-1 h-1 rounded-full bg-white/60" />
                <span>{p.name}</span>
                <span className="opacity-50">L{p.level}</span>
              </div>
            ))}
            {dept.positions.length > 3 && (
              <div className="text-[10px] opacity-60">+{dept.positions.length - 3} more</div>
            )}
          </div>
        )}
      </div>
      <div className="flex border-t border-white/20">
        <button onClick={() => onAdd(dept.id)} className="flex-1 px-2 py-1.5 text-[10px] hover:bg-white/10 rounded-bl-xl transition flex items-center justify-center gap-1">
          <Plus className="w-3 h-3" /> 子部门
        </button>
        <div className="w-px bg-white/20" />
        <button onClick={() => onAddPosition(dept.id)} className="flex-1 px-2 py-1.5 text-[10px] hover:bg-white/10 transition flex items-center justify-center gap-1">
          <UserPlus className="w-3 h-3" /> 岗位
        </button>
        <div className="w-px bg-white/20" />
        <button onClick={() => onEdit(dept)} className="flex-1 px-2 py-1.5 text-[10px] hover:bg-white/10 transition flex items-center justify-center gap-1">
          <Pencil className="w-3 h-3" />
        </button>
        <div className="w-px bg-white/20" />
        <button onClick={() => onDelete(dept)} className="flex-1 px-2 py-1.5 text-[10px] hover:bg-red-500/40 rounded-br-xl transition flex items-center justify-center gap-1">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { department: DepartmentNode };

// ── Layout helper: tree to nodes/edges ──
function layoutTree(departments: Department[], onAdd: any, onEdit: any, onDelete: any, onAddPosition: any): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const NODE_W = 240;
  const NODE_H = 160;
  const H_GAP = 40;
  const V_GAP = 80;

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
      data: { department: dept, onAdd, onEdit, onDelete, onAddPosition },
    });

    if (dept.children && dept.children.length > 0) {
      let childLeft = left;
      for (const child of dept.children) {
        const childX = layout(child, depth + 1, childLeft);
        edges.push({
          id: `${dept.id}-${child.id}`,
          source: dept.id,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
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

  // Dialog states
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [parentDeptId, setParentDeptId] = useState<string | null>(null);
  const [posDialogOpen, setPosDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posDeptId, setPosDeptId] = useState<string>('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

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

  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/org/tree`, { headers });
      if (res.ok) {
        const tree = await res.json();
        setDepartments(tree);
        // 默认展开所有部门
        const allIds = new Set<string>();
        const collect = (list: any[]) => {
          for (const d of list) {
            allIds.add(d.id);
            if (d.children?.length) collect(d.children);
          }
        };
        collect(tree);
        setExpandedDepts(allIds);
      }
    } catch (e) {
      console.error('Failed to fetch org tree', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  // Re-layout when departments or expanded state changes
  useEffect(() => {
    const filtered = search
      ? departments.filter((d) => d.name.includes(search))
      : departments;
    const { nodes: n, edges: e } = layoutTree(filtered, handleAdd, handleEdit, handleDelete, handleAddPosition);
    setNodes(n);
    setEdges(e);
  }, [departments, search]);

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

  // Sidebar department list
  function DeptList({ depts, depth = 0 }: { depts: Department[]; depth?: number }) {
    return (
      <div>
        {depts.map((dept) => (
          <div key={dept.id}>
            <div
              className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {dept.children?.length > 0 ? (
                expandedDepts.has(dept.id) ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              ) : <div className="w-3.5" />}
              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate flex-1" onClick={() => {
                // Center view on this department
              }}>{dept.name}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{dept.positions?.length || 0}</Badge>
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

  const totalPositions = useMemo(() => {
    function count(dept: Department): number {
      let n = dept.positions?.length || 0;
      for (const child of dept.children || []) n += count(child);
      return n;
    }
    return departments.length > 0 ? count(departments[0]) : 0;
  }, [departments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">加载组织架构数据...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Left sidebar: department tree + positions */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">组织架构</h3>
            <Button size="sm" variant="ghost" onClick={() => handleAdd('d1')} className="h-7 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> 新增
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{totalDepts} 部门</span>
            <span>·</span>
            <span>{totalPositions} 岗位</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          <DeptList depts={departments} />
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden relative">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索部门..."
              className="pl-8 h-8 w-48 text-xs"
            />
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Controls className="!bottom-3 !left-3" />
          <Background gap={20} />
        </ReactFlow>
      </div>

      {/* Department dialog */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} title={editingDept ? '编辑部门' : '新增部门'}>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">部门名称 *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="输入部门名称" className="mt-1" />
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
              <Input value={formLeader} onChange={(e) => setFormLeader(e.target.value)} placeholder="部门负责人" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">联系电话</label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="联系电话" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">部门描述</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeptDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={saveDept} disabled={!formName.trim()}>
              <Save className="w-4 h-4 mr-1" /> {editingDept ? '保存' : '创建'}
            </Button>
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
    </div>
  );
}
