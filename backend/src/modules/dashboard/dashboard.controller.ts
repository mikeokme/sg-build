import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

interface AuthedRequest extends Request {
  user?: { role?: string; username?: string };
}

// 集合 -> 前端页面路由（category/feature）
const COLLECTION_ROUTE: Record<string, string> = {
  projectArchives: '/engineering/project-archives',
  progress: '/engineering/progress',
  plans: '/engineering/plans',
  productionValues: '/engineering/production-value',
  budgets: '/engineering/budgets',
  rentalPlans: '/engineering/rental-plans',
  subcontractPlans: '/engineering/subcontract-plans',
  changes: '/engineering/changes',
  completions: '/engineering/completion',
  constructionLogs: '/engineering/construction-logs',
  milestones: '/engineering/milestones',
  majorRequests: '/procurement/major-requests',
  groupContracts: '/procurement/group-contracts',
  purchaseContracts: '/procurement/purchase-contracts',
  purchaseOrders: '/procurement/orders',
  rentalContracts: '/procurement/rental-contracts',
  subcontracts: '/procurement/subcontracts',
  procurementReports: '/procurement/reports',
  materialReceiving: '/material/receiving',
  materialDiscount: '/material/discount',
  materialIssue: '/material/issue',
  materialDirect: '/material/direct',
  materialTransferOut: '/material/transfer-out',
  materialTransferIn: '/material/transfer-in',
  materialReturn: '/material/return',
  materialReturnSupplier: '/material/return-supplier',
  warehouses: '/material/warehouse',
  inventories: '/material/inventory',
  slowMovingMaterials: '/material/slow-moving',
  materialLedgers: '/material/ledgers',
  equipments: '/equipment/register',
  equipmentLeases: '/equipment/lease',
  equipmentDispatches: '/equipment/dispatch',
  equipmentMaintenances: '/equipment/maintenance',
  equipmentRepairs: '/equipment/repair',
  notices: '/oa/notices',
  approvals: '/oa/approvals',
  schedules: '/oa/calendar',
  meetings: '/oa/meetings',
  tasks: '/oa/tasks',
  documents: '/oa/documents',
  customers: '/market/customers',
  opportunities: '/market/opportunities',
  bids: '/market/bids',
  bidReports: '/market/bid-reports',
  contracts: '/market/contracts',
  projectInits: '/market/project-init',
  invoices: '/finance/invoices',
  reimbursements: '/finance/reimbursements',
  funds: '/finance/funds',
  payments: '/finance/payments',
  costAnalyses: '/finance/cost-analysis',
  safetyInspections: '/quality/safety-inspection',
  safetyTrainings: '/quality/safety-training',
  safetyPunishments: '/quality/safety-punishment',
  safetyRewards: '/quality/safety-reward',
  safetyAccidents: '/quality/safety-accident',
  safetyInputLedgers: '/quality/safety-input-ledger',
  qualityInspections: '/quality/quality-inspection',
  qualityTrainings: '/quality/quality-training',
  qualityPunishments: '/quality/quality-punishment',
  qualityRewards: '/quality/quality-reward',
  qualityAccidents: '/quality/quality-accident',
  staff: '/hr/staff',
  attendances: '/hr/attendance',
  teams: '/hr/teams',
  trainings: '/hr/training',
  rewards: '/hr/rewards',
  adminAssets: '/hr/admin-assets',
  platformInfo: '/platform/info',
  alerts: '/platform/alerts',
  logs: '/platform/logs',
};

const ADMIN_ROLES = ['super_admin', 'high_admin', 'general_admin'];

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dataService: DataService) {}

  @Get('stats')
  getStats(@Req() req: AuthedRequest) {
    const get = (name: string) => this.dataService.getCollectionItems(name);
    const me = req.user?.username || '';
    const num = (v: any) => Number(v || 0);

    const projects = get('projects');
    const projectArchives = get('projectArchives');
    const contracts = get('contracts');
    const productionValues = get('productionValues');
    const funds = get('funds');
    const invoices = get('invoices');
    const approvals = get('approvals');
    const tasks = get('tasks');
    const equipments = get('equipments');
    const staff = get('staff');
    const attendances = get('attendances');
    const safetyInspections = get('safetyInspections');
    const qualityInspections = get('qualityInspections');
    const alerts = get('alerts');
    const costAnalyses = get('costAnalyses');
    const notices = get('notices');
    const schedules = get('schedules');
    const purchaseOrders = get('purchaseOrders');
    const materialReceiving = get('materialReceiving');
    const opportunities = get('opportunities');
    const bids = get('bids');
    const plans = get('plans');
    const budgets = get('budgets');
    const changes = get('changes');
    const completions = get('completions');
    const progress = get('progress');
    const subcontractPlans = get('subcontractPlans');
    const rentalPlans = get('rentalPlans');
    const projectInits = get('projectInits');
    const constructionLogs = get('constructionLogs');
    const milestones = get('milestones');

    // 待办汇总（审批类集合 + 待付款 + 预警 + 整改）
    const isAdmin = ADMIN_ROLES.includes(req.user?.role || '');
    const pendingGroups: any[] = [];
    if (isAdmin) {
      const defs: { name: string; label: string }[] = [
        { name: 'approvals', label: '审批' },
        { name: 'projectInits', label: '项目立项' },
        { name: 'majorRequests', label: '大宗采购' },
        { name: 'plans', label: '需用计划' },
        { name: 'changes', label: '变更签证' },
        { name: 'reimbursements', label: '报销' },
        { name: 'subcontractPlans', label: '分包计划' },
      ];
      for (const d of defs) {
        const items = get(d.name).filter((x: any) => x.status === '待审批');
        if (items.length > 0) {
          pendingGroups.push({ name: d.name, label: d.label, count: items.length, route: COLLECTION_ROUTE[d.name] || '' });
        }
      }
    }
    const pendingTotal = pendingGroups.reduce((s, g) => s + g.count, 0);
    const pendingPayments = get('payments').filter((x: any) => x.status === '待付款').length;
    const myTasks = tasks.filter((t: any) => t.assignee === me && t.status !== '已完成');

    // 资金
    const totalRevenue = funds.filter((f: any) => f.type === '收款').reduce((s: number, f: any) => s + num(f.amount), 0);
    const totalSpend = funds.filter((f: any) => f.type === '付款').reduce((s: number, f: any) => s + num(f.amount), 0);
    const contractTotal = contracts.reduce((s: number, c: any) => s + num(c.amount), 0);
    const invoiceIn = invoices.filter((i: any) => i.type === '进项').reduce((s: number, i: any) => s + num(i.amount), 0);
    const invoiceOut = invoices.filter((i: any) => i.type === '销项').reduce((s: number, i: any) => s + num(i.amount), 0);

    // 产值趋势（按月）
    const monthMap = new Map<string, number>();
    for (const pv of productionValues) {
      monthMap.set(pv.month, (monthMap.get(pv.month) || 0) + num(pv.value));
    }
    const productionTrend = [...monthMap.entries()]
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 商机/投标
    const oppTotal = opportunities.reduce((s: number, o: any) => s + num(o.amount), 0);
    const bidWon = bids.filter((b: any) => b.status === '中标').length;

    return {
      greeting: {
        username: me,
        role: req.user?.role || '',
      },
      projects: {
        total: projects.length,
        underConstruction: projects.filter((p: any) => p.status === '在建').length,
        completed: projects.filter((p: any) => p.status === '竣工').length,
        archiveTotal: projectArchives.reduce((s: number, p: any) => s + num(p.amount), 0),
      },
      finance: {
        contractTotal,
        totalRevenue,
        totalSpend,
        netIncome: totalRevenue - totalSpend,
        invoiceIn,
        invoiceOut,
      },
      production: {
        trend: productionTrend,
        latest: productionTrend[productionTrend.length - 1]?.value || 0,
        latestMonth: productionTrend[productionTrend.length - 1]?.month || '',
      },
      cost: costAnalyses.map((ca: any) => ({
        project: ca.project,
        plannedCost: num(ca.plannedCost),
        actualCost: num(ca.actualCost),
        profit: num(ca.profit),
      })),
      todos: {
        pendingTotal,
        pendingGroups,
        pendingPayments,
        myTasks: myTasks.length,
        alertTotal: alerts.filter((a: any) => a.status === '未处理').length,
      },
      tasks: {
        total: tasks.length,
        mine: myTasks,
      },
      equipment: {
        total: equipments.length,
        inUse: equipments.filter((e: any) => e.status === '在用').length,
        repairing: equipments.filter((e: any) => e.status === '维修').length,
      },
      material: {
        orders: purchaseOrders.length,
        receiving: materialReceiving.length,
      },
      hr: {
        staff: staff.length,
        attendanceToday: attendances.length,
      },
      quality: {
        safetyPending: safetyInspections.filter((x: any) => x.status === '整改中').length,
        qualityPending: qualityInspections.filter((x: any) => x.status === '整改中').length,
        safetyAccidents: get('safetyAccidents').length,
        qualityAccidents: get('qualityAccidents').length,
      },
      market: {
        opportunities: opportunities.length,
        oppTotal,
        bidWon,
      },
      engineering: {
        projectArchiveTotal: projectArchives.length,
        projectArchiveAmount: projectArchives.reduce((s: number, p: any) => s + num(p.amount), 0),
        inConstruction: projectArchives.filter((p: any) => p.status === '在建').length,
        completed: projectArchives.filter((p: any) => p.status === '竣工' || p.status === '完工').length,
        productionThisMonth: productionValues.filter((pv: any) => pv.month === productionTrend[productionTrend.length - 1]?.month).reduce((s: number, pv: any) => s + num(pv.value), 0),
        pendingPlans: plans.filter((p: any) => p.status === '待审批').length,
        pendingChanges: changes.filter((c: any) => c.status === '待审批').length,
        budgetTotal: budgets.reduce((s: number, b: any) => s + num(b.amount), 0),
        progressItems: progress.length,
        activeProgress: progress.filter((p: any) => p.progress && p.progress < 100).length,
        subcontractPlans: subcontractPlans.length,
        rentalPlans: rentalPlans.length,
        completions: completions.length,
        constructionLogs: constructionLogs.length,
        milestones: milestones.filter((m: any) => m.status !== '已完成').length,
        milestoneTotal: milestones.length,
      },
      alerts: alerts.filter((a: any) => a.status === '未处理').slice(0, 5),
      notices: notices.slice(0, 4),
      schedules: schedules.slice(0, 4),
      unreadCount: this.dataService.getUnreadCount(me),
    };
  }
}
