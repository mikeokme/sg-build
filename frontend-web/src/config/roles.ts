export const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  high_admin: '高权限管理员',
  general_admin: '一般管理员',
  employee: '普通职工',
  outsource: '项目外协人员',
};

export const ROLE_LEVELS: Record<string, number> = {
  super_admin: 100,
  high_admin: 80,
  general_admin: 60,
  employee: 40,
  outsource: 10,
};

export const ROLE_OPTIONS = [
  { value: 'super_admin', label: '超级管理员', desc: '董事长 · 总经理 · 超管' },
  { value: 'high_admin', label: '高权限管理员', desc: '部门/分子公司/号码公司负责人' },
  { value: 'general_admin', label: '一般管理员', desc: '部门/分子公司副手及业务主管' },
  { value: 'employee', label: '普通职工', desc: '其他普通员工' },
  { value: 'outsource', label: '项目外协人员', desc: '项目部外聘 · 集团劳务派遣' },
];

// 各业务中心所需的最低角色级别（查看）
export const CATEGORY_MIN_LEVEL: Record<string, number> = {
  oa: 10, // 外协也可用协同办公
  market: 40,
  engineering: 10, // 外协可见项目
  procurement: 40,
  material: 40,
  equipment: 40,
  finance: 60,
  quality: 40,
  hr: 60,
  platform: 100, // 平台中心仅超级管理员
  resource: 40,
};

// 各业务中心【新增】所需级别
export const CATEGORY_CREATE_LEVEL: Record<string, number> = {
  oa: 40, // 员工可发起审批/日程/任务/公告
  market: 60,
  engineering: 40, // 员工可提交进度/计划/变更
  procurement: 40, // 员工可发起采购请示/订单
  material: 40, // 员工可填出入库单
  equipment: 40,
  finance: 60,
  quality: 40, // 员工可上报隐患/检查记录
  hr: 60,
  platform: 100,
  resource: 60,
};

// 各业务中心【编辑】所需级别
export const CATEGORY_EDIT_LEVEL: Record<string, number> = {
  oa: 40,
  market: 60,
  engineering: 40,
  procurement: 40,
  material: 40,
  equipment: 40,
  finance: 60,
  quality: 40,
  hr: 60,
  platform: 100,
  resource: 60,
};

// 各业务中心【删除】所需级别（删除比增改更敏感）
export const CATEGORY_DELETE_LEVEL: Record<string, number> = {
  oa: 60,
  market: 80,
  engineering: 80,
  procurement: 80,
  material: 80,
  equipment: 80,
  finance: 80,
  quality: 80,
  hr: 80,
  platform: 100,
  resource: 80,
};

// 审批类操作（批准/驳回）所需级别
export const APPROVE_LEVEL = 60;

// 外协人员可写入的业务中心（部分功能写入）
const OUTSOURCE_WRITE_CATEGORIES = ['engineering', 'oa'];

export function getRoleLevel(role?: string | null): number {
  return ROLE_LEVELS[role || 'employee'] ?? 40;
}

export function getRoleLabel(role?: string | null): string {
  return ROLE_LABELS[role || 'employee'] ?? '普通职工';
}

export function canView(category: string, role?: string | null): boolean {
  return getRoleLevel(role) >= (CATEGORY_MIN_LEVEL[category] ?? 40);
}

export function canCreate(category: string, role?: string | null): boolean {
  if (role === 'outsource') return OUTSOURCE_WRITE_CATEGORIES.includes(category);
  return getRoleLevel(role) >= (CATEGORY_CREATE_LEVEL[category] ?? 60);
}

export function canEdit(category: string, role?: string | null): boolean {
  if (role === 'outsource') return OUTSOURCE_WRITE_CATEGORIES.includes(category);
  return getRoleLevel(role) >= (CATEGORY_EDIT_LEVEL[category] ?? 60);
}

export function canDelete(category: string, role?: string | null): boolean {
  if (role === 'outsource') return false;
  return getRoleLevel(role) >= (CATEGORY_DELETE_LEVEL[category] ?? 80);
}

export function canApprove(role?: string | null): boolean {
  return getRoleLevel(role) >= APPROVE_LEVEL;
}

// 读取当前登录用户角色
export function getCurrentRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    return JSON.parse(saved).role || null;
  } catch {
    return null;
  }
}