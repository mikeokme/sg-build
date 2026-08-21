'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  MessageCircle, Send, Lock, Flame, Users, Search, Plus,
  Check, CheckCheck, Clock, X, ArrowDown, Shield, UserPlus, Eye, Contact, KeyRound,
  Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Play, Pause, Paperclip,
  Bookmark, Image as ImageIcon, Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE = 'http://localhost:14725';
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

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  if (isYesterday) return '昨天 ' + time;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + time;
}

function formatMsgTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 取汉字拼音首字母（基于 zh locale 代表字二分法）
const PINYIN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'];
const PINYIN_SEEDS = ['阿', '芭', '擦', '搭', '蛾', '发', '噶', '哈', '击', '喀', '垃', '妈', '拿', '哦', '啪', '期', '然', '撒', '塌', '挖', '昔', '压', '匝'];
const collatorZh = new Intl.Collator('zh-Hans-CN');
function pinyinInitial(name: string): string {
  const ch = (name || '').trim().charAt(0);
  if (!ch) return '#';
  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
  // 二分定位首字母区间
  let lo = 0, hi = PINYIN_SEEDS.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (collatorZh.compare(ch, PINYIN_SEEDS[mid]) >= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 ? PINYIN_LETTERS[lo - 1] : '#';
}
// 按姓氏拼音首字母排序（全体人员）
function sortByPinyin(list: any[], key = 'name'): any[] {
  return [...list].sort((a, b) => collatorZh.compare(a[key] || '', b[key] || ''));
}

// 递归展平部门树为有序列表（用于成员选择器，兼容任意深度）
function flattenDeptTree(nodes: any[], depth = 0): Array<{ dept: any; depth: number }> {
  const out: Array<{ dept: any; depth: number }> = [];
  for (const node of nodes || []) {
    if (!node || node.isVirtual) continue;
    const hasMembers = (node.members?.length || 0) > 0;
    const childList = flattenDeptTree(node.children, depth + 1);
    const hasChildMembers = childList.length > 0;
    if (hasMembers || hasChildMembers) out.push({ dept: node, depth });
    out.push(...childList);
  }
  return out;
}

function MemberItem({ gm, isGroupAdmin, isGroupOwner, me, onChat, onSetAdmin, onRemove, onTransfer, onInfoClick }: {
  gm: any; isGroupAdmin: boolean; isGroupOwner: boolean; me: any;
  onChat: (u: string) => void; onSetAdmin: (u: string) => void; onRemove: (u: string) => void; onTransfer: (u: string) => void;
  onInfoClick: (e: React.MouseEvent, m: any) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  return (
    <div
      onClick={(e) => onInfoClick(e, gm)}
      onDoubleClick={() => onChat(gm.username)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer select-none group"
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">{gm.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800 truncate">{gm.name}</span>
          {gm.isOwner && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">群主</span>}
          {gm.isAdmin && !gm.isOwner && <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">管理员</span>}
        </div>
        <p className="text-[10px] text-gray-400 truncate">{gm.position || gm.department || ''}</p>
      </div>
      {/* 操作按钮 */}
      {showActions && isGroupAdmin && (
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onChat(gm.username)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all" title="发消息">
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          {isGroupOwner && !gm.isOwner && (
            <>
              <button onClick={() => onSetAdmin(gm.username)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all" title={gm.isAdmin ? '取消管理员' : '设为管理员'}>
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onTransfer(gm.username)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all" title="转让群主">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l0 14M5 9l7 7 7-7"/></svg>
              </button>
              <button onClick={() => onRemove(gm.username)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="移除成员">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {isGroupOwner && gm.isOwner && null}
          {!isGroupOwner && gm.isAdmin && me?.username !== gm.username && (
            <button onClick={() => onRemove(gm.username)} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="移除成员">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [encrypted, setEncrypted] = useState(false);
  const [secretTarget, setSecretTarget] = useState('');
  const [secretInputMsgId, setSecretInputMsgId] = useState<string | null>(null);
  const [secretPasswordInput, setSecretPasswordInput] = useState('');
  const [burn, setBurn] = useState(false);
  const [burnSec, setBurnSec] = useState(10);
  const [burnTarget, setBurnTarget] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showSingleDialog, setShowSingleDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCategory, setGroupCategory] = useState('custom');
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
const [convSections, setConvSections] = useState<Record<string, boolean>>({});
  const [chatGroups, setChatGroups] = useState<any[]>([]);
  // 通讯录按部门分组
  const [deptContacts, setDeptContacts] = useState<any[]>([]);
  const [deptSections, setDeptSections] = useState<Record<string, boolean>>({});

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
  // Telegram 风格扩展状态
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardMsgId, setForwardMsgId] = useState<string | null>(null);
  const [forwardTarget, setForwardTarget] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);

  // ── Telegram 风格：图片大图查看器 ──
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerMessages, setImageViewerMessages] = useState<any[]>([]);

  // ── Telegram 风格：多选模式 ──
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());

  // ── Telegram 风格：全局搜索 ──
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const globalSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Telegram 风格：已保存消息 ──
  const [savedMessagesOpen, setSavedMessagesOpen] = useState(false);
  const [savedMessages, setSavedMessages] = useState<any[]>([]);

  // ── Telegram 风格：表情面板增强 ──
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('smileys');
  const EMOJI_CATEGORIES: Record<string, string[]> = {
    smileys: ['😊', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😇', '🤗', '😏', '😅', '😄', '🙂', '😉', '😌', '😋', '🤪', '😜', '🙃', '😛', '😝', '🤑', '🤭', '🤫', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '💀', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
    gestures: ['👍', '👎', '👊', '✊', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💅', '🤳', '💪', '🦾', '🖕', '✌️', '🤞', '🤟', '🤘', '🤙', '👌', '🤌', '🤏', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '🤳'],
    objects: ['⌚', '📱', '📲', '💻', '🖥️', '⌨️', '🖱️', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🗑️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🔧', '🔨', '🛠️', '⚒️', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🩹', '💊', '💉', '🧬', '🦠', '🧪', '🧫'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '⚠️', '🚸', '⛔', '🚫', '💯', '🔥', '⭐', '🌟', '✨', '⚡', '💥', '💫', '💦', '💨', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '🌊'],
  };

  // ── Telegram 风格：富文本编辑 ──
  const [richTextMode, setRichTextMode] = useState(false);
  const [inputFormat, setInputFormat] = useState<'plain' | 'bold' | 'italic' | 'code' | 'monospace'>('plain');

  // ── Telegram 风格：表情面板增强 ──
  const [showGroupEditDialog, setShowGroupEditDialog] = useState(false);
  const [groupEditName, setGroupEditName] = useState('');
  const [groupEditDesc, setGroupEditDesc] = useState('');
  const [groupEditAvatar, setGroupEditAvatar] = useState('');
  const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '🙏', '😮'];

  // ── 语音消息 ──
  const [recording, setRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayRef = useRef<HTMLAudioElement | null>(null);

  // ── 文件/图片上传 ──
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const isImageFile = (name: string) => IMAGE_EXTS.includes(name.split('.').pop()?.toLowerCase() || '');

  // ── 单聊视频通话（WebRTC） ──
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callMuted, setCallMuted] = useState(false);
  const [callCamOff, setCallCamOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 用户信息快速查找 & 部门标签
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    availableUsers.forEach((u) => map.set(u.username, u));
    return map;
  }, [availableUsers]);

  // ── Telegram 风格：图片查看器 ──
  const openImageViewer = useCallback((msg: any, allImages: any[]) => {
    setImageViewerMessages(allImages);
    const idx = allImages.findIndex((m: any) => m.id === msg.id);
    setImageViewerIndex(idx >= 0 ? idx : 0);
    setImageViewerSrc(msg.content);
    setImageViewerOpen(true);
  }, []);
  const closeImageViewer = useCallback(() => { setImageViewerOpen(false); setImageViewerSrc(''); }, []);
  const navigateImage = useCallback((dir: 'prev' | 'next') => {
    setImageViewerIndex(prev => {
      const next = dir === 'next' ? Math.min(prev + 1, imageViewerMessages.length - 1) : Math.max(prev - 1, 0);
      setImageViewerSrc(imageViewerMessages[next]?.content || '');
      return next;
    });
  }, [imageViewerMessages]);

  // ── Telegram 风格：多选操作 ──
  const toggleSelectMsg = useCallback((id: string) => {
    setSelectedMsgIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const handleBatchDelete = useCallback(async () => {
    if (selectedMsgIds.size === 0 || !selectedId) return;
    if (!confirm(`确定删除选中的 ${selectedMsgIds.size} 条消息？`)) return;
    const token = localStorage.getItem('token');
    for (const id of selectedMsgIds) {
      await fetch(`${API_BASE}/chat/conversations/${selectedId}/messages/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setSelectedMsgIds(new Set());
    setSelectMode(false);
    if (selectedId) {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE}/chat/conversations/${selectedId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.messages) setMessages(d.messages); })
        .catch(() => {});
    }
  }, [selectedMsgIds, selectedId]);
  const handleBatchForward = useCallback(() => {
    if (selectedMsgIds.size === 0) return;
    const firstId = Array.from(selectedMsgIds)[0];
    setForwardMsgId(firstId);
    setShowForwardDialog(true);
    setSelectMode(false);
    setSelectedMsgIds(new Set());
  }, [selectedMsgIds]);

  // ── Telegram 风格：全局搜索 ──
  const performGlobalSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) { setGlobalSearchResults([]); return; }
    setGlobalSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/chat/global-search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalSearchResults(data.results || []);
      }
    } catch {}
    setGlobalSearchLoading(false);
  }, []);
  const handleGlobalSearchInput = useCallback((value: string) => {
    setGlobalSearchQuery(value);
    if (globalSearchTimerRef.current) clearTimeout(globalSearchTimerRef.current);
    globalSearchTimerRef.current = setTimeout(() => performGlobalSearch(value), 400);
  }, [performGlobalSearch]);

  // ── Telegram 风格：已保存消息 ──
  const loadSavedMessages = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/chat/saved-messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSavedMessages(data.messages || []);
    }
  }, []);
  const saveMessage = useCallback(async (msgId: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/chat/saved-messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId }),
    }).catch(() => {});
  }, []);
  const removeSavedMessage = useCallback(async (msgId: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/chat/saved-messages/${msgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setSavedMessages(prev => prev.filter(m => m.id !== msgId));
  }, []);

  // 用户信息快速查找 & 部门标签
  const getDeptLabel = useCallback((deptName: string) => {
    if (!deptName) return '';
    const findPath = (nodes: any[], prefix: string): string => {
      for (const dept of nodes) {
        if (dept.name === deptName) return prefix ? `${prefix} / ${dept.name}` : dept.name;
        if (dept.children && dept.children.length > 0) {
          const r = findPath(dept.children, prefix ? `${prefix} / ${dept.name}` : dept.name);
          if (r) return r;
        }
      }
      return '';
    };
    return findPath(deptContacts, '');
  }, [deptContacts]);

  // 从成员卡片跳转通讯录并定位部门（递归查找路径并展开）
  const gotoDept = useCallback((deptName: string) => {
    setLeftTab('contacts');
    // 递归找到部门所在路径节点，逐级展开
    const findAndExpand = (nodes: any[]): boolean => {
      for (const dept of nodes) {
        if (dept.name === deptName) {
          setDeptSections((prev) => ({ ...prev, org: true, [dept.id]: true }));
          requestAnimationFrame(() => {
            const el = document.getElementById('dept-' + dept.id);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
          return true;
        }
        if (dept.children && dept.children.length > 0 && findAndExpand(dept.children)) {
          setDeptSections((prev) => ({ ...prev, [dept.id]: true }));
          return true;
        }
      }
      return false;
    };
    if (!findAndExpand(deptContacts)) {
      // 未匹配部门：至少展开单位机构组
      setDeptSections((prev) => ({ ...prev, org: true, _all: false }));
    }
  }, [deptContacts]);

  const countdownRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ── 全局倒计时：每秒根据 burnRevealedAt 计算剩余时间 ──
  useEffect(() => {
    const timer = setInterval(() => {
      setMessages((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (!m.burn || !m.burnRevealedAt || m.burnScheduled) return m;
          const elapsed = (Date.now() - new Date(m.burnRevealedAt).getTime()) / 1000;
          const remaining = Math.max(0, (m.burnSeconds || 10) - elapsed);
          if (remaining <= 0) {
            changed = true;
            return null as any;
          }
          return m;
        }).filter(Boolean);
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── 启动倒计时（本地UI用） ──
  const startBurnCountdown = useCallback((messageId: string, seconds: number) => {
    const old = countdownRefs.current.get(messageId);
    if (old) clearInterval(old);
    let remaining = seconds;
    const timer = setInterval(() => {
      remaining--;
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
        // 更新消息的 revealedBy 列表和 burnRevealedAt
        setMessages((prev) => prev.map((m) =>
          m.id === data.messageId
            ? { ...m, revealedBy: data.revealedBy, revealedForMe: data.revealedBy.includes(user.username), content: data.content || m.content, burnRevealedAt: data.burnRevealedAt || m.burnRevealedAt }
            : m
        ));
        // 如果是当前用户揭示的，启动倒计时
        if (data.revealedByUser === user.username) {
          startBurnCountdown(data.messageId, data.seconds);
        }
      }
      fetchConvs();
    });

    // 指定接收人加密：接收人解密成功后更新消息内容
    s.on('chat:secret-revealed', (data: any) => {
      if (data.conversationId === selectedIdRef.current && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)));
      }
      fetchConvs();
    });

    s.on('chat:burning', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        // 只有已揭示的用户才启动倒计时
        setMessages((prev) => {
          const msg = prev.find((m) => m.id === data.messageId);
          if (msg?.revealedForMe && !msg.burnRevealedAt) {
            startBurnCountdown(data.messageId, data.seconds);
          }
          return prev.map((m) => m.id === data.messageId ? { ...m, burnScheduled: true } : m);
        });
      }
    });

    s.on('chat:burned', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
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

    s.on('chat:edited', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)));
      }
      fetchConvs();
    });

    s.on('chat:reaction', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.map((m) => (m.id === data.message.id ? data.message : m)));
      }
    });

    s.on('chat:message-pinned', (data: any) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessages((prev) => prev.map((m) => ({ ...m, pinned: !!data.messageId && m.id === data.messageId })));
      }
      fetchConvs();
    });

    s.on('chat:history-cleared', (data: any) => {
      if (data.conversationId === selectedIdRef.current) setMessages([]);
      fetchConvs();
    });

    s.on('chat:left', (data: any) => {
      if (data.conversationId === selectedIdRef.current) setSelectedId(null);
      fetchConvs();
    });

    s.on('chat:group-updated', (data: any) => {
      fetchConvs();
    });

    s.on('chat:presence', (data: any) => {
      setOnlineUsers((prev) => { const next = new Set(prev); if (data.online) next.add(data.username); else next.delete(data.username); return next; });
    });
    s.on('chat:presence-list', (data: any) => { setOnlineUsers(new Set(data.online || [])); });

    s.on('chat:call:offer', (data: any) => {
      if (data.from === user.username) return;
      setIncomingCall(data);
      setCallState('incoming');
    });
    s.on('chat:call:answer', async (data: any) => {
      try {
        if (pcRef.current && data.answer) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState('connected');
        }
      } catch {}
    });
    s.on('chat:call:ice', async (data: any) => {
      try { if (pcRef.current && data.candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
    });
    s.on('chat:call:end', () => cleanupCall());
    s.on('chat:call:decline', () => cleanupCall());

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
        // 默认全部展开
        const sections: Record<string, boolean> = {};
        sections['org'] = true;
        sections['_all'] = true;
        list.forEach((group: any) => {
          sections[group.id] = true;
          if (group.children) {
            group.children.forEach((dept: any) => {
              sections[dept.id] = true;
            });
          }
        });
        setDeptSections(sections);
      })
      .catch(() => {});

    // 获取聊天分组配置
    fetch(`${API_BASE}/org/chat-groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const groups = Array.isArray(d) ? d : [];
        setChatGroups(groups);
        // 初始化分组展开状态（默认全部折叠）
        const sections: Record<string, boolean> = {};
        groups.forEach((g: any) => { sections[g.id] = false; });
        sections['chat_root'] = false;
        sections['single'] = false;
        setConvSections(sections);
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

  const setAdminToggle = async (username: string) => {
    if (!selectedId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${selectedId}/admins/${username}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchGroupMembers(selectedId);
    } catch {}
  };

  const transferOwner = async (username: string) => {
    if (!selectedId || !confirm(`确定要将群主转让给 ${username} 吗？`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${selectedId}/transfer-owner`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        fetchGroupMembers(selectedId);
        fetchConvs();
      }
    } catch {}
  };

  // ── Telegram 风格社交功能 ──

  const api = async (url: string, method = 'GET', body?: any) => {
    const token = localStorage.getItem('token');
    const opts: any = { method, headers: { Authorization: `Bearer ${token}` } };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(`${API_BASE}${url}`, opts);
    return res.json();
  };

  const setPref = async (conversationId: string, patch: any) => {
    try { await api(`/chat/conversations/${conversationId}/prefs`, 'PUT', patch); fetchConvs(); } catch {}
  };

  const togglePin = (conversationId: string, cur: boolean) => setPref(conversationId, { pinned: !cur });
  const toggleMute = (conversationId: string, cur: boolean) => setPref(conversationId, { muted: !cur });
  const toggleArchive = (conversationId: string, cur: boolean) => setPref(conversationId, { archived: !cur });

  const clearHistory = async () => {
    if (!selectedId || !confirm('确定要清空当前聊天的全部记录吗？此操作不可恢复。')) return;
    try { await api(`/chat/conversations/${selectedId}/history`, 'DELETE'); } catch {}
  };

  const deleteConversation = async () => {
    if (!selectedId || !confirm('确定要删除当前聊天吗？（仅从你的会话列表移除）')) return;
    try { await api(`/chat/conversations/${selectedId}`, 'DELETE'); setSelectedId(null); fetchConvs(); } catch {}
  };

  const leaveGroup = async () => {
    if (!selectedId || !confirm('确定要退出该群聊吗？')) return;
    try { await api(`/chat/conversations/${selectedId}/leave`, 'POST'); } catch {}
  };

  const openGroupEdit = () => {
    if (!selectedConv) return;
    setGroupEditName(selectedConv.name || '');
    setGroupEditDesc(selectedConv.description || '');
    setGroupEditAvatar(selectedConv.avatar || '');
    setShowGroupEditDialog(true);
  };

  const saveGroupProfile = async () => {
    if (!selectedId || !groupEditName.trim()) return;
    try {
      await api(`/chat/conversations/${selectedId}/profile`, 'PUT', { name: groupEditName, description: groupEditDesc, avatar: groupEditAvatar });
      setShowGroupEditDialog(false);
      fetchConvs();
    } catch {}
  };

  const startEdit = (m: any) => { setEditingMsgId(m.id); setEditingText(m.content || ''); };
  const cancelEdit = () => { setEditingMsgId(null); setEditingText(''); };
  const saveEdit = async () => {
    if (!selectedId || !editingMsgId || !editingText.trim()) return;
    try {
      await api(`/chat/conversations/${selectedId}/messages/${editingMsgId}`, 'PUT', { content: editingText });
      cancelEdit();
    } catch {}
  };

  const openForward = (messageId: string) => { setForwardMsgId(messageId); setForwardTarget(''); setShowForwardDialog(true); };
  const doForward = async () => {
    if (!forwardMsgId || !forwardTarget) return;
    const srcConv = messages.find((m) => m.id === forwardMsgId)?.conversationId;
    if (!srcConv) return;
    try {
      await api(`/chat/messages/${forwardMsgId}/forward`, 'POST', { conversationId: forwardTarget, sourceConversationId: srcConv });
      setShowForwardDialog(false);
    } catch {}
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedId) return;
    try { await api(`/chat/conversations/${selectedId}/messages/${messageId}/reaction`, 'POST', { emoji }); } catch {}
  };

  const togglePinMessage = async (messageId: string) => {
    if (!selectedId) return;
    try { await api(`/chat/conversations/${selectedId}/pinned-message`, 'PUT', { messageId }); } catch {}
  };
  const unpinMessage = async () => {
    if (!selectedId) return;
    try {
      await api(`/chat/conversations/${selectedId}/pinned-message`, 'PUT', { messageId: null });
      fetchConvs();
    } catch {}
  };

  // ── 语音录制 ──
  const startRecording = async () => {
    if (recording || !selectedId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const dur = recordingSec;
        if (dur < 1) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          socket?.emit('chat:send', { conversationId: selectedId, content: base64, contentType: 'voice', duration: dur });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setRecordingSec(0);
      recordingTimerRef.current = setInterval(() => setRecordingSec((s) => s + 1), 1000);
    } catch (e: any) {
      alert(e?.message || '无法访问麦克风');
    }
  };
  const stopRecording = (cancel = false) => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      if (cancel) {
        mr.onstop = null;
        mr.stop();
        mr.stream.getTracks().forEach((t: any) => t.stop());
      } else {
        mr.stop();
      }
    }
    setRecording(false);
    setRecordingSec(0);
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };
  const playVoice = (id: string, base64: string) => {
    if (playingVoiceId === id) {
      audioPlayRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    try {
      if (audioPlayRef.current) { audioPlayRef.current.pause(); }
      const a = new Audio(base64);
      audioPlayRef.current = a;
      setPlayingVoiceId(id);
      a.onended = () => setPlayingVoiceId(null);
      a.onerror = () => setPlayingVoiceId(null);
      a.play();
    } catch { setPlayingVoiceId(null); }
  };

  // ── 视频通话 ──
  const RTC_CFG: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const cleanupCall = useCallback(() => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState('idle');
    setIncomingCall(null);
    setCallMuted(false);
    setCallCamOff(false);
  }, []);
  const startVideoCall = async () => {
    if (!selectedConv || selectedConv.type !== 'single' || !otherUsername || !socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; }
      const pc = new RTCPeerConnection(RTC_CFG);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('chat:call:ice', { conversationId: selectedId, target: otherUsername, candidate: e.candidate });
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('chat:call:offer', { conversationId: selectedId, target: otherUsername, offer });
      setCallState('calling');
    } catch (e: any) { alert(e?.message || '无法启动摄像头/麦克风'); cleanupCall(); }
  };
  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection(RTC_CFG);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('chat:call:ice', { conversationId: incomingCall.conversationId, target: incomingCall.from, candidate: e.candidate });
      };
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('chat:call:answer', { conversationId: incomingCall.conversationId, target: incomingCall.from, answer });
      setCallState('connected');
    } catch (e: any) { alert(e?.message || '接听失败'); cleanupCall(); }
  };
  const declineCall = () => {
    if (incomingCall && socket) socket.emit('chat:call:decline', { conversationId: incomingCall.conversationId, target: incomingCall.from });
    cleanupCall();
  };
  const hangupCall = () => {
    if (socket && otherUsername) socket.emit('chat:call:end', { conversationId: selectedId, target: otherUsername });
    if (incomingCall && socket) socket.emit('chat:call:end', { conversationId: incomingCall.conversationId, target: incomingCall.from });
    cleanupCall();
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
            if (m.burn && m.revealedForMe && m.burnRevealedAt) {
              startBurnCountdown(m.id, m.burnSeconds || 10);
            }
          });
        }
      })
      .catch(() => {});
    // 恢复草稿
    const conv = convs.find((c) => c.id === selectedId);
    if (conv?.draft) setInput(conv.draft); else setInput('');
    setReplyTo(null); setEditingMsgId(null);
    socket?.emit('chat:open', { conversationId: selectedId });
    socket?.emit('chat:read', { conversationId: selectedId });
    // 群聊加载成员列表
    const conv2 = convs.find((c) => c.id === selectedId);
    if (conv2?.type === 'group') {
      fetchGroupMembers(selectedId);
    } else {
      setGroupMembers([]);
    }
    // 已读后刷新会话列表（更新未读计数）
    setTimeout(() => fetchConvs(), 500);
  }, [selectedId, me]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // ── 文件发送 ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedFile({ name: file.name, size: file.size, type: file.type, data: base64 });
      if (isImageFile(file.name)) {
        setFilePreview(base64);
      } else {
        setFilePreview('');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const sendFile = async () => {
    if (!selectedFile || !socket || !selectedId) return;
    const isImg = isImageFile(selectedFile.name);
    socket.emit('chat:send', {
      conversationId: selectedId,
      content: selectedFile.data,
      contentType: isImg ? 'image' : 'file',
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
    });
    setSelectedFile(null);
    setFilePreview('');
  };
  const clearFile = () => { setSelectedFile(null); setFilePreview(''); };

  // 草稿防抖保存
  useEffect(() => {
    if (!selectedId || !me) return;
    const t = setTimeout(() => {
      if (input.trim()) setPref(selectedId, { draft: input });
    }, 800);
    return () => clearTimeout(t);
  }, [input, selectedId]);

  const sendMessage = () => {
    if (!socket || !selectedId || !input.trim()) return;
    // 检测@提及
    const mentionMatch = input.match(/@(\S+)/g) || [];
    const mentions = mentionMatch.map(m => m.substring(1));
    socket.emit('chat:send', { 
      conversationId: selectedId, 
      content: input.trim(), 
      encrypted, 
      secretTarget: encrypted && selectedConv?.type === 'group' ? secretTarget : undefined,
      burn, 
      burnSeconds: burn ? burnSec : undefined, 
      burnTarget: burn && selectedConv?.type === 'group' ? burnTarget : undefined,
      replyTo: replyTo?.id || '',
      mention: mentions
    });
    // 发送后清空草稿
    setPref(selectedId, { draft: '' });
    setInput(''); setEncrypted(false); setSecretTarget(''); setBurn(false); setBurnTarget(''); setReplyTo(null); inputRef.current?.focus();
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

  // 指定接收人加密：用密码解密
  const revealSecret = (messageId: string) => {
    if (!socket || !selectedId || !secretPasswordInput.trim()) return;
    socket.emit('chat:secret-reveal', {
      conversationId: selectedId,
      messageId,
      password: secretPasswordInput.trim(),
    });
    setSecretInputMsgId(null);
    setSecretPasswordInput('');
  };

  // 复制密码卡片后自动销毁
  const copySecretKey = async (cardId: string, password: string) => {
    try { await navigator.clipboard.writeText(password); } catch {}
    if (socket) socket.emit('chat:secret-copied', { cardId });
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
        // 自动展开单聊分区
        setConvSections((prev) => ({ ...prev, single: true }));
        fetchConvs();
      }
    } catch {}
  };

  const createGroup = async () => {
    if (!groupName.trim() || newGroupMembers.length === 0) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/chat/conversations/group`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, members: newGroupMembers, category: groupCategory }),
    });
    const conv = await res.json();
    setSelectedId(conv.id);
    setShowGroupDialog(false); setGroupName(''); setNewGroupMembers([]); setGroupCategory('custom');
    // 自动展开对应分区
    const sectionMap: Record<string, string> = { department: 'dept', custom: 'custom', project: 'proj', subsidiary: 'sub' };
    setConvSections((prev) => ({ ...prev, [sectionMap[groupCategory] || 'custom']: true }));
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
    selectedConv.owner === me.username || (selectedConv.admins || []).includes(me.username) || (ROLE_LEVELS[me.role] || 0) >= 60
  );
  const isGroupOwner = selectedConv?.owner === me?.username;
  const typingList = Array.from(typingUsers.entries()).filter(([u, t]) => Date.now() - t < 4000).map(([u]) => u);
  const filteredConvs = convs.filter((c) => !c.archived && (!searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())));
  const archivedConvs = convs.filter((c) => c.archived && (!searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())));

  // 三级分组逻辑：一级(根) → 二级(子类) → 三级(实际群聊规则)
  const getGroupForConv = (c: any): string => {
    if (c.type !== 'group') return 'single';
    const did = c.departmentId || '';
    // 查找匹配的三级分组
    for (const g of chatGroups) {
      if (g.departmentIds && g.departmentIds.includes(did)) return g.id;
    }
    // 无 departmentId 的自建群归入其他群组
    return chatGroups.find((g: any) => g.id === 'group_other')?.id || 'group_other';
  };

  // 构建通用分组树（按 parentId 递归，层级不限）
  // 自动升级：若某分组只有一个子分组且自身无直挂会话，则直接把该子分组提升为顶级，不显示多余的上级层级
  // 折叠：若某分组下仅有一个直挂会话且无子分组，则取消分组，只保留该群
  const buildGroupTree = (parentId: string | null): any[] =>
    chatGroups
      .filter((g: any) => (g.parentId ?? null) === parentId)
      .map((g: any) => {
        const children = buildGroupTree(g.id);
        const convs = filteredConvs.filter((c: any) => getGroupForConv(c) === g.id);
        if (children.length === 1 && convs.length === 0) return children[0];
        if (convs.length === 1 && children.length === 0) return { ...g, conversations: convs, children: [], collapsed: true };
        return { ...g, conversations: convs, children };
      });
  const groupedTree = buildGroupTree(null);
  const countGroupConvs = (n: any): number =>
    n.conversations.length + (n.children || []).reduce((s: number, c: any) => s + countGroupConvs(c), 0);

  const singleConvs = filteredConvs.filter((c) => c.type === 'single');

  // 递归渲染分组树节点
  const renderConvItem = (c: any) => (
    <div key={c.id} onClick={() => setSelectedId(c.id)} onContextMenu={(e) => { e.preventDefault(); setSelectedId(c.id); }}
      className={`flex items-center gap-3 px-3 py-2.5 pl-14 cursor-pointer transition-colors border-b border-gray-50 ${c.id === selectedId ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <div className="relative flex-shrink-0">
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-emerald-100 text-emerald-600"><Users className="w-3.5 h-3.5" /></AvatarFallback>
        </Avatar>
        {c.archived && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white rounded-full" title="已归档" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 truncate">
            {c.pinned && <span className="text-amber-500 mr-1">📌</span>}
            {c.muted && <span className="text-gray-300 mr-1">🔇</span>}
            {c.name}
          </span>
          {c.lastMessageAt && <span className="text-[10px] text-gray-400">{formatTime(c.lastMessageAt)}</span>}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Users className="w-3 h-3 text-gray-300 flex-shrink-0" />
          <p className="text-[11px] text-gray-400 truncate">{c.draft ? <span className="text-orange-400">[草稿] {c.draft}</span> : (c.lastMessage || '暂无消息')}</p>
        </div>
      </div>
      {!c.muted && c.unread > 0 && <Badge className="bg-blue-500 text-white text-[9px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{c.unread > 99 ? '99+' : c.unread}</Badge>}
      {c.muted && c.unread > 0 && <span className="text-[10px] text-gray-300">{c.unread}</span>}
    </div>
  );

  // 递归渲染分组树节点
  const renderGroupNode = (node: any, depth: number): React.ReactNode => {
    const count = countGroupConvs(node);
    if (count === 0) return null;
    const isExpanded = convSections[node.id] !== false;
    const colorMap: Record<string, string> = { blue: 'text-blue-600', purple: 'text-purple-600', emerald: 'text-emerald-600', amber: 'text-amber-600', gray: 'text-gray-500' };
    const indent = depth === 1 ? 'pl-6' : depth === 2 ? 'pl-10' : depth === 3 ? 'pl-14' : 'pl-16';
    if (node.collapsed) return <div key={node.id}>{node.conversations.map(renderConvItem)}</div>;
    return (
      <div key={node.id}>
        {/* 分组标题 */}
        <div onClick={() => setConvSections((p) => ({ ...p, [node.id]: isExpanded ? false : true }))}
          className={`flex items-center gap-2 ${indent} py-2 cursor-pointer hover:bg-gray-50 select-none border-b ${depth === 1 ? 'border-gray-200 bg-gray-50/50' : 'border-gray-100'}`}>
          <span className={`text-[10px] text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
          <span className={colorMap[node.color] || 'text-gray-600'}>{node.icon}</span>
          <span className={`${depth === 1 ? 'text-sm font-bold text-gray-700' : depth === 2 ? 'text-xs font-medium text-gray-600' : 'text-[11px] text-gray-500'}`}>{node.name}</span>
          <span className="text-[10px] text-gray-400 ml-auto">{count}</span>
        </div>
        {isExpanded && node.conversations.map(renderConvItem)}
        {isExpanded && (node.children || []).map((child: any) => renderGroupNode(child, depth + 1))}
      </div>
    );
  };

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

              {/* 群聊（最高级别） */}
              <div>
                <div onClick={() => setConvSections((p) => ({ ...p, chat_root: convSections.chat_root !== false ? false : true }))}
                  className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-200 bg-gray-50">
                  <span className={`text-[10px] text-gray-400 transition-transform ${convSections.chat_root !== false ? 'rotate-90' : ''}`}>▶</span>
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-sm font-bold text-gray-700">群聊</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{groupedTree.reduce((s: number, n: any) => s + countGroupConvs(n), 0)}</span>
                </div>
                {convSections.chat_root !== false && groupedTree.map((node: any) => renderGroupNode(node, 1))}
              </div>

              {/* 单聊（最高级别） */}
              <div>
                <div onClick={() => setConvSections((p) => ({ ...p, single: convSections.single !== false ? false : true }))}
                  className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-200 bg-gray-50">
                  <span className={`text-[10px] text-gray-400 transition-transform ${convSections.single !== false ? 'rotate-90' : ''}`}>▶</span>
                  <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-sm font-bold text-gray-700">单聊</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{singleConvs.length}</span>
                </div>
                {convSections.single !== false && singleConvs.map((c) => {
                  const isSelected = c.id === selectedId;
                  const otherUsername = c.members.find((m: string) => m !== me?.username) || me?.username;
                  const otherUserData = otherUsername ? userMap.get(otherUsername) : null;
                  const displayName = otherUserData?.name || otherUsername;
                  const isOnline = onlineUsers.has(otherUsername);
                  return (
                    <div key={c.id} onClick={() => setSelectedId(c.id)} onContextMenu={(e) => { e.preventDefault(); setSelectedId(c.id); }}
                      className={`flex items-center gap-3 px-3 py-3 pl-6 cursor-pointer transition-colors border-b border-gray-50 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">{displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {c.pinned && <span className="text-amber-500 mr-1">📌</span>}
                            {c.muted && <span className="text-gray-300 mr-1">🔇</span>}
                            {displayName}
                          </span>
                          {c.lastMessageAt && <span className="text-[10px] text-gray-400">{formatTime(c.lastMessageAt)}</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-xs text-gray-400 truncate">{c.draft ? <span className="text-orange-400">[草稿] {c.draft}</span> : (c.lastMessage || '暂无消息')}</p>
                        </div>
                      </div>
                      {!c.muted && c.unread > 0 && <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{c.unread > 99 ? '99+' : c.unread}</Badge>}
                      {c.muted && c.unread > 0 && <span className="text-[10px] text-gray-300">{c.unread}</span>}
                    </div>
                  );
                })}
</div>
            </div>

              {/* 已归档分区 */}
              {archivedConvs.length > 0 && (
                <div>
                  <div onClick={() => setConvSections((p) => ({ ...p, archived: convSections.archived !== false ? false : true }))}
                    className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-200 bg-gray-50">
                    <span className={`text-[10px] text-gray-400 transition-transform ${convSections.archived !== false ? 'rotate-90' : ''}`}>▶</span>
                    <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5h18v2H3zM5 9v10h14V9M10 12h4"/></svg>
                    <span className="text-sm font-bold text-gray-700">已归档</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{archivedConvs.length}</span>
                  </div>
                  {convSections.archived !== false && archivedConvs.map((c: any) => (
                    <div key={c.id} onClick={() => setSelectedId(c.id)} onContextMenu={(e) => { e.preventDefault(); setSelectedId(c.id); }}
                      className="flex items-center gap-3 px-3 py-2.5 pl-6 cursor-pointer transition-colors border-b border-gray-50 hover:bg-gray-50">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gray-100 text-gray-500">{c.type === 'group' ? <Users className="w-3.5 h-3.5" /> : (userMap.get(c.members.find((m: string) => m !== me?.username))?.name?.[0]?.toUpperCase() || 'U')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {c.pinned && <span className="text-amber-500 mr-1">📌</span>}
                          {c.type === 'group' ? c.name : (userMap.get(c.members.find((m: string) => m !== me?.username))?.name || c.name)}
                        </span>
                        <p className="text-[11px] text-gray-400 truncate">{c.lastMessage || '暂无消息'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {(() => {
                // 全体成员（虚拟组原始数据）
                const allGroupData = deptContacts.find((g: any) => g.isVirtual);
                const users = allGroupData?.members || [];
                const filteredUsers = contactSearch
                  ? users.filter((u: any) =>
                      u.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                      u.position.toLowerCase().includes(contactSearch.toLowerCase()) ||
                      (u.department || '').toLowerCase().includes(contactSearch.toLowerCase()))
                  : users;

                // 扁平化部门树，建立 deptId -> dept 节点映射（含后代）
                const flattenDepts = (nodes: any[]): any[] => {
                  const out: any[] = [];
                  for (const n of nodes || []) {
                    if (!n.isVirtual) { out.push(n); if (n.children?.length) out.push(...flattenDepts(n.children)); }
                  }
                  return out;
                };
                const allDeptNodes = flattenDepts(deptContacts.filter((g: any) => !g.isVirtual));
                const deptIdToDept = new Map(allDeptNodes.map((d: any) => [d.id, d]));
                const deptNameToId = new Map(allDeptNodes.map((d: any) => [d.name, d.id]));
                // 递归收集后代部门Ids
                const collectDescendantIds = (deptId: string, acc: Set<string>) => {
                  acc.add(deptId);
                  const dept = deptIdToDept.get(deptId);
                  if (dept?.children) {
                    for (const child of dept.children) collectDescendantIds(child.id, acc);
                  }
                };
                const getDeptIdsWithDescendants = (deptIds: string[]): Set<string> => {
                  const s = new Set<string>();
                  for (const id of deptIds) collectDescendantIds(id, s);
                  return s;
                };

                // 构建分组树（按 chatGroups 配置，和消息分组完全一致）
                const buildContactGroupTree = (parentId: string | null): any[] =>
                  chatGroups
                    .filter((g: any) => (g.parentId ?? null) === parentId)
                    .map((g: any) => {
                      const deptIds = g.departmentIds || [];
                      // 该分组直接关联的用户（含后代部门）
                      let groupUsers: any[] = [];
                      if (deptIds.length > 0) {
                        const expandedIds = getDeptIdsWithDescendants(deptIds);
                        groupUsers = filteredUsers.filter((u: any) => {
                          const uid = deptNameToId.get(u.department);
                          return uid ? expandedIds.has(uid) : false;
                        });
                      }
                      const children = buildContactGroupTree(g.id);
                      const childUsers = children.flatMap((c: any) => c.members || []);
                      // 合并时去重
                      const allUsers = [...new Map([...groupUsers, ...childUsers].map((u: any) => [u.username, u])).values()];
                      return { ...g, members: allUsers, children };
                    });

                const groupTree = buildContactGroupTree(null);

                // 渲染单个分组节点
                const renderContactGroupNode = (node: any, depth: number): React.ReactNode => {
                  const count = node.members?.length || 0;
                  if (count === 0 && (!node.children || node.children.length === 0)) return null;
                  const isExpanded = deptSections[node.id] === true;
                  const colorMap: Record<string, string> = { blue: 'text-blue-600', purple: 'text-purple-600', emerald: 'text-emerald-600', amber: 'text-amber-600', gray: 'text-gray-500' };
                  const indent = depth === 1 ? 'pl-6' : depth === 2 ? 'pl-10' : depth === 3 ? 'pl-14' : 'pl-16';
                  return (
                    <div key={node.id}>
                      <div onClick={() => setDeptSections((p) => ({ ...p, [node.id]: isExpanded ? false : true }))}
                        className={`flex items-center gap-2 ${indent} py-2 cursor-pointer hover:bg-gray-50 select-none border-b ${depth === 1 ? 'border-gray-200 bg-gray-50/50' : 'border-gray-100'}`}>
                        <span className={`text-[10px] text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <span className={colorMap[node.color] || 'text-gray-600'}>{node.icon}</span>
                        <span className={`${depth === 1 ? 'text-sm font-bold text-gray-700' : depth === 2 ? 'text-xs font-medium text-gray-600' : 'text-[11px] text-gray-500'}`}>{node.name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{count}人</span>
                      </div>
                      {isExpanded && count > 0 && (
                        <div>
                          {/* 若有搜索，按单位内过滤，否则展示全部成员（支持按单位查询） */}
                          {node.members
                            .filter((u: any) => !contactSearch || u.name.toLowerCase().includes(contactSearch.toLowerCase()) || u.position.toLowerCase().includes(contactSearch.toLowerCase()))
                            .map((u: any) => {
                            const isOnline = onlineUsers.has(u.username);
                            const isMe = me?.role === 'super_admin' || me?.role === 'high_admin';
                            return (
                              <div key={u.username}
                                className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-50 transition-colors select-none group"
                                style={{ paddingLeft: `${indent === 'pl-6' ? 24 : indent === 'pl-10' ? 38 : 52}px` }}>
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
                                  <p className="text-[10px] text-gray-400 truncate">{u.position}{u.department ? ` · ${u.department}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {isOnline && <span className="text-[10px] text-emerald-500">在线</span>}
                                  {isMe && me?.username !== u.username && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteContact(u.username); }}
                                      className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" title="删除联系人">
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
                      {isExpanded && node.children?.map((child: any) => renderContactGroupNode(child, depth + 1))}
                    </div>
                  );
                };

                return (
                  <>
                    {groupTree.map((node: any) => renderContactGroupNode(node, 1))}
                    {/* 恢复按姓氏首字母全体成员分组 */}
                    {!contactSearch && allGroupData && (() => {
                      const sorted = sortByPinyin(users);
                      const buckets: Record<string, any[]> = {};
                      sorted.forEach((u: any) => {
                        const letter = pinyinInitial(u.name);
                        (buckets[letter] = buckets[letter] || []).push(u);
                      });
                      const isAllExpanded = deptSections['_all'] === true;
                      const totalCount = users.length;
                      return (
                        <div>
                          <div onClick={() => setDeptSections((prev) => ({ ...prev, _all: isAllExpanded ? false : true }))}
                            className="sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50 select-none bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs transition-transform ${isAllExpanded ? 'rotate-90' : ''}`}>▶</span>
                              <span className="text-sm font-bold text-gray-800">全体成员</span>
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{totalCount}人</span>
                              <span className="text-[10px] text-gray-400">按姓氏首字母</span>
                            </div>
                          </div>
                          {isAllExpanded && (
                            <div>
                              {Object.keys(buckets).sort().map((letter) => (
                                <div key={letter}>
                                  <div className="sticky top-[41px] z-10 px-4 py-1 bg-gray-50/90 border-b border-gray-100 text-[10px] font-bold text-gray-400">{letter}</div>
                                  {buckets[letter].map((u: any) => {
                                    const isOnline = onlineUsers.has(u.username);
                                    return (
                                      <div key={u.username}
                                        className="flex items-center gap-3 pl-8 pr-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-50 transition-colors select-none"
                                        onClick={() => { setLeftTab('messages'); openSingle(u.username); }}>
                                        <div className="relative flex-shrink-0">
                                          <Avatar className="w-8 h-8">
                                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                          </Avatar>
                                          {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                            {u.isHead && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0 rounded font-medium">负责人</span>}
                                            {u.isDeputy && <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0 rounded font-medium">副职</span>}
                                          </div>
                                          <p className="text-[10px] text-gray-400 truncate">{u.position} · {u.department}</p>
                                        </div>
                                        {isOnline && <span className="text-[10px] text-emerald-500">在线</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {/* 搜索时：跨单位匹配结果汇总 */}
                    {contactSearch && (() => {
                      if (filteredUsers.length === 0) return <div className="text-center text-gray-400 py-8 text-xs">暂无匹配成员</div>;
                      return (
                        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                          <p className="text-xs text-gray-500 mb-2">搜索匹配 ({filteredUsers.length}人) — 可按单位展开查看，上方各分组已按单位过滤</p>
                          {sortByPinyin(filteredUsers).slice(0, 30).map((u: any) => {
                            const isOnline = onlineUsers.has(u.username);
                            return (
                              <div key={u.username} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-blue-50 rounded transition-colors" onClick={() => { setLeftTab('messages'); openSingle(u.username); }}>
                                <div className="relative flex-shrink-0">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                  </Avatar>
                                  {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                  <p className="text-[10px] text-gray-400">{u.position} · {u.department}</p>
                                </div>
                                {isOnline && <span className="text-[10px] text-emerald-500">在线</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
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
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 mr-1 hidden xl:inline-flex"><Lock className="w-3 h-3 mr-1" />端到端加密可用</Badge>
              <Button size="sm" variant="ghost" onClick={() => togglePin(selectedConv.id, selectedConv.pinned)} className="h-7 px-1.5" title={selectedConv.pinned ? '取消置顶' : '置顶会话'}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={selectedConv.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 17v5M6 13l2-1V6h8v6l2 1-4 4h-4l-4-4z"/></svg>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleMute(selectedConv.id, selectedConv.muted)} className="h-7 px-1.5" title={selectedConv.muted ? '取消静音' : '静音'}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleArchive(selectedConv.id, selectedConv.archived)} className="h-7 px-1.5" title={selectedConv.archived ? '取消归档' : '归档'}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5h18v2H3zM5 9v10h14V9M10 12h4"/></svg>
              </Button>
              <Button size="sm" variant="ghost" onClick={clearHistory} className="h-7 px-1.5" title="清空聊天记录">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
              </Button>
              <Button size="sm" variant="ghost" onClick={deleteConversation} className="h-7 px-1.5" title="删除会话">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </Button>
              {selectedConv.type === 'group' && (
                <Button size="sm" variant="ghost" onClick={leaveGroup} className="h-7 px-1.5" title="退出群聊">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setShowMsgSearch(!showMsgSearch)} className="h-7 px-1.5" title="搜索消息"><Search className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { setGlobalSearchOpen(true); setGlobalSearchQuery(''); setGlobalSearchResults([]); }} className="h-7 px-1.5" title="全局搜索"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></Button>
              <Button size="sm" variant="ghost" onClick={() => { setSavedMessagesOpen(true); loadSavedMessages(); }} className="h-7 px-1.5" title="已保存消息"><Bookmark className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={openGroupEdit} className="h-7 px-1.5" title="群信息编辑"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></Button>
              {selectedConv.type === 'single' && (
                <Button size="sm" variant={callState !== 'idle' ? 'default' : 'ghost'} onClick={() => { if (callState === 'idle') startVideoCall(); else hangupCall(); }} className={`h-7 px-2 ${callState !== 'idle' ? 'bg-emerald-600 text-white' : ''}`} title={callState === 'idle' ? '视频通话' : '挂断'}>
                  {callState === 'idle' ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </Button>
              )}
              {selectedConv.type === 'group' && (
                <Button size="sm" variant={showGroupInfo ? 'default' : 'ghost'} onClick={() => setShowGroupInfo(!showGroupInfo)} className="h-7 px-2" title="群成员管理">
                  <Users className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
            {/* 会话内消息搜索 */}
            {showMsgSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input autoFocus value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)} placeholder="搜索消息内容..." className="h-8 pl-8 text-sm bg-white" />
              </div>
            )}
            {/* 群公告置顶条 */}
            {selectedConv?.pinnedMessage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <span className="text-amber-600 font-medium">📌 群公告</span>
                <span className="text-gray-600 truncate flex-1">
                  {userMap.get(selectedConv.pinnedMessage.sender)?.name || selectedConv.pinnedMessage.sender}: {selectedConv.pinnedMessage.content}
                </span>
                {isGroupAdmin && <button onClick={unpinMessage} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
              </div>
            )}
            {messages.length === 0 && <div className="text-center text-gray-400 py-16">暂无消息，发送第一条消息开始聊天</div>}
            {(() => {
              let lastDate = '';
              return messages.filter((m) => !msgSearch || (m.content || '').toLowerCase().includes(msgSearch.toLowerCase())).map((m) => {
              const curDate = m.createdAt ? new Date(m.createdAt).toDateString() : '';
              const showDateDivider = curDate !== lastDate;
              lastDate = curDate;
              const isMine = m.sender === me?.username;
              const readCount = (m.readBy || []).filter((r: string) => r !== m.sender).length;
              // 发送者始终看到内容；接收者需揭示后才看到
              const isBurnHidden = m.burn && !m.revealedForMe && !isMine;
              const isBurnRevealed = m.burn && (m.revealedForMe || isMine);
              const isSecretKeyCard = m.contentType === 'secret-key';
              const isSecretLocked = m.encrypted && m.secretTarget && !isMine && !(m.secretRevealedBy || []).includes(me?.username);
              const isVoice = m.contentType === 'voice';
              // 加密/阅后即焚消息：不提供转发、点赞、编辑、公告等操作
              const isNoInteract = !!(m.encrypted || m.burn || isVoice);

              return (
                <div key={m.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center py-1">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {new Date(m.createdAt).toDateString() === new Date().toDateString() ? '今天' : formatMsgTime(m.createdAt).slice(0, 10)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`} onMouseEnter={() => setHoveredMsgId(m.id)} onMouseLeave={() => setHoveredMsgId(null)}>
                  <div className={`max-w-[70%] ${isMine ? 'order-2' : ''}`}>
                    {/* 回复引用 */}
                    {m.replyTo && (() => {
                      const repliedMsg = messages.find(msg => msg.id === m.replyTo);
                      if (!repliedMsg) return null;
                      return (
                        <div className="mb-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 border-l-2 border-blue-400">
                          <span className="font-medium text-blue-600">{userMap.get(repliedMsg.sender)?.name || repliedMsg.sender}:</span>
                          <span className="ml-1 truncate">{repliedMsg.encrypted || repliedMsg.burn ? (repliedMsg.encrypted ? '🔒 加密消息' : '🔥 阅后即焚') : (repliedMsg.content?.substring(0, 50) + (repliedMsg.content?.length > 50 ? '...' : ''))}</span>
                        </div>
                      );
                    })()}
                    {/* @提及提示 */}
                    {m.mentionedUsers?.includes(me?.username) && !isMine && (
                      <div className="mb-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                        @你
                      </div>
                    )}
                    {!isMine && selectedConv.type === 'group' && (
                      <p className="text-[10px] text-gray-400 mb-0.5 ml-1">
                        {(() => { const u = userMap.get(m.sender); return u ? `${u.name || m.sender}` : m.sender; })()}
                        {(() => { const u = userMap.get(m.sender); const dept = u?.department || ''; return dept ? <span className="text-gray-300 ml-1">· {getDeptLabel(dept)}</span> : null; })()}
                      </p>
                    )}

                    {/* 消息操作按钮 */}
                    {hoveredMsgId === m.id && !isBurnHidden && (
                      <div className={`flex gap-1 mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <button onClick={() => setReplyTo(m)} disabled={isNoInteract} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" title="回复">↩ 回复</button>
                        {!isNoInteract && <button onClick={() => openForward(m.id)} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600" title="转发">↪ 转发</button>}
                        {!isNoInteract && <button onClick={async() => { await navigator.clipboard.writeText(m.content||''); }} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600" title="复制">⎘ 复制</button>}
                        {isMine && !isNoInteract && (
                          <button onClick={() => startEdit(m)} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600" title="编辑">✎ 编辑</button>
                        )}
                        {!isNoInteract && (
                          <button onClick={async() => { await saveMessage(m.id); }} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-amber-100 hover:text-amber-600 rounded text-gray-600" title="保存">⭐ 保存</button>
                        )}
                        {isGroupAdmin && !isNoInteract && (
                          <button onClick={() => togglePinMessage(m.id)} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-amber-100 hover:text-amber-600 rounded text-gray-600" title="设为群公告">
                            {m.pinned ? '取消公告' : '📌 公告'}
                          </button>
                        )}
                        {isMine && (() => {
                          const msgTime = new Date(m.createdAt).getTime();
                          const canRecall = Date.now() - msgTime < 2 * 60 * 1000;
                          return canRecall ? (
                            <button onClick={() => burnNow(m.id)} className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded text-gray-600" title="撤回">撤回</button>
                          ) : null;
                        })()}
                        {/* 表情回应快捷条 */}
                        {!isNoInteract && (
                          <span className="flex items-center gap-0.5 ml-1">
                            {REACTION_EMOJIS.slice(0, 5).map((e) => (
                              <button key={e} onClick={() => toggleReaction(m.id, e)} className="px-1 py-0.5 text-[11px] bg-gray-100 hover:bg-amber-50 rounded hover:scale-110 transition-transform" title={`回应 ${e}`}>{e}</button>
                            ))}
                          </span>
                        )}
                      </div>
                    )}

                    {isSecretKeyCard ? (
                      <div className={`px-3 py-2.5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 text-sm ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow">
                            <KeyRound className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-emerald-700">加密消息密码</p>
                            <p className="text-xs font-mono text-emerald-800 break-all select-all">{m.content}</p>
                            <p className="text-[9px] text-emerald-500 mt-0.5">复制后自动销毁</p>
                          </div>
                          <button onClick={() => copySecretKey(m.id, m.content)}
                            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors">
                            复制密码
                          </button>
                        </div>
                        <div className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : ''}`}>
                          <span className="text-[10px] text-gray-400">{formatMsgTime(m.createdAt)}</span>
                        </div>
                      </div>

                    ) : isSecretLocked ? (
                      <div className={`px-3 py-2.5 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 text-sm ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow">
                            <Lock className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-purple-700">加密消息（指定接收人）</p>
                            <p className="text-[10px] text-purple-400 mt-0.5">输入单聊收到的密码解密</p>
                          </div>
                        </div>
                        {secretInputMsgId === m.id ? (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Input autoFocus value={secretPasswordInput} onChange={(e) => setSecretPasswordInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') revealSecret(m.id); if (e.key === 'Escape') { setSecretInputMsgId(null); setSecretPasswordInput(''); } }}
                              placeholder="输入密码" className="h-8 text-sm" />
                            <Button size="sm" onClick={() => revealSecret(m.id)} disabled={!secretPasswordInput.trim()} className="h-8 px-3"><KeyRound className="w-3.5 h-3.5" />解密</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setSecretInputMsgId(null); setSecretPasswordInput(''); }} className="h-8 px-2"><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        ) : (
                          <button onClick={() => setSecretInputMsgId(m.id)}
                            className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors">
                            <KeyRound className="w-3.5 h-3.5" />输入密码查看
                          </button>
                        )}
                        <div className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : ''}`}>
                          <span className="text-[10px] text-gray-400">{formatMsgTime(m.createdAt)}</span>
                        </div>
                      </div>

                    ) : isBurnHidden ? (
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
                            <span className="text-[10px] text-amber-500">{formatMsgTime(m.createdAt)}</span>
                            {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3 text-amber-400" /> : <Check className="w-3 h-3 text-amber-400" />)}
                          </div>
                        </div>
                        {/* 倒计时进度条：基于 burnRevealedAt 计算 */}
                        {m.burnRevealedAt && (() => {
                          const elapsed = (Date.now() - new Date(m.burnRevealedAt).getTime()) / 1000;
                          const remaining = Math.max(0, (m.burnSeconds || 10) - elapsed);
                          if (remaining <= 0) return null;
                          return (
                            <div className="flex items-center gap-2 mt-1 ml-1">
                              <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(remaining / (m.burnSeconds || 10)) * 100}%` }} />
                              </div>
                              <span className="text-[10px] text-orange-500 font-mono tabular-nums">{Math.ceil(remaining)}s</span>
                            </div>
                          );
                        })()}
                        {/* 发送者：即时焚毁按钮 */}
                        {isMine && !m.burnRevealedAt && (
                          <div className="flex justify-end mt-1">
                            <button onClick={() => burnNow(m.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-medium transition-colors">
                              <Flame className="w-3 h-3" />立即焚毁
                            </button>
                          </div>
                        )}
                      </div>

                    ) : m.contentType === 'image' ? (
                      <div className={`rounded-2xl overflow-hidden shadow-sm ${isMine ? 'bg-blue-500 rounded-br-md' : 'bg-white border border-gray-200 rounded-bl-md'} ${selectMode ? 'cursor-pointer ring-2 ring-blue-400' : ''}`}
                        onClick={selectMode ? () => toggleSelectMsg(m.id) : undefined}>
                        <img src={m.content} alt={m.fileName || '图片'} className="max-w-full max-h-[300px] object-cover cursor-zoom-in"
                          onClick={(e) => { e.stopPropagation(); openImageViewer(m, messages.filter((mm: any) => mm.contentType === 'image')); }} />
                        {m.caption && <div className={`px-3 py-1.5 text-xs ${isMine ? 'text-white' : 'text-gray-600'}`}>{m.caption}</div>}
                        <div className={`flex items-center gap-1 px-3 py-1 ${isMine ? 'bg-blue-600 text-blue-100' : 'bg-gray-50 text-gray-400'}`}>
                          <span className="text-[10px]">{formatMsgTime(m.createdAt).slice(11, 16)}</span>
                          {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                        </div>
                      </div>
                    ) : m.contentType === 'file' ? (
                      <div className={`rounded-2xl p-3 ${isMine ? 'bg-blue-500 rounded-br-md' : 'bg-white border border-gray-200 rounded-bl-md'} shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Paperclip className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{m.fileName || '文件'}</p>
                            <p className="text-xs text-blue-100">{m.fileSize ? (m.fileSize < 1024*1024 ? `${(m.fileSize/1024).toFixed(1)} KB` : `${(m.fileSize/1024/1024).toFixed(1)} MB`) : ''}</p>
                          </div>
                          <a href={m.content} download={m.fileName || 'file'} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors" title="下载">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                          </a>
                        </div>
                        <div className={`flex items-center gap-1 mt-2 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{formatMsgTime(m.createdAt).slice(11, 16)}</span>
                          {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                        </div>
                      </div>
                    ) : isVoice ? (
                      <div className={`px-3 py-2 rounded-2xl flex items-center gap-2.5 ${isMine ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'} shadow-sm`}>
                        <button onClick={() => playVoice(m.id, m.content)} className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} transition-colors`}>
                          {playingVoiceId === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex items-center gap-[2px] flex-1">
                          {Array.from({ length: Math.min(24, Math.max(8, Math.ceil((m.duration || 1) * 1.5))) }).map((_, i) => (
                            <div key={i} className={`w-[2px] rounded-full ${isMine ? 'bg-white/60' : 'bg-blue-300'} ${playingVoiceId === m.id ? 'animate-pulse' : ''}`} style={{ height: `${6 + Math.abs(Math.sin(i * 1.2)) * 10}px` }} />
                          ))}
                        </div>
                        <span className={`text-xs font-mono tabular-nums flex-shrink-0 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>{m.duration || 0}″</span>
                        <span className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>{formatMsgTime(m.createdAt).slice(11, 16)}</span>
                        {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3 text-blue-100 flex-shrink-0" /> : <Check className="w-3 h-3 text-blue-100 flex-shrink-0" />)}
                      </div>
                    ) : (
                      <div>
                        {/* 编辑消息输入框 */}
                        {editingMsgId === m.id ? (
                          <div className="px-3 py-2 rounded-2xl bg-yellow-50 border border-yellow-300">
                            <div className="flex items-center gap-1 mb-1.5">
                              <span className="text-[10px] font-medium text-yellow-700">编辑消息</span>
                            </div>
                            <Input autoFocus value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="h-8 text-sm" />
                            <div className="flex justify-end gap-1.5 mt-1.5">
                              <button onClick={cancelEdit} className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600">取消</button>
                              <button onClick={saveEdit} disabled={!editingText.trim()} className="px-2 py-0.5 text-[10px] bg-blue-500 hover:bg-blue-600 rounded text-white disabled:opacity-50">保存</button>
                            </div>
                          </div>
                        ) : (
                          <div className={`px-3 py-2 rounded-2xl text-sm ${
                            m.encrypted ? 'bg-purple-50 border border-purple-200 text-purple-800' :
                            isMine ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
                          } ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                            {/* 转发来源 */}
                            {m.forwardFrom && (
                              <div className={`flex items-center gap-1 mb-1 ${isMine ? 'text-blue-100' : 'text-gray-400'} text-[10px]`}>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                <span>转发自 {userMap.get(m.forwardFrom.sender)?.name || m.forwardFrom.sender}</span>
                              </div>
                            )}
                            {m.encrypted && (<div className="flex items-center gap-1 mb-1"><Lock className="w-3 h-3 opacity-60" /><span className="text-[10px] opacity-60">{m.secretTarget ? `已加密 · 发送给 ${userMap.get(m.secretTarget)?.name || m.secretTarget}` : '已加密'}</span></div>)}
                            <p className="break-words">{m.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                              <span className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>{formatMsgTime(m.createdAt)}</span>
                              {m.edited && <span className={`text-[9px] ${isMine ? 'text-blue-100' : 'text-gray-300'}`}>已编辑</span>}
                              {m.pinned && <span className="text-[9px] text-amber-500">📌</span>}
                              {isMine && (readCount > 0 ? <CheckCheck className="w-3 h-3 text-blue-100" /> : <Check className="w-3 h-3 text-blue-100" />)}
                            </div>
                          </div>
                        )}
                        {/* 表情回应展示 */}
                        {!isNoInteract && (m.reactions || []).length > 0 && (
                          <div className={`flex gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {m.reactions.map((r: any) => {
                              const reacted = (r.users || []).includes(me?.username);
                              return (
                                <button key={r.emoji} onClick={() => toggleReaction(m.id, r.emoji)}
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] border transition-colors ${reacted ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'}`}>
                                  {r.emoji} {r.users.length}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                </div>
              );
            });
            })()}
            {typingList.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-2"><Clock className="w-3 h-3 animate-spin" />{typingList.join('、')} 正在输入...</div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-gray-200 p-3 bg-white">
            {/* 回复引用 */}
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg text-xs">
                <span className="text-blue-600 font-medium">回复 {userMap.get(replyTo.sender)?.name || replyTo.sender}:</span>
                <span className="text-gray-600 truncate flex-1">{replyTo.content?.substring(0, 30)}{replyTo.content?.length > 30 ? '...' : ''}</span>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {recording && (
                <div className="flex items-center gap-2 flex-1 bg-red-50 border border-red-200 rounded-lg px-3 h-9">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-red-600 tabular-nums">{Math.floor(recordingSec / 60)}:{String(recordingSec % 60).padStart(2, '0')}</span>
                  <span className="text-xs text-red-400 flex-1">正在录音...</span>
                  <Button size="sm" variant="ghost" onClick={() => stopRecording(true)} className="h-7 px-2 text-gray-500"><X className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" onClick={() => stopRecording(false)} className="h-7 px-3 bg-red-500 hover:bg-red-600 text-white"><Send className="w-3.5 h-3.5 mr-1" />发送 {recordingSec}″</Button>
                </div>
              )}
              <div className={`flex items-center gap-2 flex-1 ${recording ? 'hidden' : ''}`}>
              <Button size="sm" variant={recording ? 'default' : 'ghost'} onClick={() => { if (recording) stopRecording(false); else startRecording(); }} className={`h-8 px-2 ${recording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`} title={recording ? '点击发送' : '按住录音'}><Mic className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="h-8 px-2" title="表情"><span className="text-lg">😊</span></Button>
              <Button size="sm" variant={encrypted ? 'default' : 'ghost'} onClick={() => { setEncrypted(!encrypted); if (!encrypted) setBurn(false); }} className={`h-8 px-2 ${encrypted ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}`} title={encrypted ? '已开启加密（需指定接收人）' : '开启加密（指定接收人）'}><Lock className="w-3.5 h-3.5" /></Button>
              {encrypted && (
                <>
                  {selectedConv?.type === 'group' ? (
                    <select value={secretTarget} onChange={(e) => setSecretTarget(e.target.value)} className="h-8 text-xs rounded-lg border border-purple-200 bg-purple-50 px-2 focus:outline-none max-w-[160px]">
                      <option value="">选择接收人</option>
                      {selectedConv.members.filter((m: string) => m !== me?.username).map((m: string) => {
                        const user = userMap.get(m);
                        return <option key={m} value={m}>{user?.name || m}</option>;
                      })}
                    </select>
                  ) : (
                    <span className="h-8 flex items-center px-2 rounded-lg bg-purple-50 text-[11px] text-purple-500 border border-purple-200">自动发给对方</span>
                  )}
                </>
              )}
              <Button size="sm" variant={burn ? 'default' : 'ghost'} onClick={() => { setBurn(!burn); if (!burn) setEncrypted(true); }} className={`h-8 px-2 ${burn ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`} title={burn ? '已开启阅后即焚' : '开启阅后即焚'}><Flame className="w-3.5 h-3.5" /></Button>
              {burn && (
                <>
                  <select value={burnSec} onChange={(e) => setBurnSec(Number(e.target.value))} className="h-8 text-xs rounded-lg border border-amber-200 bg-amber-50 px-2 focus:outline-none">
                    {BURN_SECONDS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {selectedConv?.type === 'group' && (
                    <select value={burnTarget} onChange={(e) => setBurnTarget(e.target.value)} className="h-8 text-xs rounded-lg border border-amber-200 bg-amber-50 px-2 focus:outline-none max-w-[160px]">
                      <option value="">选择接收人</option>
                      {selectedConv.members.filter((m: string) => m !== me?.username).map((m: string) => {
                        const user = userMap.get(m);
                        return <option key={m} value={m}>{user?.name || m}</option>;
                      })}
                    </select>
                  )}
                </>
              )}
              <Input ref={inputRef} value={input} onChange={(e) => { setInput(e.target.value); handleTyping(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={encrypted ? (selectedConv?.type === 'group' ? (secretTarget ? `输入加密消息（发送给 ${userMap.get(secretTarget)?.name || secretTarget}）...` : '请选择接收人...') : '输入加密消息...') : burn ? `输入阅后即焚消息（${burnSec}s后销毁）...` : '输入消息... @提及某人'} className="flex-1 h-9 text-sm" />
              <Button size="sm" onClick={sendMessage} disabled={!input.trim() || (burn && selectedConv?.type === 'group' && !burnTarget) || (encrypted && selectedConv?.type === 'group' && !secretTarget)} className="h-9 px-3"><Send className="w-4 h-4" /></Button>
              </div>
              </div>
            {/* 表情选择器 */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 right-4 bg-white border rounded-lg shadow-lg p-2 flex gap-1 flex-wrap w-48 z-50">
                {['😊', '😂', '👍', '🙏', '❤️', '🔥', '👏', '😮', '😢', '😡', '🎉', '✅'].map((emoji) => (
                  <button key={emoji} onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-xl p-1 hover:bg-gray-100 rounded">{emoji}</button>
                ))}
              </div>
            )}
            {/* 文件预览条 */}
            {selectedFile && (
              <div className="mt-2 p-2 bg-gray-50 border rounded-lg flex items-center gap-3">
                {filePreview ? (
                  <img src={filePreview} alt="预览" className="w-12 h-12 object-cover rounded border" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center"><Paperclip className="w-5 h-5 text-blue-500" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-400">{selectedFile.size < 1024 * 1024 ? `${(selectedFile.size / 1024).toFixed(1)} KB` : `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-400" onClick={clearFile}><X className="w-3.5 h-3.5" /></Button>
                <Button size="sm" onClick={sendFile} className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-xs"><Send className="w-3.5 h-3.5 mr-1" />发送</Button>
              </div>
            )}
          </div>
          </div>

          {/* 群成员管理面板（钉钉风格） */}
          {showGroupInfo && selectedConv?.type === 'group' && (
            <div ref={groupInfoRef} className="w-72 border-l border-gray-200 flex flex-col bg-white flex-shrink-0">
              {/* 群信息头部 */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-lg"><Users className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{selectedConv.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{groupMembers.length} 人</p>
                  </div>
                </div>
              </div>

              {/* 操作按钮区 */}
              {isGroupAdmin && (
                <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
                  <button onClick={() => { setSelectedMembersToAdd([]); setAddMemberSearch(''); setShowAddMembersDialog(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors">
                    <UserPlus className="w-3.5 h-3.5" />添加
                  </button>
                  <button onClick={openGroupEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>编辑
                  </button>
                  <button onClick={leaveGroup}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>退群
                  </button>
                </div>
              )}
              {!isGroupAdmin && (
                <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
                  <button onClick={leaveGroup}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>退出群聊
                  </button>
                </div>
              )}

              {/* 成员列表 */}
              <div className="flex-1 overflow-y-auto">
                {groupMembers.length === 0 && (
                  <div className="text-center text-gray-400 py-8 text-xs">暂无成员信息</div>
                )}

                {/* 群主 */}
                {groupMembers.filter((gm) => gm.isOwner).length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-400 font-medium">群主</div>
                    {groupMembers.filter((gm) => gm.isOwner).map((gm: any) => (
                      <MemberItem key={gm.username} gm={gm} isGroupAdmin={isGroupAdmin} isGroupOwner={isGroupOwner} me={me}
                        onChat={openSingle} onSetAdmin={setAdminToggle} onRemove={removeMemberFromGroup} onTransfer={transferOwner}
                        onInfoClick={(e, m) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMemberInfoPos({ x: rect.right + 8, y: Math.min(rect.top, window.innerHeight - 220) });
                          setMemberInfo(memberInfo?.username === m.username ? null : m);
                        }} />
                    ))}
                  </div>
                )}

                {/* 管理员 */}
                {groupMembers.filter((gm) => gm.isAdmin && !gm.isOwner).length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-400 font-medium">管理员</div>
                    {groupMembers.filter((gm) => gm.isAdmin && !gm.isOwner).map((gm: any) => (
                      <MemberItem key={gm.username} gm={gm} isGroupAdmin={isGroupAdmin} isGroupOwner={isGroupOwner} me={me}
                        onChat={openSingle} onSetAdmin={setAdminToggle} onRemove={removeMemberFromGroup} onTransfer={transferOwner}
                        onInfoClick={(e, m) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMemberInfoPos({ x: rect.right + 8, y: Math.min(rect.top, window.innerHeight - 220) });
                          setMemberInfo(memberInfo?.username === m.username ? null : m);
                        }} />
                    ))}
                  </div>
                )}

                {/* 普通成员 */}
                {groupMembers.filter((gm) => !gm.isAdmin && !gm.isOwner).length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-400 font-medium">成员</div>
                    {groupMembers.filter((gm) => !gm.isAdmin && !gm.isOwner).map((gm: any) => (
                      <MemberItem key={gm.username} gm={gm} isGroupAdmin={isGroupAdmin} isGroupOwner={isGroupOwner} me={me}
                        onChat={openSingle} onSetAdmin={setAdminToggle} onRemove={removeMemberFromGroup} onTransfer={transferOwner}
                        onInfoClick={(e, m) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMemberInfoPos({ x: rect.right + 8, y: Math.min(rect.top, window.innerHeight - 220) });
                          setMemberInfo(memberInfo?.username === m.username ? null : m);
                        }} />
                    ))}
                  </div>
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
                  {memberInfo.department && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-16 flex-shrink-0">机构</span>
                      <button onClick={() => { gotoDept(memberInfo.department); setMemberInfo(null); }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                        <Contact className="w-3 h-3" />查看机构
                      </button>
                    </div>
                  )}
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
              <label className="text-sm font-medium text-gray-700 mb-1 block">群分类</label>
              <select value={groupCategory} onChange={(e) => setGroupCategory(e.target.value)} className="w-full h-9 text-sm rounded-lg border border-gray-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="custom">自建群</option>
                <option value="department">部门群</option>
                <option value="project">项目部群</option>
                <option value="subsidiary">分子公司群</option>
              </select>
            </div>
             <div>
               <label className="text-sm font-medium text-gray-700 mb-1 block">选择成员</label>
               <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg">
                  {flattenDeptTree(deptContacts.filter((g: any) => !g.isVirtual)).map(({ dept, depth }) => {
                      const members = dept.members.filter((m: any) => !newGroupMembers.includes(m.username));
                      const expanded = groupDialogDeptSections[dept.id] === true;
                      if (members.length === 0 && dept.members.filter((m: any) => newGroupMembers.includes(m.username)).length === 0) return null;
                      return (
                        <div key={dept.id} className="border-b border-gray-50 last:border-b-0">
                          <div onClick={() => setGroupDialogDeptSections((p) => ({ ...p, [dept.id]: !expanded }))}
                            className="flex items-center gap-2 pl-6 pr-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none"
                            style={{ paddingLeft: `${6 + depth * 14}px` }}>
                            <span className={`text-[10px] text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                            <span className="text-xs font-semibold text-gray-600">{dept.name}</span>
                            <span className="text-[10px] text-gray-400">{dept.members.length}人</span>
                          </div>
                          {expanded && dept.members.map((u: any) => {
                            const selected = newGroupMembers.includes(u.username);
                            return (
                              <div key={u.username} onClick={() => setNewGroupMembers((prev) => selected ? prev.filter((m) => m !== u.username) : [...prev, u.username])}
                                className={`flex items-center gap-2.5 pl-10 pr-3 py-1.5 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                style={{ paddingLeft: `${10 + depth * 14}px` }}>
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
                {flattenDeptTree(deptContacts.filter((g: any) => !g.isVirtual)).map(({ dept, depth }) => {
                    if (dept.members.length === 0) return null;
                    const expanded = singleDialogDeptSections[dept.id] === true;
                    return (
                      <div key={dept.id} className="border-b border-gray-50 last:border-b-0">
                        <div onClick={() => setSingleDialogDeptSections((p) => ({ ...p, [dept.id]: !expanded }))}
                          className="flex items-center gap-2 pl-6 pr-3 py-1.5 cursor-pointer hover:bg-gray-50 select-none"
                          style={{ paddingLeft: `${6 + depth * 14}px` }}>
                          <span className={`text-[10px] text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                          <span className="text-xs font-semibold text-gray-600">{dept.name}</span>
                          <span className="text-[10px] text-gray-400">{dept.members.length}人</span>
                        </div>
                        {expanded && dept.members.map((u: any) => (
                          <div key={u.username} onClick={() => { openSingle(u.username); setShowSingleDialog(false); }}
                            className="flex items-center gap-2.5 pl-10 pr-3 py-2 cursor-pointer hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 last:border-b-0 transition-colors select-none"
                            style={{ paddingLeft: `${10 + depth * 14}px` }}>
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
              {flattenDeptTree(deptContacts.filter((g: any) => !g.isVirtual)).map(({ dept, depth }) => {
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
                        className="flex items-center justify-between pl-6 pr-3 py-2 cursor-pointer hover:bg-gray-50 select-none"
                        style={{ paddingLeft: `${6 + depth * 14}px` }}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                          <span className="text-xs font-semibold text-gray-600">{dept.name}</span>
                          <span className="text-[10px] text-gray-400">{filtered.length}人可选</span>
                        </div>
                      </div>
                      {isExpanded && filtered.map((u: any) => {
                        const selected = selectedMembersToAdd.includes(u.username);
                        return (
                          <div key={u.username} onClick={() => setSelectedMembersToAdd((prev) => selected ? prev.filter((m) => m !== u.username) : [...prev, u.username])}
                            className={`flex items-center gap-2.5 pl-10 pr-3 py-2 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            style={{ paddingLeft: `${10 + depth * 14}px` }}>
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

      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>转发消息</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">选择要转发的目标会话：</p>
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y divide-gray-100">
              {convs.filter((c) => c.id !== selectedId).map((c) => {
                const otherUsername = c.type === 'single' ? (c.members.find((m: string) => m !== me?.username) || me?.username) : null;
                const displayName = c.type === 'group' ? c.name : (otherUsername ? (userMap.get(otherUsername)?.name || otherUsername) : c.name);
                return (
                  <div key={c.id} onClick={() => setForwardTarget(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 ${forwardTarget === c.id ? 'bg-blue-50' : ''}`}>
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-gray-100 text-gray-500 text-[10px]">{c.type === 'group' ? <Users className="w-3 h-3" /> : (displayName?.[0]?.toUpperCase() || 'U')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 truncate">{displayName}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForwardDialog(false)}>取消</Button>
              <Button size="sm" disabled={!forwardTarget} onClick={doForward}>转发</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGroupEditDialog} onOpenChange={setShowGroupEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>编辑群信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">群名称</label>
              <Input value={groupEditName} onChange={(e) => setGroupEditName(e.target.value)} placeholder="群名称" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">群简介</label>
              <Input value={groupEditDesc} onChange={(e) => setGroupEditDesc(e.target.value)} placeholder="群简介（可选）" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">头像（可选）</label>
              <Input value={groupEditAvatar} onChange={(e) => setGroupEditAvatar(e.target.value)} placeholder="头像颜色或名称" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGroupEditDialog(false)}>取消</Button>
              <Button size="sm" disabled={!groupEditName.trim()} onClick={saveGroupProfile}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 来电弹窗 */}
      {callState === 'incoming' && incomingCall && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <Card className="w-80 p-6 text-center">
            <Avatar className="w-16 h-16 mx-auto mb-3">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">{userMap.get(incomingCall.from)?.name?.[0] || incomingCall.from?.[0]}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-gray-900">{userMap.get(incomingCall.from)?.name || incomingCall.from}</p>
            <p className="text-xs text-gray-500 mt-1">邀请你进行视频通话...</p>
            <div className="flex gap-3 justify-center mt-5">
              <Button onClick={declineCall} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"><PhoneOff className="w-4 h-4 mr-1" />拒绝</Button>
              <Button onClick={acceptCall} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Video className="w-4 h-4 mr-1" />接听</Button>
            </div>
          </Card>
        </div>
      )}

      {/* 视频通话界面 */}
      {callState !== 'idle' && callState !== 'incoming' && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
            {!remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                <Video className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">{callState === 'calling' ? '正在呼叫...' : '等待对方...'}</p>
                <p className="text-xs mt-1">{otherUserName || otherUsername}</p>
              </div>
            )}
            <video ref={localVideoRef} autoPlay playsInline muted className={`absolute bottom-4 right-4 w-32 h-24 rounded-lg bg-gray-900 object-cover border-2 border-white/20 shadow-lg ${callCamOff ? 'hidden' : ''}`} />
            <div className="absolute top-4 left-4 flex items-center gap-2 text-white text-sm">
              <span className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              {callState === 'calling' ? '呼叫中' : '通话中'} · {otherUserName || otherUsername}
            </div>
          </div>
          <div className="h-20 bg-black flex items-center justify-center gap-4">
            <button onClick={() => { if (localStreamRef.current) { const t = localStreamRef.current.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setCallMuted(!t.enabled); } } }} className={`w-12 h-12 rounded-full flex items-center justify-center ${callMuted ? 'bg-red-600 text-white' : 'bg-white/15 text-white hover:bg-white/25'}`}>
              {callMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={hangupCall} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center">
              <PhoneOff className="w-6 h-6" />
            </button>
            <button onClick={() => { if (localStreamRef.current) { const t = localStreamRef.current.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCallCamOff(!t.enabled); } } }} className={`w-12 h-12 rounded-full flex items-center justify-center ${callCamOff ? 'bg-red-600 text-white' : 'bg-white/15 text-white hover:bg-white/25'}`}>
              {callCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Telegram 风格：图片大图查看器 ── */}
      {imageViewerOpen && (
        <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button onClick={closeImageViewer} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <X className="w-6 h-6" />
          </button>
          {imageViewerIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }} className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={imageViewerSrc} alt="预览" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            {imageViewerMessages[imageViewerIndex]?.caption && (
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 px-4 py-2 rounded-lg">{imageViewerMessages[imageViewerIndex].caption}</p>
            )}
          </div>
          {imageViewerIndex < imageViewerMessages.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); navigateImage('next'); }} className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
            {imageViewerIndex + 1} / {imageViewerMessages.length}
          </div>
        </div>
      )}

      {/* ── Telegram 风格：多选模式工具栏 ── */}
      {selectMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-2xl shadow-2xl">
          <span className="text-white text-sm font-medium mr-2">{selectedMsgIds.size} 已选</span>
          <button onClick={handleBatchDelete} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors">删除</button>
          <button onClick={handleBatchForward} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors">转发</button>
          <button onClick={() => { setSelectMode(false); setSelectedMsgIds(new Set()); }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">取消</button>
        </div>
      )}

      {/* ── Telegram 风格：全局搜索面板 ── */}
      {globalSearchOpen && (
        <div className="fixed inset-0 z-[65] bg-black/50 flex items-start justify-center pt-20" onClick={() => setGlobalSearchOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearchInput(e.target.value)}
                placeholder="搜索所有会话..."
                className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
              />
              <button onClick={() => setGlobalSearchOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {globalSearchLoading && (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />搜索中...
                </div>
              )}
              {!globalSearchLoading && globalSearchResults.length === 0 && globalSearchQuery.length >= 2 && (
                <div className="text-center py-8 text-gray-400 text-sm">暂无搜索结果</div>
              )}
              {!globalSearchLoading && globalSearchResults.map((result: any) => (
                <div key={result.msgId} onClick={() => { setSelectedId(result.convId); setGlobalSearchOpen(false); }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">{(result.convName || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{result.convName}</span>
                      <span className="text-[10px] text-gray-400">{result.senderName || result.sender}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {result.content && result.searchText && (
                        <><span>{result.content.substring(0, result.searchStart)}</span>
                        <span className="bg-yellow-200 text-gray-900 px-0.5">{result.searchText}</span>
                        <span>{result.content.substring(result.searchStart + result.searchText.length)}</span></>
                      ) || result.content}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(result.createdAt)}</p>
                  </div>
                  {result.contentType === 'image' && <ImageIcon className="w-4 h-4 text-gray-400" />}
                  {result.contentType === 'file' && <Paperclip className="w-4 h-4 text-gray-400" />}
                  {result.contentType === 'voice' && <Mic className="w-4 h-4 text-gray-400" />}
                </div>
              ))}
              {globalSearchQuery.length < 2 && !globalSearchLoading && (
                <div className="text-center py-8 text-gray-400 text-xs">输入至少2个字符开始搜索</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Telegram 风格：已保存消息面板 ── */}
      {savedMessagesOpen && (
        <div className="fixed inset-0 z-[65] bg-black/50 flex items-center justify-center" onClick={() => setSavedMessagesOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">📌 已保存消息</h3>
              <button onClick={() => setSavedMessagesOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {savedMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无已保存消息</p>
                  <p className="text-xs mt-1 text-gray-300">在消息操作菜单中点击"保存"即可收藏</p>
                </div>
              ) : (
                savedMessages.map((msg: any) => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">{(msg.senderName || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">{msg.senderName || msg.sender}</span>
                        <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                      </div>
                      {msg.contentType === 'image' ? (
                        <img src={msg.content} alt="" className="mt-1 max-w-[120px] max-h-[80px] rounded-lg object-cover cursor-zoom-in" onClick={() => { setImageViewerSrc(msg.content); setImageViewerOpen(true); }} />
                      ) : msg.contentType === 'file' ? (
                        <div className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-gray-100 rounded-lg">
                          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600 truncate">{msg.fileName || '文件'}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mt-1 break-words">{msg.content}</p>
                      )}
                    </div>
                    <button onClick={() => removeSavedMessage(msg.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" title="移除">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Telegram 风格：表情面板增强 ── */}
      {emojiPanelOpen && (
        <div className="absolute bottom-16 right-0 bg-white border rounded-xl shadow-2xl w-[360px] z-50 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {Object.keys(EMOJI_CATEGORIES).map(cat => (
              <button key={cat} onClick={() => setEmojiCategory(cat)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${emojiCategory === cat ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {cat === 'smileys' ? '😊' : cat === 'gestures' ? '👋' : cat === 'objects' ? '📦' : '💫'}
              </button>
            ))}
          </div>
          <div className="p-3 grid grid-cols-8 gap-1 max-h-[300px] overflow-y-auto">
            {EMOJI_CATEGORIES[emojiCategory]?.map((emoji) => (
              <button key={emoji} onClick={() => { setInput(prev => prev + emoji); setEmojiPanelOpen(false); }}
                className="text-xl p-1 hover:bg-gray-100 rounded transition-colors">{emoji}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
