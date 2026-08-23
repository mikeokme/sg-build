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

  // ── 地图展板数据：返回所有项目的地理信息（用于前端工程展板）──
  @Get('map/dots')
  mapDots(@Req() req: AuthedRequest) {
    const items = this.dataService.getCollectionItems('projectArchives');
    return items.map((p: any) => {
      const { province, city } = this.parseLocation(p.location);
      return {
        id: p.id,
        name: p.name,
        province,
        city,
        basin: this.inferBasin(p.location),
        kind: p.type,
        status: p.status,
        amount: p.amount,
        manager: p.manager,
      };
    });
  }

  private parseLocation(location: string): { province: string; city: string } {
    if (!location) return { province: '', city: '' };
    
    // 直辖市
    const municipalities = ['北京市', '天津市', '上海市', '重庆市'];
    for (const m of municipalities) {
      if (location.startsWith(m)) {
        return { province: m, city: m.replace('市', '') };
      }
    }
    
    // 自治区
    const autonomous = ['内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区'];
    for (const a of autonomous) {
      const idx = location.indexOf(a);
      if (idx >= 0) {
        const after = location.slice(idx + a.length);
        const cityMatch = after.match(/^([^市]+市)/);
        const city = cityMatch ? cityMatch[1] : '';
        return { province: a, city: city || a.replace('自治区', '') };
      }
    }
    
    // 普通省份
    const provMatch = location.match(/^([^省]+省)/);
    if (provMatch) {
      const prov = provMatch[1];
      const after = location.slice(prov.length);
      const cityMatch = after.match(/^([^市]+市)/);
      const city = cityMatch ? cityMatch[1] : '';
      return { province: prov, city };
    }
    
    return { province: '', city: '' };
  }

  private inferBasin(location: string): string {
    if (!location) return '未知流域';
    const map: Record<string, string> = {
      '黑龙江': '黑龙江流域', '吉林': '黑龙江流域',
      '辽宁': '辽河流域',
      '北京': '海河流域', '天津': '海河流域', '河北': '海河流域',
      '山西': '黄河流域', '内蒙古': '黄河流域',
      '陕西': '黄河流域', '甘肃': '黄河流域', '宁夏': '黄河流域', '青海': '黄河流域',
      '山东': '黄河流域', '河南': '黄河流域',
      '江苏': '淮河流域', '安徽': '淮河流域',
      '湖北': '长江流域', '湖南': '长江流域', '江西': '长江流域',
      '四川': '长江流域', '重庆': '长江流域', '云南': '长江流域', '贵州': '长江流域',
      '浙江': '浙闽台河流区', '福建': '浙闽台河流区', '台湾': '浙闽台河流区',
      '广东': '珠江流域', '广西': '珠江流域',
      '海南': '珠江流域',
      '西藏': '藏南滇西河流区',
      '新疆': '内陆河湖区',
    };
    for (const [prov, basin] of Object.entries(map)) {
      if (location.includes(prov)) return basin;
    }
    return '未知流域';
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

  // ── 施工日志 CRUD ──
  @Get(':id/logs')
  findLogs(@Param('id') id: string, @Req() req: AuthedRequest) {
    const items = this.dataService.getCollectionItems('projectArchives');
    const project = items.find((p: any) => p.id === id);
    if (!project) throw new NotFoundException('项目不存在');
    return this.dataService.getCollectionItems('constructionLogs')
      .filter((log: any) => log.project === project.name)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  @Get(':id/logs/stats')
  logsStats(@Param('id') id: string, @Req() req: AuthedRequest) {
    const items = this.dataService.getCollectionItems('projectArchives');
    const project = items.find((p: any) => p.id === id);
    if (!project) throw new NotFoundException('项目不存在');
    const logs = this.dataService.getCollectionItems('constructionLogs')
      .filter((log: any) => log.project === project.name);
    
    const totalDays = logs.length;
    const totalLabor = logs.reduce((s: number, l: any) => s + (Number(l.labor) || 0), 0);
    const totalWorkContent = logs.reduce((s: string, l: any) => s + (l.workContent || '') + '; ', '');
    const weatherStats: Record<string, number> = {};
    for (const log of logs) {
      weatherStats[log.weather || '未知'] = (weatherStats[log.weather || '未知'] || 0) + 1;
    }
    const byDate: Record<string, { labor: number; count: number }> = {};
    for (const log of logs) {
      if (!byDate[log.date]) byDate[log.date] = { labor: 0, count: 0 };
      byDate[log.date].labor += Number(log.labor) || 0;
      byDate[log.date].count += 1;
    }
    const dates = Object.keys(byDate).sort();
    return {
      totalDays,
      totalLabor,
      avgDailyLabor: totalDays ? Math.round(totalLabor / totalDays) : 0,
      weatherStats,
      dailyTrend: dates.map(d => ({ date: d, labor: byDate[d].labor, count: byDate[d].count })),
      recentLogs: logs.slice(0, 5),
    };
  }

  @Post(':id/logs')
  createLog(@Param('id') id: string, @Body() data: any, @Req() req: AuthedRequest) {
    if (!canEditProject(req.user?.role)) throw new NotFoundException('权限不足');
    const items = this.dataService.getCollectionItems('projectArchives');
    const project = items.find((p: any) => p.id === id);
    if (!project) throw new NotFoundException('项目不存在');
    this.dataService.logAudit({ action: '新增施工日志', module: 'constructionLogs', detail: { projectId: id, ...data }, operator: req.user?.username, role: req.user?.role });
    return this.dataService.addCollectionItem('constructionLogs', { ...data, project: project.name });
  }

  @Put('logs/:logId')
  updateLog(@Param('logId') logId: string, @Body() data: any, @Req() req: AuthedRequest) {
    if (!canEditProject(req.user?.role)) throw new NotFoundException('权限不足');
    this.dataService.logAudit({ action: '修改施工日志', module: 'constructionLogs', detail: { logId, ...data }, operator: req.user?.username, role: req.user?.role });
    return this.dataService.updateCollectionItem('constructionLogs', logId, data);
  }

  @Delete('logs/:logId')
  deleteLog(@Param('logId') logId: string, @Req() req: AuthedRequest) {
    if (!canDeleteProject(req.user?.role)) throw new NotFoundException('权限不足');
    this.dataService.logAudit({ action: '删除施工日志', module: 'constructionLogs', detail: { logId }, operator: req.user?.username, role: req.user?.role });
    this.dataService.deleteCollectionItem('constructionLogs', logId);
    return { message: '删除成功' };
  }
}
