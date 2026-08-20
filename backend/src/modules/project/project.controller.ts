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
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

interface AuthedRequest extends Request {
  user?: { role?: string; username?: string };
}

const ENGINEERING_ROLES = ['super_admin', 'high_admin', 'general_admin', 'employee'];

function canEditProject(role?: string): boolean {
  return ['super_admin', 'high_admin', 'general_admin'].includes(role || '');
}
function canDeleteProject(role?: string): boolean {
  return ['super_admin', 'high_admin'].includes(role || '');
}

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private dataService: DataService) {}

  @Get()
  findAll(@Req() req: AuthedRequest) {
    const items = this.dataService.getCollectionItems('projectArchives');
    return items.map((p: any) => ({
      ...p,
      documentCount: (this.dataService.getCollectionItems('projectDocuments')
        .filter((d: any) => d.projectId === p.id)).length,
    }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    const items = this.dataService.getCollectionItems('projectArchives');
    const item = items.find((p: any) => p.id === id);
    if (!item) throw new NotFoundException('项目不存在');
    const docs = this.dataService.getCollectionItems('projectDocuments')
      .filter((d: any) => d.projectId === id);
    return { ...item, documents: docs };
  }

  @Get(':id/overview')
  overview(@Param('id') id: string, @Req() req: AuthedRequest) {
    const items = this.dataService.getCollectionItems('projectArchives');
    const item = items.find((p: any) => p.id === id);
    if (!item) throw new NotFoundException('项目不存在');
    const name = item.name;
    const byName = (col: string) => this.dataService.getCollectionItems(col)
      .filter((d: any) => d.project === name);
    const byId = (col: string) => this.dataService.getCollectionItems(col)
      .filter((d: any) => d.projectId === id);
    const sum = (arr: any[], key: string) => arr.reduce((s: number, x: any) => s + (Number(x[key]) || 0), 0);
    const docs = byId('projectDocuments');
    const logs = byName('constructionLogs').sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    const milestones = byName('milestones');
    const progressItems = byName('progress');
    const production = byName('productionValues');
    const budgets = byName('budgets');
    const plans = byName('plans');
    const changes = byName('changes');
    const completions = byName('completions');
    const rentalPlans = byName('rentalPlans');
    const subcontractPlans = byName('subcontractPlans');
    return {
      project: item,
      documents: docs,
      logs,
      milestones,
      progress: progressItems,
      production,
      budgets,
      plans,
      changes,
      completions,
      rentalPlans,
      subcontractPlans,
      stats: {
        documentCount: docs.length,
        logCount: logs.length,
        logLaborTotal: sum(logs, 'labor'),
        milestoneTotal: milestones.length,
        milestoneDone: milestones.filter((m: any) => m.status === '已完成').length,
        milestoneActive: milestones.filter((m: any) => m.status === '进行中').length,
        progressItemCount: progressItems.length,
        avgProgress: progressItems.length ? Math.round(sum(progressItems, 'progress') / progressItems.length) : 0,
        productionValue: sum(production, 'value'),
        productionCumulative: sum(production, 'cumulative'),
        budgetAmount: sum(budgets, 'amount'),
        budgetActual: sum(budgets, 'actualAmount'),
        changeAmount: sum(changes, 'amount'),
        changePending: changes.filter((c: any) => c.status === '待审批').length,
        planCount: plans.length,
        planPending: plans.filter((p: any) => p.status === '待审批').length,
      },
    };
  }

  @Post()
  create(@Body() data: any, @Req() req: AuthedRequest) {
    if (!canEditProject(req.user?.role)) throw new NotFoundException('权限不足');
    this.dataService.logAudit({ action: '新增', module: 'projects', detail: data, operator: req.user?.username, role: req.user?.role });
    return this.dataService.addCollectionItem('projectArchives', data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: AuthedRequest) {
    if (!canEditProject(req.user?.role)) throw new NotFoundException('权限不足');
    const items = this.dataService.getCollectionItems('projectArchives');
    if (!items.find((p: any) => p.id === id)) throw new NotFoundException('项目不存在');
    this.dataService.logAudit({ action: '修改', module: 'projects', detail: { id, ...data }, operator: req.user?.username, role: req.user?.role });
    return this.dataService.updateCollectionItem('projectArchives', id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    if (!canDeleteProject(req.user?.role)) throw new NotFoundException('权限不足');
    this.dataService.logAudit({ action: '删除', module: 'projects', detail: { id }, operator: req.user?.username, role: req.user?.role });
    this.dataService.deleteCollectionItem('projectArchives', id);
    // 级联删除项目文档
    const docs = this.dataService.getCollectionItems('projectDocuments');
    docs.filter((d: any) => d.projectId === id).forEach((d: any) => {
      this.dataService.deleteCollectionItem('projectDocuments', d.id);
    });
    return { message: '删除成功' };
  }

  // ── 项目文档 CRUD ──

  @Get(':id/documents')
  findDocuments(@Param('id') id: string) {
    return this.dataService.getCollectionItems('projectDocuments')
      .filter((d: any) => d.projectId === id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  @Post(':id/documents')
  createDocument(@Param('id') id: string, @Body() data: any, @Req() req: AuthedRequest) {
    if (!canEditProject(req.user?.role)) throw new NotFoundException('权限不足');
    const items = this.dataService.getCollectionItems('projectArchives');
    if (!items.find((p: any) => p.id === id)) throw new NotFoundException('项目不存在');
    this.dataService.logAudit({ action: '新增文档', module: 'projectDocuments', detail: { projectId: id, ...data }, operator: req.user?.username, role: req.user?.role });
    return this.dataService.addCollectionItem('projectDocuments', { ...data, projectId: id });
  }

  @Put('documents/:docId')
  updateDocument(@Param('docId') docId: string, @Body() data: any, @Req() req: AuthedRequest) {
    if (!canEditProject(req.user?.role)) throw new NotFoundException('权限不足');
    this.dataService.logAudit({ action: '修改文档', module: 'projectDocuments', detail: { docId, ...data }, operator: req.user?.username, role: req.user?.role });
    return this.dataService.updateCollectionItem('projectDocuments', docId, data);
  }

  @Delete('documents/:docId')
  deleteDocument(@Param('docId') docId: string, @Req() req: AuthedRequest) {
    if (!canDeleteProject(req.user?.role)) throw new NotFoundException('权限不足');
    this.dataService.logAudit({ action: '删除文档', module: 'projectDocuments', detail: { docId }, operator: req.user?.username, role: req.user?.role });
    this.dataService.deleteCollectionItem('projectDocuments', docId);
    return { message: '删除成功' };
  }
}
