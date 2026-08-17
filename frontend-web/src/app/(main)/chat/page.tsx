'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import {
  MessageCircle, Send, Lock, Flame, Users, Search, Plus,
  Check, CheckCheck, Clock, X, ArrowDown, Shield, UserPlus, Eye, Contact,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE = 'http://localhost:3000';
const BURN_SECONDS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员', high_admin: '高级管理员', general_admin: '管理员',
  employee: '员工', outsource: '外包',
};

const ROLE_LEVELS: Record<string, number> = {
  super_admin: 100, high_admin: 80, general_admin: 60, employee: 40, outsource: 10,
};

export default function ChatPage() {
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [encrypted, setEncrypted] = useState(false);
  const [burn, setBurn] = useState(false);
  const [burnSec, setBurnSec] = useState(10);
  const [burnTarget, setBurnTarget] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const [socket, setSocket] = useState<any>(null)(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showSingleDialog, setShowSingleDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupDialogDeptSections, setGroupDialogDeptSections] = useState<Record<string, boolean>>({});
  const [singleDialogDeptSections, setSingleDialogDeptSections] = useState<Record<string, boolean>>({});
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedIdRef = useRef<string | null>(null);

  // 通讯录 tab：'messages' | 'contacts'
  const [leftTab, setLeftTab] = useState<'messages' | 'contacts'>('messages');
  const [contactSearch, setContactSearch] = useState('');
  const [convSections, setConvSections] = useState<Record<string, boolean>>({ project: false, group: false, single: false });
  // 通讯录按部门分组
  const [deptContacts, setDeptContacts] = useState<any[]>([]);
  const [deptSections, setDeptSections] = useState<Record<string, boolean>>({});
  // 项目部组
  const [projectGroups, setProjectGroups] = useState<any[]>([]);
  const [projectGroupSections, setProjectGroupSections] = useState<Record<string, boolean>>({});

  // 群成员管理面板
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberDeptSections, setAddMemberDeptSections] = useState<Record<string, boolean>>({});
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([]);
  const groupInfoRef = useRef<HTMLDivElement>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [memberInfoPos, setMemberInfoPos] = useState<{ x: number; y: number } | null>(null);

  // 用户信息快速查找 & 部门标签
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    availableUsers.forEach((u) => map.set(u.username, u));
    return map;
  }, [availableUsers]);

  const getDeptLabel = useCallback((deptName: string) => {
    if (!deptName) return '';
    for (const dept of deptContacts) {
      if (dept.children) {
        for (const child of dept.children) {
          if (child.name === deptName) return `${deptName} · ${dept.name}`;
        }
      }
    }
    return deptName;
  }, [deptContacts]);

  // 焚毁倒计时：messageId -> remaining seconds
  const [burnCountdowns, setBurnCountdowns] = useState<Map<string, number>>(new Map());
  const countdownRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ── 启动倒计时 ──
  const startBurnCountdown = useCallback((messageId: string, seconds: number) => {
    const old = countdownRefs.current.get(messageId);
    if (old) clearInterval(old);
    setBurnCountdowns((prev) => { const next = new Map(prev); next.set(messageId, seconds); return next; });
    let remaining = seconds;
    const timer = setInterval(() => {
      remaining--;
      setBurnCountdowns((prev) => {
        const next = new Map(prev);
        if (remaining <= 0) next.delete(messageId); else next.set(messageId, remaining);
        return next;
      });
      if (remaining <= 0) {
        clearInterval(timer);
        countdownRefs.current.delete(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    }, 1000);
    countdownRefs.current.set(messageId, timer);
  }, []);

  // ── 初始化 ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (!token || !saved) { router.replace('/login'); return; }
    const user = JSON.parse(saved);
    setMe(user);

    const s = io(`${API_BASE}/chat`, { auth: { token }, transports: ['websocket'] });
    setSocket(s);

    s.on('chat:ready', () => { s.emit('chat:presence-query'); fetchConvs(); });

    s.on('chat:message', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => [...prev.filter((m) => m.id !== data.message.id), data.message]);
      }
      fetchConvs();
    });

    s.on('chat:revealed', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        // 更新消息的 revealedBy 列表
        setMessages((prev) => prev.map((m) =>
          m.id === data.messageId
            ? { ...m, revealedBy: data.revealedBy, revealedForMe: data.revealedBy.includes(user.username), content: data.content || m.content }
            : m
        ));
        // 如果是当前用户揭示的，启动倒计时
        if (data.revealedByUser === user.username) {
          startBurnCountdown(data.messageId, data.seconds);
        } else if (data.isFirstReveal) {
          // 其他人首次揭示：不启动我的倒计时，只更新状态
        }
      }
      fetchConvs();
    });

    s.on('chat:burning', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        // 只有已揭示的用户才启动倒计时
        setMessages((prev) => {
          const msg = prev.find((m) => m.id === data.messageId);
          if (msg?.revealedForMe) {
            startBurnCountdown(data.messageId, data.seconds);
          }
          return prev.map((m) => m.id === data.messageId ? { ...m, burnScheduled: true } : m);
        });
      }
    });

    s.on('chat:burned', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        setBurnCountdowns((prev) => { const next = new Map(prev); next.delete(data.messageId); return next; });
        const timer = countdownRefs.current.get(data.messageId);
        if (timer) { clearInterval(timer); countdownRefs.current.delete(data.messageId); }
      }
      fetchConvs();
    });

    s.on('chat:deleted', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
      fetchConvs();
    });

    s.on('chat:read', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.map((m) => ({ ...m, readBy: [...new Set([...m.readBy, data.username])] })));
      }
    });

    s.on('chat:typing', (data: any) => {
      if (data.conversationId === selectedIdRef.current && data.username !== user.username) {
        setTypingUsers((prev) => { const next = new Map(prev); next.set(data.username, Date.now()); return next; });
      }
    });

    s.on('chat:members-changed', (data: any) => {
      // 刷新群成员列表
      if (data.conversationId === selectedIdRef.current) {
        fetchGroupMembers(data.conversationId);
      }
      fetchConvs();
    });

    s.on('chat:presence', (data: any) => {
      setOnlineUsers((prev) => { const next = new Set(prev); if (data.online) next.add(data.username); else next.delete(data.username); return next; });
    });
    s.on('chat:presence-list', (data: any) => { setOnlineUsers(new Set(data.online || [])); });

    fetch(`${API_BASE}/chat/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setAvailableUsers(Array.isArray(d) ? d : []))
      .catch(() => {});

    // 获取通讯录（按部门分组）
    fetch(`${API_BASE}/chat/contacts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setDeptContacts(list);
        // 默认折叠所有部门
        const sections: Record<string, boolean> = {};
        list.forEach((dept: any) => { sections[dept.id] = false; });
        setDeptSections(sections);
      })
      .catch(() => {});

    return () => { s.disconnect(); countdownRefs.current.forEach((t) => clearInterval(t)); };
  }, []);

  const fetchConvs = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const convs = await res.json();
        setConvs(convs);
        // 加载项目部组成员信息
        const projectConvs = convs.filter((c: any) => c.category === 'project');
        const groups: any[] = [];
        for (const conv of projectConvs) {
          try {
            const mRes = await fetch(`${API_BASE}/chat/conversations/${conv.id}/members`, { headers: { Authorization: `Bearer ${token}` } });
            if (mRes.ok) {
              const members = await mRes.json();
              groups.push({ id: conv.id, name: conv.name, projectId: conv.projectId, members });
            }
          } catch {}
        }
        setProjectGroups(groups);
        // 默认折叠所有项目部组
        const sections: Record<string, boolean> = {};
        groups.forEach((g: any) => { sections[g.id] = false; });
        setProjectGroupSections(sections);
      }
    } catch {}
  }, []);

  const fetchGroupMembers = useCallback(async (convId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${convId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGroupMembers(await res.json());
    } catch {}
  }, []);

  const addMembersToGroup = async () => {
    if (!selectedId || selectedMembersToAdd.length === 0) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/chat/conversations/${selectedId}/members`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: selectedMembersToAdd }),
      });
      fetchGroupMembers(selectedId);
      setSelectedMembersToAdd([]);
      setShowAddMembersDialog(false);
      setAddMemberSearch('');
    } catch {}
  };

  const removeMemberFromGroup = async (username: string) => {
    if (!selectedId || !confirm(`确定要移除 ${username} 吗？`)) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/chat/conversations/${selectedId}/members/${username}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      fetchGroupMembers(selectedId);
    } catch {}
  };

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  useEffect(() => {
    if (!selectedId || !me) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/chat/conversations/${selectedId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) {
          setMessages(d.messages);
          d.messages.forEach((m: any) => {
            if (m.burn && m.revealedForMe && m.burnScheduled) {
              startBurnCountdown(m.id, m.burnSeconds || 10);
            }
          });
        }
      })
      .catch(() => {});
    socket?.emit('chat:open', { conversationId: selectedId });
    socket?.emit('chat:read', { conversationId: selectedId });
    // 群聊加载成员列表
    const conv = convs.find((c) => c.id === selectedId);
    if (conv?.type === 'group') {
      fetchGroupMembers(selectedId);
    } else {
      setGroupMembers([]);
    }
    // 已读后刷新会话列表（更新未读计数）
    setTimeout(() => fetchConvs(), 500);
  }, [selectedId, me]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const sendMessage = () => {
    if (!socket || !selectedId || !input.trim()) return;
    socket.emit('chat:send', { conversationId: selectedId, content: input.trim(), encrypted, burn, burnSeconds: burn ? burnSec : undefined, burnTarget: burn && selectedConv?.type === 'group' ? burnTarget : undefined });
    setInput(''); setEncrypted(false); setBurn(false); setBurnTarget(''); inputRef.current?.focus();
  };

  const revealMessage = (messageId: string) => {
    if (!socket || !selectedId) return;
    socket.emit('chat:reveal', { conversationId: selectedId, messageId });
    // 重新拉取消息以获取揭示后的内容
    const token = localStorage.getItem('token');
    setTimeout(() => {
      fetch(`${API_BASE}/chat/conversations/${selectedId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.messages) setMessages(d.messages); })
        .catch(() => {});
    }, 300);
  };

  const burnNow = (messageId: string) => {
    if (!socket || !selectedId) return;
    socket.emit('chat:delete', { conversationId: selectedId, messageId });
  };

  const openSingle = async (username: string) => {
    if (!username) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/single`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const conv = await res.json();
      if (conv?.id) {
        setSelectedId(conv.id);
        setLeftTab('messages');
        fetchConvs();
      }
    } catch {}
  };

  const createGroup = async () => {
    if (!groupName.trim() || newGroupMembers.length === 0) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/chat/conversations/group`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, members: newGroupMembers }),
    });
    const conv = await res.json();
    setSelectedId(conv.id);
    setShowGroupDialog(false); setGroupName(''); setNewGroupMembers([]);
    fetchConvs();
  };

  const handleTyping = () => { if (socket && selectedId) socket.emit('chat:typing', { conversationId: selectedId }); };

  const deleteContact = async (username: string) => {
    if (!confirm(`确定要删除用户 ${username} 吗？`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/chat/users/${username}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // 刷新通讯录
        const r2 = await fetch(`${API_BASE}/chat/contacts`, { headers: { Authorization: `Bearer ${token}` } });
        const d2 = await r2.json();
        setDeptContacts(Array.isArray(d2) ? d2 : []);
        setAvailableUsers((prev) => prev.filter((u) => u.username !== username));
      }
    } catch {}
  };

  const selectedConv = convs.find((c) => c.id === selectedId);
  const otherUsername = selectedConv?.type === 'single' ? selectedConv.members.find((m: string) => m !== me?.username) : null;
  const otherUserData = otherUsername ? userMap.get(otherUsername) : null;
  const otherUserName = otherUserData?.name || otherUsername;
  const isGroupAdmin = selectedConv?.type === 'group' && me && (
    selectedConv.owner === me.username || (ROLE_LEVELS[me.role] || 0) >= 60
  );
  const typingList = Array.from(typingUsers.entries()).filter(([u, t]) => Date.now() - t < 4000).map(([u]) => u);
  const filteredConvs = convs.filter((c) => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()));
  const projectConvs = filteredConvs.filter((c) => c.type === 'group' && c.category === 'project');
  const groupConvs = filteredConvs.filter((c) => c.type === 'group' && c.category !== 'project');
  const singleConvs = filteredConvs.filter((c) => c.type === 'single');

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 左栏 */}
      <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Tab 切换 */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setLeftTab('messages')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${leftTab === 'messages' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <MessageCircle className="w-4 h-4" />消息
            {convs.reduce((sum, c) => sum + c.unread, 0) > 0 && (
              <Badge className="bg-blue-500 text-white text-[9px] px-1 py-0 min-w-4 h-4 ml-1">{convs.reduce((sum, c) => sum + c.unread, 0)}</Badge>
            )}
          </button>
          <button
            onClick={() => setLeftTab('contacts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${leftTab === 'contacts' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Contact className="w-4 h-4" />通讯录
          </button>
        </div>

        {/* 消息 Tab */}
        {leftTab === 'messages' && (
          <>
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><MessageCircle className="w-4 h-4" />会话</h2>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowGroupDialog(true)} title="新建群聊"><Users className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowSingleDialog(true)} title="发起单聊"><UserPlus className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索会话..." className="h-8 pl-8 text-sm bg-gray-50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400"><MessageCircle className="w-10 h-10 mb-2" /><p className="text-sm">暂无会话</p></div>
              )}
              {/* 项目部组分区 */}
              {projectConvs.length > 0 && (
                <div>
                  <div onClick={() => setConvSections((p) => ({ ...p, project: !p.project }))}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-50">
                    <span className={`text-[10px] text-gray-400 transition-transform ${convSections.project !== false ? 'rotate-90' : ''}`}>▶</span>
                    <span className="text-emerald-600">🏗</span>
                    <span className="text-xs font-semibold text-gray-500">项目部组</span>
                    <span className="text-[10px] text-gray-400">{projectConvs.length}</span>
                  </div>
                  {convSections.project !== false && projectConvs.map((c) => {
                    const isSelected = c.id === selectedId;
                    return (
                      <div key={c.id} onClick={() => setSelectedId(c.id)}
                        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-50 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-emerald-100 text-emerald-600"><Users className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
                            {c.lastMessageAt && <span className="text-[10px] text-gray-400">{new Date(c.lastMessageAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-gray-300 flex-shrink-0" />
                            <p className="text-xs text-gray-400 truncate">{c.lastMessage || '暂无消息'}</p>
                          </div>
                        </div>
                        {c.unread > 0 && <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{c.unread > 99 ? '99+' : c.unread}</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* 群聊分区 */}
              {groupConvs.length > 0 && (
                <div>
                  <div onClick={() => setConvSections((p) => ({ ...p, group: !p.group }))}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-50">
                    <span className={`text-[10px] text-gray-400 transition-transform ${convSections.group !== false ? 'rotate-90' : ''}`}>▶</span>
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs font-semibold text-gray-500">群聊</span>
                    <span className="text-[10px] text-gray-400">{groupConvs.length}</span>
                  </div>
                  {convSections.group !== false && groupConvs.map((c) => {
                    const isSelected = c.id === selectedId;
                    return (
                      <div key={c.id} onClick={() => setSelectedId(c.id)}
                        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-50 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-emerald-100 text-emerald-600"><Users className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
                            {c.lastMessageAt && <span className="text-[10px] text-gray-400">{new Date(c.lastMessageAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-gray-300 flex-shrink-0" />
                            <p className="text-xs text-gray-400 truncate">{c.lastMessage || '暂无消息'}</p>
                          </div>
                        </div>
                        {c.unread > 0 && <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{c.unread > 99 ? '99+' : c.unread}</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* 单聊分区 */}
              {singleConvs.length > 0 && (
                <div>
                  <div onClick={() => setConvSections((p) => ({ ...p, single: !p.single }))}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-50">
                    <span className={`text-[10px] text-gray-400 transition-transform ${convSections.single !== false ? 'rotate-90' : ''}`}>▶</span>
                    <MessageCircle className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-500">单聊</span>
                    <span className="text-[10px] text-gray-400">{singleConvs.length}</span>
                  </div>
                  {convSections.single !== false && singleConvs.map((c) => {
                    const isSelected = c.id === selectedId;
                    const otherUsername = c.members.find((m: string) => m !== me?.username) || me?.username;
                    const otherUserData = otherUsername ? userMap.get(otherUsername) : null;
                    const displayName = otherUserData?.name || otherUsername;
                    const isOnline = onlineUsers.has(otherUsername);
                    return (
                      <div key={c.id} onClick={() => setSelectedId(c.id)}
                        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-50 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">{displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
                            {c.lastMessageAt && <span className="text-[10px] text-gray-400">{new Date(c.lastMessageAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-gray-400 truncate">{c.lastMessage || '暂无消息'}</p>
                          </div>
                        </div>
                        {c.unread > 0 && <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{c.unread > 99 ? '99+' : c.unread}</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* 通讯录 Tab */}
        {leftTab === 'contacts' && (
          <>
            <div className="p-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2"><Contact className="w-4 h-4" />通讯录</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="搜索姓名、部门..." className="h-8 pl-8 text-sm bg-gray-50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(deptContacts.length === 0 && projectGroups.length === 0) && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Contact className="w-10 h-10 mb-2" /><p className="text-sm">暂无联系人</p></div>
              )}
              {/* 项目部组 */}
              {projectGroups.map((pg) => {
                const filtered = contactSearch
                  ? pg.members.filter((m: any) =>
                      m.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                      m.position.toLowerCase().includes(contactSearch.toLowerCase()))
                  : pg.members;
                if (filtered.length === 0) return null;
                const isExpanded = projectGroupSections[pg.id] !== false;
                return (
                  <div key={pg.id} className="border-b border-gray-50">
                    <div onClick={() => setProjectGroupSections((prev) => ({ ...prev, [pg.id]: !isExpanded }))}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className="text-emerald-600">🏗</span>
                        <span className="text-sm font-semibold text-gray-700">{pg.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filtered.length}人</span>
                      </div>
                    </div>
                    {isExpanded && filtered.map((u: any) => {
                      const isOnline = onlineUsers.has(u.username);
                      return (
                        <div key={u.username}
                          className="flex items-center gap-3 pl-8 pr-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-50 transition-colors select-none"
                          onClick={() => openSingle(u.username)}>
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{u.position} · {u.department || '项目部'}</p>
                          </div>
                          {isOnline && <span className="text-[10px] text-emerald-500">在线</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {/* 部门联系人 */}
              {deptContacts.map((dept) => {
                const filtered = contactSearch
                  ? dept.members.filter((m: any) =>
                      m.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                      m.position.toLowerCase().includes(contactSearch.toLowerCase()) ||
                      dept.name.toLowerCase().includes(contactSearch.toLowerCase()))
                  : dept.members;
                if (filtered.length === 0) return null;
                const isExpanded = deptSections[dept.id] !== false;
                return (
                  <div key={dept.id} className="border-b border-gray-50">
                    {/* 部门标题行 */}
                    <div
                      onClick={() => setDeptSections((prev) => ({ ...prev, [dept.id]: !isExpanded }))}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filtered.length}人</span>
                      </div>
                      {dept.leader && <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{dept.leader}</span>}
                    </div>
                    {/* 部门成员 */}
                    {isExpanded && (
                      <div>
                        {filtered.map((u: any) => {
                          const isOnline = onlineUsers.has(u.username);
                          const isMe = me?.role === 'super_admin' || me?.role === 'high_admin';
                          return (
                            <div key={u.username}
                              className="flex items-center gap-3 pl-8 pr-3 py-2 cursor-pointer hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 transition-colors select-none group"
                            >
                              <div className="relative flex-shrink-0" onClick={() => openSingle(u.username)}>
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => openSingle(u.username)}>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                  {u.isHead && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0 rounded font-medium">负责人</span>}
                                  {u.isDeputy && <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0 rounded font-medium">副职</span>}
                                </div>
                                <p className="text-[10px] text-gray-400 truncate">
                                  {u.position}
                                  {u.department && <span className="text-gray-300 ml-1">· {getDeptLabel(u.department)}</span>}
                                  {u.phone && <span className="ml-1.5">{u.phone}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isOnline && <span className="text-[10px] text-emerald-500">在线</span>}
                                {isMe && me?.username !== u.username && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteContact(u.username); }}
                                    className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    title="删除联系人"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center pointer-events-none"><Send className="w-3 h-3 text-blue-500" /></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 右栏：聊天窗口 */}
      {!selectedConv ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <MessageCircle className="w-16 h-16 mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-500">选择一个会话开始聊天</p>
          <p className="text-sm mt-1">支持单聊、群聊、加密消息、阅后即焚</p>
        </div>
      ) : (
        <div className="flex-1 flex min-w-0">
          <div className="flex-1 flex flex-col min-w-0">
          {/* 头部 */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0 bg-gray-50">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className={selectedConv.type === 'group' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}>
                  {selectedConv.type === 'group' ? <Users className="w-3.5 h-3.5" /> : (otherUserName?.[0]?.toUpperCase() || 'U')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedConv.type === 'group' ? selectedConv.name : otherUserName}</p>
                <p className="text-[10px] text-gray-400">
                  {selectedConv.type === 'group' ? `${selectedConv.members.length} 人` : ''}
                  {otherUsername && onlineUsers.has(otherUsername) && ' · 在线'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200"><Lock className="w-3 h-3 mr-1" />端到端加密可用</Badge>
              {selectedConv.type === 'group' && (
                <Button size="sm" variant={showGroupInfo ? 'default' : 'ghost'} onClick={() => setShowGroupInfo(!showGroupInfo)} className="h-7 px-2" title="群成员管理">
                  <Users className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
            {messages.length === 0 && <div className="text-center text-gray-400 py-16">暂无消息，发送第一条消息开始聊天</div>}
            {messages.map((m) => {
              const isMine = m.sender === me?.username;
              const readCount = (m.readBy || []).filter((r: string) => r !== m.sender).length;
              const countdown = burnCountdowns.get(m.id);
              // 发送者始终看到内容；接收者需揭示后才看到
              const isBurnHidden = m.burn && !m.revealedForMe && !isMine;
              const isBurnRevealed = m.burn && (m.revealedForMe || isMine);

              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[70%] ${isMine ? 'order-2' : ''}`}>
                    {!isMine && selectedConv.type === 'group' && (
                      <p className="text-[10px] text-gray-400 mb-0.5 ml-1">
                        {(() => { const u = userMap.get(m.sender); return u ? `${u.name || m.sender}` : m.sender; })()}
                        {(() => { const u = userMap.get(m.sender); const dept = u?.department || ''; return dept ? <span className="text-gray-300 ml-1">· {getDeptLabel(dept)}</span> : null; })()}
                      </p>
                    )}

                    {isBurnHidden ? (
                      <div onClick={() => revealMessage(m.id)}
                        className="relative px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 border-dashed border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 hover:border-amber-400 animate-pulse select-none">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                            <Flame className="w-5 h-5 text-white animate-bounce" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-700">阅后即焚消息</p>
                            <p className="text-[10px] text-amber-500 mt-0.5">点击揭示内容 · {m.burnSeconds}s 后自动销毁</p>
                          </div>
                          <Eye className="w-4 h-4 text-amber-400 ml-auto" />
                        </div>
                      </div>

                    ) : isBurnRevealed ? (
                      <div>
                        <div className={`px-3 py-2 rounded-2xl text-sm bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-800 ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-[10px] font-medium text-orange-600">阅后即焚 {m.burnSeconds}s</span>
                          </div>
                          <p className="break-words">{m.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                            <span className="text-[10px] text-amber-500">{new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3 text-amber-400" /> : <Check className="w-3 h-3 text-amber-400" />)}
                          </div>
                        </div>
                        {/* 倒计时进度条 */}
                        {countdown !== undefined && countdown > 0 && (
                          <div className="flex items-center gap-2 mt-1 ml-1">
                            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(countdown / (m.burnSeconds || 10)) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-orange-500 font-mono tabular-nums">{countdown}s</span>
                          </div>
                        )}
                        {/* 发送者：即时焚毁按钮 */}
                        {isMine && !countdown && (
                          <div className="flex justify-end mt-1">
                            <button onClick={() => burnNow(m.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-medium transition-colors">
                              <Flame className="w-3 h-3" />立即焚毁
                            </button>
                          </div>
                        )}
                      </div>

                    ) : (
                      <div>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          m.encrypted ? 'bg-purple-50 border border-purple-200 text-purple-800' :
                          isMine ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
                        } ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                          {m.encrypted && (<div className="flex items-center gap-1 mb-1"><Lock className="w-3 h-3 opacity-60" /><span className="text-[10px] opacity-60">已加密</span></div>)}
                          <p className="break-words">{m.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                            <span className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>{new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3 text-blue-100" /> : <Check className="w-3 h-3 text-blue-100" />)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {typingList.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-2"><Clock className="w-3 h-3 animate-spin" />{typingList.join('、')} 正在输入...</div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={encrypted ? 'default' : 'ghost'} onClick={() => { setEncrypted(!encrypted); if (!encrypted) setBurn(false); }} className={`h-8 px-2 ${encrypted ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}`} title={encrypted ? '已开启加密' : '开启加密'}><Lock className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant={burn ? 'default' : 'ghost'} onClick={() => { setBurn(!burn); if (!burn) setEncrypted(true); }} className={`h-8 px-2 ${burn ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`} title={burn ? '已开启阅后即焚' : '开启阅后即焚'}><Flame className="w-3.5 h-3.5" /></Button>
              {burn && (
                <>
                  <select value={burnSec} onChange={(e) => setBurnSec(Number(e.target.value))} className="h-8 text-xs rounded-lg border border-amber-200 bg-amber-50 px-2 focus:outline-none">
                    {BURN_SECONDS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {selectedConv?.type === 'group' && (
                    <select value={burnTarget} onChange={(e) => setBurnTarget(e.target.value)} className="h-8 text-xs rounded-lg border border-amber-200 bg-amber-50 px-2 focus:outline-none max-w-[120px]">
                      <option value="">选择接收人</option>
                      {selectedConv.members.filter((m: string) => m !== me?.username).map((m: string) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
              <Input ref={inputRef} value={input} onChange={(e) => { setInput(e.target.value); handleTyping(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={encrypted ? '输入加密消息...' : burn ? `输入阅后即焚消息（${burnSec}s后销毁）...` : '输入消息...'} className="flex-1 h-9 text-sm" />
              <Button size="sm" onClick={sendMessage} disabled={!input.trim() || (burn && selectedConv?.type === 'group' && !burnTarget)} className="h-9 px-3"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
          </div>

          {/* 群成员管理面板 */}
          {showGroupInfo && selectedConv?.type === 'group' && (
            <div ref={groupInfoRef} className="w-64 border-l border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />群成员</h3>
                {isGroupAdmin && (
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setSelectedMembersToAdd([]); setAddMemberSearch(''); setShowAddMembersDialog(true); }}>
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {groupMembers.filter((gm) => gm.role !== 'super_admin').map((gm: any) => (
                  <div key={gm.username}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMemberInfoPos({ x: rect.right + 8, y: Math.min(rect.top, window.innerHeight - 220) });
                      setMemberInfo(memberInfo?.username === gm.username ? null : gm);
                    }}
                    onDoubleClick={(e) => { e.stopPropagation(); openSingle(gm.username); }}
                    className="flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 hover:bg-white group/member transition-colors cursor-pointer select-none"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">{gm.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-800 truncate">{gm.name}</span>
                        {gm.isOwner && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0 rounded font-medium">群主</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{ROLE_LABELS[gm.role] || gm.role} · {gm.department || '未分配'}</p>
                    </div>
                    {isGroupAdmin && !gm.isOwner && me?.username !== gm.username && (
                      <button onClick={(e) => { e.stopPropagation(); removeMemberFromGroup(gm.username); }}
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/member:opacity-100 transition-all flex-shrink-0" title="移除成员">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {groupMembers.length === 0 && (
                  <div className="text-center text-gray-400 py-8 text-xs">暂无成员信息</div>
                )}
              </div>
            </div>
          )}

          {/* 成员信息卡片 */}
          {memberInfo && memberInfoPos && (
            <div onClick={() => setMemberInfo(null)} className="fixed inset-0 z-50">
              <div onClick={(e) => e.stopPropagation()} style={{ top: memberInfoPos.y, left: Math.min(memberInfoPos.x, window.innerWidth - 280) }}
                className="absolute bg-white rounded-xl shadow-xl border border-gray-200 w-64 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 pt-4 pb-6 relative">
                  <button onClick={() => setMemberInfo(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><X className="w-3 h-3" /></button>
                  <div className="flex flex-col items-center">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
                      <AvatarFallback className="bg-white text-blue-600 text-xl font-bold">{memberInfo.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <p className="text-white font-semibold mt-2 text-base">{memberInfo.name}</p>
                  </div>
                </div>
                <div className="px-4 pt-4 pb-3 space-y-2.5">
                  <div className="flex items-center text-sm"><span className="text-gray-400 w-16 flex-shrink-0">用户名</span><span className="text-gray-700 truncate">{memberInfo.username}</span></div>
                  <div className="flex items-center text-sm"><span className="text-gray-400 w-16 flex-shrink-0">角色</span><span className="text-gray-700">{ROLE_LABELS[memberInfo.role] || memberInfo.role}</span></div>
                  <div className="flex items-center text-sm"><span className="text-gray-400 w-16 flex-shrink-0">部门</span><span className="text-gray-700 truncate">{memberInfo.department || '未分配'}</span></div>
                  {memberInfo.position && <div className="flex items-center text-sm"><span className="text-gray-400 w-16 flex-shrink-0">职位</span><span className="text-gray-700">{memberInfo.position}</span></div>}
                  {memberInfo.isOwner && <div className="flex items-center text-sm"><span className="text-gray-400 w-16 flex-shrink-0">身份</span><span className="text-amber-600 font-medium">群主</span></div>}
                  <div className="pt-2">
                    <button onClick={() => { openSingle(memberInfo.username); setMemberInfo(null); }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />发送消息
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-300 text-center">双击成员可直接进入单聊</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 创建群聊对话框 */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4" />创建群聊</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">群名称</label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="例如：项目沟通群" className="h-9" />
            </div>
             <div>
               <label className="text-sm font-medium text-gray-700 mb-1 block">选择成员</label>
               <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg">
                 {/* 项目部组 */}
                 {projectGroups.map((pg) => {
                   const members = pg.members.filter((m: any) => !newGroupMembers.includes(m.username));
                   const expanded = groupDialogDeptSections[pg.id] === true;
                   if (members.length === 0 && pg.members.filter((m: any) => newGroupMembers.includes(m.username)).length === 0) return null;
                   return (
                     <div key={pg.id} className="border-b border-gray-50 last:border-b-0">
                       <div onClick={() => setGroupDialogDeptSections((p) => ({ ...p, [pg.id]: !expanded }))}
                         className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none bg-emerald-50/50">
                         <span className={`text-[10px] text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                         <span className="text-emerald-600">🏗</span>
                         <span className="text-xs font-semibold text-gray-600">{pg.name}</span>
                         <span className="text-[10px] text-gray-400">{pg.members.length}人</span>
                       </div>
                       {expanded && pg.members.map((u: any) => {
                         const selected = newGroupMembers.includes(u.username);
                         return (
                           <div key={u.username} onClick={() => setNewGroupMembers((prev) => selected ? prev.filter((m) => m !== u.username) : [...prev, u.username])}
                             className={`flex items-center gap-2.5 pl-7 pr-3 py-1.5 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                             <Avatar className="w-6 h-6"><AvatarFallback className="text-[10px] bg-emerald-100">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                             <div className="flex-1 min-w-0">
                               <span className="text-sm">{u.name || u.username}</span>
                               <span className="text-[10px] text-gray-400 ml-1.5">{u.position}</span>
                             </div>
                             {selected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                           </div>
                         );
                       })}
                     </div>
                   );
                 })}
                 {/* 部门成员 */}
                 {deptContacts.map((dept) => {
                   const members = dept.members.filter((m: any) => !newGroupMembers.includes(m.username));
                   const expanded = groupDialogDeptSections[dept.id] === true;
                   if (members.length === 0 && dept.members.filter((m: any) => newGroupMembers.includes(m.username)).length === 0) return null;
                   return (
                     <div key={dept.id} className="border-b border-gray-50 last:border-b-0">
                       <div onClick={() => setGroupDialogDeptSections((p) => ({ ...p, [dept.id]: !expanded }))}
                         className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none">
                         <span className={`text-[10px] text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                         <span className="text-xs font-semibold text-gray-600">{dept.name}</span>
                         <span className="text-[10px] text-gray-400">{dept.members.length}人</span>
                       </div>
                       {expanded && dept.members.map((u: any) => {
                         const selected = newGroupMembers.includes(u.username);
                         return (
                           <div key={u.username} onClick={() => setNewGroupMembers((prev) => selected ? prev.filter((m) => m !== u.username) : [...prev, u.username])}
                             className={`flex items-center gap-2.5 pl-7 pr-3 py-1.5 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                             <Avatar className="w-6 h-6"><AvatarFallback className="text-[10px] bg-gray-100">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                             <div className="flex-1 min-w-0">
                               <span className="text-sm">{u.name || u.username}</span>
                               <span className="text-[10px] text-gray-400 ml-1.5">{u.position}</span>
                             </div>
                             {selected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                           </div>
                         );
                       })}
                     </div>
                   );
                 })}
              </div>
              {newGroupMembers.length > 0 && <p className="text-xs text-gray-400 mt-1">已选 {newGroupMembers.length} 人</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowGroupDialog(false); setGroupName(''); setNewGroupMembers([]); }}>取消</Button>
              <Button size="sm" onClick={createGroup} disabled={!groupName.trim() || newGroupMembers.length === 0}><Users className="w-3.5 h-3.5 mr-1" />创建</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 发起单聊对话框 */}
      <Dialog open={showSingleDialog} onOpenChange={setShowSingleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" />发起单聊</DialogTitle>
          </DialogHeader>
           <div className="mt-2">
             <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg">
               {/* 项目部组 */}
               {projectGroups.map((pg) => {
                 const expanded = singleDialogDeptSections[pg.id] === true;
                 if (pg.members.length === 0) return null;
                 return (
                   <div key={pg.id} className="border-b border-gray-50 last:border-b-0">
                     <div onClick={() => setSingleDialogDeptSections((p) => ({ ...p, [pg.id]: !expanded }))}
                       className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none bg-emerald-50/50">
                       <span className={`text-[10px] text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                       <span className="text-emerald-600">🏗</span>
                       <span className="text-xs font-semibold text-gray-600">{pg.name}</span>
                       <span className="text-[10px] text-gray-400">{pg.members.length}人</span>
                     </div>
                     {expanded && pg.members.map((u: any) => (
                       <div key={u.username} onClick={() => { openSingle(u.username); setShowSingleDialog(false); }}
                         className="flex items-center gap-2.5 pl-7 pr-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-b-0 transition-colors select-none">
                         <Avatar className="w-7 h-7">
                           <AvatarFallback className="bg-emerald-100 text-emerald-600 text-[10px]">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.username}</p>
                           <p className="text-[10px] text-gray-400 truncate">{u.position}</p>
                         </div>
                         <div className="flex-shrink-0 pointer-events-none">
                           <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center"><Send className="w-3 h-3 text-blue-500" /></div>
                         </div>
                       </div>
                     ))}
                   </div>
                 );
               })}
               {/* 部门成员 */}
               {deptContacts.map((dept) => {
                const filtered = dept.members;
                if (filtered.length === 0) return null;
                const expanded = singleDialogDeptSections[dept.id] === true;
                return (
                  <div key={dept.id} className="border-b border-gray-50 last:border-b-0">
                    <div onClick={() => setSingleDialogDeptSections((p) => ({ ...p, [dept.id]: !expanded }))}
                      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none">
                      <span className={`text-[10px] text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-xs font-semibold text-gray-600">{dept.name}</span>
                      <span className="text-[10px] text-gray-400">{filtered.length}人</span>
                    </div>
                    {expanded && filtered.map((u: any) => (
                      <div key={u.username} onClick={() => { openSingle(u.username); setShowSingleDialog(false); }}
                        className="flex items-center gap-2.5 pl-7 pr-3 py-2 cursor-pointer hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 last:border-b-0 transition-colors select-none">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px]">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.username}</p>
                          <p className="text-[10px] text-gray-400 truncate">{u.position}</p>
                        </div>
                        <div className="flex-shrink-0 pointer-events-none">
                          <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center"><Send className="w-3 h-3 text-blue-500" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加群成员对话框（部门树形选择） */}
      <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" />添加群成员</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input placeholder="搜索姓名、职位..." className="h-9 pl-8 text-sm" value={addMemberSearch} onChange={(e) => setAddMemberSearch(e.target.value)} />
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {/* 项目部组 */}
              {projectGroups.map((pg) => {
                const filtered = addMemberSearch
                  ? pg.members.filter((m: any) =>
                      (m.name.toLowerCase().includes(addMemberSearch.toLowerCase()) || m.position.toLowerCase().includes(addMemberSearch.toLowerCase()))
                      && !selectedConv?.members.includes(m.username)
                    )
                  : pg.members.filter((m: any) => !selectedConv?.members.includes(m.username));
                if (filtered.length === 0) return null;
                const isExpanded = addMemberDeptSections[pg.id] !== false;
                return (
                  <div key={pg.id} className="border-b border-gray-50 last:border-b-0 bg-emerald-50/30">
                    <div onClick={() => setAddMemberDeptSections((prev) => ({ ...prev, [pg.id]: !isExpanded }))}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className="text-emerald-600">🏗</span>
                        <span className="text-sm font-semibold text-gray-700">{pg.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filtered.length}人可选</span>
                      </div>
                    </div>
                    {isExpanded && filtered.map((u: any) => {
                      const selected = selectedMembersToAdd.includes(u.username);
                      return (
                        <div key={u.username} onClick={() => setSelectedMembersToAdd((prev) => selected ? prev.filter((m) => m !== u.username) : [...prev, u.username])}
                          className={`flex items-center gap-3 pl-8 pr-3 py-2 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <Avatar className="w-7 h-7"><AvatarFallback className="text-xs bg-emerald-100">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{u.name || u.username}</span>
                            <span className="text-[10px] text-gray-400 ml-1.5">{u.position}</span>
                          </div>
                          {selected && <Check className="w-4 h-4 text-blue-500" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {/* 部门成员 */}
              {deptContacts.map((dept) => {
                const filtered = addMemberSearch
                  ? dept.members.filter((m: any) =>
                      (m.name.toLowerCase().includes(addMemberSearch.toLowerCase()) || m.position.toLowerCase().includes(addMemberSearch.toLowerCase()))
                      && !selectedConv?.members.includes(m.username)
                    )
                  : dept.members.filter((m: any) => !selectedConv?.members.includes(m.username));
                if (filtered.length === 0) return null;
                const isExpanded = addMemberDeptSections[dept.id] !== false;
                return (
                  <div key={dept.id} className="border-b border-gray-50 last:border-b-0">
                    <div onClick={() => setAddMemberDeptSections((prev) => ({ ...prev, [dept.id]: !isExpanded }))}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filtered.length}人可选</span>
                      </div>
                    </div>
                    {isExpanded && filtered.map((u: any) => {
                      const selected = selectedMembersToAdd.includes(u.username);
                      return (
                        <div key={u.username} onClick={() => setSelectedMembersToAdd((prev) => selected ? prev.filter((m) => m !== u.username) : [...prev, u.username])}
                          className={`flex items-center gap-3 pl-8 pr-3 py-2 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <Avatar className="w-7 h-7"><AvatarFallback className="text-xs bg-gray-100">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{u.name || u.username}</span>
                            <span className="text-[10px] text-gray-400 ml-1.5">{u.position}</span>
                          </div>
                          {selected && <Check className="w-4 h-4 text-blue-500" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {selectedMembersToAdd.length > 0 && <p className="text-xs text-gray-400 mt-1">已选 {selectedMembersToAdd.length} 人</p>}
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => { setShowAddMembersDialog(false); setSelectedMembersToAdd([]); }}>取消</Button>
              <Button size="sm" onClick={addMembersToGroup} disabled={selectedMembersToAdd.length === 0}><UserPlus className="w-3.5 h-3.5 mr-1" />添加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
