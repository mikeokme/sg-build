'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Video, Clock, Users, MapPin, CalendarDays, Search, X, Maximize2, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

type MeetingStatus = '未开始' | '进行中' | '已结束';

export function VideoConferencePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joining, setJoining] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [embedMode, setEmbedMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature.collection]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return [...list].sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''));
  }, [items, search]);

  const upcoming = filtered.filter((m) => m.status !== '已结束' && (!m.scheduledAt || new Date(m.scheduledAt) > now));
  const live = filtered.filter((m) => m.status === '进行中');
  const past = filtered.filter((m) => m.status === '已结束' || (m.scheduledAt && new Date(m.scheduledAt) < now));

  const fmtDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    const wds = isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const wd = wds[dt.getDay()];
    const h = dt.getHours().toString().padStart(2, '0');
    const m = dt.getMinutes().toString().padStart(2, '0');
    return isZh ? `${d} 周${wd} ${h}:${m}` : `${d} ${wd} ${h}:${m}`;
  };

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    setForm(f);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of feature.fields) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
    setForm(next);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/collections/${feature.collection}${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}「${item.title || item.id}」？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const openJoin = (item: any) => {
    setJoining(item);
    setEmbedMode(false);
    setCopied(false);
    setJoinOpen(true);
  };

  const roomName = joining ? `sgbuild-${joining.id}` : '';
  const roomUrl = roomName ? `https://meet.jit.si/${roomName}` : '';
  const webrtcSupported = typeof window !== 'undefined' && !!((window as any).RTCPeerConnection && navigator.mediaDevices);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const stats = [
    { icon: Video, label: isZh ? '会议总数' : 'Total', value: items.length, tone: 'blue' },
    { icon: Clock, label: isZh ? '即将开始' : 'Upcoming', value: upcoming.length, tone: 'purple' },
    { icon: Users, label: isZh ? '进行中' : 'Live', value: live.length, tone: 'emerald' },
    { icon: CalendarDays, label: isZh ? '已结束' : 'Past', value: past.length, tone: 'gray' },
  ];

  const statusTone = (s: string) => {
    if (s === '进行中') return 'bg-emerald-500 text-white';
    if (s === '已结束') return 'bg-gray-400 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{t('createMeeting')}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base font-semibold">{tFeat(categoryKey, feature.key)}{t('list')}</CardTitle>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} {t('count')}</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{t('noData')}</p>
              <p className="text-sm mt-1">{isZh ? '点击右上角「新建会议」预约视频会议' : 'Click "New Meeting" to schedule a video call'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-violet-50 flex flex-col items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{m.title}</p>
                      <Badge className={`${statusTone(m.status || '未开始')} text-[10px] px-1.5 py-0 border-0`}>
                        {m.status || (m.scheduledAt && new Date(m.scheduledAt) > now ? (isZh ? '未开始' : 'Upcoming') : (isZh ? '进行中' : 'Live'))}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                      {m.scheduledAt && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-gray-400" />{fmtDate(m.scheduledAt)}</span>}
                      {m.host && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" />{m.host}</span>}
                      {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{m.location}</span>}
                      {m.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{m.duration}{isZh ? '分钟' : ' min'}</span>}
                    </div>
                    {m.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{m.description}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {(m.status === '进行中' || (m.scheduledAt && new Date(m.scheduledAt) <= now)) && (
                      <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => openJoin(m)}>
                        <Video className="w-3.5 h-3.5 mr-1" />{m.status === '进行中' ? (isZh ? '入会' : 'Join') : (isZh ? '开始入会' : 'Start')}
                      </Button>
                    )}
                    {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)} title={t('edit')}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                    {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(m)} title={t('delete')}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t('editMeeting') : t('createMeeting')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {feature.fields.map((f) => (
              <div key={f.key}>
                <Label>{tField(f.key, f.label)}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">{t('pleaseSelect')}</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="mt-1"
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    placeholder={`${t('inputPlaceholder')}${tField(f.key, f.label)}`}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? t('save') : t('confirmAdd')}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={(o) => { setJoinOpen(o); if (!o) setEmbedMode(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {joining && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold pr-6">{joining.title}</DialogTitle>
                <p className="text-xs text-gray-500">
                  {joining.host && `${t('host')}: ${joining.host}`}
                  {joining.duration && ` · ${joining.duration}${isZh ? '分钟' : ' min'}`}
                  {joining.location && ` · ${joining.location}`}
                </p>
              </DialogHeader>

              <div className="rounded-lg bg-violet-50 border border-violet-100 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-violet-500 font-medium">{isZh ? '会议室' : 'Room'}</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 truncate">{roomName}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 h-8" onClick={() => handleCopy(roomName)}>
                    {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制' : 'Copy')}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={roomUrl} className="h-8 text-xs font-mono bg-white flex-1" />
                  <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => handleCopy(roomUrl)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {!webrtcSupported && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <p className="font-semibold">{isZh ? '当前浏览器不支持 WebRTC' : 'WebRTC is not available in your browser'}</p>
                    <p className="mt-1 text-amber-700">
                      {isZh
                        ? '嵌入模式需要摄像头/麦克风权限，且在部分浏览器或 HTTP 环境下会被拦截。建议点击“在新窗口加入”，会议将在新标签页中打开（权限更稳定）。'
                        : 'Embedded mode requires camera/mic permissions and may be blocked in some browsers or non-HTTPS contexts. Please use “Open in new window” for a stable experience.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10" onClick={() => window.open(roomUrl, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {isZh ? '在新窗口加入' : 'Open in new window'}
                </Button>
                {webrtcSupported && (
                  <Button variant={embedMode ? 'secondary' : 'outline'} className="h-10" onClick={() => setEmbedMode(!embedMode)}>
                    <Maximize2 className="w-4 h-4 mr-1" />
                    {embedMode ? (isZh ? '关闭嵌入' : 'Close embed') : (isZh ? '嵌入模式' : 'Embed')}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                {isZh ? '提示：首次加入需允许浏览器使用摄像头与麦克风；建议使用最新版 Chrome / Edge' : 'Tip: allow camera & microphone on first join; Chrome / Edge latest recommended'}
              </p>

              {embedMode && webrtcSupported && (
                <div className="relative h-[62vh] bg-gray-900 rounded-lg overflow-hidden border">
                  <iframe
                    src={roomUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="camera; microphone; display-capture; fullscreen; autoplay"
                    allowFullScreen
                    title={`${t('onlineRoom')} - ${joining.title}`}
                  />
                </div>
              )}
              {embedMode && !webrtcSupported && (
                <p className="text-xs text-center text-amber-600">{isZh ? '当前环境不支持嵌入，请用新窗口打开' : 'Embed not supported in this environment, please open in new window'}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
