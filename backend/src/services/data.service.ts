import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// 五类注册码（按权限分类）
export const REG_CODES: Record<string, string> = {
  super_admin: 'SGB-ROOT-2026',
  high_admin: 'SGB-HIGH-2026',
  general_admin: 'SGB-GEN-2026',
  employee: 'SGB-EMP-2026',
  outsource: 'SGB-OUT-2026',
};

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

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// 默认种子数据
function seed(): { users: any[]; collections: Record<string, any[]> } {
  const collections: Record<string, any[]> = {};

  collections['suppliers'] = [
    { id: 's1', name: '华北建材有限公司', contact: '王强', phone: '13900000001', material: '水泥、钢筋' },
    { id: 's2', name: '恒信钢材集团', contact: '刘洋', phone: '13900000002', material: '钢材' },
  ];

  collections['materials'] = [
    { id: 'm1', name: 'P.O42.5水泥', spec: '50kg/袋', unit: '吨', price: 480 },
    { id: 'm2', name: 'HRB400螺纹钢', spec: 'Φ20', unit: '吨', price: 3650 },
    { id: 'm3', name: '河沙', spec: '中砂', unit: 'm³', price: 150 },
  ];

  collections['teams'] = [
    { id: 't1', name: '钢筋班组', leader: '赵铁柱', members: 25, project: '城南地铁站' },
    { id: 't2', name: '混凝土班组', leader: '孙建国', members: 18, project: '滨江大桥' },
  ];

  collections['projects'] = [
    { id: 'p1', name: '城南地铁站项目', code: 'XM-2024-001', manager: '陈国强', budget: 8500, startDate: '2024-03-01', endDate: '2026-06-30', status: '在建' },
    { id: 'p2', name: '滨江大桥工程', code: 'XM-2024-002', manager: '周海涛', budget: 12000, startDate: '2024-05-15', endDate: '2027-01-31', status: '在建' },
  ];

  // 审批中心
  collections['approvals'] = [
    { id: 'a1', title: '采购一批钢材的审批', applicant: 'admin', type: '采购审批', amount: 85000, date: '2026-08-10', status: '待审批' },
    { id: 'a2', title: '出差报销申请', applicant: 'admin', type: '报销审批', amount: 3600, date: '2026-08-11', status: '待审批' },
    { id: 'a3', title: '滨江大桥分包合同审批', applicant: 'admin', type: '合同审批', amount: 1500000, date: '2026-08-08', status: '已批准' },
    { id: 'a4', title: '租用塔吊申请', applicant: 'admin', type: '用款审批', amount: 120000, date: '2026-08-05', status: '已驳回' },
  ];

  // 公告通知
  collections['notices'] = [
    { id: 'n1', title: '关于2026年安全生产月的通知', publisher: '安全管理部', content: '各单位要认真组织开展安全月活动，加强现场安全管理，排查安全隐患，落实整改措施。', date: '2026-08-01', status: '已发布' },
    { id: 'n2', title: '城南地铁站项目进度协调会', publisher: '工程管理部', content: '定于本周五下午3点在项目部召开进度协调会，请各班组负责人准时参加。', date: '2026-08-12', status: '已发布' },
  ];

  // 日程管理
  collections['schedules'] = [
    { id: 'sc1', title: '项目例会', date: '2026-08-16', owner: '陈国强', location: '项目部会议室', content: '周例会' },
    { id: 'sc2', title: '安全检查', date: '2026-08-18', owner: '王安全', location: '城南地铁站现场', content: '月度安全检查' },
    { id: 'sc3', title: '材料进场验收', date: '2026-08-20', owner: '李材料', location: '材料堆场', content: '钢筋进场验收' },
  ];

  // 施工进度（甘特图）
  collections['progress'] = [
    { id: 'pr1', project: '城南地铁站项目', task: '土方开挖', startDate: '2026-03-01', endDate: '2026-04-30', progress: 100, owner: '张工' },
    { id: 'pr2', project: '城南地铁站项目', task: '主体结构施工', startDate: '2026-05-01', endDate: '2026-09-30', progress: 60, owner: '陈国强' },
    { id: 'pr3', project: '城南地铁站项目', task: '机电安装', startDate: '2026-08-01', endDate: '2026-12-31', progress: 15, owner: '刘工' },
    { id: 'pr4', project: '滨江大桥工程', task: '桩基施工', startDate: '2026-05-15', endDate: '2026-08-31', progress: 80, owner: '周海涛' },
    { id: 'pr5', project: '滨江大桥工程', task: '墩柱施工', startDate: '2026-08-01', endDate: '2026-11-30', progress: 25, owner: '孙工' },
  ];

  // 设备台账
  collections['equipments'] = [
    { id: 'e1', name: '塔式起重机', code: 'SB-001', category: '起重机械', owner: '城南地铁站', status: '在用', date: '2024-01-10' },
    { id: 'e2', name: '混凝土搅拌车', code: 'SB-002', category: '运输机械', owner: '滨江大桥', status: '在用', date: '2024-03-20' },
    { id: 'e3', name: '挖掘机', code: 'SB-003', category: '土方机械', owner: '城南地铁站', status: '维修', date: '2024-02-15' },
  ];

  // 设备租赁
  collections['equipmentLeases'] = [
    { id: 'el1', name: '汽车吊50t', lessor: '安达机械租赁', amount: 38000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el2', name: '物料提升机', lessor: '广丰设备租赁', amount: 15000, startDate: '2026-05-01', endDate: '2026-08-31', status: '租用中' },
  ];

  // 合同登记
  collections['contracts'] = [
    { id: 'ct1', name: '城南地铁站土建施工合同', code: 'HT-2024-001', party: '城投集团', amount: 85000000, signDate: '2024-02-20', status: '履行中' },
    { id: 'ct2', name: '滨江大桥钢箱梁采购合同', code: 'HT-2024-002', party: '恒信钢材集团', amount: 32000000, signDate: '2024-04-10', status: '履行中' },
  ];

  // 采购订单
  collections['purchaseOrders'] = [
    { id: 'po1', code: 'CG-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 200, unit: '吨', price: 480, status: '已收货' },
    { id: 'po2', code: 'CG-2026-002', supplier: '恒信钢材集团', material: 'HRB400螺纹钢', quantity: 80, unit: '吨', price: 3650, status: '已下单' },
  ];

  // 收料入库
  collections['materialReceiving'] = [
    { id: 'mr1', code: 'RK-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 200, unit: '吨', date: '2026-08-05' },
    { id: 'mr2', code: 'RK-2026-002', supplier: '恒信钢材集团', material: 'HRB400螺纹钢', quantity: 50, unit: '吨', date: '2026-08-12' },
  ];

  // 人事档案
  collections['staff'] = [
    { id: 'st1', name: '陈国强', department: '工程管理部', position: '项目经理', phone: '13811110001', hireDate: '2018-03-01', status: '在职' },
    { id: 'st2', name: '周海涛', department: '工程管理部', position: '项目总工', phone: '13811110002', hireDate: '2019-06-15', status: '在职' },
    { id: 'st3', name: '王安全', department: '安全管理部', position: '安全员', phone: '13811110003', hireDate: '2020-01-10', status: '在职' },
  ];

  // 商机
  collections['opportunities'] = [
    { id: 'op1', name: '城北新区道路改造项目', customer: '城投集团', amount: 56000000, stage: '方案沟通', owner: '张伟', date: '2026-07-20' },
    { id: 'op2', name: '地铁3号线二期土建', customer: '轨道交通集团', amount: 120000000, stage: '报价谈判', owner: '李明', date: '2026-08-02' },
  ];

  // 投标
  collections['bids'] = [
    { id: 'b1', name: '城北新区道路改造', customer: '城投集团', bidAmount: 56000000, bidDate: '2026-08-20', status: '准备中' },
    { id: 'b2', name: '滨江景观带工程', customer: '市建委', bidAmount: 45000000, bidDate: '2026-07-15', status: '已投标' },
  ];

  // 客户
  collections['customers'] = [
    { id: 'c1', name: '城投集团', level: '战略', contact: '张伟', phone: '13800000001', address: '北京市朝阳区' },
    { id: 'c2', name: '中建三局', level: '重要', contact: '李明', phone: '13800000002', address: '上海市浦东新区' },
  ];

  // 用户（admin 为超级管理员 root）
  const users: any[] = [
    {
      id: 'admin',
      username: 'admin',
      email: 'admin@test.com',
      password: '$2b$10$ARne.woqFHP.PUouPN.EB.UDZilAuRihH54pAG/3mEkg9NsfDKo4G', // bcrypt of admin123
      role: 'super_admin',
      appliedRole: 'super_admin',
      roleStatus: 'approved',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u2',
      username: 'manager',
      email: 'manager@test.com',
      password: '$2b$10$ARne.woqFHP.PUouPN.EB.UDZilAuRihH54pAG/3mEkg9NsfDKo4G', // bcrypt of admin123
      role: 'high_admin',
      appliedRole: 'high_admin',
      roleStatus: 'approved',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  return { users, collections };
}

@Injectable()
export class DataService implements OnModuleInit {
  private users: any[] = [];
  private collections = new Map<string, any[]>();
  private auditLogs: any[] = [];

  onModuleInit() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.collections = new Map(Object.entries(data.collections || {}));
        this.auditLogs = data.auditLogs || [];
        console.log(`[DataService] 已从 ${DATA_FILE} 加载数据`);
        return;
      } catch (e) {
        console.error('[DataService] 加载数据失败，使用种子数据', e);
      }
    }
    const seeded = seed();
    this.users = seeded.users;
    this.collections = new Map(Object.entries(seeded.collections));
    this.save();
    console.log(`[DataService] 已生成种子数据并保存到 ${DATA_FILE}`);
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const payload = {
        users: this.users,
        collections: Object.fromEntries(this.collections),
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DataService] 保存数据失败', e);
    }
  }

  // ── 审计日志 ──

  logAudit(entry: { action: string; module: string; detail?: any; operator?: string; role?: string }) {
    this.auditLogs.push({
      ...entry,
      id: this.generateId(),
      date: new Date().toISOString(),
    });
    this.save();
  }

  getAuditLogs() {
    return [...this.auditLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // User operations
  getUsers() { return this.users; }
  getUser(id: string) { return this.users.find(u => u.id === id); }
  getUserByUsername(username: string) { return this.users.find(u => u.username === username); }
  addUser(user: any) {
    user.id = this.generateId();
    user.createdAt = new Date().toISOString();
    this.users.push(user);
    this.save();
    return user;
  }
  updateUser(id: string, data: any) {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) { this.users[index] = { ...this.users[index], ...data }; this.save(); return this.users[index]; }
    return null;
  }
  deleteUser(id: string) {
    const i = this.users.findIndex(u => u.id === id);
    if (i !== -1) this.users.splice(i, 1);
    this.save();
  }
  getPendingUsers() { return this.users.filter(u => u.roleStatus === 'pending'); }
  approveUser(id: string) {
    const u = this.getUser(id);
    if (!u) return null;
    u.role = u.appliedRole || 'employee';
    u.roleStatus = 'approved';
    this.save();
    return u;
  }
  rejectUser(id: string) {
    const u = this.getUser(id);
    if (!u) return null;
    u.roleStatus = 'rejected';
    this.save();
    return u;
  }

  // 通用集合 CRUD
  private getCollection(name: string): any[] {
    if (!this.collections.has(name)) this.collections.set(name, []);
    return this.collections.get(name)!;
  }

  getCollectionItems(name: string): any[] {
    return this.getCollection(name);
  }

  addCollectionItem(name: string, item: any): any {
    item.id = this.generateId();
    item.createdAt = new Date().toISOString();
    this.getCollection(name).push(item);
    this.save();
    return item;
  }

  updateCollectionItem(name: string, id: string, data: any): any {
    const arr = this.getCollection(name);
    const i = arr.findIndex(x => x.id === id);
    if (i !== -1) {
      arr[i] = { ...arr[i], ...data };
      arr[i].updatedAt = new Date().toISOString();
      this.save();
      return arr[i];
    }
    return null;
  }

  deleteCollectionItem(name: string, id: string): boolean {
    const arr = this.getCollection(name);
    const i = arr.findIndex(x => x.id === id);
    if (i !== -1) { arr.splice(i, 1); this.save(); return true; }
    return false;
  }
}