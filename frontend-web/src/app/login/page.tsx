'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/auth/settings`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.message) setSiteSettings(d); })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('请输入用户名和密码'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/');
      } else { setError(data.message || '登录失败'); }
    } catch { setError('网络连接失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              {siteSettings?.companyLogo ? (
                <img src={siteSettings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-8 h-8 text-white" />
              )}
            </div>
            <div><h1 className="text-2xl font-bold">{siteSettings?.companyName || 'SG-Build'}</h1><p className="text-sm text-blue-200">施工管理系统</p></div>
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight">智慧施工<br />高效管理</h2>
          <p className="text-blue-200 text-lg mb-12">集项目管理、进度跟踪、物资调度、安全巡检于一体的企业级施工管理平台</p>
          <div className="grid grid-cols-3 gap-4">
            {[{ num: '12', label: '在建项目' }, { num: '286', label: '在场人员' }, { num: '99.8%', label: '安全运行' }].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <p className="text-2xl font-bold">{s.num}</p><p className="text-xs text-blue-200 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              {siteSettings?.companyLogo ? (
                <img src={siteSettings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-xl font-bold text-white">{siteSettings?.companyName || 'SG-Build'}</span>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">欢迎登录</h2>
            <p className="text-slate-400 text-sm">请输入您的账号信息</p>
          </div>
          <Card className="border-0 shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">用户名</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">密码</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 pr-12 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" className="rounded border-white/30 bg-white/10" />记住我</label>
                  <button type="button" className="text-blue-400 hover:text-blue-300">忘记密码？</button>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold" style={{ background: loading ? '#60a5fa' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  {loading ? '登录中...' : '登 录'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  还没有账户？
                  <button onClick={() => router.push('/register')} className="text-blue-400 hover:text-blue-300 ml-1 font-medium">
                    立即注册
                  </button>
                </p>
                <p className="text-slate-600 text-xs mt-2">默认账号: admin / admin123</p>
              </div>
            </CardContent>
          </Card>
          <p className="text-center text-slate-500 text-xs mt-8">© 2026 {siteSettings?.companyName || 'SG-Build'} 施工管理系统</p>
        </div>
      </div>
    </div>
  );
}
