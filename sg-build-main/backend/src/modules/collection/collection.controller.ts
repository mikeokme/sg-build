import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { guardCanView, guardCanCreate, guardCanEdit, guardCanDelete } from '../../guards/collection-permissions';

import { DataService } from '../../services/data.service';

interface AuthedRequest extends Request {
  user?: { role?: string; username?: string };
}

// 需要审批/关注流转的集合：创建后通知管理员，状态更新时通知创建者
const APPROVAL_COLLECTIONS: Record<string, { titleField: string; category: string }> = {
  approvals: { titleField: 'title', category: '审批' },
  projectInits: { titleField: 'name', category: '项目立项' },
  majorRequests: { titleField: 'name', category: '大宗采购' },
  procurementPlans: { titleField: 'name', category: '采购计划' },
  plans: { titleField: 'name', category: '需用计划' },
  changes: { titleField: 'title', category: '变更签证' },
  subcontractPlans: { titleField: 'name', category: '分包计划' },
  rentalPlans: { titleField: 'name', category: '租赁计划' },
  reimbursements: { titleField: 'title', category: '报销' },
  safetyAccidents: { titleField: 'title', category: '安全事故' },
  qualityAccidents: { titleField: 'title', category: '质量事故' },
  completions: { titleField: 'project', category: '竣工结算' },
};

// 指派/协作类集合：创建时通知负责人
const ASSIGN_COLLECTIONS: Record<string, { titleField: string; assigneeField: string; category: string }> = {
  tasks: { titleField: 'title', assigneeField: 'assignee', category: '任务' },
  meetings: { titleField: 'title', assigneeField: 'host', category: '会议' },
};

const STATUS_PENDING = ['待审批', '待确认', '待付款', '未开始'];

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(
    private collectionService: CollectionService,
    private dataService: DataService,
  ) {}

  @Get(':name')
  findAll(@Param('name') name: string, @Req() req: AuthedRequest) {
    guardCanView(name, req.user?.role || 'employee');
    return this.collectionService.findAll(name);
  }

  @Post(':name')
  create(@Param('name') name: string, @Body() data: any, @Req() req: AuthedRequest) {
    guardCanCreate(name, req.user?.role || 'employee');
    this.dataService.logAudit({
      action: '新增',
      module: name,
      detail: data,
      operator: req.user?.username,
      role: req.user?.role,
    });
    const created = this.collectionService.create(name, data);
    this.triggerNotificationsOnCreate(name, data, req.user?.username || '', created);
    // 新增在建项目时自动创建项目部群
    if (name === 'projects' && data.status === '在建' && data.manager) {
      this.autoCreateProjectGroup(data, created);
    }
    return created;
  }

  @Put(':name/:id')
  update(@Param('name') name: string, @Param('id') id: string, @Body() data: any, @Req() req: AuthedRequest) {
    guardCanEdit(name, req.user?.role || 'employee');
    this.dataService.logAudit({
      action: '修改',
      module: name,
      detail: { id, ...data },
      operator: req.user?.username,
      role: req.user?.role,
    });
    const updated = this.collectionService.update(name, id, data);
    this.triggerNotificationsOnUpdate(name, data, req.user?.username || '', updated);
    return updated;
  }

  @Delete(':name/:id')
  remove(@Param('name') name: string, @Param('id') id: string, @Req() req: AuthedRequest) {
    guardCanDelete(name, req.user?.role || 'employee');
    this.dataService.logAudit({
      action: '删除',
      module: name,
      detail: { id },
      operator: req.user?.username,
      role: req.user?.role,
    });
    return this.collectionService.remove(name, id);
  }

  // ── 通知关联逻辑 ──

  private notifyAdmins(title: string, content: string, link: string) {
    const admins = this.dataService.getUsers().filter((u) => ['super_admin', 'high_admin', 'general_admin'].includes(u.role));
    for (const a of admins) {
      this.dataService.addNotification(a.username, { title, content, type: 'approval', link });
    }
  }

  private triggerNotificationsOnCreate(name: string, data: any, operator: string, created: any) {
    // 审批类：创建后通知管理员（若非管理员本人创建）
    const appRule = APPROVAL_COLLECTIONS[name];
    if (appRule && operator) {
      const titleVal = data[appRule.titleField] || '新事项';
      this.notifyAdmins(
        `新的${appRule.category}待处理`,
        `${operator} 提交了「${titleVal}」，请及时审批`,
        `/${name === 'approvals' ? 'oa' : this.categoryOf(name)}/${name}`,
      );
    }
    // 指派类：通知负责人
    const assignRule = ASSIGN_COLLECTIONS[name];
    if (assignRule && data[assignRule.assigneeField] && data[assignRule.assigneeField] !== operator) {
      const titleVal = data[assignRule.titleField] || '新事项';
      this.dataService.addNotification(data[assignRule.assigneeField], {
        title: `您有一个新的${assignRule.category}`,
        content: `「${titleVal}」，发起人：${operator}`,
        type: 'task',
        link: `/oa/tasks`,
      });
    }
    void created;
  }

  private triggerNotificationsOnUpdate(name: string, data: any, operator: string, updated: any) {
    const appRule = APPROVAL_COLLECTIONS[name];
    if (!appRule) return;
    // 状态变化：审批通过/驳回时通知创建者
    if (data.status) {
      const titleVal = (updated && (updated[appRule.titleField] || data[appRule.titleField])) || '事项';
      const isFinal = ['已批准', '已通过', '已驳回', '已确认', '已完成', '已付款'].includes(data.status);
      if (isFinal) {
        const owner = (updated && updated.applicant) || (updated && updated.createdBy) || operator;
        this.dataService.addNotification(owner, {
          title: `您的${appRule.category}已${data.status}`,
          content: `「${titleVal}」${data.status === '已驳回' ? '，请查看驳回原因' : ''}`,
          type: 'approval',
          link: `/${name === 'approvals' ? 'oa' : this.categoryOf(name)}/${name}`,
        });
      }
    }
  }

  private categoryOf(collection: string): string {
    const map: Record<string, string> = {
      approvals: 'oa', projectInits: 'market', majorRequests: 'procurement',
      procurementPlans: 'procurement',
      plans: 'engineering', changes: 'engineering', subcontractPlans: 'engineering',
      rentalPlans: 'engineering', completions: 'engineering',
      reimbursements: 'finance', safetyAccidents: 'quality', qualityAccidents: 'quality',
      tasks: 'oa', meetings: 'oa',
    };
    return map[collection] || 'oa';
  }

  private autoCreateProjectGroup(projectData: any, created: any) {
    const projectId = created?.id || projectData.id;
    const projectName = projectData.name || '新项目';
    // 检查是否已存在该项目的群聊
    const existing = this.dataService.getConversations().find(
      (c: any) => c.category === 'project' && c.projectId === projectId,
    );
    if (existing) return;
    // 简称：取项目名前4个字
    const shortName = projectName.length > 4 ? projectName.substring(0, 4) + '群' : projectName + '群';
    const manager = projectData.manager;
    // 管理员 + 项目经理 + admin
    const members = ['admin'];
    if (manager && manager !== 'admin') members.push(manager);
    this.dataService.createGroupConversation(shortName, members, manager || 'admin', 'project', projectId);
  }
}
