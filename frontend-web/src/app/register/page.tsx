'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Building2, AlertCircle, CheckCircle2, ShieldCheck, Shield, UserCog, UserRound, HardHat, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const ROLE_OPTIONS = [
  { value: 'super_admin', label: '超级管理员', desc: '董事长 · 总经理 · 超管', icon: ShieldCheck, color: 'text-red-400 border-red-500/40 bg-red-500/10', iconColor: 'text-red-400' },
  { value: 'high_admin', label: '高权限管理员', desc: '部门/分子公司/号码公司负责人', icon: Shield, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10', iconColor: 'text-orange-400' },
  { value: 'general_admin', label: '一般管理员', desc: '部门/分子公司副手及业务主管', icon: UserCog, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10', iconColor: 'text-blue-400' },
  { value: 'employee', label: '普通职工', desc: '其他普通员工', icon: UserRound, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', iconColor: 'text-emerald-400' },
  { value: 'outsource', label: '项目外协人员', desc: '项目部外聘 · 集团劳务派遣', icon: HardHat, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10', iconColor: 'text-purple-400' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    appliedRole: '',
    regCode: '',
  });

  const validateStep1 = () => {
    if (!form.username.trim()) { setError('请输入用户名'); return false; }
    if (form.username.length < 3) { setError('用户名至少3个字符'); return false; }
    if (!form.email.trim()) { setError('请输入邮箱'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('邮箱格式不正确'); return false; }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!form.password) { setError('请输入密码'); return false; }
    if (form.password.length < 6) { setError('密码至少6个字符'); return false; }
    if (!form.confirmPassword) { setError('请确认密码'); return false; }
    if (form.password !== form.confirmPassword) { setError('两次密码输入不一致'); return false; }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (!form.appliedRole) { setError('请选择注册类别'); return false; }
    if (!form.regCode.trim()) { setError('请输入注册码'); return false; }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone || null,
          appliedRole: form.appliedRole,
          regCode: form.regCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        setSuccess(true);
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => router.replace('/'), 1500);
      } else {
        setError(data.message || '注册失败，请稍后重试');
      }
    } catch {
      setError('网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    setError('');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SG-Build</h1>
              <p className="text-sm text-blue-200">施工管理系统</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight">加入SG-Build<br />开启高效管理</h2>
          <p className="text-blue-200 text-lg mb-12">专业施工管理工具，助力企业数字化转型</p>
          <div className="space-y-4">
            {['多项目并行管理', '实时进度跟踪', '移动端现场记录', '审批流程自动化'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-blue-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧注册区 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* 移动端Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SG-Build</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">创建账户</h2>
            <p className="text-slate-400 text-sm">填写信息完成注册</p>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${s < step ? 'bg-blue-600' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <Card className="border-0 shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent className="p-8">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">注册成功！</h3>
                  <p className="text-slate-400 text-sm">您已以普通用户身份登录，权限审批中...</p>
                  <p className="text-slate-500 text-xs mt-1">所申请的权限需经超级管理员确认后生效</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.15)' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">用户名</Label>
                        <Input value={form.username} onChange={(e) => updateForm('username', e.target.value)} placeholder="请输入用户名（至少3个字符）"
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">邮箱</Label>
                        <Input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="请输入邮箱地址"
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">密码</Label>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateForm('password', e.target.value)} placeholder="请输入密码（至少6个字符）"
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 pr-12 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">确认密码</Label>
                        <div className="relative">
                          <Input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} placeholder="请再次输入密码"
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 pr-12 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div>
                        <Label className="text-slate-300 text-sm mb-3 block">选择注册类别（权限分类）</Label>
                        <div className="space-y-2.5">
                          {ROLE_OPTIONS.map((r) => {
                            const Icon = r.icon;
                            const selected = form.appliedRole === r.value;
                            return (
                              <button type="button" key={r.value} onClick={() => { updateForm('appliedRole', r.value); updateForm('regCode', ''); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selected ? r.color + ' ring-1 ring-white/20' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
                                <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? r.iconColor : 'text-slate-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-slate-300'}`}>{r.label}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                                </div>
                                {selected && <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${r.iconColor}`} />}
                              </button>
                            );
                          })}
                        </div>
                        {form.appliedRole && (
                          <div className="mt-4 p-3 rounded-lg text-xs text-slate-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            已选择「{ROLE_OPTIONS.find((r) => r.value === form.appliedRole)?.label}」· 注册后一律为普通用户，申请权限需经超级管理员二次确认后生效
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">注册码 <span className="text-slate-500">({ROLE_OPTIONS.find((r) => r.value === form.appliedRole)?.label || '未选择类别'})</span></Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input value={form.regCode} onChange={(e) => updateForm('regCode', e.target.value)} placeholder="请输入对应类别的注册码"
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-10 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">注册码由管理员按类别发放，不同类别对应不同权限</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">公司名称 <span className="text-slate-500">(选填)</span></Label>
                        <Input value={form.companyName} onChange={(e) => updateForm('companyName', e.target.value)} placeholder="请输入公司名称"
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm mb-2 block">手机号 <span className="text-slate-500">(选填)</span></Label>
                        <Input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="请输入手机号"
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-blue-500" style={{ caretColor: '#fff' }} />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    {step > 1 && (
                      <Button type="button" variant="outline" onClick={() => setStep(step - 1)}
                        className="flex-1 h-12 border-white/20 text-white hover:bg-white/10">
                        上一步
                      </Button>
                    )}
                    {step < 4 ? (
                      <Button type="button" onClick={handleNext}
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
                        下一步
                      </Button>
                    ) : (
                      <Button type="submit" disabled={loading}
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                        style={{ background: loading ? '#60a5fa' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                        {loading ? '注册中...' : '完成注册'}
                      </Button>
                    )}
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  已有账户？
                  <button onClick={() => router.push('/login')} className="text-blue-400 hover:text-blue-300 ml-1 font-medium">
                    立即登录
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-slate-500 text-xs mt-8">
            注册即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
