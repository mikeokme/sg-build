'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Settings as SettingsIcon, AlertTriangle, Upload, X, Building2 } from 'lucide-react';

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
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    companyName: 'SG-Build',
    companyLogo: '',
    siteName: '',
    systemDescription: '',
    dataRetentionDays: 365,
    sessionTimeoutMin: 120,
    passwordMinLength: 6,
    loginRetryLimit: 5,
    allowPublicRegister: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    if (user?.role !== 'super_admin') { setForbidden(true); setLoading(false); return; }
    fetch(`${API_BASE}/auth/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 403) { setForbidden(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => {
        if (d && !d.message) {
          setSettings({
            companyName: d.companyName || 'SG-Build',
            companyLogo: d.companyLogo || '',
            siteName: d.siteName || '',
            systemDescription: d.systemDescription || '',
            dataRetentionDays: d.dataRetentionDays ?? 365,
            sessionTimeoutMin: d.sessionTimeoutMin ?? 120,
            passwordMinLength: d.passwordMinLength ?? 6,
            loginRetryLimit: d.loginRetryLimit ?? 5,
            allowPublicRegister: d.allowPublicRegister ?? true,
            maintenanceMode: d.maintenanceMode ?? false,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setSaving(true); setMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('系统设置已保存');
        setTimeout(() => setMessage(''), 2500);
      } else {
        setMessage(data.message || '保存失败');
      }
    } catch { setMessage('网络连接失败'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...</div>;
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
        <AlertTriangle className="w-10 h-10" />
        <p className="text-lg font-medium text-gray-600">无权访问系统设置</p>
        <p className="text-sm">仅超级管理员可修改系统设置</p>
      </div>
    );
  }

  const set = (k: string, v: any) => setSettings((prev) => ({ ...prev, [k]: v }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 1024 * 1024;
    if (file.size > maxSize) { setMessage('Logo 图片不能超过 1MB'); setTimeout(() => setMessage(''), 2500); return; }
    try {
      const compressed = await compressImage(file, 200, 0.85);
      set('companyLogo', compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => set('companyLogo', reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">系统管理</p>
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-500 text-sm mt-0.5">超级管理员专属 · 站点信息与安全策略配置</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="w-4 h-4" />站点信息</CardTitle>
          <CardDescription>公司名称、Logo 与系统简介，展示在登录页与侧边栏</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {settings.companyLogo ? (
                  <img src={settings.companyLogo} alt="公司Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Building2 className="w-6 h-6" />
                    <span className="text-[10px]">上传Logo</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-1" />{settings.companyLogo ? '更换' : '上传'}
                </Button>
                {settings.companyLogo && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => set('companyLogo', '')}>
                    <X className="w-3 h-3 mr-1" />移除
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-gray-400">建议 200×200px，≤ 512KB</p>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label>公司名称</Label>
                <Input value={settings.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="显示在侧边栏与登录页" />
              </div>
              <div className="space-y-1.5">
                <Label>系统名称</Label>
                <Input value={settings.siteName} onChange={(e) => set('siteName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>系统简介</Label>
                <Input value={settings.systemDescription} onChange={(e) => set('systemDescription', e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">安全策略</CardTitle>
          <CardDescription>账户安全相关的参数配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>密码最小长度</Label>
              <Input type="number" min={4} max={32} value={settings.passwordMinLength} onChange={(e) => set('passwordMinLength', Number(e.target.value) || 6)} />
            </div>
            <div className="space-y-1.5">
              <Label>登录失败锁定次数</Label>
              <Input type="number" min={1} max={20} value={settings.loginRetryLimit} onChange={(e) => set('loginRetryLimit', Number(e.target.value) || 5)} />
            </div>
            <div className="space-y-1.5">
              <Label>会话超时（分钟）</Label>
              <Input type="number" min={5} max={1440} value={settings.sessionTimeoutMin} onChange={(e) => set('sessionTimeoutMin', Number(e.target.value) || 120)} />
            </div>
            <div className="space-y-1.5">
              <Label>数据保留天数</Label>
              <Input type="number" min={30} max={3650} value={settings.dataRetentionDays} onChange={(e) => set('dataRetentionDays', Number(e.target.value) || 365)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">系统选项</CardTitle>
          <CardDescription>注册与维护模式的开关</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-800">允许公开注册</p><p className="text-xs text-gray-500">关闭后新用户需由管理员后台创建</p></div>
            <Switch checked={settings.allowPublicRegister} onCheckedChange={(v) => set('allowPublicRegister', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-800">维护模式</p><p className="text-xs text-gray-500">开启后仅超级管理员可访问系统</p></div>
            <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => set('maintenanceMode', v)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />{saving ? '保存中...' : '保存设置'}
        </Button>
        {message && <span className={`text-sm ${message === '系统设置已保存' ? 'text-emerald-600' : 'text-red-500'}`}>{message}</span>}
      </div>
    </div>
  );
}
