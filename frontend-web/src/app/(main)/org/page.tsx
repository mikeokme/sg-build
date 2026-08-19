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

      {/* Action buttons */}
      <div className="flex border-t border-gray-100">
        <button onClick={() => onAdd(dept.id)} className="flex-1 px-2 py-1.5 text-[10px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition flex items-center justify-center gap-1">
          <Plus className="w-3 h-3" /> 子部门
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onAddPosition(dept.id)} className="flex-1 px-2 py-1.5 text-[10px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition flex items-center justify-center gap-1">
          <UserPlus className="w-3 h-3" /> 岗位
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onEdit(dept)} className="flex-1 px-2 py-1.5 text-[10px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition flex items-center justify-center">
          <Pencil className="w-3 h-3" />
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onDelete(dept)} className="flex-1 px-2 py-1.5 text-[10px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { department: DepartmentNode };

// ── Layout helper: tree to nodes/edges with management labels ──
function layoutTree(departments: Department[], onAdd: any, onEdit: any, onDelete: any, onAddPosition: any): { nodes: Node[]; edges: Edge[] } {
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
      data: { department: dept, onAdd, onEdit, onDelete, onAddPosition },
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
      }
    } catch (e) {
      console.error('Failed to fetch org tree', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  // Re-layout when departments change
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

  // Sidebar department list
  function DeptList({ depts, depth = 0 }: { depts: Department[]; depth?: number }) {
    return (
      <div>
        {depts.map((dept) => (
          <div key={dept.id}>
            <div
              className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors ${
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
          </div>
          <div className="text-xs text-gray-500">
            共 {totalDepts} 个部门 · {totalMembers} 人
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          <DeptList depts={departments} />
        </div>
        <div className="p-3 border-t border-gray-100">
          <Button size="sm" variant="outline" onClick={() => handleAdd('group')} className="w-full text-xs h-8">
            <Plus className="w-3.5 h-3.5 mr-1" /> 新建部门
          </Button>
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
            /* ReactFlow diagram */
            <div className="h-full relative">
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索部门..."
                    className="pl-8 h-8 w-48 text-xs bg-white"
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
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
              >
                <Controls className="!bottom-3 !left-3 !bg-white !shadow-md !rounded-lg !border !border-gray-200" />
                <Background gap={20} color="#f1f5f9" />
              </ReactFlow>
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
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedDept.name}</h3>
                      <p className="text-xs text-gray-500">{selectedDept.directMembers?.length || 0} 名直属成员</p>
                    </div>
                  </div>
                  {selectedDept.directMembers && selectedDept.directMembers.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">姓名</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">职位</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">角色</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDept.directMembers.map((m: any) => (
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
                              <td className="px-4 py-3 text-sm text-gray-600">{m.position}</td>
                              <td className="px-4 py-3">
                                {m.isHead && <Badge className="bg-amber-100 text-amber-700 text-[10px]">负责人</Badge>}
                                {m.isDeputy && <Badge className="bg-blue-100 text-blue-700 text-[10px]">副职</Badge>}
                                {!m.isHead && !m.isDeputy && <span className="text-xs text-gray-400">-</span>}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">正常</Badge>
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
