import { ForbiddenException } from '@nestjs/common';

export const ROLE_LEVELS: Record<string, number> = {
  super_admin: 100,
  high_admin: 80,
  general_admin: 60,
  employee: 40,
  outsource: 10,
};

export const CATEGORY_MIN_LEVEL: Record<string, number> = {
  oa: 10,
  market: 40,
  engineering: 10,
  procurement: 40,
  material: 40,
  equipment: 40,
  finance: 60,
  quality: 40,
  hr: 60,
  platform: 100,
  resource: 40,
};

export const CATEGORY_CREATE_LEVEL: Record<string, number> = {
  oa: 40, market: 60, engineering: 40, procurement: 40, material: 40,
  equipment: 40, finance: 60, quality: 40, hr: 60, platform: 100, resource: 60,
};

export const CATEGORY_EDIT_LEVEL: Record<string, number> = {
  oa: 40, market: 60, engineering: 40, procurement: 40, material: 40,
  equipment: 40, finance: 60, quality: 40, hr: 60, platform: 100, resource: 60,
};

export const CATEGORY_DELETE_LEVEL: Record<string, number> = {
  oa: 60, market: 80, engineering: 80, procurement: 80, material: 80,
  equipment: 80, finance: 80, quality: 80, hr: 80, platform: 100, resource: 80,
};

// 外协可写集合
const OUTSOURCE_WRITE_COLLECTIONS = ['progress', 'plans', 'changes', 'constructionLogs', 'milestones', 'safetyInspections', 'safetyTrainings', 'qualityInspections', 'qualityTrainings', 'siteRecords', 'schedules', 'tasks'];

// 集合 → 业务中心
const COLLECTION_CATEGORY: Record<string, string> = {
  // oa
  notices: 'oa', approvals: 'oa', schedules: 'oa', meetings: 'oa', tasks: 'oa', documents: 'oa',
  // market
  customers: 'market', opportunities: 'market', bids: 'market', bidReports: 'market', contracts: 'market', projectInits: 'market',
  // engineering
  projectArchives: 'engineering', progress: 'engineering', plans: 'engineering', productionValues: 'engineering',
  budgets: 'engineering', rentalPlans: 'engineering', subcontractPlans: 'engineering', changes: 'engineering', completions: 'engineering',
  constructionLogs: 'engineering', milestones: 'engineering',
  // procurement
  majorRequests: 'procurement', groupContracts: 'procurement', purchaseContracts: 'procurement',
  purchaseOrders: 'procurement', rentalContracts: 'procurement', subcontracts: 'procurement', procurementReports: 'procurement',
  procurementPlans: 'procurement', purchaseReceipts: 'procurement', supplierEvaluations: 'procurement',
  // subcontract
  laborSubcontractors: 'subcontract', proSubcontractors: 'subcontract', laborContracts: 'subcontract',
  proContracts: 'subcontract', subcontractChanges: 'subcontract', subcontractSettlements: 'subcontract',
  subcontractPayments: 'subcontract', subcontractEvaluations: 'subcontract', subcontractReports: 'subcontract',
  // material
  materialReceiving: 'material', materialDiscount: 'material', materialIssue: 'material', materialDirect: 'material',
  materialTransferOut: 'material', materialTransferIn: 'material', materialReturn: 'material', materialReturnSupplier: 'material',
  warehouses: 'material', inventories: 'material', slowMovingMaterials: 'material', materialLedgers: 'material',
  // equipment
  equipments: 'equipment', equipmentLeases: 'equipment', equipmentDispatches: 'equipment', equipmentMaintenances: 'equipment', equipmentRepairs: 'equipment',
  // finance
  invoices: 'finance', reimbursements: 'finance', funds: 'finance', payments: 'finance', costAnalyses: 'finance',
  // quality
  safetyInspections: 'quality', safetyTrainings: 'quality', safetyPunishments: 'quality', safetyRewards: 'quality',
  safetyAccidents: 'quality', safetyInputLedgers: 'quality', qualityInspections: 'quality', qualityTrainings: 'quality',
  qualityPunishments: 'quality', qualityRewards: 'quality', qualityAccidents: 'quality',
  // hr
  staff: 'hr', attendances: 'hr', teams: 'hr', trainings: 'hr', rewards: 'hr', adminAssets: 'hr',
  // platform
  platformInfo: 'platform', alerts: 'platform', logs: 'platform', users: 'platform',
  // resource
  materials: 'resource', suppliers: 'resource', projects: 'resource',
};

export function getCategoryOf(collection: string): string | null {
  return COLLECTION_CATEGORY[collection] || null;
}

export function getRoleLevel(role?: string): number {
  return ROLE_LEVELS[role || 'employee'] ?? 40;
}

function guardView(category: string, role: string) {
  if (getRoleLevel(role) < (CATEGORY_MIN_LEVEL[category] ?? 40)) {
    throw new ForbiddenException('无权查看该模块');
  }
}

export function guardCanView(collection: string, role: string) {
  const cat = getCategoryOf(collection);
  if (cat) guardView(cat, role);
}

export function guardCanCreate(collection: string, role: string) {
  if (role === 'outsource') {
    if (!OUTSOURCE_WRITE_COLLECTIONS.includes(collection)) throw new ForbiddenException('外协人员仅可写入部分功能');
    return;
  }
  const cat = getCategoryOf(collection);
  if (!cat) return;
  if (getRoleLevel(role) < (CATEGORY_CREATE_LEVEL[cat] ?? 60)) throw new ForbiddenException('无新增权限');
}

export function guardCanEdit(collection: string, role: string) {
  if (role === 'outsource') {
    if (!OUTSOURCE_WRITE_COLLECTIONS.includes(collection)) throw new ForbiddenException('外协人员仅可写入部分功能');
    return;
  }
  const cat = getCategoryOf(collection);
  if (!cat) return;
  if (getRoleLevel(role) < (CATEGORY_EDIT_LEVEL[cat] ?? 60)) throw new ForbiddenException('无编辑权限');
}

export function guardCanDelete(collection: string, role: string) {
  if (role === 'outsource') throw new ForbiddenException('外协人员无删除权限');
  const cat = getCategoryOf(collection);
  if (!cat) return;
  if (getRoleLevel(role) < (CATEGORY_DELETE_LEVEL[cat] ?? 80)) throw new ForbiddenException('无删除权限');
}