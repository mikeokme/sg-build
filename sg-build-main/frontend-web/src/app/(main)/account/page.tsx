'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, UserCircle, KeyRound, Save, ShieldCheck, Mail, Phone, Building2, Briefcase, Camera, X } from 'lucide-react';
import { getRoleLabel } from '@/config/roles';

const API_BASE = 'http://localhost:14725';

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no ctx')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', position: '' });

  const [pw, setPw] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [avatar, setAvatar] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initialTab = searchParams?.get('tab') === 'password' ? 'password' : 'profile';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${API_BASE}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.message) { router.replace('/login'); return; }
        setUser(d);
        setForm({ name: d.name || '', email: d.email || '', phone: d.phone || '', department: d.department || '', position: d.position || '' });
        setAvatar(d.avatar || '');
        localStorage.setItem('user', JSON.stringify(d));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 512 * 1024;
    if (file.size > maxSize) { setMessage('头像图片不能超过 512KB'); setTimeout(() => setMessage(''), 2500); return; }
    setMessage('压缩中...');
    try {
      const compressed = await compressImage(file, 256, 0.8);
      setAvatar(compressed);
      saveAvatar(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => { setAvatar(reader.result as string); saveAvatar(reader.result as string); };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const getInitial = () => {
    const n = form.name || user?.name || '';
    if (n) return n[0].toUpperCase();
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const saveAvatar = async (avatarUrl: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: avatarUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setAvatar(data.avatar || avatarUrl);
        localStorage.setItem('user', JSON.stringify(data));
        setMessage('头像已更新');
        setTimeout(() => setMessage(''), 2500);
      } else {
        setMessage(data.message || '头像上传失败');
        setTimeout(() => setMessage(''), 2500);
      }
    } catch { setMessage('头像上传失败，请重试'); setTimeout(() => setMessage(''), 2500); }
  };

  const handleRemoveAvatar = async () => {
    setAvatar('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: '' }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setMessage('头像已移除');
        setTimeout(() => setMessage(''), 2500);
      }
    } catch {}
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    setSaving(true); setMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setAvatar(data.avatar || avatar);
        localStorage.setItem('user', JSON.stringify(data));
        setMessage('个人信息已保存');
        setTimeout(() => setMessage(''), 2500);
      } else {
        setMessage(data.message || '保存失败');
      }
    } catch { setMessage('网络连接失败'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem('token');
    setPwMsg(''); setPwError('');
    if (pw.newPassword !== pw.confirmPassword) { setPwError('两次输入的新密码不一致'); return; }
    if (pw.newPassword.length < 6) { setPwError('新密码长度至少 6 位'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: pw.oldPassword, newPassword: pw.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg(data.message || '密码修改成功');
        setPw({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPwMsg(''), 2500);
      } else {
        setPwError(data.message || '密码修改失败');
      }
    } catch { setPwError('网络连接失败'); }
    finally { setPwSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">我的账户</p>
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-gray-500 text-sm mt-0.5">查看与维护您的账户信息、个人信息及登录安全</p>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="gap-1.5"><UserCircle className="w-4 h-4" />个人信息</TabsTrigger>
          <TabsTrigger value="password" className="gap-1.5"><KeyRound className="w-4 h-4" />修改密码</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative group mb-4">
                  <Avatar className="w-20 h-20">
                    {avatar && <AvatarImage src={avatar} alt="头像" className="object-cover" />}
                    <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">{getInitial()}</AvatarFallback>
                  </Avatar>
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  {avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <h3 className="text-lg font-bold text-gray-900">{form.name || user?.username}</h3>
                <p className="text-sm text-gray-500 mb-3">{user?.username}</p>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-5">{getRoleLabel(user?.role)}</Badge>
                <div className="w-full space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{form.email || '未设置邮箱'}</div>
                  <div className="flex items-center gap-2.5 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{form.phone || '未设置手机号'}</div>
                  <div className="flex items-center gap-2.5 text-gray-600"><Building2 className="w-4 h-4 text-gray-400" />{form.department || '未设置部门'}</div>
                  <div className="flex items-center gap-2.5 text-gray-600"><Briefcase className="w-4 h-4 text-gray-400" />{form.position || '未设置职位'}</div>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs text-gray-400"><ShieldCheck className="w-3.5 h-3.5" />账户已启用 · 权限由系统管理员管理</div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">编辑个人信息</CardTitle>
                <CardDescription>更新您的姓名、联系方式与工作信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>真实姓名</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入真实姓名" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>邮箱</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="请输入邮箱" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>手机号</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="请输入手机号" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>部门</Label>
                    <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="请输入所属部门" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>职位</Label>
                    <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="请输入职位" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-1.5" />{saving ? '保存中...' : '保存修改'}
                  </Button>
                  {message && <span className={`text-sm ${message === '个人信息已保存' ? 'text-emerald-600' : 'text-red-500'}`}>{message}</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="password">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">修改密码</CardTitle>
              <CardDescription>定期更换密码可有效保护账户安全</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>原密码</Label>
                <Input type="password" value={pw.oldPassword} onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} placeholder="请输入当前密码" />
              </div>
              <div className="space-y-1.5">
                <Label>新密码</Label>
                <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="至少 6 位字符" />
              </div>
              <div className="space-y-1.5">
                <Label>确认新密码</Label>
                <Input type="password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} placeholder="再次输入新密码" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleChangePassword} disabled={pwSaving}>
                  <KeyRound className="w-4 h-4 mr-1.5" />{pwSaving ? '提交中...' : '确认修改'}
                </Button>
                {pwMsg && <span className="text-sm text-emerald-600">{pwMsg}</span>}
                {pwError && <span className="text-sm text-red-500">{pwError}</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
