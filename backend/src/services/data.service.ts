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

// 默认系统设置
export const DEFAULT_SETTINGS = {
  companyName: 'SG-Build',
  companyLogo: '',
  siteName: 'SG-Build 施工企业管理系统',
  systemDescription: '集项目管理、进度跟踪、物资调度、安全巡检于一体的企业级施工管理平台',
  dataRetentionDays: 365,
  sessionTimeoutMin: 120,
  passwordMinLength: 6,
  loginRetryLimit: 5,
  allowPublicRegister: true,
  maintenanceMode: false,
};

// 默认种子数据
function seed(): { users: any[]; collections: Record<string, any[]>; settings: Record<string, any>; conversations: any[]; chatMessages: any[] } {
  const collections: Record<string, any[]> = {};

  // 聊天群组 + 消息
  const now = Date.now();
  const d = 86400000;
  const h = 3600000;
    const conversations = [
    // ── 部门群（category: 'department'）──
    { id: 'dg_group', type: 'group', name: '集团公司群', category: 'department', departmentId: 'group', members: ['admin','manager','张伟','周芳','郑敏','马行政','林助理','王磊','赵丽','孙强','何安全','高安全','朱商务','秦商务','李明','钱人事','陈工','林工','刘市场','韩市场','杨市场','许投标','何投标','吕客服','施客服','梁质量','宋质量','吴刚','总工程师','总会计师','总经济师','赵子乙','钱子乙','孙子乙','李子乙','周子乙','吴一公司','周一公司','郑一公司','冯一公司','陈一公司','褚二公司','卫二公司','蒋二公司','沈二公司','韩二公司','杨三公司','朱三公司','秦三公司','尤三公司','许三公司'], admins: ['manager','张伟'], owner: 'admin' },
    { id: 'dg_board', type: 'group', name: '董事会群', category: 'department', departmentId: 'board', members: ['admin'], admins: [], owner: 'admin' },
    { id: 'dg_gm', type: 'group', name: '总经理办公室群', category: 'department', departmentId: 'gm-office', members: ['admin','manager','张伟'], admins: ['manager'], owner: 'admin' },
    { id: 'dg_office', type: 'group', name: '办公室群', category: 'department', departmentId: 'office', members: ['周芳','郑敏','马行政','林助理'], admins: ['郑敏'], owner: '周芳' },
    { id: 'dg_dgm-a', type: 'group', name: '副总经理A群', category: 'department', departmentId: 'dgm-a', members: ['张伟','王磊','赵丽','孙强','何安全','高安全','朱商务','秦商务','刘工','张副1','李技术1','王施工1','赵质量1','钱安全1','孙材料1','周测量','马师傅','张副2','李技术2','王施工2','赵质量2','钱安全2','孙材料2','周测量','张经理','李技术3','王施工3','赵质量3','钱安全3','李经理','张测量','王施工4','赵质量4','孙经理','周施工','吴安全','周经理','吴采购','郑质量','吴经理','郑施工','陈安全'], admins: ['王磊','赵丽','刘工','马师傅','张经理'], owner: '张伟' },
    { id: 'dg_dgm-b', type: 'group', name: '副总经理B群', category: 'department', departmentId: 'dgm-b', members: ['李明','钱人事','陈工','林工'], admins: ['李明'], owner: '李明' },
    { id: 'dg_dgm-c', type: 'group', name: '副总经理C群', category: 'department', departmentId: 'dgm-c', members: ['刘市场','韩市场','杨市场','许投标','何投标','吕客服','施客服','梁质量','宋质量','吴刚'], admins: ['刘市场','吕客服'], owner: '刘市场' },
    { id: 'dg_eng', type: 'group', name: '工程管理部群', category: 'department', departmentId: 'eng-mgmt', members: ['admin','王磊'], admins: [], owner: '王磊' },
    { id: 'dg_fin', type: 'group', name: '财务部群', category: 'department', departmentId: 'finance', members: ['admin','赵丽','赵会计','周出纳'], admins: ['赵会计'], owner: '赵丽' },
    { id: 'dg_saf', type: 'group', name: '安全生产部群', category: 'department', departmentId: 'safety', members: ['admin','孙强','何安全','高安全'], admins: ['何安全'], owner: '孙强' },
    { id: 'dg_con', type: 'group', name: '合同管理部群', category: 'department', departmentId: 'contract', members: ['admin','朱商务','秦商务'], admins: [], owner: '朱商务' },
    { id: 'dg_hr', type: 'group', name: '人力资源部群', category: 'department', departmentId: 'hr', members: ['admin','李明','钱人事'], admins: [], owner: '李明' },
    { id: 'dg_aud', type: 'group', name: '审计部群', category: 'department', departmentId: 'audit', members: ['admin','陈工','林工'], admins: [], owner: '陈工' },
    { id: 'dg_chief', type: 'group', name: '三总师群', category: 'department', departmentId: 'chief-eng', members: ['admin','总工程师','总会计师','总经济师'], admins: ['总工程师'], owner: '总工程师' },
    { id: 'dg_mkt', type: 'group', name: '市场开发部群', category: 'department', departmentId: 'market-dev', members: ['admin','刘市场','韩市场','杨市场','许投标','何投标'], admins: ['韩市场'], owner: '刘市场' },
    { id: 'dg_ops', type: 'group', name: '运维部群', category: 'department', departmentId: 'ops', members: ['admin','吕客服','施客服','梁质量','宋质量','吴刚'], admins: ['吴刚'], owner: '吕客服' },
    { id: 'dg_proj-a', type: 'group', name: '项目部A群', category: 'department', departmentId: 'proj-a', members: ['admin','刘工','张副1','李技术1','王施工1','赵质量1','钱安全1','孙材料1','周测量'], admins: ['张副1','李技术1'], owner: '刘工' },
    { id: 'dg_proj-b', type: 'group', name: '项目部B群', category: 'department', departmentId: 'proj-b', members: ['admin','马师傅','张副2','李技术2','王施工2','赵质量2','钱安全2','孙材料2','周测量'], admins: ['张副2','李技术2'], owner: '马师傅' },
    { id: 'dg_proj-c', type: 'group', name: '项目部C群', category: 'department', departmentId: 'proj-c', members: ['admin','张经理','李技术3','王施工3','赵质量3','钱安全3','李经理','张测量','王施工4','赵质量4','孙经理','周施工','吴安全','周经理','吴采购','郑质量','吴经理','郑施工','陈安全'], admins: ['李技术3'], owner: '张经理' },
    { id: 'dg_ba', type: 'group', name: '分公司A群', category: 'department', departmentId: 'branch-a', members: ['admin','钱建国','孙一','周一','吴一','郑一'], admins: ['孙一'], owner: '钱建国' },
    { id: 'dg_bb', type: 'group', name: '分公司B群', category: 'department', departmentId: 'branch-b', members: ['admin','陈国强','孙二','周二','吴二','郑二'], admins: ['孙二'], owner: '陈国强' },
    { id: 'dg_bc', type: 'group', name: '分公司C群', category: 'department', departmentId: 'branch-c', members: ['admin','周海涛','孙三','周三','吴三','郑三'], admins: ['孙三'], owner: '周海涛' },
    { id: 'dg_sa', type: 'group', name: '子公司甲群', category: 'department', departmentId: 'sub-alpha', members: ['admin','孙建国','孙四','周四','吴四','郑四'], admins: ['孙四'], owner: '孙建国' },
    { id: 'dg_sb', type: 'group', name: '子公司乙群', category: 'department', departmentId: 'sub-beta', members: ['admin','赵子乙','钱子乙','孙子乙','李子乙','周子乙'], admins: ['钱子乙'], owner: '赵子乙' },
    { id: 'dg_co1', type: 'group', name: '一公司群', category: 'department', departmentId: 'co-1', members: ['admin','吴一公司','周一公司','郑一公司','冯一公司','陈一公司'], admins: ['周一公司'], owner: '吴一公司' },
    { id: 'dg_co2', type: 'group', name: '二公司群', category: 'department', departmentId: 'co-2', members: ['admin','褚二公司','卫二公司','蒋二公司','沈二公司','韩二公司'], admins: ['卫二公司'], owner: '褚二公司' },
    { id: 'dg_co3', type: 'group', name: '三公司群', category: 'department', departmentId: 'co-3', members: ['admin','杨三公司','朱三公司','秦三公司','尤三公司','许三公司'], admins: ['朱三公司'], owner: '杨三公司' },
    // ── 普通群聊 ──
    { id: 'g4', type: 'group', name: '安全管理群', members: ['admin', '孙强', '吴刚', '何安全', '高安全'], admins: ['孙强'], owner: 'admin' },
    { id: 'g5', type: 'group', name: '综合事务群', members: ['admin', 'manager', '周芳', '郑敏', '马行政'], admins: ['manager'], owner: 'admin' },
    // 单聊
    { id: 's1', type: 'single', name: '孙强', members: ['admin', '孙强', '吴刚'], owner: '孙强' },
    { id: 's2', type: 'single', name: '张伟', members: ['admin', '张伟', '赵丽'], owner: '张伟' },
    { id: 's3', type: 'single', name: '刘市场', members: ['admin', '刘市场', '钱建国'], owner: '刘市场' },
    { id: 's4', type: 'single', name: '周芳', members: ['admin', '周芳', '郑敏'], owner: '周芳' },
    { id: 's5', type: 'single', name: '李明', members: ['admin', '李明', '赵丽'], owner: '李明' },
  ];
    const chatMessages = [
    // ══════════════════════════════════════════════
    //  项目部A（清河水库除险加固工程）
    // ══════════════════════════════════════════════
    { id: 'pa1', conversationId: 'dg_proj-a', sender: '刘工', content: '清河水库除险加固工程主体坝体浇筑安排在下周一，请各岗位做好准备', type: 'text', readBy: ['刘工','张副1','李技术1'], createdAt: new Date(now - d * 6).toISOString() },
    { id: 'pa2', conversationId: 'dg_proj-a', sender: '张副1', content: '收到，我提前准备好坝体混凝土配合比报告', type: 'text', readBy: ['刘工','张副1'], createdAt: new Date(now - d * 6 + h * 2).toISOString() },
    { id: 'pa3', conversationId: 'dg_proj-a', sender: '李技术1', content: '技术方案已经过水利厅专家组审核，没问题', type: 'text', readBy: ['刘工','李技术1'], createdAt: new Date(now - d * 5).toISOString() },
    { id: 'pa4', conversationId: 'dg_proj-a', sender: '王施工1', content: '现场防渗墙施工已完成，等待验收', type: 'text', readBy: ['王施工1'], createdAt: new Date(now - d * 4).toISOString() },
    { id: 'pa5', conversationId: 'dg_proj-a', sender: '赵质量1', content: '放水涵管浇筑计划已排好，明天开始', type: 'text', readBy: ['赵质量1'], createdAt: new Date(now - d * 3).toISOString() },
    { id: 'pa6', conversationId: 'dg_proj-a', sender: '钱安全1', content: '安全巡查发现坝肩有渗水点，已上报', type: 'text', readBy: ['刘工','钱安全1'], createdAt: new Date(now - d * 2).toISOString() },
    { id: 'pa7', conversationId: 'dg_proj-a', sender: '孙材料1', content: '水泥钢筋已进场，验收合格入库', type: 'text', readBy: ['孙材料1'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'pa8', conversationId: 'dg_proj-a', sender: '刘工', content: '验收通过，进度良好，继续推进', type: 'text', readBy: ['刘工'], createdAt: new Date(now - h * 8).toISOString() },
    // 项目部A — 阅后即焚消息
    { id: 'pa_f1', conversationId: 'dg_proj-a', sender: '刘工', content: '张副，坝体渗透系数数据先别上报，等我复核后再报水利厅', type: 'text', burn: true, burnSeconds: 30, burnTarget: '张副1', readBy: ['刘工'], createdAt: new Date(now - h * 6).toISOString() },
    { id: 'pa_f2', conversationId: 'dg_proj-a', sender: '张副1', content: '刘工，清河水库二期预算有调整，具体内容私聊，此消息阅后即焚', type: 'text', burn: true, burnSeconds: 60, burnTarget: '刘工', readBy: ['张副1'], createdAt: new Date(now - h * 3).toISOString() },
    { id: 'pa_f3', conversationId: 'dg_proj-a', sender: '李技术1', content: '刘工，防渗墙那个检测报告数据有点问题，你看看是不是要改', type: 'text', burn: true, burnSeconds: 30, burnTarget: '刘工', readBy: ['李技术1'], createdAt: new Date(now - h * 1).toISOString() },
    // 项目部A — 加密消息
    { id: 'pa_e1', conversationId: 'dg_proj-a', sender: '刘工', content: '水库除险加固总预算：总投资6800万，专项资金已到位', type: 'text', encrypted: true, readBy: ['刘工'], createdAt: new Date(now - d * 3).toISOString() },

    // ══════════════════════════════════════════════
    //  项目部B（南水北调支线渠系工程）
    // ══════════════════════════════════════════════
    { id: 'pb1', conversationId: 'dg_proj-b', sender: '马师傅', content: '南水北调支线渠系工程渠道开挖已完成80%', type: 'text', readBy: ['马师傅','张副2'], createdAt: new Date(now - d * 5).toISOString() },
    { id: 'pb2', conversationId: 'dg_proj-b', sender: '张副2', content: '渠道衬砌施工即将开始，预制板已进场', type: 'text', readBy: ['马师傅','张副2'], createdAt: new Date(now - d * 4).toISOString() },
    { id: 'pb3', conversationId: 'dg_proj-b', sender: '李技术2', content: '渡槽结构设计已完成，等设计院确认', type: 'text', readBy: ['李技术2'], createdAt: new Date(now - d * 3).toISOString() },
    { id: 'pb4', conversationId: 'dg_proj-b', sender: '王施工2', content: '渠道土方运输路线已确定，预计下周进场', type: 'text', readBy: ['王施工2'], createdAt: new Date(now - d * 2).toISOString() },
    { id: 'pb5', conversationId: 'dg_proj-b', sender: '赵质量2', content: '节制闸基坑开挖方案已报监理审批', type: 'text', readBy: ['赵质量2'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'pb6', conversationId: 'dg_proj-b', sender: '钱安全2', content: '水质监测点已布设完毕，开始实时监测', type: 'text', readBy: ['钱安全2'], createdAt: new Date(now - h * 10).toISOString() },
    { id: 'pb7', conversationId: 'dg_proj-b', sender: '孙材料2', content: '预制板到场2000块，质量合格', type: 'text', readBy: ['孙材料2'], createdAt: new Date(now - h * 6).toISOString() },
    { id: 'pb8', conversationId: 'dg_proj-b', sender: '马师傅', content: '渠道衬砌明天开始，全员6点到场', type: 'text', readBy: ['马师傅'], createdAt: new Date(now - h * 2).toISOString() },
    // 项目部B — 阅后即焚消息
    { id: 'pb_f1', conversationId: 'dg_proj-b', sender: '马师傅', content: '业主那边透露二期延伸段预算可增加到2亿，别往外说', type: 'text', burn: true, burnSeconds: 60, burnTarget: '张副2', readBy: ['马师傅'], createdAt: new Date(now - h * 8).toISOString() },
    { id: 'pb_f2', conversationId: 'dg_proj-b', sender: '张副2', content: '渠道衬砌分包报价有3家，最低价是1200万', type: 'text', burn: true, burnSeconds: 30, burnTarget: '马师傅', readBy: ['张副2'], createdAt: new Date(now - h * 4).toISOString() },
    { id: 'pb_f3', conversationId: 'dg_proj-b', sender: '李技术2', content: '渡槽那个变更签证金额可能要调，先别跟监理说', type: 'text', burn: true, burnSeconds: 30, burnTarget: '马师傅', readBy: ['李技术2'], createdAt: new Date(now - h * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  项目部C（流域治理 + 农田水利 + 水文监测 + 生态廊道 + 山区水库）
    // ══════════════════════════════════════════════
    // — 流域治理 —
    { id: 'pc1', conversationId: 'dg_proj-c', sender: '张经理', content: '项目部C本月在建项目4个，请各项目经理报送进度', type: 'text', readBy: ['张经理','李经理','孙经理','周经理','吴经理'], createdAt: new Date(now - d * 3).toISOString() },
    { id: 'pc2', conversationId: 'dg_proj-c', sender: '李经理', content: '流域治理工程河道疏浚方案已通过评审', type: 'text', readBy: ['李经理'], createdAt: new Date(now - d * 2).toISOString() },
    { id: 'pc3', conversationId: 'dg_proj-c', sender: '李技术3', content: '护岸工程设计变更已完成，等业主确认', type: 'text', readBy: ['李技术3'], createdAt: new Date(now - d * 2 + h * 3).toISOString() },
    { id: 'pc4', conversationId: 'dg_proj-c', sender: '张经理', content: '很好，准备上报水利局的施工图审查', type: 'text', readBy: ['张经理'], createdAt: new Date(now - d * 1).toISOString() },
    // — 农田水利 —
    { id: 'pc5', conversationId: 'dg_proj-c', sender: '孙经理', content: '农田水利灌溉工程渠道衬砌已通过验收', type: 'text', readBy: ['孙经理'], createdAt: new Date(now - d * 1 + h * 2).toISOString() },
    { id: 'pc6', conversationId: 'dg_proj-c', sender: '张测量', content: '量水设施安装已完成，开始通水试验', type: 'text', readBy: ['张测量'], createdAt: new Date(now - h * 10).toISOString() },
    // — 水文监测 —
    { id: 'pc7', conversationId: 'dg_proj-c', sender: '周经理', content: '跨河大桥水文监测站基础施工已完成', type: 'text', readBy: ['周经理'], createdAt: new Date(now - h * 8).toISOString() },
    { id: 'pc8', conversationId: 'dg_proj-c', sender: '周施工', content: '水位计、雨量计已采购，下周到货安装', type: 'text', readBy: ['周施工'], createdAt: new Date(now - h * 6).toISOString() },
    // — 生态廊道 —
    { id: 'pc9', conversationId: 'dg_proj-c', sender: '吴经理', content: '滨江生态廊道工程植被恢复方案已定', type: 'text', readBy: ['吴经理'], createdAt: new Date(now - h * 5).toISOString() },
    { id: 'pc10', conversationId: 'dg_proj-c', sender: '吴采购', content: '生态护坡材料已到场，准备施工', type: 'text', readBy: ['吴采购'], createdAt: new Date(now - h * 4).toISOString() },
    // — 山区水库 —
    { id: 'pc11', conversationId: 'dg_proj-c', sender: '郑施工', content: '溢洪道结构计算已完成，等设计院确认', type: 'text', readBy: ['郑施工'], createdAt: new Date(now - h * 3).toISOString() },
    { id: 'pc12', conversationId: 'dg_proj-c', sender: '陈安全', content: '山区水库基坑开挖安全专项方案已报批', type: 'text', readBy: ['陈安全'], createdAt: new Date(now - h * 2).toISOString() },
    { id: 'pc13', conversationId: 'dg_proj-c', sender: '赵质量3', content: '流域治理护岸混凝土试块强度合格', type: 'text', readBy: ['赵质量3'], createdAt: new Date(now - h * 1).toISOString() },
    // 项目部C — 阅后即焚消息
    { id: 'pc_f1', conversationId: 'dg_proj-c', sender: '张经理', content: '河道采砂许可证审批有变，具体数字先别对外透露', type: 'text', burn: true, burnSeconds: 15, burnTarget: '李技术3', readBy: ['张经理'], createdAt: new Date(now - h * 7).toISOString() },
    { id: 'pc_f2', conversationId: 'dg_proj-c', sender: '李经理', content: '流域治理那个分包队结算有水分，你帮我先压一下', type: 'text', burn: true, burnSeconds: 30, burnTarget: '张经理', readBy: ['李经理'], createdAt: new Date(now - h * 5).toISOString() },
    { id: 'pc_f3', conversationId: 'dg_proj-c', sender: '孙经理', content: '农田水利变更签证金额120万，业主口头同意了', type: 'text', burn: true, burnSeconds: 30, burnTarget: '张经理', readBy: ['孙经理'], createdAt: new Date(now - h * 3).toISOString() },
    { id: 'pc_f4', conversationId: 'dg_proj-c', sender: '周经理', content: '水文监测站那个设备采购价比市场价高15%，你心里有数', type: 'text', burn: true, burnSeconds: 30, burnTarget: '张经理', readBy: ['周经理'], createdAt: new Date(now - h * 2).toISOString() },
    { id: 'pc_f5', conversationId: 'dg_proj-c', sender: '吴经理', content: '生态廊道苗木供应商报价有回扣空间，具体面谈', type: 'text', burn: true, burnSeconds: 60, burnTarget: '张经理', readBy: ['吴经理'], createdAt: new Date(now - h * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  集团公司群消息
    // ══════════════════════════════════════════════
    { id: 'dg1', conversationId: 'dg_group', sender: 'admin', content: '集团公司各位同事，本周五下午召开季度总结会', type: 'text', readBy: ['admin','manager','张伟'], createdAt: new Date(now - d * 2).toISOString() },
    { id: 'dg2', conversationId: 'dg_group', sender: 'manager', content: '收到，我准备汇报材料', type: 'text', readBy: ['admin','manager'], createdAt: new Date(now - d * 2 + h).toISOString() },
    { id: 'dg3', conversationId: 'dg_group', sender: '张伟', content: '总经理办公室已将会议议程发给各部门', type: 'text', readBy: ['admin','张伟'], createdAt: new Date(now - d * 2 + h * 2).toISOString() },

    // ══════════════════════════════════════════════
    //  副总经理A群消息
    // ══════════════════════════════════════════════
    { id: 'da1', conversationId: 'dg_dgm-a', sender: '张伟', content: '各项目部本月进度报表请于25日前提交', type: 'text', readBy: ['张伟','刘工','马师傅'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'da2', conversationId: 'dg_dgm-a', sender: '刘工', content: '项目部A进度正常，已提交', type: 'text', readBy: ['刘工'], createdAt: new Date(now - d * 1 + h * 2).toISOString() },
    { id: 'da3', conversationId: 'dg_dgm-a', sender: '马师傅', content: '项目部B渠道衬砌施工进入关键期', type: 'text', readBy: ['马师傅'], createdAt: new Date(now - h * 12).toISOString() },

    // ══════════════════════════════════════════════
    //  安全管理群消息
    // ══════════════════════════════════════════════
    { id: 'sm1', conversationId: 'g4', sender: '孙强', content: '本月水利工程施工安全检查发现4项隐患', type: 'text', readBy: ['admin','孙强','吴刚'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'sm2', conversationId: 'g4', sender: '何安全', content: '清河水库坝肩渗水点已设置监测仪器', type: 'text', readBy: ['admin','何安全'], createdAt: new Date(now - h * 8).toISOString() },
    { id: 'sm3', conversationId: 'g4', sender: '高安全', content: '南水北调渠道基坑临边防护已整改完毕', type: 'text', readBy: ['高安全'], createdAt: new Date(now - h * 4).toISOString() },

    // ══════════════════════════════════════════════
    //  分公司A群消息
    // ══════════════════════════════════════════════
    { id: 'ba1', conversationId: 'dg_ba', sender: '钱建国', content: '分公司A本月产值目标800万，目前进度70%', type: 'text', readBy: ['钱建国','孙一'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'ba2', conversationId: 'dg_ba', sender: '孙一', content: '安全质量检查已安排，明天开始', type: 'text', readBy: ['孙一'], createdAt: new Date(now - h * 8).toISOString() },

    // ══════════════════════════════════════════════
    //  分公司B群消息
    // ══════════════════════════════════════════════
    { id: 'bb1', conversationId: 'dg_bb', sender: '陈国强', content: '分公司B审计资料已准备完毕', type: 'text', readBy: ['陈国强','孙二'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'bb2', conversationId: 'dg_bb', sender: '孙二', content: '项目进度报告已提交', type: 'text', readBy: ['孙二'], createdAt: new Date(now - h * 6).toISOString() },

    // ══════════════════════════════════════════════
    //  分公司C群消息
    // ══════════════════════════════════════════════
    { id: 'bc1', conversationId: 'dg_bc', sender: '周海涛', content: '分公司C本月施工计划已下发', type: 'text', readBy: ['周海涛','孙三'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'bc2', conversationId: 'dg_bc', sender: '孙三', content: '设备进场验收完成', type: 'text', readBy: ['孙三'], createdAt: new Date(now - h * 5).toISOString() },

    // ══════════════════════════════════════════════
    //  子公司甲群消息
    // ══════════════════════════════════════════════
    { id: 'sa1', conversationId: 'dg_sa', sender: '孙建国', content: '子公司甲年度目标已完成75%', type: 'text', readBy: ['孙建国','孙四'], createdAt: new Date(now - d * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  子公司乙群消息
    // ══════════════════════════════════════════════
    { id: 'sb1', conversationId: 'dg_sb', sender: '赵子乙', content: '子公司乙新业务拓展方案已上报集团', type: 'text', readBy: ['赵子乙','钱子乙'], createdAt: new Date(now - d * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  一公司群消息
    // ══════════════════════════════════════════════
    { id: 'co1_1', conversationId: 'dg_co1', sender: '吴一公司', content: '一公司本月产值目标600万，进度65%', type: 'text', readBy: ['吴一公司','周一公司'], createdAt: new Date(now - d * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  二公司群消息
    // ══════════════════════════════════════════════
    { id: 'co2_1', conversationId: 'dg_co2', sender: '褚二公司', content: '二公司本月产值目标500万，进度60%', type: 'text', readBy: ['褚二公司','卫二公司'], createdAt: new Date(now - d * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  三公司群消息
    // ══════════════════════════════════════════════
    { id: 'co3_1', conversationId: 'dg_co3', sender: '杨三公司', content: '三公司本月产值目标400万，进度55%', type: 'text', readBy: ['杨三公司','朱三公司'], createdAt: new Date(now - d * 1).toISOString() },

    // ══════════════════════════════════════════════
    //  综合事务群消息
    // ══════════════════════════════════════════════
    { id: 'za1', conversationId: 'g5', sender: 'manager', content: '下周一下午2点全员例会，请准时参加', type: 'text', readBy: ['admin','manager','周芳'], createdAt: new Date(now - d * 1).toISOString() },
    { id: 'za2', conversationId: 'g5', sender: '周芳', content: '报销审批流程已更新，请大家注意新规定', type: 'text', readBy: ['admin','周芳'], createdAt: new Date(now - h * 3).toISOString() },

    // ══════════════════════════════════════════════
    //  单聊消息
    // ══════════════════════════════════════════════
    { id: 's1m1', conversationId: 's1', sender: '孙强', content: '吴刚，清河水库坝肩渗水点需要重点监测', type: 'text', readBy: ['孙强','吴刚'], createdAt: new Date(now - d * 3).toISOString() },
    { id: 's1m2', conversationId: 's1', sender: '吴刚', content: '好的，我上午过去，带上渗压计', type: 'text', readBy: ['孙强','吴刚'], createdAt: new Date(now - d * 3 + h).toISOString() },
    // 孙强发给admin的阅后即焚
    { id: 's1m_burn1', conversationId: 's1', sender: '孙强', content: 'admin，清河水库那次渗漏事故的责任人名单我先不发，等上级下来再说', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['孙强'], createdAt: new Date(now - d * 2).toISOString() },
    // admin发给孙强的阅后即焚
    { id: 's1m_burn2', conversationId: 's1', sender: 'admin', content: '孙强，上次安全检查发现的4项隐患，第3项是资质问题，先别公开通报', type: 'text', burn: true, burnSeconds: 60, burnTarget: '孙强', readBy: ['admin'], createdAt: new Date(now - d * 1).toISOString() },
    // 张伟发给admin的阅后即焚
    { id: 's2m_burn1', conversationId: 's2', sender: '张伟', content: 'admin，张伟涛的投标报价有异常，单价比市场价低20%，你心里有数', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['张伟'], createdAt: new Date(now - d * 1 + h * 3).toISOString() },
    // admin发给张伟的阅后即焚
    { id: 's2m_burn2', conversationId: 's2', sender: 'admin', content: '张伟，流域治理那个项目的业主关系你要稳住，具体细节电话说', type: 'text', burn: true, burnSeconds: 60, burnTarget: '张伟', readBy: ['admin'], createdAt: new Date(now - h * 8).toISOString() },
    // 刘市场发给admin的阅后即焚
    { id: 's3m_burn1', conversationId: 's3', sender: '刘市场', content: 'admin，南水北调那个渠道衬砌的分包队报价有问题，1200万是底线，不能再降了', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['刘市场'], createdAt: new Date(now - h * 6).toISOString() },
    // admin发给刘市场的阅后即焚
    { id: 's3m_burn2', conversationId: 's3', sender: 'admin', content: '刘市场，下个月市场部要跟进3个新项目，预算已经批了，具体数字你别跟别人说', type: 'text', burn: true, burnSeconds: 45, burnTarget: '刘市场', readBy: ['admin'], createdAt: new Date(now - h * 4).toISOString() },
    // 钱建国发给admin的阅后即焚
    { id: 's3m_burn3', conversationId: 's3', sender: '钱建国', content: 'admin，分公司A的安全生产费挪用了一部分，大概80万，我准备补上但还没批下来', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['钱建国'], createdAt: new Date(now - h * 2).toISOString() },
    // admin发给钱建国的阅后即焚
    { id: 's3m_burn4', conversationId: 's3', sender: 'admin', content: '钱建国，分公司A的那个分包队结算有水分，你先压着，我让审计部去查', type: 'text', burn: true, burnSeconds: 60, burnTarget: '钱建国', readBy: ['admin'], createdAt: new Date(now - h).toISOString() },
    // 周芳发给admin的阅后即焚
    { id: 's4m_burn1', conversationId: 's4', sender: '周芳', content: 'admin，办公室采购的办公用品发票有问题，金额对不上，我先压着没报财务', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['周芳'], createdAt: new Date(now - h * 5).toISOString() },
    // admin发给周芳的阅后即焚
    { id: 's4m_burn2', conversationId: 's4', sender: 'admin', content: '周芳，办公室那个采购单你帮我重新审核一下，有些项目要删掉', type: 'text', burn: true, burnSeconds: 45, burnTarget: '周芳', readBy: ['admin'], createdAt: new Date(now - h * 2).toISOString() },
    // 李明发给admin的阅后即焚
    { id: 's5m_burn1', conversationId: 's5', sender: '李明', content: 'admin，人力资源部这个月的社保基数要调整，涉及成本增加约15万，你先别看这份报告', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['李明'], createdAt: new Date(now - h * 7).toISOString() },
    // admin发给李明的阅后即焚
    { id: 's5m_burn2', conversationId: 's5', sender: 'admin', content: '李明，下季度的人员编制方案先别发，我打算缩减技术岗，具体方案晚点通知你', type: 'text', burn: true, burnSeconds: 60, burnTarget: '李明', readBy: ['admin'], createdAt: new Date(now - h * 3).toISOString() },

    // ══════════════════════════════════════════════
    //  发给吴刚的阅后即焚消息
    // ══════════════════════════════════════════════
    // 孙强发给吴刚的阅后即焚
    { id: 'wg_s1', conversationId: 's1', sender: '孙强', content: '吴刚，清河水库那次事故的质量检测报告我有保留，数据有点问题，你要小心', type: 'text', burn: true, burnSeconds: 30, burnTarget: '吴刚', readBy: ['孙强'], createdAt: new Date(now - d * 2 + h * 5).toISOString() },
    // admin发给吴刚的阅后即焚
    { id: 'wg_s2', conversationId: 's1', sender: 'admin', content: '吴刚，质量管理部那个抽查报告先别急着发，有几个问题还没核实清楚', type: 'text', burn: true, burnSeconds: 60, burnTarget: '吴刚', readBy: ['admin'], createdAt: new Date(now - d * 1 + h * 2).toISOString() },
    // 吴一发给吴刚的阅后即焚（分公司人员发给总部质量部门）
    { id: 'wg_s3', conversationId: 's1', sender: '周一公司', content: '吴刚，一公司这边有个质量验收通过了，但监理那边有点意见，你帮我们打个招呼', type: 'text', burn: true, burnSeconds: 30, burnTarget: '吴刚', readBy: ['周一公司'], createdAt: new Date(now - h * 6).toISOString() },

    // ══════════════════════════════════════════════
    //  发给admin的群聊阅后即焚消息
    // ══════════════════════════════════════════════
    // 副总经理A群里的阅后即焚
    { id: 'dgda_burn1', conversationId: 'dg_dgm-a', sender: '张伟', content: '各位，总经理办公室有个内部调整的消息，大家可以私下交流，但别在群里说', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['张伟'], createdAt: new Date(now - d * 1 + h * 4).toISOString() },
    // 副总经理B群里的阅后即焚
    { id: 'dgdb_burn1', conversationId: 'dg_dgm-b', sender: '李明', content: '审计部发现了几个问题，涉及资金流向，我会单独汇报给总经理', type: 'text', burn: true, burnSeconds: 60, burnTarget: 'admin', readBy: ['李明'], createdAt: new Date(now - h * 10).toISOString() },
    // 副总经理C群里的阅后即焚
    { id: 'dgdc_burn1', conversationId: 'dg_dgm-c', sender: '刘市场', content: '市场部接到了一个意向订单，金额很大，但还没定，大家先别外传', type: 'text', burn: true, burnSeconds: 30, burnTarget: 'admin', readBy: ['刘市场'], createdAt: new Date(now - h * 8).toISOString() },
    // 集团公司群里的阅后即焚
    { id: 'dgg_burn1', conversationId: 'dg_group', sender: 'manager', content: 'admin，集团下周有个重要会议，议题涉及人事调整，具体内容会后再通知大家', type: 'text', burn: true, burnSeconds: 45, burnTarget: 'admin', readBy: ['manager'], createdAt: new Date(now - h * 5).toISOString() },

    // ══════════════════════════════════════════════
    //  admin发给各群的阅后即焚消息
    // ══════════════════════════════════════════════
    // admin在安全管理群发的阅后即焚
    { id: 'adm_g4_burn1', conversationId: 'g4', sender: 'admin', content: '孙强，上次的隐患整改报告你先别发出去，有几个数据需要再核实', type: 'text', burn: true, burnSeconds: 30, burnTarget: '孙强', readBy: ['admin'], createdAt: new Date(now - h * 7).toISOString() },
    // admin在综合事务群发的阅后即焚
    { id: 'adm_g5_burn1', conversationId: 'g5', sender: 'admin', content: '各位，下周的例会取消，改为各部门内部总结，具体安排另行通知', type: 'text', burn: true, burnSeconds: 60, burnTarget: 'manager', readBy: ['admin'], createdAt: new Date(now - h * 4).toISOString() },
    // admin在项目部A群发的阅后即焚
    { id: 'adm_pa_burn1', conversationId: 'dg_proj-a', sender: 'admin', content: '刘工，清河水库那个渗水点的监测数据有异常，你先别上报，等我复核', type: 'text', burn: true, burnSeconds: 30, burnTarget: '刘工', readBy: ['admin'], createdAt: new Date(now - h * 3).toISOString() },
    // admin在项目部B群发的阅后即焚
    { id: 'adm_pb_burn1', conversationId: 'dg_proj-b', sender: 'admin', content: '马师傅，南水北调那个渠道衬砌的分包报价，我有异议，你先别签合同', type: 'text', burn: true, burnSeconds: 45, burnTarget: '马师傅', readBy: ['admin'], createdAt: new Date(now - h * 2).toISOString() },
    // admin在项目部C群发的阅后即焚
    { id: 'adm_pc_burn1', conversationId: 'dg_proj-c', sender: 'admin', content: '张经理，项目部C有几个分包结算有问题，审计部下周会介入调查', type: 'text', burn: true, burnSeconds: 60, burnTarget: '张经理', readBy: ['admin'], createdAt: new Date(now - h).toISOString() },
    // admin在分公司A群发的阅后即焚
    { id: 'adm_ba_burn1', conversationId: 'dg_ba', sender: 'admin', content: '钱建国，分公司A的安全检查记录有缺失，你要补上，别让大家知道是我说的', type: 'text', burn: true, burnSeconds: 30, burnTarget: '钱建国', readBy: ['admin'], createdAt: new Date(now - h * 6).toISOString() },
    // admin在子公司甲群发的阅后即焚
     { id: 'adm_sa_burn1', conversationId: 'dg_sa', sender: 'admin', content: '孙建国，子公司甲的资质年审材料有问题，重新准备一下，别让人知道是哪里错了', type: 'text', burn: true, burnSeconds: 45, burnTarget: '孙建国', readBy: ['admin'], createdAt: new Date(now - h * 3).toISOString() },
  ];

  // 聊天分组配置（三级结构）
  // 一级：顶级分组（parentId=null）
  // 二级：子类分组（parentId=一级ID，无departmentIds）
  // 三级：实际群聊匹配规则（parentId=二级ID，有departmentIds）
  collections['chatGroups'] = [
    // ═══ 一级：集团总部组 ═══
    { id: 'group_exec', name: '集团总部组', icon: '🏛', color: 'blue', sortOrder: 0, description: '集团管理层群', parentId: null },

    // 二级：总经办子类（容器，无departmentIds）
    { id: 'sub_exec_parent', name: '总经办组', icon: '👔', color: 'blue', sortOrder: 0, description: '总经理及副总层级', parentId: 'group_exec' },

    // 三级：副总群
    { id: 'sub_dgm', name: '副总群', icon: '👔', color: 'blue', sortOrder: 0, description: '副总经理群', parentId: 'sub_exec_parent', departmentIds: ['dgm-a', 'dgm-b', 'dgm-c'] },
    // 三级：三总师群
    { id: 'sub_chief', name: '三总师群', icon: '⚙️', color: 'blue', sortOrder: 1, description: '总工程师/会计师/经济师', parentId: 'sub_exec_parent', departmentIds: ['chief-eng'] },
    // 三级：高管群
    { id: 'sub_exec', name: '高管群', icon: '🎩', color: 'blue', sortOrder: 2, description: '董事会与总经理', parentId: 'sub_exec_parent', departmentIds: ['board', 'gm-office'] },

    // ═══ 一级：分子公司组（下拉直接各分公司/子公司/公司群，不设子分组）═══
    { id: 'group_branch', name: '分子公司组', icon: '🏢', color: 'amber', sortOrder: 1, description: '分公司与子公司', parentId: null, departmentIds: ['branch-a', 'branch-b', 'branch-c', 'sub-alpha', 'sub-beta', 'co-1', 'co-2', 'co-3'] },

    // ═══ 一级：集团部门组（下拉直接各部门群，不设子分组）═══
    { id: 'group_dept', name: '集团部门组', icon: '📋', color: 'purple', sortOrder: 2, description: '集团职能部门', parentId: null, departmentIds: ['eng-mgmt', 'finance', 'safety', 'contract', 'hr', 'audit', 'market-dev', 'ops', 'office'] },

    // ═══ 一级：项目部组（下拉直接各项目部群，不设子分组）═══
    { id: 'group_proj', name: '项目部组', icon: '🏗', color: 'emerald', sortOrder: 3, description: '项目执行单元', parentId: null, departmentIds: ['proj-a', 'proj-b', 'proj-c'] },

    // ═══ 一级：其他群组（下拉直接各群，不设子分组）═══
    { id: 'group_other', name: '其他群组', icon: '💬', color: 'gray', sortOrder: 4, description: '其他自建群', parentId: null },
  ];


  collections['suppliers'] = [
    { id: 's1', name: '华源水泥集团', contact: '王强', phone: '13900000001', material: '大坝专用水泥、混凝土' },
    { id: 's2', name: '恒信钢材集团', contact: '刘洋', phone: '13900000002', material: '钢筋、钢板桩' },
    { id: 's3', name: '安达机械租赁', contact: '马丽', phone: '13900000003', material: '挖掘机、装载机' },
    { id: 's4', name: '水利材料厂', contact: '张总', phone: '13900000004', material: '土工膜、防渗材料' },
    { id: 's5', name: '监测设备公司', contact: '李总', phone: '13900000005', material: '渗压计、水位计' },
  ];

  collections['materials'] = [
    { id: 'm1', name: '大坝专用水泥', spec: 'P.O42.5', unit: '吨', price: 520 },
    { id: 'm2', name: 'HRB400螺纹钢', spec: 'Φ20', unit: '吨', price: 3650 },
    { id: 'm3', name: '土工膜', spec: '0.5mm', unit: '㎡', price: 18 },
    { id: 'm4', name: '预制混凝土板', spec: '渠道衬砌用', unit: '块', price: 85 },
    { id: 'm5', name: '渗压计', spec: '智能型', unit: '台', price: 3500 },
    { id: 'm6', name: '水位计', spec: '雷达式', unit: '台', price: 8500 },
  ];

  collections['teams'] = [
    { id: 't1', name: '坝体施工班组', leader: '刘工', members: 35, project: '清河水库' },
    { id: 't2', name: '渠道衬砌班组', leader: '马师傅', members: 28, project: '南水北调' },
    { id: 't3', name: '防渗施工班组', leader: '李技术', members: 18, project: '清河水库' },
    { id: 't4', name: '渡槽施工班组', leader: '马师傅', members: 22, project: '南水北调' },
    { id: 't5', name: '土方班组', leader: '刘工', members: 15, project: '农田水利' },
    { id: 't6', name: '河道疏浚班组', leader: '张经理', members: 30, project: '流域治理' },
    { id: 't7', name: '生态护坡班组', leader: '马师傅', members: 16, project: '生态廊道' },
    { id: 't8', name: '监测设备安装班组', leader: '孙经理', members: 10, project: '水文监测' },
  ];

  collections['projects'] = [
    { id: 'p1', name: '清河水库除险加固工程', code: 'SL-2024-001', manager: '刘工', budget: 6800, startDate: '2024-03-01', endDate: '2026-06-30', status: '在建' },
    { id: 'p2', name: '南水北调支线渠系工程', code: 'SL-2024-002', manager: '马师傅', budget: 15000, startDate: '2024-05-15', endDate: '2027-01-31', status: '在建' },
    { id: 'p3', name: '城市防洪堤加固工程', code: 'SL-2023-003', manager: '钱建国', budget: 5000, startDate: '2023-09-01', endDate: '2026-03-31', status: '竣工' },
    { id: 'p4', name: '流域综合治理工程', code: 'SL-2025-004', manager: '张经理', budget: 32000, startDate: '2025-01-15', endDate: '2027-12-31', status: '在建' },
    { id: 'p5', name: '农田水利灌溉工程', code: 'SL-2025-005', manager: '李经理', budget: 2800, startDate: '2025-06-01', endDate: '2026-12-31', status: '在建' },
    { id: 'p6', name: '湿地公园水系工程', code: 'SL-2024-006', manager: '王磊', budget: 4380, startDate: '2024-08-01', endDate: '2026-06-30', status: '完工' },
    { id: 'p7', name: '污水处理厂升级工程', code: 'SL-2023-007', manager: '赵丽', budget: 8000, startDate: '2023-03-01', endDate: '2025-12-31', status: '完工' },
    { id: 'p8', name: '跨河大桥水文监测站', code: 'SL-2026-008', manager: '孙经理', budget: 1200, startDate: '2026-01-01', endDate: '2027-06-30', status: '在建' },
    { id: 'p9', name: '滨江生态廊道工程', code: 'SL-2025-009', manager: '周经理', budget: 5600, startDate: '2025-04-01', endDate: '2027-03-31', status: '在建' },
    { id: 'p10', name: '灌区现代化改造工程', code: 'SL-2023-010', manager: '陈国强', budget: 3200, startDate: '2023-06-01', endDate: '2025-08-31', status: '竣工' },
    { id: 'p11', name: '山区小型水库建设', code: 'SL-2026-011', manager: '吴经理', budget: 2500, startDate: '2026-03-01', endDate: '2027-08-31', status: '在建' },
  ];

  // 工程管理
  collections['projectArchives'] = [
    { id: 'pa1', name: '清河水库除险加固工程', code: 'SL-2024-001', manager: '刘工', customer: '市水利局', amount: 68000000, startDate: '2024-03-01', endDate: '2026-06-30', status: '在建' },
    { id: 'pa2', name: '南水北调支线渠系工程', code: 'SL-2024-002', manager: '马师傅', customer: '省水利厅', amount: 150000000, startDate: '2024-05-15', endDate: '2027-01-31', status: '在建' },
    { id: 'pa3', name: '城市防洪堤加固工程', code: 'SL-2023-003', manager: '钱建国', customer: '市防汛办', amount: 50000000, startDate: '2023-09-01', endDate: '2026-03-31', status: '竣工' },
    { id: 'pa4', name: '流域综合治理工程', code: 'SL-2025-004', manager: '张经理', customer: '流域管理局', amount: 320000000, startDate: '2025-01-15', endDate: '2027-12-31', status: '在建' },
    { id: 'pa5', name: '农田水利灌溉工程', code: 'SL-2025-005', manager: '李经理', customer: '县农业农村局', amount: 28000000, startDate: '2025-06-01', endDate: '2026-12-31', status: '在建' },
    { id: 'pa6', name: '湿地公园水系工程', code: 'SL-2024-006', manager: '王磊', customer: '市园林局', amount: 43800000, startDate: '2024-08-01', endDate: '2026-06-30', status: '完工' },
    { id: 'pa7', name: '污水处理厂升级工程', code: 'SL-2023-007', manager: '赵丽', customer: '市环保局', amount: 80000000, startDate: '2023-03-01', endDate: '2025-12-31', status: '完工' },
    { id: 'pa8', name: '跨河大桥水文监测站', code: 'SL-2026-008', manager: '孙经理', customer: '水文局', amount: 12000000, startDate: '2026-01-01', endDate: '2027-06-30', status: '在建' },
    { id: 'pa9', name: '滨江生态廊道工程', code: 'SL-2025-009', manager: '周经理', customer: '市住建局', amount: 56000000, startDate: '2025-04-01', endDate: '2027-03-31', status: '在建' },
    { id: 'pa10', name: '灌区现代化改造工程', code: 'SL-2023-010', manager: '陈国强', customer: '灌区管理处', amount: 32000000, startDate: '2023-06-01', endDate: '2025-08-31', status: '竣工' },
    { id: 'pa11', name: '山区小型水库建设', code: 'SL-2026-011', manager: '吴经理', customer: '县水利局', amount: 25000000, startDate: '2026-03-01', endDate: '2027-08-31', status: '在建' },
  ];

  collections['plans'] = [
    { id: 'pl1', name: '清河水库坝体混凝土需用计划', project: '清河水库除险加固工程', material: '大坝专用水泥', quantity: 1500, unit: '吨', planDate: '2026-07-01', status: '已批准' },
    { id: 'pl2', name: '南水北调渠道衬砌板需用计划', project: '南水北调支线渠系工程', material: '预制混凝土板', quantity: 5000, unit: '块', planDate: '2026-07-15', status: '待审批' },
    { id: 'pl3', name: '清河水库防渗土工膜需用计划', project: '清河水库除险加固工程', material: '土工膜', quantity: 8000, unit: '㎡', planDate: '2026-08-01', status: '待审批' },
  ];

  collections['productionValues'] = [
    { id: 'pv1', project: '清河水库除险加固工程', month: '2026-07', value: 1250, owner: '刘工' },
    { id: 'pv2', project: '南水北调支线渠系工程', month: '2026-07', value: 980, owner: '马师傅' },
    { id: 'pv3', project: '清河水库除险加固工程', month: '2026-06', value: 1100, owner: '刘工' },
    { id: 'pv4', project: '流域综合治理工程', month: '2026-07', value: 3200, owner: '张经理' },
    { id: 'pv5', project: '农田水利灌溉工程', month: '2026-07', value: 850, owner: '李经理' },
    { id: 'pv6', project: '跨河大桥水文监测站', month: '2026-07', value: 450, owner: '孙经理' },
    { id: 'pv7', project: '滨江生态廊道工程', month: '2026-07', value: 680, owner: '周经理' },
    { id: 'pv8', project: '山区小型水库建设', month: '2026-07', value: 420, owner: '吴经理' },
    { id: 'pv9', project: '清河水库除险加固工程', month: '2026-05', value: 1050, owner: '刘工' },
    { id: 'pv10', project: '南水北调支线渠系工程', month: '2026-06', value: 920, owner: '马师傅' },
  ];

  collections['budgets'] = [
    { id: 'bd1', name: '清河水库除险加固预算', project: '清河水库除险加固工程', amount: 68000000, date: '2024-04-01' },
    { id: 'bd2', name: '南水北调渠系工程预算', project: '南水北调支线渠系工程', amount: 150000000, date: '2024-06-15' },
    { id: 'bd3', name: '流域治理工程预算', project: '流域综合治理工程', amount: 320000000, date: '2025-02-01' },
    { id: 'bd4', name: '农田水利灌溉预算', project: '农田水利灌溉工程', amount: 28000000, date: '2025-07-01' },
    { id: 'bd5', name: '水文监测站预算', project: '跨河大桥水文监测站', amount: 12000000, date: '2026-02-01' },
    { id: 'bd6', name: '生态廊道工程预算', project: '滨江生态廊道工程', amount: 56000000, date: '2025-05-01' },
  ];

  collections['rentalPlans'] = [
    { id: 'rp1', name: '清河水库挖掘机租赁计划', equipment: '挖掘机CAT320', quantity: 3, duration: 12, startDate: '2026-09-01' },
    { id: 'rp2', name: '南水北调运输车辆租赁计划', equipment: '自卸车20t', quantity: 10, duration: 8, startDate: '2026-08-15' },
  ];

  collections['subcontractPlans'] = [
    { id: 'sp1', name: '清河水库防渗工程分包计划', project: '清河水库除险加固工程', content: '库盆防渗施工', amount: 2600000, team: '水利防渗班组' },
    { id: 'sp2', name: '南水北调渠道衬砌分包计划', project: '南水北调支线渠系工程', content: '渠道预制板铺设', amount: 5800000, team: '渠道衬砌班组' },
  ];

  collections['changes'] = [
    { id: 'ch1', title: '清河水库坝体加高变更', project: '清河水库除险加固工程', type: '设计变更', amount: 850000, content: '坝顶加高0.5米以满足防洪标准', status: '已批准' },
    { id: 'ch2', title: '南水北调渠道线路调整', project: '南水北调支线渠系工程', type: '签证变更', amount: 320000, content: '穿越村庄路段调整', status: '待审批' },
    { id: 'ch3', title: '流域治理护岸结构变更', project: '流域综合治理工程', type: '设计变更', amount: 450000, content: '护岸型式由重力式改为扶壁式', status: '待审批' },
    { id: 'ch4', title: '地铁3号线车站加宽', project: '地铁3号线二期土建', type: '设计变更', amount: 5600000, content: '1号站台加宽2米', status: '待审批' },
    { id: 'ch5', title: '城北道路路基处理方案变更', project: '城北新区道路改造', type: '签证变更', amount: 780000, content: '软基处理换填方案调整', status: '已批准' },
    { id: 'ch6', title: '高铁站项目桩基变更', project: '高铁站交通枢纽', type: '设计变更', amount: 12000000, content: '桩基深度调整', status: '待审批' },
  ];

  collections['completions'] = [
    { id: 'cm1', project: '城东物流园工程', settleAmount: 23500000, settleDate: '2026-06-20', status: '已完成' },
  ];

  // 审批中心
  collections['approvals'] = [
    { id: 'a1', title: '采购一批钢材的审批', applicant: 'admin', type: '采购审批', amount: 85000, date: '2026-08-10', status: '待审批' },
    { id: 'a2', title: '出差报销申请', applicant: 'admin', type: '报销审批', amount: 3600, date: '2026-08-11', status: '待审批' },
    { id: 'a3', title: '滨江大桥分包合同审批', applicant: 'admin', type: '合同审批', amount: 1500000, date: '2026-08-08', status: '已批准' },
    { id: 'a4', title: '租用塔吊申请', applicant: 'admin', type: '用款审批', amount: 120000, date: '2026-08-05', status: '已驳回' },
    { id: 'a5', title: '地铁3号线钢材采购', applicant: '张伟', type: '采购审批', amount: 5600000, date: '2026-08-12', status: '待审批' },
    { id: 'a6', title: '城北道路改造混凝土采购', applicant: '李明', type: '采购审批', amount: 1200000, date: '2026-08-13', status: '待审批' },
    { id: 'a7', title: '孙强出差差旅费报销', applicant: '孙强', type: '报销审批', amount: 2800, date: '2026-08-14', status: '待审批' },
    { id: 'a8', title: '高铁站项目设备租赁', applicant: '张伟', type: '用款审批', amount: 350000, date: '2026-08-09', status: '已批准' },
    { id: 'a9', title: '吴刚质量检测费报销', applicant: '吴刚', type: '报销审批', amount: 4500, date: '2026-08-07', status: '已批准' },
    { id: 'a10', title: '安全防护用品采购', applicant: '孙强', type: '采购审批', amount: 68000, date: '2026-08-06', status: '已批准' },
    { id: 'a11', title: '城南商业综合体设计变更', applicant: '周芳', type: '合同审批', amount: 230000, date: '2026-08-15', status: '待审批' },
    { id: 'a12', title: '刘市场外协人员进场申请', applicant: '刘市场', type: '其他', amount: 0, date: '2026-08-16', status: '待审批' },
  ];

  // 公告通知
  collections['notices'] = [
    { id: 'n1', title: '关于2026年安全生产月的通知', publisher: '安全管理部', content: '各单位要认真组织开展安全月活动，加强现场安全管理，排查安全隐患，落实整改措施。', date: '2026-08-01', status: '已发布' },
    { id: 'n2', title: '城南地铁站项目进度协调会', publisher: '工程管理部', content: '定于本周五下午3点在项目部召开进度协调会，请各班组负责人准时参加。', date: '2026-08-12', status: '已发布' },
    { id: 'n3', title: '集团年度安全培训通知', publisher: '综合管理部', content: '请各项目部组织全员参加年度安全培训考核，9月15日前完成。', date: '2026-08-10', status: '已发布' },
    { id: 'n4', title: '物资采购流程优化通知', publisher: '物资管理部', content: '为提高采购效率，即日起启用线上审批流程。', date: '2026-08-08', status: '已发布' },
    { id: 'n5', title: '中秋节放假通知', publisher: '综合管理部', content: '9月15日至17日放假3天，各项目部安排好值班人员。', date: '2026-08-15', status: '已发布' },
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
    { id: 'pr6', project: '地铁3号线二期土建', task: '地质勘察', startDate: '2026-01-15', endDate: '2026-04-30', progress: 100, owner: '张伟' },
    { id: 'pr7', project: '地铁3号线二期土建', task: '围护结构施工', startDate: '2026-05-01', endDate: '2026-10-31', progress: 45, owner: '李明' },
    { id: 'pr8', project: '城北新区道路改造', task: '路基处理', startDate: '2026-06-01', endDate: '2026-08-31', progress: 70, owner: '李明' },
    { id: 'pr9', project: '城北新区道路改造', task: '路面铺设', startDate: '2026-09-01', endDate: '2026-11-30', progress: 0, owner: '李明' },
    { id: 'pr10', project: '高铁站交通枢纽', task: '基坑开挖', startDate: '2026-03-01', endDate: '2026-06-30', progress: 100, owner: '孙强' },
    { id: 'pr11', project: '高铁站交通枢纽', task: '主体结构', startDate: '2026-07-01', endDate: '2027-06-30', progress: 35, owner: '孙强' },
    { id: 'pr12', project: '城南商业综合体', task: '桩基施工', startDate: '2026-04-01', endDate: '2026-07-31', progress: 90, owner: '周芳' },
    { id: 'pr13', project: '城南商业综合体', task: '地下室施工', startDate: '2026-08-01', endDate: '2026-12-31', progress: 20, owner: '周芳' },
    { id: 'pr14', project: '城北学校扩建工程', task: '基础施工', startDate: '2026-03-01', endDate: '2026-05-31', progress: 100, owner: '吴刚' },
    { id: 'pr15', project: '城北学校扩建工程', task: '主体施工', startDate: '2026-06-01', endDate: '2026-10-31', progress: 55, owner: '吴刚' },
  ];

  // 设备台账
  collections['equipments'] = [
    { id: 'e1', name: '塔式起重机', code: 'SB-001', category: '起重机械', owner: '城南地铁站', status: '在用', date: '2024-01-10' },
    { id: 'e2', name: '混凝土搅拌车', code: 'SB-002', category: '运输机械', owner: '滨江大桥', status: '在用', date: '2024-03-20' },
    { id: 'e3', name: '挖掘机', code: 'SB-003', category: '土方机械', owner: '城南地铁站', status: '维修', date: '2024-02-15' },
    { id: 'e4', name: '塔式起重机', code: 'SB-004', category: '起重机械', owner: '地铁3号线', status: '在用', date: '2025-03-01' },
    { id: 'e5', name: '混凝土泵车', code: 'SB-005', category: '混凝土机械', owner: '高铁站项目', status: '在用', date: '2026-02-15' },
    { id: 'e6', name: '压路机', code: 'SB-006', category: '路面机械', owner: '城北道路', status: '在用', date: '2025-07-01' },
    { id: 'e7', name: '盾构机', code: 'SB-007', category: '隧道机械', owner: '地铁3号线', status: '在用', date: '2025-06-01' },
    { id: 'e8', name: '汽车吊', code: 'SB-008', category: '起重机械', owner: '城南商业', status: '闲置', date: '2024-08-10' },
  ];

  // 设备租赁
  collections['equipmentLeases'] = [
    { id: 'el1', name: '汽车吊50t', lessor: '安达机械租赁', amount: 38000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el2', name: '物料提升机', lessor: '广丰设备租赁', amount: 15000, startDate: '2026-05-01', endDate: '2026-08-31', status: '租用中' },
  ];

  // 设备管理
  collections['equipmentDispatches'] = [
    { id: 'ed1', equipment: '挖掘机', fromProject: '城南地铁站项目', toProject: '滨江大桥工程', date: '2026-08-10', owner: '张机械' },
  ];

  collections['equipmentMaintenances'] = [
    { id: 'em1', equipment: '塔式起重机', type: '日常保养', date: '2026-08-01', cost: 3500, content: '钢丝绳检查、润滑' },
    { id: 'em2', equipment: '混凝土搅拌车', type: '定期保养', date: '2026-07-28', cost: 8800, content: '更换液压油、滤芯' },
  ];

  collections['equipmentRepairs'] = [
    { id: 'er1', equipment: '挖掘机', fault: '液压泵异响、动作无力', date: '2026-08-05', cost: 15000, status: '维修中' },
    { id: 'er2', equipment: '塔式起重机', fault: '回转机构故障', date: '2026-07-20', cost: 23000, status: '已修复' },
  ];

  // 合同登记
  collections['contracts'] = [
    { id: 'ct1', name: '城南地铁站土建施工合同', code: 'HT-2024-001', party: '城投集团', amount: 85000000, signDate: '2024-02-20', status: '履行中' },
    { id: 'ct2', name: '滨江大桥钢箱梁采购合同', code: 'HT-2024-002', party: '恒信钢材集团', amount: 32000000, signDate: '2024-04-10', status: '履行中' },
    { id: 'ct3', name: '地铁3号线土建合同', code: 'HT-2025-001', party: '轨道交通集团', amount: 980000000, signDate: '2025-01-10', status: '履行中' },
    { id: 'ct4', name: '城北道路施工合同', code: 'HT-2025-002', party: '城投集团', amount: 56000000, signDate: '2025-05-20', status: '履行中' },
    { id: 'ct5', name: '高铁站交通枢纽合同', code: 'HT-2026-001', party: '铁路集团', amount: 1560000000, signDate: '2025-12-15', status: '已生效' },
    { id: 'ct6', name: '城南商业综合体合同', code: 'HT-2025-003', party: '万达集团', amount: 78000000, signDate: '2025-03-25', status: '履行中' },
  ];

  // 采购管理
  collections['majorRequests'] = [
    { id: 'mrq1', name: '城南地铁站钢材大宗采购请示', project: '城南地铁站项目', material: 'HRB400螺纹钢', amount: 4200000, date: '2026-07-10', status: '已批准' },
    { id: 'mrq2', name: '滨江大桥水泥大宗采购请示', project: '滨江大桥工程', material: 'P.O42.5水泥', amount: 3600000, date: '2026-07-25', status: '待审批' },
  ];

  collections['groupContracts'] = [
    { id: 'gc1', name: '集团钢材集采框架合同', code: 'JC-2026-001', supplier: '恒信钢材集团', amount: 80000000, signDate: '2026-01-15' },
    { id: 'gc2', name: '集团水泥集采框架合同', code: 'JC-2026-002', supplier: '华北建材有限公司', amount: 50000000, signDate: '2026-02-01' },
  ];

  collections['purchaseContracts'] = [
    { id: 'pc1', name: '城南地铁站钢筋采购合同', code: 'CGHT-2026-001', supplier: '恒信钢材集团', amount: 4200000, signDate: '2026-07-20', status: '履行中' },
    { id: 'pc2', name: '滨江大桥水泥采购合同', code: 'CGHT-2026-002', supplier: '华北建材有限公司', amount: 3600000, signDate: '2026-08-01', status: '已生效' },
  ];

  collections['rentalContracts'] = [
    { id: 'rc1', name: '城南地铁站塔吊租赁合同', code: 'ZLHT-2026-001', supplier: '安达机械租赁', equipment: '塔式起重机', amount: 480000, signDate: '2026-08-01' },
    { id: 'rc2', name: '滨江大桥汽车吊租赁合同', code: 'ZLHT-2026-002', supplier: '广丰设备租赁', equipment: '汽车吊50t', amount: 228000, signDate: '2026-07-15' },
  ];

  collections['subcontracts'] = [
    { id: 'sc1', name: '城南地铁站防水工程分包合同', code: 'FBHT-2026-001', team: '蓝天防水班组', amount: 2600000, project: '城南地铁站项目', signDate: '2026-07-01' },
    { id: 'sc2', name: '滨江大桥钢结构安装分包合同', code: 'FBHT-2026-002', team: '华安钢构班组', amount: 5800000, project: '滨江大桥工程', signDate: '2026-06-20' },
  ];

  collections['procurementReports'] = [
    { id: 'prr1', name: '2026年7月采购台账', type: '采购台账', date: '2026-07-31' },
    { id: 'prr2', name: '2026年二季度物资价格表', type: '物资价格', date: '2026-06-30' },
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

  // 物资管理
  collections['materialDiscount'] = [
    { id: 'md1', code: 'ZK-2026-001', material: 'P.O42.5水泥', discount: 0.95, amount: 120000, date: '2026-08-01' },
    { id: 'md2', code: 'ZK-2026-002', material: '河沙', discount: 0.92, amount: 45000, date: '2026-08-10' },
  ];

  collections['materialIssue'] = [
    { id: 'mi1', code: 'LK-2026-001', project: '城南地铁站项目', team: '钢筋班组', material: 'HRB400螺纹钢', quantity: 30, unit: '吨', date: '2026-08-06' },
    { id: 'mi2', code: 'LK-2026-002', project: '滨江大桥工程', team: '混凝土班组', material: 'P.O42.5水泥', quantity: 120, unit: '吨', date: '2026-08-11' },
  ];

  collections['materialDirect'] = [
    { id: 'mdr1', code: 'ZR-2026-001', supplier: '华北建材有限公司', project: '城南地铁站项目', material: 'P.O42.5水泥', quantity: 60, unit: '吨', date: '2026-08-08' },
  ];

  collections['materialTransferOut'] = [
    { id: 'mto1', code: 'DC-2026-001', fromWarehouse: '城南一号仓', toWarehouse: '滨江材料仓', material: 'HRB400螺纹钢', quantity: 15, unit: '吨', date: '2026-08-09' },
  ];

  collections['materialTransferIn'] = [
    { id: 'mti1', code: 'DR-2026-001', fromWarehouse: '城南一号仓', toWarehouse: '滨江材料仓', material: 'HRB400螺纹钢', quantity: 15, unit: '吨', date: '2026-08-09' },
  ];

  collections['materialReturn'] = [
    { id: 'mrt1', code: 'TK-2026-001', project: '城南地铁站项目', team: '钢筋班组', material: '河沙', quantity: 5, unit: 'm³', date: '2026-08-12' },
  ];

  collections['materialReturnSupplier'] = [
    { id: 'mrs1', code: 'TH-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 8, unit: '吨', reason: '检验不合格', date: '2026-08-13' },
  ];

  collections['warehouses'] = [
    { id: 'wh1', name: '城南一号仓', code: 'CK-001', keeper: '李材料', location: '城南地铁站项目部', capacity: 5000 },
    { id: 'wh2', name: '滨江材料仓', code: 'CK-002', keeper: '赵仓库', location: '滨江大桥项目部', capacity: 8000 },
  ];

  collections['inventories'] = [
    { id: 'in1', name: '城南一号仓8月盘点', warehouse: '城南一号仓', date: '2026-08-15', status: '盘点中' },
    { id: 'in2', name: '滨江材料仓7月盘点', warehouse: '滨江材料仓', date: '2026-07-31', status: '已确认' },
  ];

  collections['slowMovingMaterials'] = [
    { id: 'sm1', material: 'HRB400螺纹钢Φ32', quantity: 20, days: 160, solution: '调拨', status: '处理中' },
    { id: 'sm2', material: '旧模板', quantity: 300, days: 220, solution: '报废', status: '待处理' },
  ];

  collections['materialLedgers'] = [
    { id: 'ml1', name: '城南地铁站7月台账', type: '需用计划明细', date: '2026-07-31' },
    { id: 'ml2', name: '滨江大桥钢筋库存台账', type: '库存台账', date: '2026-08-14' },
  ];

  // 财务管理
  collections['invoices'] = [
    { id: 'iv1', code: 'FP-2026-001', type: '进项', amount: 960000, tax: 110000, date: '2026-08-05', party: '恒信钢材集团' },
    { id: 'iv2', code: 'FP-2026-002', type: '销项', amount: 12500000, tax: 1250000, date: '2026-08-12', party: '城投集团' },
    { id: 'iv3', code: 'FP-2026-003', type: '进项', amount: 2300000, tax: 253000, date: '2026-08-08', party: '华北建材有限公司' },
    { id: 'iv4', code: 'FP-2026-004', type: '销项', amount: 45000000, tax: 4500000, date: '2026-08-10', party: '轨道交通集团' },
    { id: 'iv5', code: 'FP-2026-005', type: '进项', amount: 580000, tax: 63800, date: '2026-08-03', party: '安达机械租赁' },
  ];

  collections['reimbursements'] = [
    { id: 'rm1', title: '出差差旅费报销', applicant: '周海涛', amount: 3600, date: '2026-08-11', status: '待审批' },
    { id: 'rm2', title: '办公用品采购报销', applicant: '李材料', amount: 1200, date: '2026-08-02', status: '已批准' },
    { id: 'rm3', title: '设备维修费报销', applicant: '张机械', amount: 15000, date: '2026-08-08', status: '待审批' },
    { id: 'rm4', title: '孙强出差差旅费报销', applicant: '孙强', amount: 2800, date: '2026-08-14', status: '待审批' },
    { id: 'rm5', title: '质量检测费报销', applicant: '吴刚', amount: 4500, date: '2026-08-07', status: '已批准' },
  ];

  collections['funds'] = [
    { id: 'fd1', title: '城南地铁站一期工程款', type: '收款', amount: 25000000, party: '城投集团', date: '2026-08-10' },
    { id: 'fd2', title: '钢材采购付款', type: '付款', amount: 4200000, party: '恒信钢材集团', date: '2026-08-06' },
    { id: 'fd3', title: '塔吊租赁付款', type: '付款', amount: 480000, party: '安达机械租赁', date: '2026-08-03' },
    { id: 'fd4', title: '地铁3号线工程款', type: '收款', amount: 120000000, party: '轨道交通集团', date: '2026-08-12' },
    { id: 'fd5', title: '高铁站项目首期款', type: '收款', amount: 200000000, party: '铁路集团', date: '2026-07-20' },
  ];

  collections['payments'] = [
    { id: 'pm1', title: '滨江大桥桩基班组结算', payee: '桩基施工班组', amount: 580000, date: '2026-08-14', method: '银行转账', status: '待付款' },
    { id: 'pm2', title: '水泥采购付款', payee: '华北建材有限公司', amount: 1200000, date: '2026-08-07', method: '承兑汇票', status: '已付款' },
    { id: 'pm3', title: '地铁3号线钢材款', payee: '恒信钢材集团', amount: 5600000, date: '2026-08-15', method: '银行转账', status: '待付款' },
    { id: 'pm4', title: '盾构机租赁付款', payee: '广丰设备租赁', amount: 3500000, date: '2026-08-01', method: '银行转账', status: '已付款' },
  ];

  collections['costAnalyses'] = [
    { id: 'ca1', project: '城南地铁站项目', plannedCost: 78000000, actualCost: 65200000, profit: 12800000, date: '2026-07-31' },
    { id: 'ca2', project: '滨江大桥工程', plannedCost: 108000000, actualCost: 89500000, profit: 18500000, date: '2026-07-31' },
    { id: 'ca3', project: '地铁3号线二期土建', plannedCost: 890000000, actualCost: 312000000, profit: 578000000, date: '2026-07-31' },
    { id: 'ca4', project: '城北新区道路改造', plannedCost: 52000000, actualCost: 36400000, profit: 15600000, date: '2026-07-31' },
    { id: 'ca5', project: '高铁站交通枢纽', plannedCost: 1400000000, actualCost: 490000000, profit: 910000000, date: '2026-07-31' },
  ];

  // 人事档案
  collections['staff'] = [
    { id: 'st1', name: '陈国强', department: '工程管理部', position: '项目经理', phone: '13811110001', hireDate: '2018-03-01', status: '在职' },
    { id: 'st2', name: '周海涛', department: '工程管理部', position: '项目总工', phone: '13811110002', hireDate: '2019-06-15', status: '在职' },
    { id: 'st3', name: '王安全', department: '安全管理部', position: '安全员', phone: '13811110003', hireDate: '2020-01-10', status: '在职' },
    { id: 'st4', name: '张伟', department: '工程管理部', position: '项目经理', phone: '13800000001', hireDate: '2017-05-20', status: '在职' },
    { id: 'st5', name: '李明', department: '工程管理部', position: '技术负责人', phone: '13800000002', hireDate: '2019-09-01', status: '在职' },
    { id: 'st6', name: '王磊', department: '市场经营部', position: '商务经理', phone: '13800000003', hireDate: '2020-03-15', status: '在职' },
    { id: 'st7', name: '赵丽', department: '财务管理部', position: '财务主管', phone: '13800000004', hireDate: '2018-07-01', status: '在职' },
    { id: 'st8', name: '孙强', department: '安全管理部', position: '安全员', phone: '13800000005', hireDate: '2021-02-10', status: '在职' },
    { id: 'st9', name: '周芳', department: '物资管理部', position: '材料员', phone: '13800000006', hireDate: '2020-06-01', status: '在职' },
    { id: 'st10', name: '吴刚', department: '质量管理部', position: '质检员', phone: '13800000007', hireDate: '2021-08-15', status: '在职' },
    { id: 'st11', name: '郑敏', department: '综合管理部', position: '行政专员', phone: '13800000008', hireDate: '2022-01-10', status: '在职' },
    { id: 'st12', name: '刘工', department: '城南地铁站项目部', position: '施工员', phone: '13800000009', hireDate: '2023-04-01', status: '在职' },
    { id: 'st13', name: '马师傅', department: '滨江大桥项目部', position: '班组长', phone: '13800000010', hireDate: '2022-09-01', status: '在职' },
    { id: 'st14', name: '钱建国', department: '工程管理部', position: '项目副经理', phone: '13800000011', hireDate: '2016-11-20', status: '在职' },
    { id: 'st15', name: '孙建国', department: '工程管理部', position: '施工队长', phone: '13800000012', hireDate: '2021-05-01', status: '在职' },
  ];

  // 人力资源
  collections['attendances'] = [
    { id: 'at1', name: '陈国强', date: '2026-08-14', status: '出勤' },
    { id: 'at2', name: '周海涛', date: '2026-08-14', status: '出勤' },
    { id: 'at3', name: '李材料', date: '2026-08-14', status: '请假' },
    { id: 'at4', name: '张机械', date: '2026-08-13', status: '迟到' },
    { id: 'at5', name: '张伟', date: '2026-08-14', status: '出勤' },
    { id: 'at6', name: '李明', date: '2026-08-14', status: '出勤' },
    { id: 'at7', name: '王磊', date: '2026-08-14', status: '出勤' },
    { id: 'at8', name: '赵丽', date: '2026-08-14', status: '出勤' },
    { id: 'at9', name: '孙强', date: '2026-08-14', status: '出勤' },
    { id: 'at10', name: '周芳', date: '2026-08-14', status: '请假' },
    { id: 'at11', name: '吴刚', date: '2026-08-14', status: '出勤' },
    { id: 'at12', name: '郑敏', date: '2026-08-14', status: '出勤' },
    { id: 'at13', name: '刘工', date: '2026-08-14', status: '迟到' },
    { id: 'at14', name: '马师傅', date: '2026-08-14', status: '出勤' },
    { id: 'at15', name: '陈国强', date: '2026-08-13', status: '出勤' },
    { id: 'at16', name: '张伟', date: '2026-08-13', status: '出勤' },
    { id: 'at17', name: '李明', date: '2026-08-13', status: '迟到' },
    { id: 'at18', name: '孙强', date: '2026-08-14', status: '出勤' },
    { id: 'at19', name: '周芳', date: '2026-08-14', status: '出勤' },
    { id: 'at20', name: '吴刚', date: '2026-08-14', status: '出勤' },
  ];

  collections['trainings'] = [
    { id: 'tr1', title: '新员工入职培训', trainer: '综合管理部', date: '2026-08-15', participants: 12, status: '已完成' },
    { id: 'tr2', title: '项目经理能力提升班', trainer: '外部讲师', date: '2026-09-01', participants: 8, status: '计划中' },
  ];

  collections['rewards'] = [
    { id: 'rw1', person: '陈国强', type: '奖励', reason: '城南地铁站进度提前完成', amount: 10000, date: '2026-07-30' },
    { id: 'rw2', person: '刘强', type: '处罚', reason: '未按规定佩戴安全防护用品', amount: 500, date: '2026-08-07' },
  ];

  collections['adminAssets'] = [
    { id: 'aa1', name: '办公电脑', category: '电子设备', quantity: 25, unit: '台', location: '机关办公室' },
    { id: 'aa2', name: '办公桌', category: '家具', quantity: 60, unit: '张', location: '机关办公室' },
    { id: 'aa3', name: '打印机', category: '电子设备', quantity: 6, unit: '台', location: '各项目部' },
  ];

  // 安全与质量
  collections['safetyInspections'] = [
    { id: 'si1', title: '城南地铁站8月安全大检查', project: '城南地铁站项目', inspector: '王安全', date: '2026-08-10', issues: '临边防护缺失、基坑边堆料', status: '整改中' },
    { id: 'si2', title: '滨江大桥高处作业检查', project: '滨江大桥工程', inspector: '王安全', date: '2026-08-06', issues: '个别工人未系安全带', status: '已完成' },
    { id: 'si3', title: '地铁3号线基坑安全检查', project: '地铁3号线二期土建', inspector: '孙强', date: '2026-08-12', issues: '围挡缺失2处', status: '整改中' },
    { id: 'si4', title: '城北道路施工安全检查', project: '城北新区道路改造', inspector: '孙强', date: '2026-08-11', issues: '交通疏导标识不足', status: '已完成' },
    { id: 'si5', title: '高铁站项目临电检查', project: '高铁站交通枢纽', inspector: '孙强', date: '2026-08-13', issues: '三级配电箱未上锁', status: '整改中' },
    { id: 'si6', title: '城南商业综合体消防检查', project: '城南商业综合体', inspector: '孙强', date: '2026-08-09', issues: '灭火器过期3具', status: '已完成' },
  ];

  collections['safetyTrainings'] = [
    { id: 'stn1', title: '新入场工人三级安全教育', trainer: '王安全', date: '2026-08-12', participants: 32, content: '入场安全须知、事故案例' },
    { id: 'stn2', title: '起重吊装作业专项培训', trainer: '张机械', date: '2026-08-03', participants: 15, content: '吊装操作规程与信号指挥' },
    { id: 'stn3', title: '高处作业安全培训', trainer: '孙强', date: '2026-08-08', participants: 28, content: '安全带使用、临边防护' },
    { id: 'stn4', title: '临时用电安全培训', trainer: '孙强', date: '2026-08-05', participants: 20, content: '三级配电、两级保护' },
  ];

  collections['safetyPunishments'] = [
    { id: 'sps1', code: 'AQCF-2026-001', project: '滨江大桥工程', person: '刘强', reason: '高处作业未系安全带', amount: 500, date: '2026-08-07' },
  ];

  collections['safetyRewards'] = [
    { id: 'srw1', code: 'AQJL-2026-001', project: '城南地铁站项目', person: '李庆', reason: '及时报告脚手架隐患', amount: 800, date: '2026-08-05' },
  ];

  collections['safetyAccidents'] = [
    { id: 'sac1', title: '滨江大桥塔吊吊物坠落', project: '滨江大桥工程', level: '一般', date: '2026-07-25', description: '吊物坠落至地面未造成人员伤亡，已按四不放过处理' },
  ];

  collections['safetyInputLedgers'] = [
    { id: 'sil1', project: '城南地铁站项目', item: '安全防护用品购置', amount: 86000, date: '2026-08-01' },
    { id: 'sil2', project: '滨江大桥工程', item: '安全教育培训', amount: 45000, date: '2026-08-08' },
  ];

  collections['qualityInspections'] = [
    { id: 'qi1', title: '城南地铁站主体结构钢筋验收', project: '城南地铁站项目', inspector: '周海涛', date: '2026-08-11', issues: '个别箍筋间距超标', status: '整改中' },
    { id: 'qi2', title: '滨江大桥墩柱混凝土质量检查', project: '滨江大桥工程', inspector: '周海涛', date: '2026-08-04', issues: '外观质量良好，蜂窝麻面少量', status: '已完成' },
  ];

  collections['qualityTrainings'] = [
    { id: 'qtn1', title: '混凝土施工质量控制要点', trainer: '周海涛', date: '2026-08-09', participants: 28, content: '混凝土浇筑、养护及验收标准' },
  ];

  collections['qualityPunishments'] = [
    { id: 'qps1', code: 'ZLCF-2026-001', project: '城南地铁站项目', person: '孙建', reason: '钢筋搭接长度不足', amount: 400, date: '2026-08-13' },
  ];

  collections['qualityRewards'] = [
    { id: 'qrw1', code: 'ZLJL-2026-001', project: '滨江大桥工程', person: '张班组', reason: '墩柱外观质量优良', amount: 1000, date: '2026-08-06' },
  ];

  collections['qualityAccidents'] = [
    { id: 'qac1', title: '滨江大桥墩柱混凝土裂缝', project: '滨江大桥工程', level: '一般', date: '2026-07-18', description: '养护不到位产生收缩裂缝，已制定修补方案' },
  ];

  // 平台中心
  collections['platformInfo'] = [
    { id: 'pfi1', title: '系统上线公告', type: '公告', content: 'SG-Build 施工企业管理系统 v1.0 正式上线', date: '2026-08-01', status: '已发布' },
    { id: 'pfi2', title: '数据备份管理规定', type: '制度', content: '各模块数据每日自动备份', date: '2026-08-10', status: '已发布' },
  ];

  collections['alerts'] = [
    { id: 'al1', title: '滨江大桥钢筋库存不足', level: '警告', content: 'HRB400螺纹钢库存低于安全线', date: '2026-08-14', status: '未处理' },
    { id: 'al2', title: '城南地铁站进度预警', level: '提示', content: '机电安装进度落后计划10%', date: '2026-08-13', status: '未处理' },
    { id: 'al3', title: '地铁3号线成本超支预警', level: '警告', content: '钢材采购成本超出预算8%', date: '2026-08-15', status: '未处理' },
    { id: 'al4', title: '高铁站项目混凝土供应延迟', level: '严重', content: '商品混凝土供应商产能不足', date: '2026-08-16', status: '未处理' },
    { id: 'al5', title: '城北道路改造工期预警', level: '提示', content: '雨季影响工期，需调整施工计划', date: '2026-08-12', status: '已处理' },
    { id: 'al6', title: '安全帽即将过期', level: '提示', content: '32顶安全帽下月到期需更换', date: '2026-08-10', status: '未处理' },
  ];

  collections['logs'] = [
    { id: 'lg1', operator: 'admin', action: '登录系统', module: 'auth', date: '2026-08-17' },
    { id: 'lg2', operator: 'admin', action: '新增采购订单', module: '采购管理', date: '2026-08-16' },
    { id: 'lg3', operator: 'manager', action: '修改施工进度', module: '工程管理', date: '2026-08-15' },
  ];

  // 协同办公
  collections['meetings'] = [
    { id: 'mt1', title: '城南地铁站主体结构施工协调会', date: '2026-08-17', location: '项目部会议室', host: '陈国强', participants: '各班组负责人、材料、安全', content: '协调主体结构进度与材料供应' },
    { id: 'mt2', title: '安全生产月度例会', date: '2026-08-20', location: '公司会议室', host: '王安全', participants: '各项目安全员', content: '通报本月安全检查情况' },
    { id: 'mt3', title: '地铁3号线项目启动会', date: '2026-08-22', location: '集团会议室', host: '张伟', participants: '项目全体成员', content: '项目启动动员与任务分工' },
    { id: 'mt4', title: '高铁站项目进度协调会', date: '2026-08-19', location: '项目部', host: '孙强', participants: '各部门负责人', content: '基坑开挖进度协调' },
    { id: 'mt5', title: '8月经营分析会', date: '2026-08-25', location: '集团会议室', host: 'manager', participants: '各部门经理', content: '月度经营指标分析' },
  ];

  collections['tasks'] = [
    { id: 'ts1', title: '编制城南地铁站8月进度计划', assignee: '陈国强', project: '城南地铁站项目', priority: '高', dueDate: '2026-08-18', status: '进行中' },
    { id: 'ts2', title: '整理滨江大桥桩基验收资料', assignee: '周海涛', project: '滨江大桥工程', priority: '中', dueDate: '2026-08-22', status: '未开始' },
    { id: 'ts3', title: '统计7月物资出入库数据', assignee: '李材料', project: '城南地铁站项目', priority: '低', dueDate: '2026-08-15', status: '已完成' },
    { id: 'ts4', title: '编制地铁3号线施工方案', assignee: '张伟', project: '地铁3号线二期土建', priority: '高', dueDate: '2026-08-20', status: '进行中' },
    { id: 'ts5', title: '城北道路改造投标文件', assignee: '李明', project: '城北新区道路改造', priority: '高', dueDate: '2026-08-25', status: '进行中' },
    { id: 'ts6', title: '滨江景观带竣工资料整理', assignee: '王磊', project: '滨江景观带工程', priority: '中', dueDate: '2026-08-19', status: '已完成' },
    { id: 'ts7', title: '安全月活动总结报告', assignee: '孙强', project: '安全管理', priority: '中', dueDate: '2026-08-17', status: '进行中' },
    { id: 'ts8', title: '8月钢材对账单编制', assignee: '赵丽', project: '财务管理', priority: '低', dueDate: '2026-08-28', status: '未开始' },
    { id: 'ts9', title: '高铁站项目开工报告', assignee: '孙强', project: '高铁站交通枢纽', priority: '高', dueDate: '2026-08-30', status: '未开始' },
    { id: 'ts10', title: '物资盘点表更新', assignee: '周芳', project: '物资管理', priority: '低', dueDate: '2026-08-21', status: '进行中' },
  ];

  collections['documents'] = [
    { id: 'dm1', title: '项目管理制度汇编', category: '制度文件', author: '综合管理部', content: '涵盖进度、质量、安全、物资等管理制度', date: '2026-01-10' },
    { id: 'dm2', title: '城南地铁站施工组织设计', category: '图纸资料', author: '技术部', content: '主体结构施工组织设计', date: '2026-03-05' },
  ];

  // 商机
  collections['opportunities'] = [
    { id: 'op1', name: '城北新区道路改造项目', customer: '城投集团', amount: 56000000, stage: '方案沟通', owner: '张伟', date: '2026-07-20' },
    { id: 'op2', name: '地铁3号线二期土建', customer: '轨道交通集团', amount: 120000000, stage: '报价谈判', owner: '李明', date: '2026-08-02' },
    { id: 'op3', name: '城东物流园二期', customer: '城东物流', amount: 88000000, stage: '初步接触', owner: '王雷', date: '2026-08-05' },
    { id: 'op4', name: '高新区产业园建设', customer: '高新区管委会', amount: 230000000, stage: '方案沟通', owner: '王磊', date: '2026-07-15' },
    { id: 'op5', name: '城际铁路站房改造', customer: '铁路集团', amount: 450000000, stage: '初步接触', owner: '王磊', date: '2026-08-08' },
    { id: 'op6', name: '城南片区管网改造', customer: '市水务局', amount: 32000000, stage: '投标', owner: '王磊', date: '2026-08-01' },
  ];

  // 投标结果报表
  collections['bidReports'] = [
    { id: 'br1', name: '滨江景观带工程投标', result: '中标', amount: 43800000, date: '2026-08-01' },
    { id: 'br2', name: '城西污水处理厂投标', result: '未中标', amount: 120000000, date: '2026-07-20' },
    { id: 'br3', name: '经济开发区标准厂房投标', result: '中标', amount: 32000000, date: '2026-06-15' },
    { id: 'br4', name: '城北学校扩建工程投标', result: '中标', amount: 45000000, date: '2026-02-20' },
    { id: 'br5', name: '高铁站交通枢纽投标', result: '中标', amount: 1560000000, date: '2025-12-01' },
  ];

  // 项目立项
  collections['projectInits'] = [
    { id: 'pi1', name: '城北新区道路改造项目', customer: '城投集团', amount: 56000000, approvalDate: '2026-07-25', status: '已立项' },
    { id: 'pi2', name: '地铁3号线二期土建', customer: '轨道交通集团', amount: 120000000, approvalDate: '2026-08-03', status: '待审批' },
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

  // 组织架构（五大组：集团总部、业务部门、分子公司、项目部、全体人员）
  collections['departments'] = [
    // ── 集团 ──
    { id: 'group', name: '集团公司', code: 'GRP', parentId: null, leader: '', phone: '', description: '集团公司', sortOrder: 0 },

    // ── 核心决策层 ──
    { id: 'board', name: '董事会/长', code: 'BOARD', parentId: 'group', leader: 'admin', phone: '13800000000', description: '最高决策机构', sortOrder: 0 },
    { id: 'gm-office', name: '总经理办公室', code: 'GM-OFF', parentId: 'group', leader: 'manager', phone: '13800000099', description: '总经理日常管理', sortOrder: 1 },

    // ── 总经理直辖 ──
    { id: 'office', name: '办公室', code: 'OFFICE', parentId: 'gm-office', leader: '周芳', phone: '13900001006', description: '总经理直辖办公室', sortOrder: 0 },

    // ── 副总经理A分管 ──
    { id: 'dgm-a', name: '副总经理A', code: 'DGM-A', parentId: 'gm-office', leader: '张伟', phone: '13900001001', description: '分管工程、财务、安全、合同', sortOrder: 2 },
    { id: 'eng-mgmt', name: '工程管理部', code: 'ENG', parentId: 'dgm-a', leader: '王磊', phone: '13900001003', description: '负责工程管理', sortOrder: 0 },
    { id: 'finance', name: '财务部', code: 'FIN', parentId: 'dgm-a', leader: '赵丽', phone: '13900001004', description: '负责财务管理', sortOrder: 1 },
    { id: 'safety', name: '安全生产部', code: 'SAF', parentId: 'dgm-a', leader: '孙强', phone: '13900001005', description: '负责安全生产管理', sortOrder: 2 },
    { id: 'contract', name: '合同管理部', code: 'CON', parentId: 'dgm-a', leader: '朱商务', phone: '13900012003', description: '负责合同管理', sortOrder: 3 },

    // ── 副总经理B分管 ──
    { id: 'dgm-b', name: '副总经理B', code: 'DGM-B', parentId: 'gm-office', leader: '李明', phone: '13900001002', description: '分管人力、审计', sortOrder: 3 },
    { id: 'hr', name: '人力资源部', code: 'HR', parentId: 'dgm-b', leader: '李明', phone: '13900001002', description: '负责人力资源管理', sortOrder: 0 },
    { id: 'audit', name: '审计部', code: 'AUD', parentId: 'dgm-b', leader: '郑敏', phone: '13900001008', description: '负责审计监督', sortOrder: 1 },

    // ── 三总师 ──
    { id: 'chief-eng', name: '三总师', code: 'CHIEF', parentId: 'gm-office', leader: '', phone: '', description: '技术/专业线指导', sortOrder: 4 },

    // ── 副总经理C分管 ──
    { id: 'dgm-c', name: '副总经理C', code: 'DGM-C', parentId: 'gm-office', leader: '刘市场', phone: '13900001009', description: '分管市场、运维', sortOrder: 5 },
    { id: 'market-dev', name: '市场开发部', code: 'MKT', parentId: 'dgm-c', leader: '刘市场', phone: '13900001009', description: '负责市场开拓与开发', sortOrder: 0 },
    { id: 'ops', name: '运维部', code: 'OPS', parentId: 'dgm-c', leader: '吕客服', phone: '13900012007', description: '负责运维服务', sortOrder: 1 },

    // ── 项目部（副总经理A统筹） ──
    { id: 'proj-a', name: '项目部A', code: 'PROJ-A', parentId: 'dgm-a', leader: '刘工', phone: '13900014001', description: '项目部A', sortOrder: 0 },
    { id: 'proj-b', name: '项目部B', code: 'PROJ-B', parentId: 'dgm-a', leader: '马师傅', phone: '13900014009', description: '项目部B', sortOrder: 1 },
    { id: 'proj-c', name: '项目部C', code: 'PROJ-C', parentId: 'dgm-a', leader: '张经理', phone: '13900015001', description: '项目部C', sortOrder: 2 },

    // ── 分公司 ──
    { id: 'branch-a', name: '分公司A', code: 'BR-A', parentId: 'group', leader: '钱建国', phone: '13800000011', description: '分公司A', sortOrder: 2 },
    { id: 'branch-b', name: '分公司B', code: 'BR-B', parentId: 'group', leader: '陈国强', phone: '13811110001', description: '分公司B', sortOrder: 3 },
    { id: 'branch-c', name: '分公司C', code: 'BR-C', parentId: 'group', leader: '周海涛', phone: '13811110002', description: '分公司C', sortOrder: 4 },

    // ── 子公司 ──
    { id: 'sub-alpha', name: '子公司甲', code: 'SUB-A', parentId: 'group', leader: '孙建国', phone: '13800000012', description: '子公司甲', sortOrder: 5 },
    { id: 'sub-beta', name: '子公司乙', code: 'SUB-B', parentId: 'group', leader: '', phone: '', description: '子公司乙', sortOrder: 6 },

    // ── 一公司、二公司、三公司 ──
    { id: 'co-1', name: '一公司', code: 'CO-1', parentId: 'group', leader: '钱建国', phone: '13800000011', description: '一公司', sortOrder: 7 },
    { id: 'co-2', name: '二公司', code: 'CO-2', parentId: 'group', leader: '陈国强', phone: '13811110001', description: '二公司', sortOrder: 8 },
    { id: 'co-3', name: '三公司', code: 'CO-3', parentId: 'group', leader: '周海涛', phone: '13811110002', description: '三公司', sortOrder: 9 },
  ];

  collections['orgPositions'] = [
    { id: 'op1', name: '董事长', departmentId: 'board', level: 100, description: '集团最高决策人', sortOrder: 0 },
    { id: 'op2', name: '总经理', departmentId: 'gm-office', level: 100, description: '集团日常运营负责人', sortOrder: 0 },
    { id: 'op3', name: '副总经理', departmentId: 'dgm-a', level: 80, description: '分管工程、财务、安全、合同', sortOrder: 0 },
    { id: 'op3b', name: '副总经理', departmentId: 'dgm-b', level: 80, description: '分管人力、审计', sortOrder: 0 },
    { id: 'op3c', name: '副总经理', departmentId: 'dgm-c', level: 80, description: '分管市场、运维', sortOrder: 0 },
    { id: 'op3d', name: '总工程师', departmentId: 'chief-eng', level: 90, description: '技术总负责', sortOrder: 0 },
    { id: 'op3e', name: '总会计师', departmentId: 'chief-eng', level: 85, description: '财务总负责', sortOrder: 1 },
    { id: 'op3f', name: '总经济师', departmentId: 'chief-eng', level: 85, description: '经济总负责', sortOrder: 2 },
    { id: 'op4', name: '办公室主任', departmentId: 'office', level: 70, description: '办公室负责人', sortOrder: 0 },
    { id: 'op5', name: '部门经理', departmentId: 'eng-mgmt', level: 70, description: '工程管理部负责人', sortOrder: 0 },
    { id: 'op6', name: '部门经理', departmentId: 'finance', level: 70, description: '财务部负责人', sortOrder: 0 },
    { id: 'op7', name: '部门经理', departmentId: 'safety', level: 70, description: '安全生产部负责人', sortOrder: 0 },
    { id: 'op8', name: '部门经理', departmentId: 'contract', level: 70, description: '合同管理部负责人', sortOrder: 0 },
    { id: 'op9', name: '部门经理', departmentId: 'hr', level: 70, description: '人力资源部负责人', sortOrder: 0 },
    { id: 'op10', name: '部门经理', departmentId: 'audit', level: 70, description: '审计部负责人', sortOrder: 0 },
    { id: 'op11', name: '部门经理', departmentId: 'market-dev', level: 70, description: '市场开发部负责人', sortOrder: 0 },
    { id: 'op12', name: '部门经理', departmentId: 'ops', level: 70, description: '运维部负责人', sortOrder: 0 },
    { id: 'op13', name: '项目经理', departmentId: 'proj-a', level: 60, description: '项目部A负责人', sortOrder: 0 },
    { id: 'op14', name: '项目经理', departmentId: 'proj-b', level: 60, description: '项目部B负责人', sortOrder: 0 },
    { id: 'op15', name: '项目经理', departmentId: 'proj-c', level: 60, description: '项目部C负责人', sortOrder: 0 },
    { id: 'op16', name: '公司经理', departmentId: 'branch-a', level: 80, description: '分公司A负责人', sortOrder: 0 },
    { id: 'op17', name: '公司经理', departmentId: 'branch-b', level: 80, description: '分公司B负责人', sortOrder: 0 },
    { id: 'op18', name: '公司经理', departmentId: 'branch-c', level: 80, description: '分公司C负责人', sortOrder: 0 },
    { id: 'op19', name: '公司经理', departmentId: 'sub-alpha', level: 80, description: '子公司甲负责人', sortOrder: 0 },
  ];

  // 用户（admin 为超级管理员 root）
  const PWD_HASH = '$2b$10$ARne.woqFHP.PUouPN.EB.UDZilAuRihH54pAG/3mEkg9NsfDKo4G'; // admin123
  const users: any[] = [
    // ── 董事会 ──
    {
      id: 'admin', username: 'admin', email: 'admin@test.com', password: PWD_HASH,
      role: 'super_admin', appliedRole: 'super_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(),
      name: '管理员', department: '董事会/长', position: '董事长', phone: '13800000000', isHead: true,
    },

    // ── 总经理办公室 ──
    {
      id: 'u2', username: 'manager', email: 'manager@test.com', password: PWD_HASH,
      role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(),
      name: '王总', department: '总经理办公室', position: '总经理', phone: '13800000099', isHead: true,
    },
    { id: 'u3', username: '张伟', email: '张伟@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张伟', department: '副总经理A', position: '副总经理', phone: '13900001001', isHead: true },

    // ── 办公室 ──
    { id: 'u8', username: '周芳', email: '周芳@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周芳', department: '办公室', position: '办公室主任', phone: '13900001006', isHead: true },
    { id: 'u10', username: '郑敏', email: '郑敏@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑敏', department: '办公室', position: '副主任', phone: '13900001008', isDeputy: true },
    { id: 'u51', username: '马行政', email: '马行政@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '马行政', department: '办公室', position: '行政专员', phone: '13900011001' },
    { id: 'u13', username: '林助理', email: '林助理@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '林助理', department: '办公室', position: '总经理助理', phone: '13900011019' },

    // ── 副总经理A下属：工程管理部 ──
    { id: 'u5', username: '王磊', email: '王磊@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王磊', department: '工程管理部', position: '部门经理', phone: '13900001003', isHead: true },

    // ── 副总经理A下属：财务部 ──
    { id: 'u6', username: '赵丽', email: '赵丽@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵丽', department: '财务部', position: '部门经理', phone: '13900001004', isHead: true },
    { id: 'u53', username: '赵会计', email: '赵会计@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵会计', department: '财务部', position: '会计', phone: '13900011003', isDeputy: true },
    { id: 'u54', username: '周出纳', email: '周出纳@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周出纳', department: '财务部', position: '出纳', phone: '13900011004' },

    // ── 副总经理A下属：安全生产部 ──
    { id: 'u7', username: '孙强', email: '孙强@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙强', department: '安全生产部', position: '部门经理', phone: '13900001005', isHead: true },
    { id: 'u57', username: '何安全', email: '何安全@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '何安全', department: '安全生产部', position: '副经理', phone: '13900011007', isDeputy: true },
    { id: 'u58', username: '高安全', email: '高安全@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '高安全', department: '安全生产部', position: '安全员', phone: '13900011008' },

    // ── 副总经理A下属：合同管理部 ──
    { id: 'u63', username: '朱商务', email: '朱商务@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '朱商务', department: '合同管理部', position: '部门经理', phone: '13900012003', isHead: true },
    { id: 'u64', username: '秦商务', email: '秦商务@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '秦商务', department: '合同管理部', position: '商务专员', phone: '13900012004' },

    // ── 副总经理B下属：人力资源部 ──
    { id: 'u4', username: '李明', email: '李明@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李明', department: '人力资源部', position: '部门经理', phone: '13900001002', isHead: true },
    { id: 'u52', username: '钱人事', email: '钱人事@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱人事', department: '人力资源部', position: '人事专员', phone: '13900011002' },

    // ── 副总经理B下属：审计部 ──
    { id: 'u55', username: '陈工', email: '陈工@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '陈工', department: '审计部', position: '部门经理', phone: '13900011005', isHead: true },
    { id: 'u56', username: '林工', email: '林工@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '林工', department: '审计部', position: '审计专员', phone: '13900011006' },

    // ── 副总经理C下属：市场开发部 ──
    { id: 'u11', username: '刘市场', email: '刘市场@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '刘市场', department: '市场开发部', position: '部门经理', phone: '13900001009', isHead: true },
    { id: 'u61', username: '韩市场', email: '韩市场@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '韩市场', department: '市场开发部', position: '副经理', phone: '13900012001', isDeputy: true },
    { id: 'u62', username: '杨市场', email: '杨市场@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '杨市场', department: '市场开发部', position: '市场专员', phone: '13900012002' },
    { id: 'u65', username: '许投标', email: '许投标@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '许投标', department: '市场开发部', position: '投标专员', phone: '13900012005' },
    { id: 'u66', username: '何投标', email: '何投标@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '何投标', department: '市场开发部', position: '投标专员', phone: '13900012006' },

    // ── 副总经理C下属：运维部 ──
    { id: 'u67', username: '吕客服', email: '吕客服@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吕客服', department: '运维部', position: '部门经理', phone: '13900012007', isHead: true },
    { id: 'u68', username: '施客服', email: '施客服@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '施客服', department: '运维部', position: '运维专员', phone: '13900012008' },
    { id: 'u59', username: '梁质量', email: '梁质量@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '梁质量', department: '运维部', position: '质量专员', phone: '13900011009' },
    { id: 'u60', username: '宋质量', email: '宋质量@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '宋质量', department: '运维部', position: '质检员', phone: '13900011010' },
    { id: 'u9', username: '吴刚', email: '吴刚@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴刚', department: '运维部', position: '运维经理', phone: '13900001007', isDeputy: true },

    // ── 三总师 ──
    { id: 'u130', username: '总工程师', email: '总工程师@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '总工程师', department: '三总师', position: '总工程师', phone: '13900011020', isHead: true },
    { id: 'u131', username: '总会计师', email: '总会计师@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '总会计师', department: '三总师', position: '总会计师', phone: '13900011021' },
    { id: 'u132', username: '总经济师', email: '总经济师@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '总经济师', department: '三总师', position: '总经济师', phone: '13900011022' },

    // ── 项目部A ──
    { id: 'u88', username: '刘工', email: '刘工@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '刘工', department: '项目部A', position: '项目经理', phone: '13900014001', isHead: true },
    { id: 'u89', username: '张副1', email: '张副1@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张副', department: '项目部A', position: '副经理', phone: '13900014002', isDeputy: true },
    { id: 'u90', username: '李技术1', email: '李技术1@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李技术', department: '项目部A', position: '技术负责人', phone: '13900014003' },
    { id: 'u91', username: '王施工1', email: '王施工1@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王施工', department: '项目部A', position: '施工员', phone: '13900014004' },
    { id: 'u92', username: '赵质量1', email: '赵质量1@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵质量', department: '项目部A', position: '质量员', phone: '13900014005' },
    { id: 'u93', username: '钱安全1', email: '钱安全1@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱安全', department: '项目部A', position: '安全员', phone: '13900014006' },
    { id: 'u111', username: '孙材料1', email: '孙材料1@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙材料', department: '项目部A', position: '材料员', phone: '13900014007' },
    { id: 'u112', username: '张测量', email: '张测量@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周测量', department: '项目部A', position: '测量员', phone: '13900014008' },

    // ── 项目部B ──
    { id: 'u94', username: '马师傅', email: '马师傅@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '马师傅', department: '项目部B', position: '项目经理', phone: '13900014009', isHead: true },
    { id: 'u95', username: '张副2', email: '张副2@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张副', department: '项目部B', position: '副经理', phone: '13900014010', isDeputy: true },
    { id: 'u96', username: '李技术2', email: '李技术2@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李技术', department: '项目部B', position: '技术负责人', phone: '13900014011' },
    { id: 'u97', username: '王施工2', email: '王施工2@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王施工', department: '项目部B', position: '施工员', phone: '13900014012' },
    { id: 'u98', username: '赵质量2', email: '赵质量2@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵质量', department: '项目部B', position: '质量员', phone: '13900014013' },
    { id: 'u99', username: '钱安全2', email: '钱安全2@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱安全', department: '项目部B', position: '安全员', phone: '13900014014' },
    { id: 'u113', username: '孙材料2', email: '孙材料2@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙材料', department: '项目部B', position: '材料员', phone: '13900014015' },
    { id: 'u114', username: '周测量', email: '周测量@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周测量', department: '项目部B', position: '测量员', phone: '13900014016' },

    // ── 项目部C ──
    { id: 'u100', username: '张经理', email: '张经理@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张经理', department: '项目部C', position: '项目经理', phone: '13900015001', isHead: true },
    { id: 'u101', username: '李技术3', email: '李技术3@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李技术', department: '项目部C', position: '技术负责人', phone: '13900015002' },
    { id: 'u102', username: '王施工3', email: '王施工3@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王施工', department: '项目部C', position: '施工员', phone: '13900015003' },
    { id: 'u115', username: '赵质量3', email: '赵质量3@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵质量', department: '项目部C', position: '质量员', phone: '13900015004' },
    { id: 'u116', username: '钱安全3', email: '钱安全3@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱安全', department: '项目部C', position: '安全员', phone: '13900015005' },
    { id: 'u103', username: '李经理', email: '李经理@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李经理', department: '项目部C', position: '项目副经理', phone: '13900015006', isDeputy: true },
    { id: 'u104', username: '张测量C', email: '张测量C@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张测量', department: '项目部C', position: '测量员', phone: '13900015007' },
    { id: 'u117', username: '王施工4', email: '王施工4@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王施工', department: '项目部C', position: '施工员', phone: '13900015008' },
    { id: 'u118', username: '赵质量4', email: '赵质量4@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵质量', department: '项目部C', position: '质量员', phone: '13900015009' },
    { id: 'u105', username: '孙经理', email: '孙经理@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙经理', department: '项目部C', position: '项目副经理', phone: '13900015010', isDeputy: true },
    { id: 'u106', username: '周施工', email: '周施工@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周施工', department: '项目部C', position: '施工员', phone: '13900015011' },
    { id: 'u119', username: '吴安全', email: '吴安全@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴安全', department: '项目部C', position: '安全员', phone: '13900015012' },
    { id: 'u107', username: '周经理', email: '周经理@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周经理', department: '项目部C', position: '项目副经理', phone: '13900015013', isDeputy: true },
    { id: 'u108', username: '吴采购', email: '吴采购@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴采购', department: '项目部C', position: '材料员', phone: '13900015014' },
    { id: 'u120', username: '郑质量', email: '郑质量@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑质量', department: '项目部C', position: '质量员', phone: '13900015015' },
    { id: 'u109', username: '吴经理', email: '吴经理@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴经理', department: '项目部C', position: '项目副经理', phone: '13900015016', isDeputy: true },
    { id: 'u110', username: '郑施工', email: '郑施工@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑施工', department: '项目部C', position: '施工员', phone: '13900015017' },
    { id: 'u121', username: '陈安全', email: '陈安全@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '陈安全', department: '项目部C', position: '安全员', phone: '13900015018' },

    // ── 分公司A ──
    { id: 'u12', username: '钱建国', email: '钱建国@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱建国', department: '分公司A', position: '公司经理', phone: '13800000011', isHead: true },
    { id: 'u69', username: '孙一', email: '孙一@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙一', department: '分公司A', position: '副经理', phone: '13900013001', isDeputy: true },
    { id: 'u70', username: '周一', email: '周一@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周一', department: '分公司A', position: '技术负责人', phone: '13900013002' },
    { id: 'u71', username: '吴一', email: '吴一@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴一', department: '分公司A', position: '安全员', phone: '13900013003' },
    { id: 'u72', username: '郑一', email: '郑一@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑一', department: '分公司A', position: '施工员', phone: '13900013004' },

    // ── 分公司B ──
    { id: 'u73', username: '陈国强', email: '陈国强@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '陈国强', department: '分公司B', position: '公司经理', phone: '13811110001', isHead: true },
    { id: 'u74', username: '孙二', email: '孙二@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙二', department: '分公司B', position: '副经理', phone: '13900013006', isDeputy: true },
    { id: 'u75', username: '周二', email: '周二@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周二', department: '分公司B', position: '技术负责人', phone: '13900013007' },
    { id: 'u76', username: '吴二', email: '吴二@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴二', department: '分公司B', position: '安全员', phone: '13900013008' },
    { id: 'u77', username: '郑二', email: '郑二@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑二', department: '分公司B', position: '施工员', phone: '13900013009' },

    // ── 分公司C ──
    { id: 'u78', username: '周海涛', email: '周海涛@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周海涛', department: '分公司C', position: '公司经理', phone: '13811110002', isHead: true },
    { id: 'u79', username: '孙三', email: '孙三@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙三', department: '分公司C', position: '副经理', phone: '13900013011', isDeputy: true },
    { id: 'u80', username: '周三', email: '周三@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周三', department: '分公司C', position: '技术负责人', phone: '13900013012' },
    { id: 'u81', username: '吴三', email: '吴三@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴三', department: '分公司C', position: '安全员', phone: '13900013013' },
    { id: 'u82', username: '郑三', email: '郑三@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑三', department: '分公司C', position: '施工员', phone: '13900013014' },

    // ── 子公司甲 ──
    { id: 'u83', username: '孙建国', email: '孙建国@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙建国', department: '子公司甲', position: '公司经理', phone: '13800000012', isHead: true },
    { id: 'u84', username: '孙四', email: '孙四@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙四', department: '子公司甲', position: '副经理', phone: '13900013016', isDeputy: true },
    { id: 'u85', username: '周四', email: '周四@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周四', department: '子公司甲', position: '技术负责人', phone: '13900013017' },
    { id: 'u86', username: '吴四', email: '吴四@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴四', department: '子公司甲', position: '安全员', phone: '13900013018' },
    { id: 'u87', username: '郑四', email: '郑四@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑四', department: '子公司甲', position: '施工员', phone: '13900013019' },
    // ── 子公司乙 ──
    { id: 'u200', username: '赵子乙', email: '赵子乙@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵子乙', department: '子公司乙', position: '公司经理', phone: '13900020001', isHead: true },
    { id: 'u201', username: '钱子乙', email: '钱子乙@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱子乙', department: '子公司乙', position: '副经理', phone: '13900020002', isDeputy: true },
    { id: 'u202', username: '孙子乙', email: '孙子乙@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙子乙', department: '子公司乙', position: '技术负责人', phone: '13900020003' },
    { id: 'u203', username: '李子乙', email: '李子乙@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李子乙', department: '子公司乙', position: '安全员', phone: '13900020004' },
    { id: 'u204', username: '周子乙', email: '周子乙@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周子乙', department: '子公司乙', position: '施工员', phone: '13900020005' },

    // ── 一公司 ──
    { id: 'u210', username: '吴一公司', email: '吴一公司@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴一公司', department: '一公司', position: '公司经理', phone: '13900021001', isHead: true },
    { id: 'u211', username: '周一公司', email: '周一公司@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周一公司', department: '一公司', position: '副经理', phone: '13900021002', isDeputy: true },
    { id: 'u212', username: '郑一公司', email: '郑一公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑一公司', department: '一公司', position: '技术负责人', phone: '13900021003' },
    { id: 'u213', username: '冯一公司', email: '冯一公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '冯一公司', department: '一公司', position: '安全员', phone: '13900021004' },
    { id: 'u214', username: '陈一公司', email: '陈一公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '陈一公司', department: '一公司', position: '施工员', phone: '13900021005' },

    // ── 二公司 ──
    { id: 'u220', username: '褚二公司', email: '褚二公司@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '褚二公司', department: '二公司', position: '公司经理', phone: '13900022001', isHead: true },
    { id: 'u221', username: '卫二公司', email: '卫二公司@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '卫二公司', department: '二公司', position: '副经理', phone: '13900022002', isDeputy: true },
    { id: 'u222', username: '蒋二公司', email: '蒋二公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '蒋二公司', department: '二公司', position: '技术负责人', phone: '13900022003' },
    { id: 'u223', username: '沈二公司', email: '沈二公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '沈二公司', department: '二公司', position: '安全员', phone: '13900022004' },
    { id: 'u224', username: '韩二公司', email: '韩二公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '韩二公司', department: '二公司', position: '施工员', phone: '13900022005' },

    // ── 三公司 ──
    { id: 'u230', username: '杨三公司', email: '杨三公司@test.com', password: PWD_HASH, role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '杨三公司', department: '三公司', position: '公司经理', phone: '13900023001', isHead: true },
    { id: 'u231', username: '朱三公司', email: '朱三公司@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '朱三公司', department: '三公司', position: '副经理', phone: '13900023002', isDeputy: true },
    { id: 'u232', username: '秦三公司', email: '秦三公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '秦三公司', department: '三公司', position: '技术负责人', phone: '13900023003' },
    { id: 'u233', username: '尤三公司', email: '尤三公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '尤三公司', department: '三公司', position: '安全员', phone: '13900023004' },
    { id: 'u234', username: '许三公司', email: '许三公司@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '许三公司', department: '三公司', position: '施工员', phone: '13900023005' },

  ];

  return { users, collections, settings: { ...DEFAULT_SETTINGS }, conversations, chatMessages };
}

@Injectable()
export class DataService implements OnModuleInit {
  private users: any[] = [];
  private collections = new Map<string, any[]>();
  private auditLogs: any[] = [];
  private notifications: any[] = [];
  private settings: Record<string, any> = { ...DEFAULT_SETTINGS };
  // 聊天：会话 + 消息
  private conversations: any[] = [];
  private chatMessages: any[] = [];
  // SSE 实时推送：username -> 订阅回调集合
  private notifSubscribers = new Map<string, Set<(n: any) => void>>();

  onModuleInit() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.collections = new Map(Object.entries(data.collections || {}));
        this.auditLogs = data.auditLogs || [];
        this.notifications = data.notifications || [];
        this.conversations = data.conversations || [];
        this.chatMessages = data.chatMessages || [];
        this.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        console.log(`[DataService] 已从 ${DATA_FILE} 加载数据`);
        return;
      } catch (e) {
        console.error('[DataService] 加载数据失败，使用种子数据', e);
      }
    }
    const seeded = seed();
    this.users = seeded.users;
    this.collections = new Map(Object.entries(seeded.collections));
    this.settings = seeded.settings;
    this.conversations = seeded.conversations;
    this.chatMessages = seeded.chatMessages;
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
        notifications: this.notifications,
        conversations: this.conversations,
        chatMessages: this.chatMessages,
        settings: this.settings,
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

  // ── 个人信息 ──
  updateProfile(id: string, data: any) {
    const allowed = ['name', 'email', 'phone', 'department', 'position', 'avatar'];
    const clean: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) clean[key] = data[key];
    }
    return this.updateUser(id, clean);
  }

  // ── 系统设置 ──
  getSettings() { return this.settings; }
  updateSettings(patch: any) {
    this.settings = { ...this.settings, ...patch };
    this.save();
    return this.settings;
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

  // ── 通知消息 ──

  // 订阅某用户的实时通知（返回退订函数）
  subscribeNotifications(username: string, cb: (n: any) => void): () => void {
    if (!username) return () => {};
    if (!this.notifSubscribers.has(username)) {
      this.notifSubscribers.set(username, new Set());
    }
    this.notifSubscribers.get(username)!.add(cb);
    return () => this.unsubscribeNotifications(username, cb);
  }

  unsubscribeNotifications(username: string, cb: (n: any) => void) {
    const set = this.notifSubscribers.get(username);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) this.notifSubscribers.delete(username);
  }

  // 给指定用户（username）发送通知
  addNotification(username: string, data: { title: string; content?: string; type?: string; link?: string }) {
    const n = {
      id: this.generateId(),
      username,
      title: data.title,
      content: data.content || '',
      type: data.type || 'system',
      link: data.link || '',
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.push(n);
    this.save();
    // 实时推送给在线订阅者
    const set = this.notifSubscribers.get(username);
    if (set) {
      for (const cb of set) {
        try { cb(n); } catch {}
      }
    }
    return n;
  }

  // 通知所有用户（公告类）
  notifyAll(data: { title: string; content?: string; type?: string; link?: string }) {
    const targets = this.users.map((u) => u.username);
    for (const t of targets) {
      this.addNotification(t, data);
    }
    return targets.length;
  }

  getNotifications(username: string): any[] {
    return this.notifications
      .filter((n) => n.username === username)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadCount(username: string): number {
    return this.notifications.filter((n) => n.username === username && !n.read).length;
  }

  markNotificationRead(id: string, username: string): boolean {
    const n = this.notifications.find((x) => x.id === id && x.username === username);
    if (!n) return false;
    n.read = true;
    this.save();
    return true;
  }

  markAllNotificationsRead(username: string): number {
    let count = 0;
    for (const n of this.notifications) {
      if (n.username === username && !n.read) { n.read = true; count++; }
    }
    if (count > 0) this.save();
    return count;
  }

  deleteNotification(id: string, username: string): boolean {
    const i = this.notifications.findIndex((x) => x.id === id && x.username === username);
    if (i !== -1) { this.notifications.splice(i, 1); this.save(); return true; }
    return false;
  }

  // ── 聊天：会话 ──

  getConversations() { return this.conversations; }
  getConversation(id: string) { return this.conversations.find((c) => c.id === id); }

  getOrCreateSingleConversation(myUsername: string, otherUsername: string): any {
    let conv = this.conversations.find(
      (c) => c.type === 'single' && c.members.includes(myUsername) && c.members.includes(otherUsername),
    );
    if (!conv) {
      conv = {
        id: this.generateId(),
        type: 'single',
        name: otherUsername,
        members: [myUsername, otherUsername],
        owner: myUsername,
        createdAt: new Date().toISOString(),
      };
      this.conversations.push(conv);
      this.save();
    }
    return conv;
  }

  createGroupConversation(name: string, members: string[], owner: string, category?: string, projectId?: string): any {
    const uniqueMembers = Array.from(new Set([owner, ...members]));
    const conv: any = {
      id: this.generateId(),
      type: 'group',
      name: name || '未命名群聊',
      members: uniqueMembers,
      admins: [],
      owner,
      createdAt: new Date().toISOString(),
    };
    if (category) conv.category = category;
    if (projectId) conv.projectId = projectId;
    this.conversations.push(conv);
    this.save();
    return conv;
  }

  addConversationMember(conversationId: string, username: string) {
    const c = this.getConversation(conversationId);
    if (c && !c.members.includes(username)) {
      c.members.push(username);
      this.save();
    }
    return c;
  }

  removeConversationMember(conversationId: string, username: string) {
    const c = this.getConversation(conversationId);
    if (!c) return false;
    c.members = c.members.filter((m) => m !== username);
    this.save();
    return true;
  }

  updateConversation(id: string, data: any): any {
    const c = this.getConversation(id);
    if (!c) return null;
    Object.assign(c, data);
    this.save();
    return c;
  }

  // ── 聊天：消息 ──

  getChatMessages(conversationId: string): any[] {
    return this.chatMessages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addChatMessage(msg: any): any {
    msg.id = this.generateId();
    msg.createdAt = new Date().toISOString();
    this.chatMessages.push(msg);
    this.save();
    return msg;
  }

  getChatMessage(id: string) { return this.chatMessages.find((m) => m.id === id); }

  updateChatMessage(id: string, patch: any): any {
    const m = this.getChatMessage(id);
    if (!m) return null;
    Object.assign(m, patch);
    this.save();
    return m;
  }

  deleteChatMessage(id: string): boolean {
    const i = this.chatMessages.findIndex((m) => m.id === id);
    if (i !== -1) { this.chatMessages.splice(i, 1); this.save(); return true; }
    return false;
  }

  deleteConversationMessages(conversationId: string) {
    this.chatMessages = this.chatMessages.filter((m) => m.conversationId !== conversationId);
    this.save();
  }

  // ── 组织架构树（共享逻辑） ──
  buildOrgTree(departments: any[], positions: any[]): any[] {
    const users = this.getUsers().filter((u: any) => u.isActive !== false);
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const dept of departments) {
      const memberCount = this.countMembersInDept(dept.id, departments, users);
      const members = this.getMembersInDept(dept.id, departments, users);
      const directMembers = users.filter((u: any) => u.department === dept.name).map((u: any) => ({
        username: u.username,
        name: u.name,
        position: u.position,
        role: u.role,
        isHead: u.isHead,
        isDeputy: u.isDeputy,
      }));
      map.set(dept.id, {
        ...dept,
        children: [],
        positions: positions.filter((p: any) => p.departmentId === dept.id),
        memberCount,
        members: members.slice(0, 50),
        directMembers: directMembers.slice(0, 50),
      });
    }

    for (const dept of departments) {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private countMembersInDept(deptId: string, departments: any[], users: any[]): number {
    const dept = departments.find((d: any) => d.id === deptId);
    if (!dept) return 0;
    const directMembers = users.filter((u: any) => u.department === dept.name).length;
    const childDepts = departments.filter((d: any) => d.parentId === deptId);
    let total = directMembers;
    for (const child of childDepts) {
      total += this.countMembersInDept(child.id, departments, users);
    }
    return total;
  }

  private getMembersInDept(deptId: string, departments: any[], users: any[]): any[] {
    const dept = departments.find((d: any) => d.id === deptId);
    if (!dept) return [];
    const directMembers = users.filter((u: any) => u.department === dept.name).map((u: any) => ({
      username: u.username,
      name: u.name,
      position: u.position,
      role: u.role,
      isHead: u.isHead,
      isDeputy: u.isDeputy,
    }));
    const children = departments.filter((d: any) => d.parentId === deptId);
    let allMembers = [...directMembers];
    for (const child of children) {
      allMembers = allMembers.concat(this.getMembersInDept(child.id, departments, users));
    }
    return allMembers;
  }

  getDescendantIds(parentId: string, departments: any[]): string[] {
    const children = departments.filter((d) => d.parentId === parentId);
    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      ids.push(...this.getDescendantIds(child.id, departments));
    }
    return ids;
  }
}