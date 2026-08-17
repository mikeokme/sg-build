import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

interface AuthedRequest extends Request {
  user?: { role?: string; username?: string };
}

const ADMIN_ROLES = ['super_admin', 'high_admin', 'general_admin'];

interface TodoItem {
  id: string;
  title: string;
  sub: string;
  link: string;
  meta?: string;
}

interface TodoGroup {
  key: string;
  label: string;
  type: 'approval' | 'task' | 'payment' | 'alert' | 'inspection';
  count: number;
  items: TodoItem[];
}

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodoController {
  constructor(private dataService: DataService) {}

  @Get()
  getTodos(@Req() req: AuthedRequest) {
    const get = (name: string) => this.dataService.getCollectionItems(name);
    const me = req.user?.username || '';
    const isAdmin = ADMIN_ROLES.includes(req.user?.role || '');
    const num = (v: any) => Number(v || 0);
    const money = (v: any) => `¥${num(v).toLocaleString()}`;

    const groups: TodoGroup[] = [];

    if (isAdmin) {
      const approvalItems: TodoItem[] = [];
      const defs: { name: string; label: string; titleField: string; subField: string }[] = [
        { name: 'approvals', label: '审批中心', titleField: 'title', subField: 'type' },
        { name: 'projectInits', label: '项目立项', titleField: 'name', subField: 'customer' },
        { name: 'majorRequests', label: '大宗采购', titleField: 'name', subField: 'project' },
        { name: 'plans', label: '需用计划', titleField: 'name', subField: 'project' },
        { name: 'changes', label: '变更签证', titleField: 'title', subField: 'project' },
        { name: 'reimbursements', label: '报销', titleField: 'title', subField: 'applicant' },
        { name: 'subcontractPlans', label: '分包计划', titleField: 'name', subField: 'project' },
      ];
      for (const d of defs) {
        for (const x of get(d.name)) {
          if (x.status === '待审批') {
            const amountStr = x.amount ? ` · ${money(x.amount)}` : '';
            approvalItems.push({
              id: x.id,
              title: x.titleField === 'title' ? x.title : x.name,
              sub: `${x[d.subField] || ''}${amountStr}`,
              link: `/todos?jump=${d.name}`,
              meta: d.label,
            });
          }
        }
      }
      if (approvalItems.length > 0) {
        groups.push({ key: 'approval', label: '待我审批', type: 'approval', count: approvalItems.length, items: approvalItems });
      }
    }

    // 我的任务
    const myTasks: TodoItem[] = get('tasks')
      .filter((t: any) => t.assignee === me && t.status !== '已完成')
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        sub: `${t.project || ''} · 截止 ${t.dueDate || '无'} · ${t.priority || '中'}优先级`,
        link: `/todos?jump=tasks`,
        meta: t.status || '',
      }));
    if (myTasks.length > 0) {
      groups.push({ key: 'task', label: '我的任务', type: 'task', count: myTasks.length, items: myTasks });
    }

    if (isAdmin) {
      // 待付款
      const payments: TodoItem[] = get('payments')
        .filter((x: any) => x.status === '待付款')
        .map((x: any) => ({ id: x.id, title: x.title, sub: `${x.payee || ''} · ${money(x.amount)}`, link: '/finance/payments', meta: '待付款' }));
      if (payments.length > 0) {
        groups.push({ key: 'payment', label: '待付款', type: 'payment', count: payments.length, items: payments });
      }

      // 整改中
      const inspections: TodoItem[] = [
        ...get('safetyInspections')
          .filter((x: any) => x.status === '整改中')
          .map((x: any) => ({ id: x.id, title: x.title, sub: x.project || '', link: '/quality/safety-inspection', meta: '安全整改' })),
        ...get('qualityInspections')
          .filter((x: any) => x.status === '整改中')
          .map((x: any) => ({ id: x.id, title: x.title, sub: x.project || '', link: '/quality/quality-inspection', meta: '质量整改' })),
      ];
      if (inspections.length > 0) {
        groups.push({ key: 'inspection', label: '整改待办', type: 'inspection', count: inspections.length, items: inspections });
      }
    }

    // 预警
    const alerts: TodoItem[] = get('alerts')
      .filter((x: any) => x.status === '未处理')
      .map((x: any) => ({ id: x.id, title: x.title, sub: x.content || '', link: '/platform/alerts', meta: x.level || '警告' }));
    if (alerts.length > 0) {
      groups.push({ key: 'alert', label: '未处理预警', type: 'alert', count: alerts.length, items: alerts });
    }

    const total = groups.reduce((s, g) => s + g.count, 0);
    return { total, groups };
  }
}
