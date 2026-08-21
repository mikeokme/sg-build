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
    const byNameFuzzy = (col: string) => this.dataService.getCollectionItems(col)
      .filter((d: any) => {
        const p = d.project;
        if (!p) return false;
        if (p === name) return true;
        if (name.includes(p) && p.length >= 4) return true;
        if (p.includes(name) && name.length >= 4) return true;
        return false;
      });
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
    // 关联业务数据（模糊名称匹配，跨模块互通）
    const purchaseOrders = byNameFuzzy('purchaseOrders');
    const purchaseReceipts = byNameFuzzy('purchaseReceipts');
    const procurementPlans = byNameFuzzy('procurementPlans');
    const majorRequests = byNameFuzzy('majorRequests');
    const supplierEvaluations = byNameFuzzy('supplierEvaluations');
    const materialReceiving = byNameFuzzy('materialReceiving');
    const materialIssue = byNameFuzzy('materialIssue');
    const materialDirect = byNameFuzzy('materialDirect');
    const materialReturn = byNameFuzzy('materialReturn');
    const inventories = byNameFuzzy('inventories');
    const equipments = byNameFuzzy('equipments');
    const equipmentLeases = byNameFuzzy('equipmentLeases');
    const equipmentMaintenances = byNameFuzzy('equipmentMaintenances');
    const equipmentRepairs = byNameFuzzy('equipmentRepairs');
    const laborContracts = byNameFuzzy('laborContracts');
    const proContracts = byNameFuzzy('proContracts');
    const subcontractChanges = byNameFuzzy('subcontractChanges');
    const subcontractSettlements = byNameFuzzy('subcontractSettlements');
    const subcontractPayments = byNameFuzzy('subcontractPayments');
    const subcontractEvaluations = byNameFuzzy('subcontractEvaluations');
    const safetyInspections = byNameFuzzy('safetyInspections');
    const safetyTrainings = byNameFuzzy('safetyTrainings');
    const safetyPunishments = byNameFuzzy('safetyPunishments');
    const safetyRewards = byNameFuzzy('safetyRewards');
    const safetyAccidents = byNameFuzzy('safetyAccidents');
    const safetyInputLedgers = byNameFuzzy('safetyInputLedgers');
    const riskLedgers = byNameFuzzy('riskLedgers');
    const emergencyPlans = byNameFuzzy('emergencyPlans');
    const qualityInspections = byNameFuzzy('qualityInspections');
    const qualityTrainings = byNameFuzzy('qualityTrainings');
    const qualityPunishments = byNameFuzzy('qualityPunishments');
    const qualityRewards = byNameFuzzy('qualityRewards');
    const qualityAccidents = byNameFuzzy('qualityAccidents');
    const qualityDefects = byNameFuzzy('qualityDefects');
    const costAnalyses = byNameFuzzy('costAnalyses');
    const teams = byNameFuzzy('teams');
    const suppliers = byNameFuzzy('suppliers');
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
      // 关联业务数据块
      purchaseOrders,
      purchaseReceipts,
      procurementPlans,
      majorRequests,
      supplierEvaluations,
      materialReceiving,
      materialIssue,
      materialDirect,
      materialReturn,
      inventories,
      equipments,
      equipmentLeases,
      equipmentMaintenances,
      equipmentRepairs,
      laborContracts,
      proContracts,
      subcontractChanges,
      subcontractSettlements,
      subcontractPayments,
      subcontractEvaluations,
      safetyInspections,
      safetyTrainings,
      safetyPunishments,
      safetyRewards,
      safetyAccidents,
      safetyInputLedgers,
      riskLedgers,
      emergencyPlans,
      qualityInspections,
      qualityTrainings,
      qualityPunishments,
      qualityRewards,
      qualityAccidents,
      qualityDefects,
      costAnalyses,
      teams,
      suppliers,
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
        // 关联统计
        purchaseOrderCount: purchaseOrders.length,
        purchaseOrderAmount: sum(purchaseOrders, 'amount'),
        receiptCount: purchaseReceipts.length,
        materialReceivingCount: materialReceiving.length,
        materialIssueCount: materialIssue.length,
        materialReceivingAmount: sum(materialReceiving, 'amount'),
        equipmentCount: equipments.length,
        equipmentLeaseCount: equipmentLeases.length,
        equipmentMaintenanceCount: equipmentMaintenances.length,
        equipmentRepairCount: equipmentRepairs.length,
        laborContractCount: laborContracts.length,
        proContractCount: proContracts.length,
        subcontractAmount: sum(laborContracts, 'amount') + sum(proContracts, 'amount'),
        subcontractSettlementCount: subcontractSettlements.length,
        subcontractPaymentCount: subcontractPayments.length,
        subcontractPaymentAmount: sum(subcontractPayments, 'amount'),
        safetyInspectionCount: safetyInspections.length,
        safetyPending: safetyInspections.filter((i: any) => i.status === '整改中' || i.status === '待整改').length,
        riskCount: riskLedgers.length,
        riskWarning: riskLedgers.filter((r: any) => r.status !== '受控').length,
        safetyAccidentCount: safetyAccidents.length,
        qualityInspectionCount: qualityInspections.length,
        qualityPending: qualityInspections.filter((i: any) => i.status === '整改中' || i.status === '待整改').length,
        qualityAccidentCount: qualityAccidents.length,
        qualityDefectCount: qualityDefects.length,
        costPlanned: sum(costAnalyses, 'plannedCost'),
        costActual: sum(costAnalyses, 'actualCost'),
        costProfit: sum(costAnalyses, 'profit'),
        teamCount: teams.length,
        teamMembers: sum(teams, 'members'),
        supplierCount: suppliers.length,
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
