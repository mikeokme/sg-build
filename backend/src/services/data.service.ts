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
    { id: 'dg_dgm-a', type: 'group', name: '副总经理A群', category: 'department', departmentId: 'dgm-a', members: ['admin','张伟','王磊','赵丽','孙强','何安全','高安全','朱商务','秦商务','刘工','张副1','李技术1','王施工1','赵质量1','钱安全1','孙材料1','周测量','马师傅','张副2','李技术2','王施工2','赵质量2','钱安全2','孙材料2','周测量','张经理','李技术3','王施工3','赵质量3','钱安全3','李经理','张测量','王施工4','赵质量4','孙经理','周施工','吴安全','周经理','吴采购','郑质量','吴经理','郑施工','陈安全'], admins: ['王磊','赵丽','刘工','马师傅','张经理'], owner: '张伟' },
    { id: 'dg_dgm-b', type: 'group', name: '副总经理B群', category: 'department', departmentId: 'dgm-b', members: ['admin','李明','钱人事','陈工','林工'], admins: ['李明'], owner: '李明' },
    { id: 'dg_dgm-c', type: 'group', name: '副总经理C群', category: 'department', departmentId: 'dgm-c', members: ['admin','刘市场','韩市场','杨市场','许投标','何投标','吕客服','施客服','梁质量','宋质量','吴刚'], admins: ['刘市场','吕客服'], owner: '刘市场' },
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
  // 二级：集团高管组下设直接群聊匹配规则（parentId=一级ID，有departmentIds）
  collections['chatGroups'] = [
    // ═══ 一级：集团高管组 ═══
    { id: 'group_exec', name: '集团高管组', icon: '🏛', color: 'blue', sortOrder: 0, description: '集团高管层群', parentId: null },

    // 二级：高管群（对应集团公司群）
    { id: 'sub_exec', name: '高管群', icon: '🎩', color: 'blue', sortOrder: 0, description: '集团公司高层群', parentId: 'group_exec', departmentIds: ['group'] },
    // 二级：总经办公群
    { id: 'sub_gm_office', name: '总经办公群', icon: '👔', color: 'blue', sortOrder: 1, description: '总经理办公室', parentId: 'group_exec', departmentIds: ['gm-office'] },
    // 二级：董事群
    { id: 'sub_board', name: '董事群', icon: '💼', color: 'blue', sortOrder: 2, description: '董事会', parentId: 'group_exec', departmentIds: ['board'] },
    // 二级：副总群
    { id: 'sub_dgm', name: '副总群', icon: '👔', color: 'blue', sortOrder: 3, description: '副总经理群', parentId: 'group_exec', departmentIds: ['dgm-a', 'dgm-b', 'dgm-c'] },
    // 二级：三总师群
    { id: 'sub_chief', name: '三总师群', icon: '⚙️', color: 'blue', sortOrder: 4, description: '总工程师/会计师/经济师', parentId: 'group_exec', departmentIds: ['chief-eng'] },

    // ═══ 一级：分子公司组 ═══
    { id: 'group_branch', name: '分子公司组', icon: '🏢', color: 'amber', sortOrder: 1, description: '分公司与子公司', parentId: null },

    // 二级：分公司组
    { id: 'sub_branch_co', name: '分公司组', icon: '🏢', color: 'amber', sortOrder: 0, description: '各分公司', parentId: 'group_branch', departmentIds: ['branch-a', 'branch-b', 'branch-c'] },
    // 二级：子公司组
    { id: 'sub_sub', name: '子公司组', icon: '🏭', color: 'amber', sortOrder: 1, description: '各子公司', parentId: 'group_branch', departmentIds: ['sub-alpha', 'sub-beta'] },
    // 二级：号码公司组
    { id: 'sub_num', name: '号码公司组', icon: '🔢', color: 'amber', sortOrder: 2, description: '一/二/三公司', parentId: 'group_branch', departmentIds: ['co-1', 'co-2', 'co-3'] },

    // ═══ 一级：集团部门组（下拉直接各部门群，不设子分组）═══
    { id: 'group_dept', name: '集团部门组', icon: '📋', color: 'purple', sortOrder: 2, description: '集团职能部门', parentId: null, departmentIds: ['eng-mgmt', 'finance', 'safety', 'contract', 'hr', 'audit', 'market-dev', 'ops', 'office'] },

    // ═══ 一级：项目部组（按真实工程项目细分，每项目一子组）═══
    { id: 'group_proj', name: '项目部组', icon: '🏗', color: 'emerald', sortOrder: 3, description: '项目执行单元（按真实工程细分）', parentId: null },

    // ═══ 一级：其他群组（下拉直接各群，不设子分组）═══
    { id: 'group_other', name: '其他群组', icon: '💬', color: 'gray', sortOrder: 4, description: '其他自建群', parentId: null },
  ];


  collections['suppliers'] = [
    { id: 's1', project: '清河水库除险加固工程', name: '华源水泥集团', contact: '王强', phone: '13900000001', material: '大坝专用水泥、混凝土' },
    { id: 's2', project: '清河水库除险加固工程', name: '恒信钢材集团', contact: '刘洋', phone: '13900000002', material: '钢筋、钢板桩' },
    { id: 's3', project: '城南地铁站项目', name: '安达机械租赁', contact: '马丽', phone: '13900000003', material: '挖掘机、装载机' },
    { id: 's4', project: '南水北调支线渠系工程', name: '水利材料厂', contact: '张总', phone: '13900000004', material: '土工膜、防渗材料' },
    { id: 's5', project: '跨河大桥水文监测站', name: '监测设备公司', contact: '李总', phone: '13900000005', material: '渗压计、水位计' },
    { id: 's2271', name: '华北建材有限公司', contact: '联系人2', phone: '13900001002', project: '城市防洪堤加固工程', material: '土工膜', address: '城市防洪堤加固工程项目部' },
    { id: 's2272', name: '广丰设备租赁', contact: '联系人3', phone: '13900001003', project: '流域综合治理工程', material: '土工膜', address: '流域综合治理工程项目部' },
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

  // 企业云盘
  collections['cloudFiles'] = [
    { id: 'fd1', name: '项目部资料', type: 'folder', size: 0, parentId: null, owner: 'admin', date: '2026-01-05', starred: false, shared: false },
    { id: 'fd2', name: '合同与制度', type: 'folder', size: 0, parentId: null, owner: 'admin', date: '2026-01-10', starred: false, shared: false },
    { id: 'fd3', name: '图纸与技术', type: 'folder', size: 0, parentId: null, owner: '周海涛', date: '2026-02-01', starred: false, shared: false },
    { id: 'fd4', name: '培训课件', type: 'folder', size: 0, parentId: null, owner: '王安全', date: '2026-03-12', starred: false, shared: false },
    { id: 'fd5', name: '影像资料', type: 'folder', size: 0, parentId: null, owner: '刘工', date: '2026-04-20', starred: false, shared: false },
    { id: 'fd11', name: '城南地铁站项目', type: 'folder', size: 0, parentId: 'fd1', owner: '陈国强', date: '2026-01-15', starred: false, shared: false },
    { id: 'fd12', name: '滨江大桥项目', type: 'folder', size: 0, parentId: 'fd1', owner: '周海涛', date: '2026-01-16', starred: false, shared: false },
    { id: 'fd21', name: '分包合同', type: 'folder', size: 0, parentId: 'fd2', owner: '王磊', date: '2026-02-05', starred: false, shared: false },
    { id: 'cf1', name: '城南地铁站主体结构施工方案', type: 'doc', size: 2621440, parentId: 'fd11', owner: '陈国强', date: '2026-07-20', starred: false, shared: false, version: 3 },
    { id: 'cf2', name: '车站深基坑开挖专项方案', type: 'doc', size: 3250586, parentId: 'fd11', owner: '周海涛', date: '2026-07-22', starred: false, shared: false, version: 2 },
    { id: 'cf3', name: '主体结构钢筋验收记录', type: 'xls', size: 1258291, parentId: 'fd11', owner: '吴刚', date: '2026-08-11', starred: false, shared: true, version: 1 },
    { id: 'cf4', name: '滨江大桥墩柱施工方案', type: 'doc', size: 4404019, parentId: 'fd12', owner: '周海涛', date: '2026-06-18', starred: false, shared: false, version: 2 },
    { id: 'cf5', name: '墩柱混凝土配合比设计', type: 'xls', size: 943718, parentId: 'fd12', owner: '周芳', date: '2026-07-05', starred: false, shared: false, version: 1 },
    { id: 'cf6', name: '分包合同-土方分包', type: 'pdf', size: 2936013, parentId: 'fd21', owner: '王磊', date: '2026-03-15', starred: true, shared: true, version: 1 },
    { id: 'cf7', name: '分包合同-防水专业分包', type: 'pdf', size: 3670016, parentId: 'fd21', owner: '王磊', date: '2026-04-08', starred: false, shared: false, version: 1 },
    { id: 'cf8', name: '安全文明施工管理制度', type: 'doc', size: 1677722, parentId: 'fd2', owner: '王安全', date: '2026-02-20', starred: false, shared: true, version: 2 },
    { id: 'cf9', name: '项目管理办法汇编', type: 'pdf', size: 5452595, parentId: 'fd2', owner: 'admin', date: '2026-05-01', starred: false, shared: false, version: 1 },
    { id: 'cf10', name: '城南地铁站结构施工图', type: 'cad', size: 12582912, parentId: 'fd3', owner: '周海涛', date: '2026-07-01', starred: false, shared: false, version: 5 },
    { id: 'cf11', name: '滨江大桥桥墩节点详图', type: 'cad', size: 8808038, parentId: 'fd3', owner: '周海涛', date: '2026-07-10', starred: false, shared: true, version: 3 },
    { id: 'cf12', name: '渠道衬砌断面图', type: 'cad', size: 7130317, parentId: 'fd3', owner: '李明', date: '2026-06-25', starred: false, shared: false, version: 2 },
    { id: 'cf13', name: '新员工入场安全教育课件', type: 'ppt', size: 8912896, parentId: 'fd4', owner: '王安全', date: '2026-08-01', starred: true, shared: true, version: 2 },
    { id: 'cf14', name: '混凝土质量控制培训课件', type: 'ppt', size: 7549747, parentId: 'fd4', owner: '吴刚', date: '2026-08-09', starred: false, shared: false, version: 1 },
    { id: 'cf15', name: '有限空间作业安全培训', type: 'video', size: 47185920, parentId: 'fd4', owner: '王安全', date: '2026-07-28', starred: false, shared: false, version: 1 },
    { id: 'cf16', name: '主体结构施工全景照片', type: 'img', size: 3355443, parentId: 'fd5', owner: '刘工', date: '2026-08-10', starred: false, shared: false, version: 1 },
    { id: 'cf17', name: '无人机航拍-施工现场', type: 'video', size: 85983232, parentId: 'fd5', owner: '刘工', date: '2026-08-12', starred: true, shared: false, version: 2 },
    { id: 'cf18', name: '防汛演练现场影像', type: 'img', size: 2516582, parentId: 'fd5', owner: '王安全', date: '2026-07-15', starred: false, shared: true, version: 1 },
    { id: 'cf19', name: '物资采购计划表-8月', type: 'xls', size: 1153434, parentId: 'fd2', owner: '周芳', date: '2026-08-02', starred: false, shared: false, version: 1 },
    { id: 'cf20', name: '结算资料包', type: 'zip', size: 18874368, parentId: 'fd12', owner: '赵丽', date: '2026-08-14', starred: false, shared: true, version: 1 },
  ];

  // 项目管理
  collections['projectArchives'] = [
    { id: 'pa1', name: '清河水库除险加固工程', code: 'SL-2024-001', location: '河北省石家庄市鹿泉区', type: '水利枢纽', scope: '大坝除险加固、溢洪道改造、涵洞重建', manager: '刘工', supervisor: '张伟', customer: '市水利局', contractType: '总价合同', amount: 68000000, qualityTarget: '合格', safetyTarget: '零事故', startDate: '2024-03-01', endDate: '2026-06-30', planDuration: 822, status: '在建', description: '对清河水库大坝进行除险加固，提高防洪标准至50年一遇' },
    { id: 'pa2', name: '南水北调支线渠系工程', code: 'SL-2024-002', location: '河南省南阳市邓州市', type: '渠道工程', scope: '渠道衬砌、渡槽建设、泵站更新', manager: '马师傅', supervisor: '王磊', customer: '省水利厅', contractType: '单价合同', amount: 150000000, qualityTarget: '优良', safetyTarget: '零事故', startDate: '2024-05-15', endDate: '2027-01-31', planDuration: 961, status: '在建', description: '南水北调中线二期支线渠系配套工程' },
    { id: 'pa3', name: '城市防洪堤加固工程', code: 'SL-2023-003', location: '湖北省武汉市洪山区', type: '防洪工程', scope: '堤防加固、护岸工程、排涝泵站', manager: '钱建国', supervisor: '李工', customer: '市防汛办', contractType: '总价合同', amount: 50000000, qualityTarget: '合格', safetyTarget: '零事故', startDate: '2023-09-01', endDate: '2026-03-31', planDuration: 912, status: '竣工', description: '城区防洪堤加固提升工程，设计防洪标准100年一遇' },
    { id: 'pa4', name: '流域综合治理工程', code: 'SL-2025-004', location: '四川省成都市都江堰市', type: '综合治理', scope: '河道整治、湿地恢复、生态廊道', manager: '张经理', supervisor: '赵工', customer: '流域管理局', contractType: 'EPC总承包', amount: 320000000, qualityTarget: '优良', safetyTarget: '零事故', startDate: '2025-01-15', endDate: '2027-12-31', planDuration: 1081, status: '在建', description: '流域水系综合治理与生态修复工程' },
    { id: 'pa5', name: '农田水利灌溉工程', code: 'SL-2025-005', location: '山东省济南市章丘区', type: '灌溉工程', scope: '渠道改造、泵站建设、智能灌溉', manager: '李经理', supervisor: '王磊', customer: '县农业农村局', contractType: '单价合同', amount: 28000000, qualityTarget: '合格', safetyTarget: '一般事故以下', startDate: '2025-06-01', endDate: '2026-12-31', planDuration: 579, status: '在建', description: '高标准农田水利配套设施改造' },
    { id: 'pa6', name: '湿地公园水系工程', code: 'SL-2024-006', location: '浙江省杭州市西湖区', type: '景观工程', scope: '人工湖开挖、水系连通、绿化景观', manager: '王磊', supervisor: '陈工', customer: '市园林局', contractType: '总价合同', amount: 43800000, qualityTarget: '优良', safetyTarget: '零事故', startDate: '2024-08-01', endDate: '2026-06-30', planDuration: 698, status: '完工', description: '城市湿地公园水系景观工程' },
    { id: 'pa7', name: '污水处理厂升级工程', code: 'SL-2023-007', location: '江苏省南京市江宁区', type: '环保工程', scope: '生化池改造、深度处理、污泥脱水', manager: '赵丽', supervisor: '孙强', customer: '市环保局', contractType: 'EPC总承包', amount: 80000000, qualityTarget: '合格', safetyTarget: '零事故', startDate: '2023-03-01', endDate: '2025-12-31', planDuration: 1006, status: '完工', description: '城市污水处理厂提标改造工程' },
    { id: 'pa8', name: '跨河大桥水文监测站', code: 'SL-2026-008', location: '广东省广州市海珠区', type: '监测工程', scope: '桥墩基础施工、监测设备安装、数据采集系统', manager: '孙经理', supervisor: '周芳', customer: '水文局', contractType: '单价合同', amount: 12000000, qualityTarget: '合格', safetyTarget: '一般事故以下', startDate: '2026-01-01', endDate: '2027-06-30', planDuration: 545, status: '在建', description: '跨河大桥配套水文自动监测系统建设' },
    { id: 'pa9', name: '滨江生态廊道工程', code: 'SL-2025-009', location: '湖南省长沙市岳麓区', type: '生态工程', scope: '河岸生态修复、步道建设、植被恢复', manager: '周经理', supervisor: '郑敏', customer: '市住建局', contractType: '总价合同', amount: 56000000, qualityTarget: '优良', safetyTarget: '零事故', startDate: '2025-04-01', endDate: '2027-03-31', planDuration: 760, status: '在建', description: '滨江生态廊道贯通工程' },
    { id: 'pa10', name: '灌区现代化改造工程', code: 'SL-2023-010', location: '安徽省合肥市肥西县', type: '灌溉工程', scope: '干渠防渗改造、量测水设施、自动化控制', manager: '陈国强', supervisor: '刘市场', customer: '灌区管理处', contractType: '单价合同', amount: 32000000, qualityTarget: '合格', safetyTarget: '一般事故以下', startDate: '2023-06-01', endDate: '2025-08-31', planDuration: 822, status: '竣工', description: '大型灌区续建配套与现代化改造' },
    { id: 'pa11', name: '山区小型水库建设', code: 'SL-2026-011', location: '云南省昆明市呈贡区', type: '水库工程', scope: '坝体填筑、溢洪道、放水设施', manager: '吴经理', supervisor: '钱安全', customer: '县水利局', contractType: '总价合同', amount: 25000000, qualityTarget: '合格', safetyTarget: '零事故', startDate: '2026-03-01', endDate: '2027-08-31', planDuration: 549, status: '在建', description: '山区小型水库新建工程，解决当地饮水安全问题' },
  ];

  // 项目文档库
  collections['projectDocuments'] = [
    { id: 'pd1', projectId: 'pa1', name: '施工组织设计', type: '技术方案', fileName: '施工组织设计_v2.pdf', size: 2457600, uploader: '刘工', date: '2024-04-15', description: '清河水库除险加固工程施工组织设计' },
    { id: 'pd2', projectId: 'pa1', name: '施工图纸-坝体加固', type: '图纸', fileName: '坝体加固图纸.dwg', size: 5242880, uploader: '张伟', date: '2024-03-20', description: '大坝坝体加固施工图纸' },
    { id: 'pd3', projectId: 'pa1', name: '质量检验报告-第一批', type: '检测报告', fileName: '质检报告001.pdf', size: 1048576, uploader: '监理组', date: '2024-06-01', description: '大坝混凝土浇筑质量检验报告' },
    { id: 'pd4', projectId: 'pa2', name: '渠道衬砌施工方案', type: '技术方案', fileName: '渠道衬砌方案.pdf', size: 3145728, uploader: '马师傅', date: '2024-06-10', description: '南水北调渠道衬砌施工专项方案' },
    { id: 'pd5', projectId: 'pa2', name: '材料进场验收单', type: '验收记录', fileName: '进场验收001.xlsx', size: 524288, uploader: '王磊', date: '2024-07-01', description: '预制混凝土板进场验收记录' },
    { id: 'pd6', projectId: 'pa4', name: '河道整治设计变更', type: '设计变更', fileName: '变更单001.pdf', size: 2097152, uploader: '赵工', date: '2025-03-15', description: '河道整治线路调整设计变更' },
    { id: 'pd7', projectId: 'pa4', name: '环境影响评估报告', type: '评估报告', fileName: '环评报告.pdf', size: 8388608, uploader: '张伟', date: '2025-02-01', description: '流域治理工程环境影响评估' },
    { id: 'pd8', projectId: 'pa3', name: '竣工验收报告', type: '验收记录', fileName: '竣工验收报告.pdf', size: 4194304, uploader: '李工', date: '2026-03-25', description: '城市防洪堤加固工程竣工验收' },
    { id: 'pd9', projectId: 'pa5', name: '灌溉系统图纸', type: '图纸', fileName: '灌溉系统图.dwg', size: 3670016, uploader: '李经理', date: '2025-07-15', description: '农田灌溉系统管网布置图' },
    { id: 'pd10', projectId: 'pa5', name: '智能灌溉设备清单', type: '设备清单', fileName: '设备清单.xlsx', size: 327680, uploader: '钱安全', date: '2025-08-01', description: '智能灌溉控制系统设备明细' },
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
    { id: 'bd1', name: '清河水库除险加固-人工费预算', project: '清河水库除险加固工程', category: '人工费', amount: 15000000, actualAmount: 9800000, date: '2024-04-01', status: '已审定' },
    { id: 'bd2', name: '清河水库除险加固-材料费预算', project: '清河水库除险加固工程', category: '材料费', amount: 38000000, actualAmount: 24500000, date: '2024-04-01', status: '已审定' },
    { id: 'bd3', name: '清河水库除险加固-机械费预算', project: '清河水库除险加固工程', category: '机械费', amount: 9000000, actualAmount: 6200000, date: '2024-04-01', status: '已审定' },
    { id: 'bd4', name: '清河水库除险加固-措施费预算', project: '清河水库除险加固工程', category: '措施费', amount: 4000000, actualAmount: 2100000, date: '2024-04-01', status: '已审定' },
    { id: 'bd5', name: '清河水库除险加固-管理费预算', project: '清河水库除险加固工程', category: '管理费', amount: 2000000, actualAmount: 1800000, date: '2024-04-01', status: '已审定' },
    { id: 'bd6', name: '南水北调支线渠系-人工费预算', project: '南水北调支线渠系工程', category: '人工费', amount: 22000000, actualAmount: 11000000, date: '2024-06-01', status: '已审定' },
    { id: 'bd7', name: '南水北调支线渠系-材料费预算', project: '南水北调支线渠系工程', category: '材料费', amount: 48000000, actualAmount: 20500000, date: '2024-06-01', status: '已审定' },
    { id: 'bd8', name: '南水北调支线渠系-机械费预算', project: '南水北调支线渠系工程', category: '机械费', amount: 12000000, actualAmount: 6400000, date: '2024-06-01', status: '已审定' },
    { id: 'bd9', name: '城市防洪堤加固-人工费预算', project: '城市防洪堤加固工程', category: '人工费', amount: 11000000, actualAmount: 10800000, date: '2024-04-01', status: '已封顶' },
    { id: 'bd10', name: '城市防洪堤加固-材料费预算', project: '城市防洪堤加固工程', category: '材料费', amount: 29000000, actualAmount: 28200000, date: '2024-04-01', status: '已封顶' },
    { id: 'bd11', name: '城市防洪堤加固-机械费预算', project: '城市防洪堤加固工程', category: '机械费', amount: 6000000, actualAmount: 5900000, date: '2024-04-01', status: '已封顶' },
    { id: 'bd12', name: '流域综合治理-人工费预算', project: '流域综合治理工程', category: '人工费', amount: 28000000, actualAmount: 5200000, date: '2025-06-01', status: '已审定' },
    { id: 'bd13', name: '流域综合治理-材料费预算', project: '流域综合治理工程', category: '材料费', amount: 46000000, actualAmount: 7800000, date: '2025-06-01', status: '已审定' },
    { id: 'bd14', name: '流域综合治理-机械费预算', project: '流域综合治理工程', category: '机械费', amount: 15000000, actualAmount: 2400000, date: '2025-06-01', status: '已审定' },
    { id: 'bd15', name: '流域综合治理-措施费预算', project: '流域综合治理工程', category: '措施费', amount: 6000000, actualAmount: 900000, date: '2025-06-01', status: '已审定' },
    { id: 'bd16', name: '农田水利灌溉-人工费预算', project: '农田水利灌溉工程', category: '人工费', amount: 8000000, actualAmount: 4700000, date: '2025-05-01', status: '已审定' },
    { id: 'bd17', name: '农田水利灌溉-材料费预算', project: '农田水利灌溉工程', category: '材料费', amount: 15000000, actualAmount: 8600000, date: '2025-05-01', status: '已审定' },
    { id: 'bd18', name: '农田水利灌溉-机械费预算', project: '农田水利灌溉工程', category: '机械费', amount: 5000000, actualAmount: 2400000, date: '2025-05-01', status: '已审定' },
    { id: 'bd19', name: '跨河大桥水文监测-材料费预算', project: '跨河大桥水文监测站', category: '材料费', amount: 7000000, actualAmount: 2100000, date: '2026-01-01', status: '编制中' },
    { id: 'bd20', name: '滨江生态廊道-人工费预算', project: '滨江生态廊道工程', category: '人工费', amount: 13000000, actualAmount: 3100000, date: '2025-04-01', status: '已审定' },
    { id: 'bd21', name: '滨江生态廊道-材料费预算', project: '滨江生态廊道工程', category: '材料费', amount: 18000000, actualAmount: 4200000, date: '2025-04-01', status: '已审定' },
    { id: 'bd22', name: '滨江生态廊道-机械费预算', project: '滨江生态廊道工程', category: '机械费', amount: 8000000, actualAmount: 1500000, date: '2025-04-01', status: '已审定' },
    { id: 'bd23', name: '湿地公园水系-人工费预算', project: '湿地公园水系工程', category: '人工费', amount: 14000000, actualAmount: 13600000, date: '2024-08-01', status: '已封顶' },
    { id: 'bd24', name: '湿地公园水系-材料费预算', project: '湿地公园水系工程', category: '材料费', amount: 22000000, actualAmount: 21500000, date: '2024-08-01', status: '已封顶' },
    { id: 'bd25', name: '湿地公园水系-机械费预算', project: '湿地公园水系工程', category: '机械费', amount: 5000000, actualAmount: 4900000, date: '2024-08-01', status: '已封顶' },
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

  // 施工日志
  collections['constructionLogs'] = [
    { id: 'cl1', project: '清河水库除险加固工程', date: '2026-08-18', weather: '晴', workContent: '大坝上游坝坡护砌砌筑，完成第12仓；溢洪道消力池底板钢筋绑扎', labor: 46, equipment: '挖掘机1台、自卸车4台、搅拌车2台', issues: '坝肩岩层渗水，已联系设计单位复核', recorder: '刘工' },
    { id: 'cl2', project: '清河水库除险加固工程', date: '2026-08-19', weather: '多云', workContent: '溢洪道消力池底板浇筑混凝土120方；坝体心墙碾压试验段施工', labor: 52, equipment: '挖掘机2台、压路机1台、泵车1台', issues: '无', recorder: '刘工' },
    { id: 'cl3', project: '南水北调支线渠系工程', date: '2026-08-18', weather: '小雨', workContent: '渠道土方开挖3000方；节制闸基坑降水施工', labor: 38, equipment: '挖掘机3台、自卸车6台、降水井泵8台', issues: '降雨影响土方压实，已安排覆盖', recorder: '马师傅' },
    { id: 'cl4', project: '城市防洪堤加固工程', date: '2026-08-17', weather: '晴', workContent: '堤身加高培厚填筑，完成第8段；堤脚浆砌石护脚施工', labor: 44, equipment: '装载机2台、压路机1台、搅拌车3台', issues: '无', recorder: '张经理' },
    { id: 'cl5', project: '流域综合治理工程', date: '2026-08-16', weather: '晴', workContent: '生态护岸格宾网箱安装80米；河道清淤验收', labor: 30, equipment: '挖掘机1台、吊车1台', issues: '部分格宾网箱石料粒径偏大，已要求更换', recorder: '周经理' },
    { id: 'cl6', project: '农田水利灌溉工程', date: '2026-08-15', weather: '阴', workContent: '灌溉渠道衬砌施工150米；泵站机电设备安装', labor: 26, equipment: '搅拌车2台、吊车1台', issues: '无', recorder: '吴经理' },
    { id: 'cl7', project: '湿地公园水系工程', date: '2026-08-14', weather: '多云', workContent: '湖底清淤完成验收；栈桥基础桩基施工', labor: 22, equipment: '挖掘机1台、打桩机1台', issues: '桩基检测安排中', recorder: '赵工' },
    { id: 'cl8', project: '污水处理厂升级工程', date: '2026-08-13', weather: '晴', workContent: '生化池设备安装调试；二沉池刮泥机安装', labor: 18, equipment: '吊车2台', issues: '无', recorder: '孙工' },
  ];

  // 里程碑管理
  collections['milestones'] = [
    { id: 'ms1', project: '清河水库除险加固工程', name: '开工', planDate: '2024-04-01', actualDate: '2024-04-08', progress: 100, status: '已完成' },
    { id: 'ms2', project: '清河水库除险加固工程', name: '大坝基础处理完成', planDate: '2024-09-30', actualDate: '2024-10-12', progress: 100, status: '已完成' },
    { id: 'ms3', project: '清河水库除险加固工程', name: '坝体加高至设计高程', planDate: '2026-03-31', actualDate: '', progress: 82, status: '进行中' },
    { id: 'ms4', project: '清河水库除险加固工程', name: '溢洪道改造完成', planDate: '2026-05-31', actualDate: '', progress: 60, status: '进行中' },
    { id: 'ms5', project: '清河水库除险加固工程', name: '竣工验收', planDate: '2026-06-30', actualDate: '', progress: 0, status: '未开始' },
    { id: 'ms6', project: '南水北调支线渠系工程', name: '开工', planDate: '2024-06-01', actualDate: '2024-06-10', progress: 100, status: '已完成' },
    { id: 'ms7', project: '南水北调支线渠系工程', name: '渠道开挖完成', planDate: '2025-12-31', actualDate: '2026-01-15', progress: 100, status: '已完成' },
    { id: 'ms8', project: '南水北调支线渠系工程', name: '衬砌施工完成80%', planDate: '2026-09-30', actualDate: '', progress: 45, status: '进行中' },
    { id: 'ms9', project: '南水北调支线渠系工程', name: '竣工验收', planDate: '2027-01-31', actualDate: '', progress: 0, status: '未开始' },
    { id: 'ms10', project: '城市防洪堤加固工程', name: '堤身填筑完成', planDate: '2025-12-31', actualDate: '2025-12-20', progress: 100, status: '已完成' },
    { id: 'ms11', project: '城市防洪堤加固工程', name: '竣工验收', planDate: '2026-03-31', actualDate: '2026-03-25', progress: 100, status: '已完成' },
    { id: 'ms12', project: '流域综合治理工程', name: '生态护岸完成', planDate: '2026-10-31', actualDate: '', progress: 35, status: '进行中' },
    { id: 'ms13', project: '流域综合治理工程', name: '竣工验收', planDate: '2027-12-31', actualDate: '', progress: 0, status: '未开始' },
    { id: 'ms14', project: '农田水利灌溉工程', name: '渠道工程完成', planDate: '2026-08-31', actualDate: '', progress: 70, status: '进行中' },
    { id: 'ms15', project: '湿地公园水系工程', name: '湖底清淤验收完成', planDate: '2026-05-31', actualDate: '2026-05-28', progress: 100, status: '已完成' },
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
    { id: 'pr1', project: '城南地铁站项目', task: '土方开挖', startDate: '2026-03-01', endDate: '2026-04-30', progress: 100, owner: '张工' , plannedProgress: 100},
    { id: 'pr2', project: '城南地铁站项目', task: '主体结构施工', startDate: '2026-05-01', endDate: '2026-09-30', progress: 60, owner: '陈国强' , predecessors: ["pr1"], plannedProgress: 73},
    { id: 'pr3', project: '城南地铁站项目', task: '机电安装', startDate: '2026-08-01', endDate: '2026-12-31', progress: 15, owner: '刘工' , predecessors: ["pr2"], plannedProgress: 13},
    { id: 'pr4', project: '滨江大桥工程', task: '桩基施工', startDate: '2026-05-15', endDate: '2026-08-31', progress: 80, owner: '周海涛' , plannedProgress: 90},
    { id: 'pr5', project: '滨江大桥工程', task: '墩柱施工', startDate: '2026-08-01', endDate: '2026-11-30', progress: 25, owner: '孙工' , predecessors: ["pr4"], plannedProgress: 16},
    { id: 'pr6', project: '地铁3号线二期土建', task: '地质勘察', startDate: '2026-01-15', endDate: '2026-04-30', progress: 100, owner: '张伟' , plannedProgress: 100},
    { id: 'pr7', project: '地铁3号线二期土建', task: '围护结构施工', startDate: '2026-05-01', endDate: '2026-10-31', progress: 45, owner: '李明' , predecessors: ["pr6"], plannedProgress: 61},
    { id: 'pr8', project: '城北新区道路改造', task: '路基处理', startDate: '2026-06-01', endDate: '2026-08-31', progress: 70, owner: '李明' , plannedProgress: 88},
    { id: 'pr9', project: '城北新区道路改造', task: '路面铺设', startDate: '2026-09-01', endDate: '2026-11-30', progress: 0, owner: '李明' , predecessors: ["pr8"], plannedProgress: 0},
    { id: 'pr10', project: '高铁站交通枢纽', task: '基坑开挖', startDate: '2026-03-01', endDate: '2026-06-30', progress: 100, owner: '孙强' , plannedProgress: 100},
    { id: 'pr11', project: '高铁站交通枢纽', task: '主体结构', startDate: '2026-07-01', endDate: '2027-06-30', progress: 35, owner: '孙强' , predecessors: ["pr10"], plannedProgress: 14},
    { id: 'pr12', project: '城南商业综合体', task: '桩基施工', startDate: '2026-04-01', endDate: '2026-07-31', progress: 90, owner: '周芳' , plannedProgress: 100},
    { id: 'pr13', project: '城南商业综合体', task: '地下室施工', startDate: '2026-08-01', endDate: '2026-12-31', progress: 20, owner: '周芳' , predecessors: ["pr12"], plannedProgress: 13},
    { id: 'pr14', project: '城北学校扩建工程', task: '基础施工', startDate: '2026-03-01', endDate: '2026-05-31', progress: 100, owner: '吴刚' , plannedProgress: 100},
    { id: 'pr15', project: '城北学校扩建工程', task: '主体施工', startDate: '2026-06-01', endDate: '2026-10-31', progress: 55, owner: '吴刚' , predecessors: ["pr14"], plannedProgress: 53},
  ];

  // 设备台账
  collections['equipments'] = [
    { id: 'e1', project: '城南地铁站项目', name: '塔式起重机', code: 'SB-001', category: '起重机械', owner: '城南地铁站', status: '在用', date: '2024-01-10' },
    { id: 'e2', project: '滨江大桥工程', name: '混凝土搅拌车', code: 'SB-002', category: '运输机械', owner: '滨江大桥', status: '在用', date: '2024-03-20' },
    { id: 'e3', project: '城南地铁站项目', name: '挖掘机', code: 'SB-003', category: '土方机械', owner: '城南地铁站', status: '维修', date: '2024-02-15' },
    { id: 'e4', project: '地铁3号线二期土建', name: '塔式起重机', code: 'SB-004', category: '起重机械', owner: '地铁3号线', status: '在用', date: '2025-03-01' },
    { id: 'e5', project: '高铁站交通枢纽', name: '混凝土泵车', code: 'SB-005', category: '混凝土机械', owner: '高铁站项目', status: '在用', date: '2026-02-15' },
    { id: 'e6', project: '城北新区道路改造', name: '压路机', code: 'SB-006', category: '路面机械', owner: '城北道路', status: '在用', date: '2025-07-01' },
    { id: 'e7', project: '地铁3号线二期土建', name: '盾构机', code: 'SB-007', category: '隧道机械', owner: '地铁3号线', status: '在用', date: '2025-06-01' },
    { id: 'e8', project: '城南商业综合体', name: '汽车吊', code: 'SB-008', category: '起重机械', owner: '城南商业', status: '闲置', date: '2024-08-10' },
    { id: 'e2181', name: '塔式起重机', code: 'SB-100', category: '起重机械', project: '清河水库除险加固工程', owner: '清河水库除险加固', status: '在用', date: '2025-06-15' },
    { id: 'e2182', name: '汽车吊50t', code: 'SB-101', category: '土方机械', project: '清河水库除险加固工程', owner: '清河水库除险加固', status: '在用', date: '2025-06-15' },
    { id: 'e2183', name: '挖掘机', code: 'SB-102', category: '土方机械', project: '南水北调支线渠系工程', owner: '南水北调支线渠系', status: '在用', date: '2025-06-15' },
    { id: 'e2184', name: '混凝土搅拌车', code: 'SB-103', category: '运输机械', project: '南水北调支线渠系工程', owner: '南水北调支线渠系', status: '闲置', date: '2025-06-15' },
    { id: 'e2185', name: '混凝土泵车', code: 'SB-104', category: '运输机械', project: '城市防洪堤加固工程', owner: '城市防洪堤加固', status: '闲置', date: '2025-06-15' },
    { id: 'e2186', name: '物料提升机', code: 'SB-105', category: '混凝土机械', project: '城市防洪堤加固工程', owner: '城市防洪堤加固', status: '维修', date: '2025-06-15' },
    { id: 'e2187', name: '压路机', code: 'SB-106', category: '混凝土机械', project: '流域综合治理工程', owner: '流域综合治理', status: '维修', date: '2025-06-15' },
    { id: 'e2188', name: '装载机', code: 'SB-107', category: '隧道机械', project: '流域综合治理工程', owner: '流域综合治理', status: '在用', date: '2025-06-15' },
    { id: 'e2189', name: '盾构机', code: 'SB-108', category: '隧道机械', project: '农田水利灌溉工程', owner: '农田水利灌溉', status: '在用', date: '2025-06-15' },
    { id: 'e2190', name: '平板运输车', code: 'SB-109', category: '起重机械', project: '农田水利灌溉工程', owner: '农田水利灌溉', status: '在用', date: '2025-06-15' },
    { id: 'e2191', name: '塔式起重机', code: 'SB-110', category: '起重机械', project: '湿地公园水系工程', owner: '湿地公园水系', status: '在用', date: '2025-06-15' },
    { id: 'e2192', name: '汽车吊50t', code: 'SB-111', category: '土方机械', project: '湿地公园水系工程', owner: '湿地公园水系', status: '闲置', date: '2025-06-15' },
    { id: 'e2193', name: '挖掘机', code: 'SB-112', category: '土方机械', project: '污水处理厂升级工程', owner: '污水处理厂升级', status: '闲置', date: '2025-06-15' },
    { id: 'e2194', name: '混凝土搅拌车', code: 'SB-113', category: '运输机械', project: '污水处理厂升级工程', owner: '污水处理厂升级', status: '维修', date: '2025-06-15' },
    { id: 'e2195', name: '混凝土泵车', code: 'SB-114', category: '运输机械', project: '跨河大桥水文监测站', owner: '跨河大桥水文监测站', status: '维修', date: '2025-06-15' },
    { id: 'e2196', name: '物料提升机', code: 'SB-115', category: '混凝土机械', project: '跨河大桥水文监测站', owner: '跨河大桥水文监测站', status: '在用', date: '2025-06-15' },
    { id: 'e2197', name: '压路机', code: 'SB-116', category: '混凝土机械', project: '滨江生态廊道工程', owner: '滨江生态廊道', status: '在用', date: '2025-06-15' },
    { id: 'e2198', name: '装载机', code: 'SB-117', category: '隧道机械', project: '滨江生态廊道工程', owner: '滨江生态廊道', status: '在用', date: '2025-06-15' },
    { id: 'e2199', name: '盾构机', code: 'SB-118', category: '隧道机械', project: '灌区现代化改造工程', owner: '灌区现代化改造', status: '在用', date: '2025-06-15' },
    { id: 'e2200', name: '平板运输车', code: 'SB-119', category: '起重机械', project: '灌区现代化改造工程', owner: '灌区现代化改造', status: '闲置', date: '2025-06-15' },
    { id: 'e2201', name: '塔式起重机', code: 'SB-120', category: '起重机械', project: '山区小型水库建设', owner: '山区小型水库建设', status: '闲置', date: '2025-06-15' },
    { id: 'e2202', name: '汽车吊50t', code: 'SB-121', category: '土方机械', project: '山区小型水库建设', owner: '山区小型水库建设', status: '维修', date: '2025-06-15' },
    { id: 'e2203', name: '物料提升机', code: 'SB-125', category: '混凝土机械', project: '滨江大桥工程', owner: '滨江大桥', status: '在用', date: '2025-06-15' },
    { id: 'e2204', name: '平板运输车', code: 'SB-129', category: '起重机械', project: '高铁站交通枢纽', owner: '高铁站交通枢纽', status: '维修', date: '2025-06-15' },
    { id: 'e2205', name: '汽车吊50t', code: 'SB-131', category: '土方机械', project: '城北新区道路改造', owner: '城北新区道路改造', status: '在用', date: '2025-06-15' },
    { id: 'e2206', name: '混凝土搅拌车', code: 'SB-133', category: '运输机械', project: '城南商业综合体', owner: '城南商业综合体', status: '在用', date: '2025-06-15' },
    { id: 'e2207', name: '混凝土泵车', code: 'SB-134', category: '运输机械', project: '城北学校扩建工程', owner: '城北学校扩建', status: '在用', date: '2025-06-15' },
    { id: 'e2208', name: '物料提升机', code: 'SB-135', category: '混凝土机械', project: '城北学校扩建工程', owner: '城北学校扩建', status: '闲置', date: '2025-06-15' },
    { id: 'e2209', name: '压路机', code: 'SB-136', category: '混凝土机械', project: '滨江景观带工程', owner: '滨江景观带', status: '闲置', date: '2025-06-15' },
    { id: 'e2210', name: '装载机', code: 'SB-137', category: '隧道机械', project: '滨江景观带工程', owner: '滨江景观带', status: '维修', date: '2025-06-15' },
    { id: 'e2211', name: '盾构机', code: 'SB-138', category: '隧道机械', project: '城东物流园工程', owner: '城东物流园', status: '维修', date: '2025-06-15' },
    { id: 'e2212', name: '平板运输车', code: 'SB-139', category: '起重机械', project: '城东物流园工程', owner: '城东物流园', status: '在用', date: '2025-06-15' },
  ];

  // 设备租赁
  collections['equipmentLeases'] = [
    { id: 'el1', project: '城南地铁站项目', name: '汽车吊50t', lessor: '安达机械租赁', amount: 38000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el2', project: '滨江大桥工程', name: '物料提升机', lessor: '广丰设备租赁', amount: 15000, startDate: '2026-05-01', endDate: '2026-08-31', status: '租用中' },
    { id: 'el1002', name: '塔式起重机', lessor: '安达机械租赁', project: '清河水库除险加固工程', amount: 12000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1008', name: '混凝土搅拌车', lessor: '北方机械租赁', project: '南水北调支线渠系工程', amount: 26000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1014', name: '挖掘机', lessor: '北方机械租赁', project: '城市防洪堤加固工程', amount: 22000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1022', name: '物料提升机', lessor: '安达机械租赁', project: '流域综合治理工程', amount: 36000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1028', name: '混凝土泵车', lessor: '安达机械租赁', project: '农田水利灌溉工程', amount: 32000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1037', name: '装载机', lessor: '北方机械租赁', project: '湿地公园水系工程', amount: 46000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1044', name: '压路机', lessor: '北方机械租赁', project: '污水处理厂升级工程', amount: 42000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1053', name: '平板运输车', lessor: '安达机械租赁', project: '跨河大桥水文监测站', amount: 56000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1060', name: '盾构机', lessor: '安达机械租赁', project: '滨江生态廊道工程', amount: 52000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1069', name: '汽车吊50t', lessor: '北方机械租赁', project: '灌区现代化改造工程', amount: 66000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1076', name: '塔式起重机', lessor: '北方机械租赁', project: '山区小型水库建设', amount: 62000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1096', name: '物料提升机', lessor: '北方机械租赁', project: '地铁3号线二期土建', amount: 86000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1103', name: '混凝土泵车', lessor: '北方机械租赁', project: '高铁站交通枢纽', amount: 82000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1112', name: '装载机', lessor: '安达机械租赁', project: '城北新区道路改造', amount: 96000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1119', name: '压路机', lessor: '安达机械租赁', project: '城南商业综合体', amount: 92000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1128', name: '平板运输车', lessor: '北方机械租赁', project: '城北学校扩建工程', amount: 106000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1135', name: '盾构机', lessor: '北方机械租赁', project: '滨江景观带工程', amount: 102000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el1144', name: '汽车吊50t', lessor: '安达机械租赁', project: '城东物流园工程', amount: 116000, startDate: '2026-07-01', endDate: '2026-10-31', status: '租用中' },
    { id: 'el2213', name: '挖掘机', lessor: '广丰设备租赁', project: '清河水库除险加固工程', amount: 24000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2214', name: '物料提升机', lessor: '北方机械租赁', project: '南水北调支线渠系工程', amount: 30000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2215', name: '盾构机', lessor: '南方设备租赁', project: '城市防洪堤加固工程', amount: 36000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2216', name: '汽车吊50t', lessor: '安达机械租赁', project: '流域综合治理工程', amount: 42000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2217', name: '混凝土泵车', lessor: '广丰设备租赁', project: '农田水利灌溉工程', amount: 48000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2218', name: '装载机', lessor: '北方机械租赁', project: '湿地公园水系工程', amount: 54000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2219', name: '塔式起重机', lessor: '南方设备租赁', project: '污水处理厂升级工程', amount: 60000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2220', name: '混凝土搅拌车', lessor: '安达机械租赁', project: '跨河大桥水文监测站', amount: 66000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2221', name: '压路机', lessor: '广丰设备租赁', project: '滨江生态廊道工程', amount: 72000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2222', name: '平板运输车', lessor: '北方机械租赁', project: '灌区现代化改造工程', amount: 78000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2223', name: '挖掘机', lessor: '南方设备租赁', project: '山区小型水库建设', amount: 84000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2224', name: '物料提升机', lessor: '安达机械租赁', project: '城南地铁站项目', amount: 90000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2225', name: '盾构机', lessor: '广丰设备租赁', project: '滨江大桥工程', amount: 96000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2226', name: '汽车吊50t', lessor: '北方机械租赁', project: '地铁3号线二期土建', amount: 102000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2227', name: '混凝土泵车', lessor: '南方设备租赁', project: '高铁站交通枢纽', amount: 108000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2228', name: '装载机', lessor: '安达机械租赁', project: '城北新区道路改造', amount: 114000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2229', name: '塔式起重机', lessor: '广丰设备租赁', project: '城南商业综合体', amount: 120000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2230', name: '混凝土搅拌车', lessor: '北方机械租赁', project: '城北学校扩建工程', amount: 126000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2231', name: '压路机', lessor: '南方设备租赁', project: '滨江景观带工程', amount: 132000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
    { id: 'el2232', name: '平板运输车', lessor: '安达机械租赁', project: '城东物流园工程', amount: 138000, startDate: '2026-06-01', endDate: '2026-12-31', status: '租用中' },
  ];

  // 设备管理
  collections['equipmentDispatches'] = [
    { id: 'ed1', project: '滨江大桥工程', equipment: '挖掘机', fromProject: '城南地铁站项目', toProject: '滨江大桥工程', date: '2026-08-10', owner: '张机械' },
  ];

  collections['equipmentMaintenances'] = [
    { id: 'em1', project: '城南地铁站项目', equipment: '塔式起重机', type: '日常保养', date: '2026-08-01', cost: 3500, content: '钢丝绳检查、润滑' },
    { id: 'em2', project: '滨江大桥工程', equipment: '混凝土搅拌车', type: '定期保养', date: '2026-07-28', cost: 8800, content: '更换液压油、滤芯' },
    { id: 'em2233', equipment: '塔式起重机', type: '日常保养', project: '清河水库除险加固工程', date: '2026-07-05', cost: 2000, content: '设备例行保养检修' },
    { id: 'em2234', equipment: '汽车吊50t', type: '定期保养', project: '清河水库除险加固工程', date: '2026-07-05', cost: 6000, content: '设备例行保养检修' },
    { id: 'em2235', equipment: '汽车吊50t', type: '定期保养', project: '南水北调支线渠系工程', date: '2026-07-06', cost: 3500, content: '设备例行保养检修' },
    { id: 'em2236', equipment: '挖掘机', type: '大修', project: '南水北调支线渠系工程', date: '2026-07-06', cost: 7500, content: '设备例行保养检修' },
    { id: 'em2237', equipment: '挖掘机', type: '大修', project: '城市防洪堤加固工程', date: '2026-07-07', cost: 5000, content: '设备例行保养检修' },
    { id: 'em2238', equipment: '混凝土搅拌车', type: '日常保养', project: '城市防洪堤加固工程', date: '2026-07-07', cost: 9000, content: '设备例行保养检修' },
    { id: 'em2239', equipment: '混凝土搅拌车', type: '日常保养', project: '流域综合治理工程', date: '2026-07-08', cost: 6500, content: '设备例行保养检修' },
    { id: 'em2240', equipment: '混凝土泵车', type: '定期保养', project: '流域综合治理工程', date: '2026-07-08', cost: 10500, content: '设备例行保养检修' },
    { id: 'em2241', equipment: '混凝土泵车', type: '定期保养', project: '农田水利灌溉工程', date: '2026-07-09', cost: 8000, content: '设备例行保养检修' },
    { id: 'em2242', equipment: '物料提升机', type: '大修', project: '农田水利灌溉工程', date: '2026-07-09', cost: 12000, content: '设备例行保养检修' },
    { id: 'em2243', equipment: '物料提升机', type: '大修', project: '湿地公园水系工程', date: '2026-07-10', cost: 9500, content: '设备例行保养检修' },
    { id: 'em2244', equipment: '压路机', type: '日常保养', project: '湿地公园水系工程', date: '2026-07-10', cost: 13500, content: '设备例行保养检修' },
    { id: 'em2245', equipment: '压路机', type: '日常保养', project: '污水处理厂升级工程', date: '2026-07-11', cost: 11000, content: '设备例行保养检修' },
    { id: 'em2246', equipment: '装载机', type: '定期保养', project: '污水处理厂升级工程', date: '2026-07-11', cost: 15000, content: '设备例行保养检修' },
    { id: 'em2247', equipment: '装载机', type: '定期保养', project: '跨河大桥水文监测站', date: '2026-07-12', cost: 12500, content: '设备例行保养检修' },
    { id: 'em2248', equipment: '盾构机', type: '大修', project: '跨河大桥水文监测站', date: '2026-07-12', cost: 16500, content: '设备例行保养检修' },
    { id: 'em2249', equipment: '盾构机', type: '大修', project: '滨江生态廊道工程', date: '2026-07-13', cost: 14000, content: '设备例行保养检修' },
    { id: 'em2250', equipment: '平板运输车', type: '日常保养', project: '滨江生态廊道工程', date: '2026-07-13', cost: 18000, content: '设备例行保养检修' },
    { id: 'em2251', equipment: '平板运输车', type: '日常保养', project: '灌区现代化改造工程', date: '2026-07-14', cost: 15500, content: '设备例行保养检修' },
    { id: 'em2252', equipment: '塔式起重机', type: '定期保养', project: '灌区现代化改造工程', date: '2026-07-14', cost: 19500, content: '设备例行保养检修' },
    { id: 'em2253', equipment: '塔式起重机', type: '定期保养', project: '山区小型水库建设', date: '2026-07-15', cost: 17000, content: '设备例行保养检修' },
    { id: 'em2254', equipment: '汽车吊50t', type: '大修', project: '山区小型水库建设', date: '2026-07-15', cost: 21000, content: '设备例行保养检修' },
    { id: 'em2255', equipment: '挖掘机', type: '日常保养', project: '城南地铁站项目', date: '2026-07-16', cost: 2500, content: '设备例行保养检修' },
    { id: 'em2256', equipment: '混凝土搅拌车', type: '定期保养', project: '滨江大桥工程', date: '2026-07-17', cost: 4000, content: '设备例行保养检修' },
    { id: 'em2257', equipment: '混凝土搅拌车', type: '定期保养', project: '地铁3号线二期土建', date: '2026-07-18', cost: 21500, content: '设备例行保养检修' },
    { id: 'em2258', equipment: '混凝土泵车', type: '大修', project: '地铁3号线二期土建', date: '2026-07-18', cost: 5500, content: '设备例行保养检修' },
    { id: 'em2259', equipment: '混凝土泵车', type: '大修', project: '高铁站交通枢纽', date: '2026-07-19', cost: 3000, content: '设备例行保养检修' },
    { id: 'em2260', equipment: '物料提升机', type: '日常保养', project: '高铁站交通枢纽', date: '2026-07-19', cost: 7000, content: '设备例行保养检修' },
    { id: 'em2261', equipment: '物料提升机', type: '日常保养', project: '城北新区道路改造', date: '2026-07-20', cost: 4500, content: '设备例行保养检修' },
    { id: 'em2262', equipment: '压路机', type: '定期保养', project: '城北新区道路改造', date: '2026-07-20', cost: 8500, content: '设备例行保养检修' },
    { id: 'em2263', equipment: '压路机', type: '定期保养', project: '城南商业综合体', date: '2026-07-21', cost: 6000, content: '设备例行保养检修' },
    { id: 'em2264', equipment: '装载机', type: '大修', project: '城南商业综合体', date: '2026-07-21', cost: 10000, content: '设备例行保养检修' },
    { id: 'em2265', equipment: '装载机', type: '大修', project: '城北学校扩建工程', date: '2026-07-22', cost: 7500, content: '设备例行保养检修' },
    { id: 'em2266', equipment: '盾构机', type: '日常保养', project: '城北学校扩建工程', date: '2026-07-22', cost: 11500, content: '设备例行保养检修' },
    { id: 'em2267', equipment: '盾构机', type: '日常保养', project: '滨江景观带工程', date: '2026-07-23', cost: 9000, content: '设备例行保养检修' },
    { id: 'em2268', equipment: '平板运输车', type: '定期保养', project: '滨江景观带工程', date: '2026-07-23', cost: 13000, content: '设备例行保养检修' },
    { id: 'em2269', equipment: '平板运输车', type: '定期保养', project: '城东物流园工程', date: '2026-07-24', cost: 10500, content: '设备例行保养检修' },
    { id: 'em2270', equipment: '塔式起重机', type: '大修', project: '城东物流园工程', date: '2026-07-24', cost: 14500, content: '设备例行保养检修' },
  ];

  collections['equipmentRepairs'] = [
    { id: 'er1', project: '城南地铁站项目', equipment: '挖掘机', fault: '液压泵异响、动作无力', date: '2026-08-05', cost: 15000, status: '维修中' },
    { id: 'er2', project: '滨江大桥工程', equipment: '塔式起重机', fault: '回转机构故障', date: '2026-07-20', cost: 23000, status: '已修复' },
    { id: 'er1003', equipment: '汽车吊50t', fault: '发动机无法启动', project: '清河水库除险加固工程', date: '2026-07-02', cost: 10000, status: '维修中' },
    { id: 'er1007', equipment: '挖掘机', fault: '发动机无法启动', project: '南水北调支线渠系工程', date: '2026-07-03', cost: 5000, status: '维修中' },
    { id: 'er1015', equipment: '物料提升机', fault: '制动失灵', project: '城市防洪堤加固工程', date: '2026-07-04', cost: 14000, status: '待维修' },
    { id: 'er1021', equipment: '压路机', fault: '制动失灵', project: '流域综合治理工程', date: '2026-07-05', cost: 9000, status: '待维修' },
    { id: 'er1029', equipment: '平板运输车', fault: '液压系统异响', project: '农田水利灌溉工程', date: '2026-07-06', cost: 18000, status: '已修复' },
    { id: 'er1036', equipment: '塔式起重机', fault: '液压系统异响', project: '湿地公园水系工程', date: '2026-07-07', cost: 13000, status: '已修复' },
    { id: 'er1045', equipment: '混凝土搅拌车', fault: '回转机构故障', project: '污水处理厂升级工程', date: '2026-07-08', cost: 22000, status: '维修中' },
    { id: 'er1052', equipment: '混凝土泵车', fault: '回转机构故障', project: '跨河大桥水文监测站', date: '2026-07-09', cost: 17000, status: '维修中' },
    { id: 'er1061', equipment: '装载机', fault: '电路故障', project: '滨江生态廊道工程', date: '2026-07-10', cost: 26000, status: '待维修' },
    { id: 'er1068', equipment: '盾构机', fault: '电路故障', project: '灌区现代化改造工程', date: '2026-07-11', cost: 21000, status: '待维修' },
    { id: 'er1077', equipment: '汽车吊50t', fault: '发动机无法启动', project: '山区小型水库建设', date: '2026-07-12', cost: 5000, status: '已修复' },
    { id: 'er1095', equipment: '压路机', fault: '制动失灵', project: '地铁3号线二期土建', date: '2026-07-15', cost: 4000, status: '维修中' },
    { id: 'er1104', equipment: '平板运输车', fault: '液压系统异响', project: '高铁站交通枢纽', date: '2026-07-16', cost: 13000, status: '待维修' },
    { id: 'er1111', equipment: '塔式起重机', fault: '液压系统异响', project: '城北新区道路改造', date: '2026-07-17', cost: 8000, status: '待维修' },
    { id: 'er1120', equipment: '混凝土搅拌车', fault: '回转机构故障', project: '城南商业综合体', date: '2026-07-18', cost: 17000, status: '已修复' },
    { id: 'er1127', equipment: '混凝土泵车', fault: '回转机构故障', project: '城北学校扩建工程', date: '2026-07-19', cost: 12000, status: '已修复' },
    { id: 'er1136', equipment: '装载机', fault: '电路故障', project: '滨江景观带工程', date: '2026-07-20', cost: 21000, status: '维修中' },
    { id: 'er1143', equipment: '盾构机', fault: '电路故障', project: '城东物流园工程', date: '2026-07-21', cost: 16000, status: '维修中' },
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
    { id: 'gc1', project: '清河水库除险加固工程', name: '集团钢材集采框架合同', code: 'JC-2026-001', supplier: '恒信钢材集团', amount: 80000000, signDate: '2026-01-15' },
    { id: 'gc2', project: '南水北调支线渠系工程', name: '集团水泥集采框架合同', code: 'JC-2026-002', supplier: '华北建材有限公司', amount: 50000000, signDate: '2026-02-01' },
  ];

  collections['purchaseContracts'] = [
    { id: 'pc1', project: '城南地铁站项目', name: '城南地铁站钢筋采购合同', code: 'CGHT-2026-001', supplier: '恒信钢材集团', amount: 4200000, signDate: '2026-07-20', status: '履行中' },
    { id: 'pc2', project: '滨江大桥工程', name: '滨江大桥水泥采购合同', code: 'CGHT-2026-002', supplier: '华北建材有限公司', amount: 3600000, signDate: '2026-08-01', status: '已生效' },
  ];

  collections['rentalContracts'] = [
    { id: 'rc1', project: '城南地铁站项目', name: '城南地铁站塔吊租赁合同', code: 'ZLHT-2026-001', supplier: '安达机械租赁', equipment: '塔式起重机', amount: 480000, signDate: '2026-08-01' },
    { id: 'rc2', project: '滨江大桥工程', name: '滨江大桥汽车吊租赁合同', code: 'ZLHT-2026-002', supplier: '广丰设备租赁', equipment: '汽车吊50t', amount: 228000, signDate: '2026-07-15' },
  ];

  collections['subcontracts'] = [
    { id: 'sc1', name: '城南地铁站防水工程分包合同', code: 'FBHT-2026-001', team: '蓝天防水班组', amount: 2600000, project: '城南地铁站项目', signDate: '2026-07-01' },
    { id: 'sc2', name: '滨江大桥钢结构安装分包合同', code: 'FBHT-2026-002', team: '华安钢构班组', amount: 5800000, project: '滨江大桥工程', signDate: '2026-06-20' },
  ];

  collections['procurementReports'] = [
    { id: 'prr1', name: '2026年7月采购台账', type: '采购台账', date: '2026-07-31' , project: '清河水库除险加固工程' },
    { id: 'prr2', name: '2026年二季度物资价格表', type: '物资价格', date: '2026-06-30' , project: '清河水库除险加固工程' },
    { id: 'prr100', name: '清河水库除险加固工程采购台账', type: '采购台账', date: '2026-07-31', project: '清河水库除险加固工程' },
    { id: 'prr101', name: '清河水库除险加固工程物资价格表', type: '物资价格', date: '2026-06-30', project: '清河水库除险加固工程' },
    { id: 'prr102', name: '南水北调支线渠系工程采购台账', type: '采购台账', date: '2026-07-31', project: '南水北调支线渠系工程' },
    { id: 'prr103', name: '南水北调支线渠系工程物资价格表', type: '物资价格', date: '2026-06-30', project: '南水北调支线渠系工程' },
    { id: 'prr104', name: '城市防洪堤加固工程采购台账', type: '采购台账', date: '2026-07-31', project: '城市防洪堤加固工程' },
    { id: 'prr105', name: '城市防洪堤加固工程物资价格表', type: '物资价格', date: '2026-06-30', project: '城市防洪堤加固工程' },
    { id: 'prr106', name: '流域综合治理工程采购台账', type: '采购台账', date: '2026-07-31', project: '流域综合治理工程' },
    { id: 'prr107', name: '流域综合治理工程物资价格表', type: '物资价格', date: '2026-06-30', project: '流域综合治理工程' },
    { id: 'prr108', name: '农田水利灌溉工程采购台账', type: '采购台账', date: '2026-07-31', project: '农田水利灌溉工程' },
    { id: 'prr109', name: '农田水利灌溉工程物资价格表', type: '物资价格', date: '2026-06-30', project: '农田水利灌溉工程' },
    { id: 'prr110', name: '湿地公园水系工程采购台账', type: '采购台账', date: '2026-07-31', project: '湿地公园水系工程' },
    { id: 'prr111', name: '湿地公园水系工程物资价格表', type: '物资价格', date: '2026-06-30', project: '湿地公园水系工程' },
    { id: 'prr112', name: '污水处理厂升级工程采购台账', type: '采购台账', date: '2026-07-31', project: '污水处理厂升级工程' },
    { id: 'prr113', name: '污水处理厂升级工程物资价格表', type: '物资价格', date: '2026-06-30', project: '污水处理厂升级工程' },
    { id: 'prr114', name: '跨河大桥水文监测站采购台账', type: '采购台账', date: '2026-07-31', project: '跨河大桥水文监测站' },
    { id: 'prr115', name: '跨河大桥水文监测站物资价格表', type: '物资价格', date: '2026-06-30', project: '跨河大桥水文监测站' },
    { id: 'prr116', name: '滨江生态廊道工程采购台账', type: '采购台账', date: '2026-07-31', project: '滨江生态廊道工程' },
    { id: 'prr117', name: '滨江生态廊道工程物资价格表', type: '物资价格', date: '2026-06-30', project: '滨江生态廊道工程' },
    { id: 'prr118', name: '灌区现代化改造工程采购台账', type: '采购台账', date: '2026-07-31', project: '灌区现代化改造工程' },
    { id: 'prr119', name: '灌区现代化改造工程物资价格表', type: '物资价格', date: '2026-06-30', project: '灌区现代化改造工程' },
    { id: 'prr120', name: '山区小型水库建设采购台账', type: '采购台账', date: '2026-07-31', project: '山区小型水库建设' },
    { id: 'prr121', name: '山区小型水库建设物资价格表', type: '物资价格', date: '2026-06-30', project: '山区小型水库建设' },
    { id: 'prr122', name: '城南地铁站项目采购台账', type: '采购台账', date: '2026-07-31', project: '城南地铁站项目' },
    { id: 'prr123', name: '城南地铁站项目物资价格表', type: '物资价格', date: '2026-06-30', project: '城南地铁站项目' },
    { id: 'prr124', name: '滨江大桥工程采购台账', type: '采购台账', date: '2026-07-31', project: '滨江大桥工程' },
    { id: 'prr125', name: '滨江大桥工程物资价格表', type: '物资价格', date: '2026-06-30', project: '滨江大桥工程' },
    { id: 'prr126', name: '地铁3号线二期土建采购台账', type: '采购台账', date: '2026-07-31', project: '地铁3号线二期土建' },
    { id: 'prr127', name: '地铁3号线二期土建物资价格表', type: '物资价格', date: '2026-06-30', project: '地铁3号线二期土建' },
    { id: 'prr128', name: '高铁站交通枢纽采购台账', type: '采购台账', date: '2026-07-31', project: '高铁站交通枢纽' },
    { id: 'prr129', name: '高铁站交通枢纽物资价格表', type: '物资价格', date: '2026-06-30', project: '高铁站交通枢纽' },
    { id: 'prr130', name: '城北新区道路改造采购台账', type: '采购台账', date: '2026-07-31', project: '城北新区道路改造' },
    { id: 'prr131', name: '城北新区道路改造物资价格表', type: '物资价格', date: '2026-06-30', project: '城北新区道路改造' },
    { id: 'prr132', name: '城南商业综合体采购台账', type: '采购台账', date: '2026-07-31', project: '城南商业综合体' },
    { id: 'prr133', name: '城南商业综合体物资价格表', type: '物资价格', date: '2026-06-30', project: '城南商业综合体' },
    { id: 'prr134', name: '城北学校扩建工程采购台账', type: '采购台账', date: '2026-07-31', project: '城北学校扩建工程' },
    { id: 'prr135', name: '城北学校扩建工程物资价格表', type: '物资价格', date: '2026-06-30', project: '城北学校扩建工程' },
    { id: 'prr136', name: '滨江景观带工程采购台账', type: '采购台账', date: '2026-07-31', project: '滨江景观带工程' },
    { id: 'prr137', name: '滨江景观带工程物资价格表', type: '物资价格', date: '2026-06-30', project: '滨江景观带工程' },
    { id: 'prr138', name: '城东物流园工程采购台账', type: '采购台账', date: '2026-07-31', project: '城东物流园工程' },
    { id: 'prr139', name: '城东物流园工程物资价格表', type: '物资价格', date: '2026-06-30', project: '城东物流园工程' },
  ];

  // 采购计划
  collections['procurementPlans'] = [
    { id: 'pp1', name: '清河水库三季度钢材采购计划', project: '清河水库除险加固工程', material: 'HRB400螺纹钢', spec: 'Φ12-Φ25', quantity: 1200, unit: '吨', budget: 4380000, planDate: '2026-08-01', owner: '王采购', status: '待审批' },
    { id: 'pp2', name: '南水北调支线水泥采购计划', project: '南水北调支线渠系工程', material: 'P.O42.5水泥', spec: '袋装', quantity: 3000, unit: '吨', budget: 1440000, planDate: '2026-08-05', owner: '王采购', status: '已批准' },
    { id: 'pp3', name: '流域治理格宾网箱采购计划', project: '流域综合治理工程', material: '格宾网箱', spec: '3m×1m×1m', quantity: 5000, unit: '套', budget: 7500000, planDate: '2026-07-20', owner: '李采购', status: '已批准' },
    { id: 'pp4', name: '农田水利灌溉PVC管采购计划', project: '农田水利灌溉工程', material: 'PVC排水管', spec: 'Φ110', quantity: 8000, unit: '米', budget: 320000, planDate: '2026-08-10', owner: '李采购', status: '草稿' },
    { id: 'pp5', name: '湿地公园景观石采购计划', project: '湿地公园水系工程', material: '景观石材', spec: '黄蜡石', quantity: 500, unit: '吨', budget: 250000, planDate: '2026-06-15', owner: '王采购', status: '已驳回' },
    { id: 'pp6', name: '城市防洪堤土工布采购计划', project: '城市防洪堤加固工程', material: '土工布', spec: '400g/㎡', quantity: 15000, unit: '㎡', budget: 270000, planDate: '2026-05-01', owner: '王采购', status: '已批准' },
  ];

  // 到货验收
  collections['purchaseReceipts'] = [
    { id: 'pr1', project: '南水北调支线渠系工程', receiptNo: 'YS-2026-001', orderCode: 'CG-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 200, unit: '吨', qualified: 198, unqualified: 2, inspector: '赵验收', date: '2026-08-05', remark: '少量结块，已退回', status: '部分合格' },
    { id: 'pr2', project: '清河水库除险加固工程', receiptNo: 'YS-2026-002', orderCode: 'CG-2026-002', supplier: '恒信钢材集团', material: 'HRB400螺纹钢', quantity: 80, unit: '吨', qualified: 80, unqualified: 0, inspector: '赵验收', date: '2026-08-18', remark: '质量合格，材质单齐全', status: '验收合格' },
    { id: 'pr3', project: '清河水库除险加固工程', receiptNo: 'YS-2026-003', orderCode: 'CG-2026-003', supplier: '恒信钢材集团', material: 'HRB400螺纹钢', quantity: 200, unit: '吨', qualified: 0, unqualified: 0, inspector: '赵验收', date: '2026-08-20', remark: '待实验室检测', status: '待验收' },
    { id: 'pr4', project: '城南地铁站项目', receiptNo: 'YS-2026-004', orderCode: 'CG-2026-004', supplier: '北方机械租赁', material: '塔式起重机', quantity: 2, unit: '台', qualified: 2, unqualified: 0, inspector: '孙验收', date: '2026-07-28', remark: '设备状态良好', status: '验收合格' },
    { id: 'pr5', project: '滨江大桥工程', receiptNo: 'YS-2026-005', orderCode: 'CG-2026-005', supplier: '华安钢构', material: '钢结构构件', quantity: 500, unit: '吨', qualified: 460, unqualified: 40, inspector: '孙验收', date: '2026-08-12', remark: '部分构件尺寸偏差超限，已拒收', status: '部分合格' },
  ];

  // 供应商评价
  collections['supplierEvaluations'] = [
    { id: 'se1', supplier: '恒信钢材集团', project: '清河水库除险加固工程', qualityScore: 92, deliveryScore: 88, priceScore: 80, serviceScore: 85, date: '2026-07-31', content: '钢材质量稳定，交货及时，价格略高', result: 'A级-优秀' },
    { id: 'se2', supplier: '华北建材有限公司', project: '南水北调支线渠系工程', qualityScore: 85, deliveryScore: 90, priceScore: 82, serviceScore: 80, date: '2026-07-31', content: '水泥供应稳定，部分批次有结块', result: 'B级-良好' },
    { id: 'se3', supplier: '华安钢构', project: '滨江大桥工程', qualityScore: 70, deliveryScore: 75, priceScore: 78, serviceScore: 72, date: '2026-06-30', content: '构件质量波动较大，需加强出厂检验', result: 'C级-合格' },
    { id: 'se4', supplier: '北方机械租赁', project: '流域综合治理工程', qualityScore: 88, deliveryScore: 92, priceScore: 75, serviceScore: 86, date: '2026-06-30', content: '设备状态良好，调度响应快', result: 'B级-良好' },
    { id: 'se2145', supplier: '水利材料厂', project: '清河水库除险加固工程', qualityScore: 84, deliveryScore: 82, priceScore: 78, serviceScore: 81, date: '2026-07-31', content: '清河水库除险加固工程采购供应评价', result: 'B级-良好' },
    { id: 'se2146', supplier: '安达机械租赁', project: '南水北调支线渠系工程', qualityScore: 89, deliveryScore: 88, priceScore: 82, serviceScore: 86, date: '2026-07-31', content: '南水北调支线渠系工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2147', supplier: '监测设备公司', project: '城市防洪堤加固工程', qualityScore: 85, deliveryScore: 87, priceScore: 78, serviceScore: 85, date: '2026-07-31', content: '城市防洪堤加固工程采购供应评价', result: 'B级-良好' },
    { id: 'se2148', supplier: '华源水泥集团', project: '城市防洪堤加固工程', qualityScore: 94, deliveryScore: 94, priceScore: 86, serviceScore: 91, date: '2026-07-31', content: '城市防洪堤加固工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2149', supplier: '华北建材有限公司', project: '流域综合治理工程', qualityScore: 99, deliveryScore: 75, priceScore: 90, serviceScore: 96, date: '2026-07-31', content: '流域综合治理工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2150', supplier: '恒信钢材集团', project: '农田水利灌溉工程', qualityScore: 95, deliveryScore: 99, priceScore: 86, serviceScore: 95, date: '2026-07-31', content: '农田水利灌溉工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2151', supplier: '监测设备公司', project: '农田水利灌溉工程', qualityScore: 79, deliveryScore: 81, priceScore: 94, serviceScore: 76, date: '2026-07-31', content: '农田水利灌溉工程采购供应评价', result: 'B级-良好' },
    { id: 'se2152', supplier: '水利材料厂', project: '湿地公园水系工程', qualityScore: 75, deliveryScore: 80, priceScore: 90, serviceScore: 75, date: '2026-07-31', content: '湿地公园水系工程采购供应评价', result: 'B级-良好' },
    { id: 'se2153', supplier: '广丰设备租赁', project: '湿地公园水系工程', qualityScore: 84, deliveryScore: 87, priceScore: 70, serviceScore: 81, date: '2026-07-31', content: '湿地公园水系工程采购供应评价', result: 'B级-良好' },
    { id: 'se2154', supplier: '安达机械租赁', project: '污水处理厂升级工程', qualityScore: 80, deliveryScore: 86, priceScore: 94, serviceScore: 80, date: '2026-07-31', content: '污水处理厂升级工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2155', supplier: '恒信钢材集团', project: '污水处理厂升级工程', qualityScore: 89, deliveryScore: 93, priceScore: 74, serviceScore: 86, date: '2026-07-31', content: '污水处理厂升级工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2156', supplier: '华源水泥集团', project: '跨河大桥水文监测站', qualityScore: 85, deliveryScore: 92, priceScore: 70, serviceScore: 85, date: '2026-07-31', content: '跨河大桥水文监测站采购供应评价', result: 'B级-良好' },
    { id: 'se2157', supplier: '水利材料厂', project: '跨河大桥水文监测站', qualityScore: 94, deliveryScore: 99, priceScore: 78, serviceScore: 91, date: '2026-07-31', content: '跨河大桥水文监测站采购供应评价', result: 'A级-优秀' },
    { id: 'se2158', supplier: '华北建材有限公司', project: '滨江生态廊道工程', qualityScore: 90, deliveryScore: 98, priceScore: 74, serviceScore: 90, date: '2026-07-31', content: '滨江生态廊道工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2159', supplier: '安达机械租赁', project: '滨江生态廊道工程', qualityScore: 99, deliveryScore: 80, priceScore: 82, serviceScore: 96, date: '2026-07-31', content: '滨江生态廊道工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2160', supplier: '监测设备公司', project: '灌区现代化改造工程', qualityScore: 95, deliveryScore: 79, priceScore: 78, serviceScore: 95, date: '2026-07-31', content: '灌区现代化改造工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2161', supplier: '华源水泥集团', project: '灌区现代化改造工程', qualityScore: 79, deliveryScore: 86, priceScore: 86, serviceScore: 76, date: '2026-07-31', content: '灌区现代化改造工程采购供应评价', result: 'B级-良好' },
    { id: 'se2162', supplier: '广丰设备租赁', project: '山区小型水库建设', qualityScore: 75, deliveryScore: 85, priceScore: 82, serviceScore: 75, date: '2026-07-31', content: '山区小型水库建设采购供应评价', result: 'B级-良好' },
    { id: 'se2163', supplier: '华北建材有限公司', project: '山区小型水库建设', qualityScore: 84, deliveryScore: 92, priceScore: 90, serviceScore: 81, date: '2026-07-31', content: '山区小型水库建设采购供应评价', result: 'A级-优秀' },
    { id: 'se2164', supplier: '恒信钢材集团', project: '城南地铁站项目', qualityScore: 80, deliveryScore: 91, priceScore: 86, serviceScore: 80, date: '2026-07-31', content: '城南地铁站项目采购供应评价', result: 'B级-良好' },
    { id: 'se2165', supplier: '监测设备公司', project: '城南地铁站项目', qualityScore: 89, deliveryScore: 98, priceScore: 94, serviceScore: 86, date: '2026-07-31', content: '城南地铁站项目采购供应评价', result: 'A级-优秀' },
    { id: 'se2166', supplier: '广丰设备租赁', project: '滨江大桥工程', qualityScore: 94, deliveryScore: 79, priceScore: 70, serviceScore: 91, date: '2026-07-31', content: '滨江大桥工程采购供应评价', result: 'B级-良好' },
    { id: 'se2167', supplier: '安达机械租赁', project: '地铁3号线二期土建', qualityScore: 90, deliveryScore: 78, priceScore: 94, serviceScore: 90, date: '2026-07-31', content: '地铁3号线二期土建采购供应评价', result: 'A级-优秀' },
    { id: 'se2168', supplier: '恒信钢材集团', project: '地铁3号线二期土建', qualityScore: 99, deliveryScore: 85, priceScore: 74, serviceScore: 96, date: '2026-07-31', content: '地铁3号线二期土建采购供应评价', result: 'A级-优秀' },
    { id: 'se2169', supplier: '华源水泥集团', project: '高铁站交通枢纽', qualityScore: 95, deliveryScore: 84, priceScore: 70, serviceScore: 95, date: '2026-07-31', content: '高铁站交通枢纽采购供应评价', result: 'A级-优秀' },
    { id: 'se2170', supplier: '水利材料厂', project: '高铁站交通枢纽', qualityScore: 79, deliveryScore: 91, priceScore: 78, serviceScore: 76, date: '2026-07-31', content: '高铁站交通枢纽采购供应评价', result: 'B级-良好' },
    { id: 'se2171', supplier: '华北建材有限公司', project: '城北新区道路改造', qualityScore: 75, deliveryScore: 90, priceScore: 74, serviceScore: 75, date: '2026-07-31', content: '城北新区道路改造采购供应评价', result: 'B级-良好' },
    { id: 'se2172', supplier: '安达机械租赁', project: '城北新区道路改造', qualityScore: 84, deliveryScore: 97, priceScore: 82, serviceScore: 81, date: '2026-07-31', content: '城北新区道路改造采购供应评价', result: 'A级-优秀' },
    { id: 'se2173', supplier: '监测设备公司', project: '城南商业综合体', qualityScore: 80, deliveryScore: 96, priceScore: 78, serviceScore: 80, date: '2026-07-31', content: '城南商业综合体采购供应评价', result: 'B级-良好' },
    { id: 'se2174', supplier: '华源水泥集团', project: '城南商业综合体', qualityScore: 89, deliveryScore: 78, priceScore: 86, serviceScore: 86, date: '2026-07-31', content: '城南商业综合体采购供应评价', result: 'B级-良好' },
    { id: 'se2175', supplier: '广丰设备租赁', project: '城北学校扩建工程', qualityScore: 85, deliveryScore: 77, priceScore: 82, serviceScore: 85, date: '2026-07-31', content: '城北学校扩建工程采购供应评价', result: 'B级-良好' },
    { id: 'se2176', supplier: '华北建材有限公司', project: '城北学校扩建工程', qualityScore: 94, deliveryScore: 84, priceScore: 90, serviceScore: 91, date: '2026-07-31', content: '城北学校扩建工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2177', supplier: '恒信钢材集团', project: '滨江景观带工程', qualityScore: 90, deliveryScore: 83, priceScore: 86, serviceScore: 90, date: '2026-07-31', content: '滨江景观带工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2178', supplier: '监测设备公司', project: '滨江景观带工程', qualityScore: 99, deliveryScore: 90, priceScore: 94, serviceScore: 96, date: '2026-07-31', content: '滨江景观带工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2179', supplier: '水利材料厂', project: '城东物流园工程', qualityScore: 95, deliveryScore: 89, priceScore: 90, serviceScore: 95, date: '2026-07-31', content: '城东物流园工程采购供应评价', result: 'A级-优秀' },
    { id: 'se2180', supplier: '广丰设备租赁', project: '城东物流园工程', qualityScore: 79, deliveryScore: 96, priceScore: 70, serviceScore: 76, date: '2026-07-31', content: '城东物流园工程采购供应评价', result: 'B级-良好' },
  ];

  // 分包管理
  collections['subcontractOverview'] = [
    { id: 'so1', name: '2026年三季度分包管理汇总', type: '汇总报表', date: '2026-08-31' },
  ];
  collections['laborSubcontractors'] = [
    { id: 'ls1', project: '清河水库除险加固工程', name: '金城建筑劳务有限公司', code: 'LW-001', legalPerson: '金大成', phone: '13800001111', workType: '钢筋工', workerCount: 80, qualification: '劳务分包资质', status: '合作中' },
    { id: 'ls2', project: '流域综合治理工程', name: '恒通模板工程队', code: 'LW-002', legalPerson: '王恒', phone: '13800002222', workType: '木工', workerCount: 45, qualification: '劳务分包资质', status: '合作中' },
    { id: 'ls3', project: '城市防洪堤加固工程', name: '蓝天砌筑劳务队', code: 'LW-003', legalPerson: '张蓝天', phone: '13800003333', workType: '砌筑工', workerCount: 60, qualification: '三级', status: '合作中' },
    { id: 'ls4', project: '南水北调支线渠系工程', name: '众诚综合劳务公司', code: 'LW-004', legalPerson: '李众', phone: '13800004444', workType: '综合', workerCount: 120, qualification: '一级', status: '暂停合作' },
    { id: 'ls2273', name: '明宇防水工程公司', code: 'LW-100', legalPerson: '负责人', phone: '13800001000', project: '清河水库除险加固工程', workType: '木工', workerCount: 35, qualification: '一级', status: '合作中' },
    { id: 'ls2274', name: '华安钢结构工程有限公司', code: 'LW-103', legalPerson: '负责人', phone: '13800001003', project: '流域综合治理工程', workType: '综合', workerCount: 56, qualification: '一级', status: '合作中' },
    { id: 'ls2275', name: '永固桩基工程公司', code: 'LW-104', legalPerson: '负责人', phone: '13800001004', project: '农田水利灌溉工程', workType: '综合', workerCount: 58, qualification: '一级', status: '合作中' },
    { id: 'ls2276', name: '蓝天幕墙装饰公司', code: 'LW-105', legalPerson: '负责人', phone: '13800001005', project: '湿地公园水系工程', workType: '钢筋工', workerCount: 65, qualification: '一级', status: '合作中' },
  ];
  collections['proSubcontractors'] = [
    { id: 'ps1', project: '滨江大桥工程', name: '华安钢结构工程有限公司', code: 'ZY-001', legalPerson: '刘华安', phone: '13900001111', category: '钢结构', qualification: '一级', licenseNo: 'D12345678', status: '合作中' },
    { id: 'ps2', project: '清河水库除险加固工程', name: '永固桩基工程公司', code: 'ZY-002', legalPerson: '赵永固', phone: '13900002222', category: '桩基', qualification: '一级', licenseNo: 'D23456789', status: '合作中' },
    { id: 'ps3', project: '农田水利灌溉工程', name: '明宇防水工程公司', code: 'ZY-003', legalPerson: '孙明宇', phone: '13900003333', category: '防水防腐', qualification: '二级', licenseNo: 'D34567890', status: '合作中' },
    { id: 'ps4', project: '湿地公园水系工程', name: '蓝天幕墙装饰公司', code: 'ZY-004', legalPerson: '周蓝天', phone: '13900004444', category: '幕墙', qualification: '二级', licenseNo: 'D45678901', status: '已终止' },
    { id: 'ps2277', name: '蓝天砌筑劳务队', code: 'ZY-100', legalPerson: '负责人', phone: '13900002000', project: '清河水库除险加固工程', category: '钢结构', qualification: '一级', licenseNo: 'D3000', status: '合作中' },
    { id: 'ps2278', name: '恒通模板工程队', code: 'ZY-103', legalPerson: '负责人', phone: '13900002003', project: '流域综合治理工程', category: '机电安装', qualification: '一级', licenseNo: 'D3003', status: '合作中' },
    { id: 'ps2279', name: '众诚综合劳务公司', code: 'ZY-105', legalPerson: '负责人', phone: '13900002005', project: '湿地公园水系工程', category: '钢结构', qualification: '一级', licenseNo: 'D3005', status: '合作中' },
    { id: 'ps2280', name: '金城建筑劳务有限公司', code: 'ZY-106', legalPerson: '负责人', phone: '13900002006', project: '污水处理厂升级工程', category: '防水防腐', qualification: '一级', licenseNo: 'D3006', status: '合作中' },
  ];
  collections['laborContracts'] = [
    { id: 'lc1', name: '清河水库主体劳务分包合同', code: 'LWB-2026-001', subcontractor: '金城建筑劳务有限公司', project: '清河水库除险加固工程', workType: '钢筋工', workerCount: 80, amount: 3600000, payRatio: 80, signDate: '2026-03-01', endDate: '2026-11-30', status: '履行中' },
    { id: 'lc2', name: '流域治理模板劳务分包合同', code: 'LWB-2026-002', subcontractor: '恒通模板工程队', project: '流域综合治理工程', workType: '木工', workerCount: 45, amount: 2100000, payRatio: 70, signDate: '2026-04-15', endDate: '2026-12-31', status: '履行中' },
    { id: 'lc3', name: '防洪堤砌筑劳务分包合同', code: 'LWB-2026-003', subcontractor: '蓝天砌筑劳务队', project: '城市防洪堤加固工程', workType: '砌筑工', workerCount: 60, amount: 1850000, payRatio: 90, signDate: '2026-02-10', endDate: '2026-08-31', status: '已完工' },
    { id: 'lc4', name: '支线渠系综合劳务分包合同', code: 'LWB-2026-004', subcontractor: '众诚综合劳务公司', project: '南水北调支线渠系工程', workType: '综合', workerCount: 120, amount: 5200000, payRatio: 60, signDate: '2026-05-01', endDate: '2027-06-30', status: '履行中' },
    { id: 'lc1005', name: '南水北调支线渠系工程劳务分包合同2', code: 'LWB-2026-106', subcontractor: '金城建筑劳务有限公司', project: '南水北调支线渠系工程', workType: '砌筑工', workerCount: 58, amount: 1380000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已完工' },
    { id: 'lc1018', name: '流域综合治理工程劳务分包合同2', code: 'LWB-2026-116', subcontractor: '华安钢结构工程有限公司', project: '流域综合治理工程', workType: '综合', workerCount: 80, amount: 2120000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已生效' },
    { id: 'lc1033', name: '湿地公园水系工程劳务分包合同2', code: 'LWB-2026-126', subcontractor: '永固桩基工程公司', project: '湿地公园水系工程', workType: '木工', workerCount: 102, amount: 2860000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '履行中' },
    { id: 'lc1040', name: '污水处理厂升级工程劳务分包合同1', code: 'LWB-2026-130', subcontractor: '蓝天砌筑劳务队', project: '污水处理厂升级工程', workType: '木工', workerCount: 106, amount: 3020000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '履行中' },
    { id: 'lc1049', name: '跨河大桥水文监测站劳务分包合同2', code: 'LWB-2026-136', subcontractor: '蓝天砌筑劳务队', project: '跨河大桥水文监测站', workType: '混凝土工', workerCount: 124, amount: 3600000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已完工' },
    { id: 'lc1056', name: '滨江生态廊道工程劳务分包合同1', code: 'LWB-2026-140', subcontractor: '金城建筑劳务有限公司', project: '滨江生态廊道工程', workType: '混凝土工', workerCount: 128, amount: 3760000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已完工' },
    { id: 'lc1065', name: '灌区现代化改造工程劳务分包合同2', code: 'LWB-2026-146', subcontractor: '金城建筑劳务有限公司', project: '灌区现代化改造工程', workType: '钢筋工', workerCount: 56, amount: 4340000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已生效' },
    { id: 'lc1072', name: '山区小型水库建设劳务分包合同1', code: 'LWB-2026-150', subcontractor: '华安钢结构工程有限公司', project: '山区小型水库建设', workType: '钢筋工', workerCount: 60, amount: 4500000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已生效' },
    { id: 'lc1081', name: '城南地铁站项目劳务分包合同2', code: 'LWB-2026-156', subcontractor: '华安钢结构工程有限公司', project: '城南地铁站项目', workType: '砌筑工', workerCount: 78, amount: 5080000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '履行中' },
    { id: 'lc1092', name: '地铁3号线二期土建劳务分包合同2', code: 'LWB-2026-166', subcontractor: '永固桩基工程公司', project: '地铁3号线二期土建', workType: '综合', workerCount: 100, amount: 5820000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已完工' },
    { id: 'lc1099', name: '高铁站交通枢纽劳务分包合同1', code: 'LWB-2026-170', subcontractor: '蓝天砌筑劳务队', project: '高铁站交通枢纽', workType: '综合', workerCount: 104, amount: 5980000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已完工' },
    { id: 'lc1108', name: '城北新区道路改造劳务分包合同2', code: 'LWB-2026-176', subcontractor: '蓝天砌筑劳务队', project: '城北新区道路改造', workType: '木工', workerCount: 122, amount: 1360000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已生效' },
    { id: 'lc1115', name: '城南商业综合体劳务分包合同1', code: 'LWB-2026-180', subcontractor: '金城建筑劳务有限公司', project: '城南商业综合体', workType: '木工', workerCount: 126, amount: 1520000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已生效' },
    { id: 'lc1124', name: '城北学校扩建工程劳务分包合同2', code: 'LWB-2026-186', subcontractor: '金城建筑劳务有限公司', project: '城北学校扩建工程', workType: '混凝土工', workerCount: 54, amount: 2100000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '履行中' },
    { id: 'lc1131', name: '滨江景观带工程劳务分包合同1', code: 'LWB-2026-190', subcontractor: '华安钢结构工程有限公司', project: '滨江景观带工程', workType: '混凝土工', workerCount: 58, amount: 2260000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '履行中' },
    { id: 'lc1140', name: '城东物流园工程劳务分包合同2', code: 'LWB-2026-196', subcontractor: '华安钢结构工程有限公司', project: '城东物流园工程', workType: '钢筋工', workerCount: 76, amount: 2840000, payRatio: 70, signDate: '2026-03-01', endDate: '2026-11-30', status: '已完工' },
  ];
  collections['proContracts'] = [
    { id: 'pc1', name: '滨江大桥钢结构制作安装合同', code: 'ZYB-2026-001', subcontractor: '华安钢结构工程有限公司', project: '滨江大桥工程', category: '钢结构', amount: 5800000, payRatio: 75, signDate: '2026-02-20', endDate: '2026-12-31', status: '履行中' },
    { id: 'pc2', name: '水库大坝桩基工程专业分包合同', code: 'ZYB-2026-002', subcontractor: '永固桩基工程公司', project: '清河水库除险加固工程', category: '桩基', amount: 3200000, payRatio: 80, signDate: '2026-03-10', endDate: '2026-09-30', status: '履行中' },
    { id: 'pc3', name: '闸站防水防腐工程专业分包合同', code: 'ZYB-2026-003', subcontractor: '明宇防水工程公司', project: '农田水利灌溉工程', category: '防水防腐', amount: 980000, payRatio: 90, signDate: '2026-04-01', endDate: '2026-08-31', status: '已完工' },
    { id: 'pc1011', name: '城市防洪堤加固工程专业分包合同2', code: 'ZYB-2026-111', subcontractor: '众诚综合劳务公司', project: '城市防洪堤加固工程', category: '幕墙', amount: 1750000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '履行中' },
    { id: 'pc1025', name: '农田水利灌溉工程专业分包合同2', code: 'ZYB-2026-121', subcontractor: '恒通模板工程队', project: '农田水利灌溉工程', category: '桩基', amount: 2490000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已完工' },
    { id: 'pc1032', name: '湿地公园水系工程专业分包合同1', code: 'ZYB-2026-125', subcontractor: '蓝天幕墙装饰公司', project: '湿地公园水系工程', category: '桩基', amount: 2650000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已完工' },
    { id: 'pc1041', name: '污水处理厂升级工程专业分包合同2', code: 'ZYB-2026-131', subcontractor: '蓝天幕墙装饰公司', project: '污水处理厂升级工程', category: '防水防腐', amount: 3230000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已生效' },
    { id: 'pc1048', name: '跨河大桥水文监测站专业分包合同1', code: 'ZYB-2026-135', subcontractor: '明宇防水工程公司', project: '跨河大桥水文监测站', category: '防水防腐', amount: 3390000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已生效' },
    { id: 'pc1057', name: '滨江生态廊道工程专业分包合同2', code: 'ZYB-2026-141', subcontractor: '明宇防水工程公司', project: '滨江生态廊道工程', category: '机电安装', amount: 3970000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '履行中' },
    { id: 'pc1064', name: '灌区现代化改造工程专业分包合同1', code: 'ZYB-2026-145', subcontractor: '众诚综合劳务公司', project: '灌区现代化改造工程', category: '机电安装', amount: 4130000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '履行中' },
    { id: 'pc1073', name: '山区小型水库建设专业分包合同2', code: 'ZYB-2026-151', subcontractor: '众诚综合劳务公司', project: '山区小型水库建设', category: '钢结构', amount: 4710000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已完工' },
    { id: 'pc1080', name: '城南地铁站项目专业分包合同1', code: 'ZYB-2026-155', subcontractor: '恒通模板工程队', project: '城南地铁站项目', category: '钢结构', amount: 4870000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已完工' },
    { id: 'pc1086', name: '滨江大桥工程专业分包合同2', code: 'ZYB-2026-161', subcontractor: '恒通模板工程队', project: '滨江大桥工程', category: '幕墙', amount: 5450000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已生效' },
    { id: 'pc1091', name: '地铁3号线二期土建专业分包合同1', code: 'ZYB-2026-165', subcontractor: '蓝天幕墙装饰公司', project: '地铁3号线二期土建', category: '幕墙', amount: 5610000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已生效' },
    { id: 'pc1100', name: '高铁站交通枢纽专业分包合同2', code: 'ZYB-2026-171', subcontractor: '蓝天幕墙装饰公司', project: '高铁站交通枢纽', category: '桩基', amount: 990000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '履行中' },
    { id: 'pc1107', name: '城北新区道路改造专业分包合同1', code: 'ZYB-2026-175', subcontractor: '明宇防水工程公司', project: '城北新区道路改造', category: '桩基', amount: 1150000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '履行中' },
    { id: 'pc1116', name: '城南商业综合体专业分包合同2', code: 'ZYB-2026-181', subcontractor: '明宇防水工程公司', project: '城南商业综合体', category: '防水防腐', amount: 1730000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已完工' },
    { id: 'pc1123', name: '城北学校扩建工程专业分包合同1', code: 'ZYB-2026-185', subcontractor: '众诚综合劳务公司', project: '城北学校扩建工程', category: '防水防腐', amount: 1890000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已完工' },
    { id: 'pc1132', name: '滨江景观带工程专业分包合同2', code: 'ZYB-2026-191', subcontractor: '众诚综合劳务公司', project: '滨江景观带工程', category: '机电安装', amount: 2470000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已生效' },
    { id: 'pc1139', name: '城东物流园工程专业分包合同1', code: 'ZYB-2026-195', subcontractor: '恒通模板工程队', project: '城东物流园工程', category: '机电安装', amount: 2630000, payRatio: 75, signDate: '2026-03-10', endDate: '2026-12-31', status: '已生效' },
  ];
  collections['subcontractChanges'] = [
    { id: 'sch1', name: '清河水库劳务合同人员增补变更', code: 'BG-2026-001', contract: 'LWB-2026-001', project: '清河水库除险加固工程', reason: '施工高峰期劳动力增补', amount: 350000, date: '2026-07-10', status: '已批准' },
    { id: 'sch2', name: '滨江大桥钢构工程量变更', code: 'BG-2026-002', contract: 'ZYB-2026-001', project: '滨江大桥工程', reason: '设计变更增加工程量', amount: 460000, date: '2026-07-20', status: '待审批' },
    { id: 'sch3', name: '桩基工程桩长调整变更', code: 'BG-2026-003', contract: 'ZYB-2026-002', project: '清河水库除险加固工程', reason: '地质条件变化调整桩长', amount: 180000, date: '2026-08-01', status: '待审批' },
    { id: 'sch2072', name: '南水北调支线渠系工程工程量变更1', code: 'BG-2026-510', contract: 'LWB-2026-106', project: '南水北调支线渠系工程', reason: '地质条件变化', amount: 90000, date: '2026-02-10', status: '待审批' },
    { id: 'sch2073', name: '南水北调支线渠系工程工程量变更2', code: 'BG-2026-511', contract: 'LWB-2026-004', project: '南水北调支线渠系工程', reason: '材料代换', amount: 120000, date: '2026-02-10', status: '已驳回' },
    { id: 'sch2074', name: '城市防洪堤加固工程工程量变更1', code: 'BG-2026-520', contract: 'LWB-2026-003', project: '城市防洪堤加固工程', reason: '材料代换', amount: 130000, date: '2026-03-10', status: '已驳回' },
    { id: 'sch2075', name: '城市防洪堤加固工程工程量变更2', code: 'BG-2026-521', contract: 'ZYB-2026-111', project: '城市防洪堤加固工程', reason: '工期顺延', amount: 160000, date: '2026-03-10', status: '已批准' },
    { id: 'sch2076', name: '流域综合治理工程工程量变更1', code: 'BG-2026-530', contract: 'LWB-2026-116', project: '流域综合治理工程', reason: '工期顺延', amount: 170000, date: '2026-04-10', status: '已批准' },
    { id: 'sch2077', name: '流域综合治理工程工程量变更2', code: 'BG-2026-531', contract: 'LWB-2026-002', project: '流域综合治理工程', reason: '设计变更增加工程量', amount: 200000, date: '2026-04-10', status: '待审批' },
    { id: 'sch2078', name: '农田水利灌溉工程工程量变更1', code: 'BG-2026-540', contract: 'ZYB-2026-003', project: '农田水利灌溉工程', reason: '设计变更增加工程量', amount: 210000, date: '2026-05-10', status: '待审批' },
    { id: 'sch2079', name: '农田水利灌溉工程工程量变更2', code: 'BG-2026-541', contract: 'ZYB-2026-121', project: '农田水利灌溉工程', reason: '地质条件变化', amount: 240000, date: '2026-05-10', status: '已驳回' },
    { id: 'sch2080', name: '湿地公园水系工程工程量变更1', code: 'BG-2026-550', contract: 'ZYB-2026-125', project: '湿地公园水系工程', reason: '地质条件变化', amount: 250000, date: '2026-06-10', status: '已驳回' },
    { id: 'sch2081', name: '湿地公园水系工程工程量变更2', code: 'BG-2026-551', contract: 'LWB-2026-126', project: '湿地公园水系工程', reason: '材料代换', amount: 280000, date: '2026-06-10', status: '已批准' },
    { id: 'sch2082', name: '污水处理厂升级工程工程量变更1', code: 'BG-2026-560', contract: 'LWB-2026-130', project: '污水处理厂升级工程', reason: '材料代换', amount: 290000, date: '2026-07-10', status: '已批准' },
    { id: 'sch2083', name: '污水处理厂升级工程工程量变更2', code: 'BG-2026-561', contract: 'ZYB-2026-131', project: '污水处理厂升级工程', reason: '工期顺延', amount: 320000, date: '2026-07-10', status: '待审批' },
    { id: 'sch2084', name: '跨河大桥水文监测站工程量变更1', code: 'BG-2026-570', contract: 'ZYB-2026-135', project: '跨河大桥水文监测站', reason: '工期顺延', amount: 330000, date: '2026-08-10', status: '待审批' },
    { id: 'sch2085', name: '跨河大桥水文监测站工程量变更2', code: 'BG-2026-571', contract: 'LWB-2026-136', project: '跨河大桥水文监测站', reason: '设计变更增加工程量', amount: 360000, date: '2026-08-10', status: '已驳回' },
    { id: 'sch2086', name: '滨江生态廊道工程工程量变更1', code: 'BG-2026-580', contract: 'LWB-2026-140', project: '滨江生态廊道工程', reason: '设计变更增加工程量', amount: 370000, date: '2026-01-10', status: '已驳回' },
    { id: 'sch2087', name: '滨江生态廊道工程工程量变更2', code: 'BG-2026-581', contract: 'ZYB-2026-141', project: '滨江生态廊道工程', reason: '地质条件变化', amount: 400000, date: '2026-01-10', status: '已批准' },
    { id: 'sch2088', name: '灌区现代化改造工程工程量变更1', code: 'BG-2026-590', contract: 'ZYB-2026-145', project: '灌区现代化改造工程', reason: '地质条件变化', amount: 410000, date: '2026-02-10', status: '已批准' },
    { id: 'sch2089', name: '灌区现代化改造工程工程量变更2', code: 'BG-2026-591', contract: 'LWB-2026-146', project: '灌区现代化改造工程', reason: '材料代换', amount: 440000, date: '2026-02-10', status: '待审批' },
    { id: 'sch2090', name: '山区小型水库建设工程量变更1', code: 'BG-2026-600', contract: 'LWB-2026-150', project: '山区小型水库建设', reason: '材料代换', amount: 50000, date: '2026-03-10', status: '待审批' },
    { id: 'sch2091', name: '山区小型水库建设工程量变更2', code: 'BG-2026-601', contract: 'ZYB-2026-151', project: '山区小型水库建设', reason: '工期顺延', amount: 80000, date: '2026-03-10', status: '已驳回' },
    { id: 'sch2092', name: '城南地铁站项目工程量变更1', code: 'BG-2026-610', contract: 'ZYB-2026-155', project: '城南地铁站项目', reason: '工期顺延', amount: 90000, date: '2026-04-10', status: '已驳回' },
    { id: 'sch2093', name: '城南地铁站项目工程量变更2', code: 'BG-2026-611', contract: 'LWB-2026-156', project: '城南地铁站项目', reason: '设计变更增加工程量', amount: 120000, date: '2026-04-10', status: '已批准' },
    { id: 'sch2094', name: '滨江大桥工程工程量变更2', code: 'BG-2026-621', contract: 'ZYB-2026-161', project: '滨江大桥工程', reason: '地质条件变化', amount: 160000, date: '2026-05-10', status: '待审批' },
    { id: 'sch2095', name: '地铁3号线二期土建工程量变更1', code: 'BG-2026-630', contract: 'ZYB-2026-165', project: '地铁3号线二期土建', reason: '地质条件变化', amount: 170000, date: '2026-06-10', status: '待审批' },
    { id: 'sch2096', name: '地铁3号线二期土建工程量变更2', code: 'BG-2026-631', contract: 'LWB-2026-166', project: '地铁3号线二期土建', reason: '材料代换', amount: 200000, date: '2026-06-10', status: '已驳回' },
    { id: 'sch2097', name: '高铁站交通枢纽工程量变更1', code: 'BG-2026-640', contract: 'LWB-2026-170', project: '高铁站交通枢纽', reason: '材料代换', amount: 210000, date: '2026-07-10', status: '已驳回' },
    { id: 'sch2098', name: '高铁站交通枢纽工程量变更2', code: 'BG-2026-641', contract: 'ZYB-2026-171', project: '高铁站交通枢纽', reason: '工期顺延', amount: 240000, date: '2026-07-10', status: '已批准' },
    { id: 'sch2099', name: '城北新区道路改造工程量变更1', code: 'BG-2026-650', contract: 'ZYB-2026-175', project: '城北新区道路改造', reason: '工期顺延', amount: 250000, date: '2026-08-10', status: '已批准' },
    { id: 'sch2100', name: '城北新区道路改造工程量变更2', code: 'BG-2026-651', contract: 'LWB-2026-176', project: '城北新区道路改造', reason: '设计变更增加工程量', amount: 280000, date: '2026-08-10', status: '待审批' },
    { id: 'sch2101', name: '城南商业综合体工程量变更1', code: 'BG-2026-660', contract: 'LWB-2026-180', project: '城南商业综合体', reason: '设计变更增加工程量', amount: 290000, date: '2026-01-10', status: '待审批' },
    { id: 'sch2102', name: '城南商业综合体工程量变更2', code: 'BG-2026-661', contract: 'ZYB-2026-181', project: '城南商业综合体', reason: '地质条件变化', amount: 320000, date: '2026-01-10', status: '已驳回' },
    { id: 'sch2103', name: '城北学校扩建工程工程量变更1', code: 'BG-2026-670', contract: 'ZYB-2026-185', project: '城北学校扩建工程', reason: '地质条件变化', amount: 330000, date: '2026-02-10', status: '已驳回' },
    { id: 'sch2104', name: '城北学校扩建工程工程量变更2', code: 'BG-2026-671', contract: 'LWB-2026-186', project: '城北学校扩建工程', reason: '材料代换', amount: 360000, date: '2026-02-10', status: '已批准' },
    { id: 'sch2105', name: '滨江景观带工程工程量变更1', code: 'BG-2026-680', contract: 'LWB-2026-190', project: '滨江景观带工程', reason: '材料代换', amount: 370000, date: '2026-03-10', status: '已批准' },
    { id: 'sch2106', name: '滨江景观带工程工程量变更2', code: 'BG-2026-681', contract: 'ZYB-2026-191', project: '滨江景观带工程', reason: '工期顺延', amount: 400000, date: '2026-03-10', status: '待审批' },
    { id: 'sch2107', name: '城东物流园工程工程量变更1', code: 'BG-2026-690', contract: 'ZYB-2026-195', project: '城东物流园工程', reason: '工期顺延', amount: 410000, date: '2026-04-10', status: '待审批' },
    { id: 'sch2108', name: '城东物流园工程工程量变更2', code: 'BG-2026-691', contract: 'LWB-2026-196', project: '城东物流园工程', reason: '设计变更增加工程量', amount: 440000, date: '2026-04-10', status: '已驳回' },
  ];
  collections['subcontractSettlements'] = [
    { id: 'ss1', name: '清河水库主体劳务6月结算', code: 'JS-2026-001', contract: 'LWB-2026-001', subcontractor: '金城建筑劳务有限公司', project: '清河水库除险加固工程', amount: 420000, paidAmount: 420000, period: '2026-06', date: '2026-07-05', status: '已支付' },
    { id: 'ss2', name: '流域治理模板劳务7月结算', code: 'JS-2026-002', contract: 'LWB-2026-002', subcontractor: '恒通模板工程队', project: '流域综合治理工程', amount: 380000, paidAmount: 0, period: '2026-07', date: '2026-08-05', status: '已批准' },
    { id: 'ss3', name: '滨江大桥钢构首期结算', code: 'JS-2026-003', contract: 'ZYB-2026-001', subcontractor: '华安钢结构工程有限公司', project: '滨江大桥工程', amount: 1450000, paidAmount: 1000000, period: '2026-07', date: '2026-08-10', status: '已批准' },
    { id: 'ss4', name: '防洪堤砌筑劳务完工结算', code: 'JS-2026-004', contract: 'LWB-2026-003', subcontractor: '蓝天砌筑劳务队', project: '城市防洪堤加固工程', amount: 1850000, paidAmount: 1850000, period: '完工', date: '2026-08-15', status: '已支付' },
    { id: 'ss2000', name: '清河水库除险加固工程分包2期结算', code: 'JS-2026-301', contract: 'ZYB-2026-002', subcontractor: '永固桩基工程公司', project: '清河水库除险加固工程', amount: 390000, paidAmount: 234000, period: '2026-01', date: '2026-01-15', status: '已批准' },
    { id: 'ss2001', name: '南水北调支线渠系工程分包1期结算', code: 'JS-2026-310', contract: 'LWB-2026-106', subcontractor: '金城建筑劳务有限公司', project: '南水北调支线渠系工程', amount: 450000, paidAmount: 270000, period: '2026-02', date: '2026-02-15', status: '已批准' },
    { id: 'ss2002', name: '南水北调支线渠系工程分包2期结算', code: 'JS-2026-311', contract: 'LWB-2026-004', subcontractor: '众诚综合劳务公司', project: '南水北调支线渠系工程', amount: 540000, paidAmount: 540000, period: '2026-02', date: '2026-02-15', status: '待审批' },
    { id: 'ss2003', name: '城市防洪堤加固工程分包2期结算', code: 'JS-2026-321', contract: 'ZYB-2026-111', subcontractor: '众诚综合劳务公司', project: '城市防洪堤加固工程', amount: 690000, paidAmount: 414000, period: '2026-03', date: '2026-03-15', status: '已支付' },
    { id: 'ss2004', name: '流域综合治理工程分包2期结算', code: 'JS-2026-331', contract: 'LWB-2026-002', subcontractor: '恒通模板工程队', project: '流域综合治理工程', amount: 840000, paidAmount: 840000, period: '2026-04', date: '2026-04-15', status: '已批准' },
    { id: 'ss2005', name: '农田水利灌溉工程分包1期结算', code: 'JS-2026-340', contract: 'ZYB-2026-003', subcontractor: '明宇防水工程公司', project: '农田水利灌溉工程', amount: 900000, paidAmount: 900000, period: '2026-05', date: '2026-05-15', status: '已批准' },
    { id: 'ss2006', name: '农田水利灌溉工程分包2期结算', code: 'JS-2026-341', contract: 'ZYB-2026-121', subcontractor: '恒通模板工程队', project: '农田水利灌溉工程', amount: 990000, paidAmount: 594000, period: '2026-05', date: '2026-05-15', status: '待审批' },
    { id: 'ss2007', name: '湿地公园水系工程分包1期结算', code: 'JS-2026-350', contract: 'ZYB-2026-125', subcontractor: '蓝天幕墙装饰公司', project: '湿地公园水系工程', amount: 1050000, paidAmount: 630000, period: '2026-06', date: '2026-06-15', status: '待审批' },
    { id: 'ss2008', name: '湿地公园水系工程分包2期结算', code: 'JS-2026-351', contract: 'LWB-2026-126', subcontractor: '永固桩基工程公司', project: '湿地公园水系工程', amount: 1140000, paidAmount: 1140000, period: '2026-06', date: '2026-06-15', status: '已支付' },
    { id: 'ss2009', name: '污水处理厂升级工程分包1期结算', code: 'JS-2026-360', contract: 'LWB-2026-130', subcontractor: '蓝天砌筑劳务队', project: '污水处理厂升级工程', amount: 1200000, paidAmount: 1200000, period: '2026-07', date: '2026-07-15', status: '已支付' },
    { id: 'ss2010', name: '污水处理厂升级工程分包2期结算', code: 'JS-2026-361', contract: 'ZYB-2026-131', subcontractor: '蓝天幕墙装饰公司', project: '污水处理厂升级工程', amount: 1290000, paidAmount: 774000, period: '2026-07', date: '2026-07-15', status: '已批准' },
    { id: 'ss2011', name: '跨河大桥水文监测站分包1期结算', code: 'JS-2026-370', contract: 'ZYB-2026-135', subcontractor: '明宇防水工程公司', project: '跨河大桥水文监测站', amount: 1350000, paidAmount: 810000, period: '2026-08', date: '2026-08-15', status: '已批准' },
    { id: 'ss2012', name: '跨河大桥水文监测站分包2期结算', code: 'JS-2026-371', contract: 'LWB-2026-136', subcontractor: '蓝天砌筑劳务队', project: '跨河大桥水文监测站', amount: 1440000, paidAmount: 1440000, period: '2026-08', date: '2026-08-15', status: '待审批' },
    { id: 'ss2013', name: '滨江生态廊道工程分包1期结算', code: 'JS-2026-380', contract: 'LWB-2026-140', subcontractor: '金城建筑劳务有限公司', project: '滨江生态廊道工程', amount: 1500000, paidAmount: 1500000, period: '2026-01', date: '2026-01-15', status: '待审批' },
    { id: 'ss2014', name: '滨江生态廊道工程分包2期结算', code: 'JS-2026-381', contract: 'ZYB-2026-141', subcontractor: '明宇防水工程公司', project: '滨江生态廊道工程', amount: 1590000, paidAmount: 954000, period: '2026-01', date: '2026-01-15', status: '已支付' },
    { id: 'ss2015', name: '灌区现代化改造工程分包1期结算', code: 'JS-2026-390', contract: 'ZYB-2026-145', subcontractor: '众诚综合劳务公司', project: '灌区现代化改造工程', amount: 1650000, paidAmount: 990000, period: '2026-02', date: '2026-02-15', status: '已支付' },
    { id: 'ss2016', name: '灌区现代化改造工程分包2期结算', code: 'JS-2026-391', contract: 'LWB-2026-146', subcontractor: '金城建筑劳务有限公司', project: '灌区现代化改造工程', amount: 1740000, paidAmount: 1740000, period: '2026-02', date: '2026-02-15', status: '已批准' },
    { id: 'ss2017', name: '山区小型水库建设分包1期结算', code: 'JS-2026-400', contract: 'LWB-2026-150', subcontractor: '华安钢结构工程有限公司', project: '山区小型水库建设', amount: 1800000, paidAmount: 1800000, period: '2026-03', date: '2026-03-15', status: '已批准' },
    { id: 'ss2018', name: '山区小型水库建设分包2期结算', code: 'JS-2026-401', contract: 'ZYB-2026-151', subcontractor: '众诚综合劳务公司', project: '山区小型水库建设', amount: 1890000, paidAmount: 1134000, period: '2026-03', date: '2026-03-15', status: '待审批' },
    { id: 'ss2019', name: '城南地铁站项目分包1期结算', code: 'JS-2026-410', contract: 'ZYB-2026-155', subcontractor: '恒通模板工程队', project: '城南地铁站项目', amount: 1950000, paidAmount: 1170000, period: '2026-04', date: '2026-04-15', status: '待审批' },
    { id: 'ss2020', name: '城南地铁站项目分包2期结算', code: 'JS-2026-411', contract: 'LWB-2026-156', subcontractor: '华安钢结构工程有限公司', project: '城南地铁站项目', amount: 2040000, paidAmount: 2040000, period: '2026-04', date: '2026-04-15', status: '已支付' },
    { id: 'ss2021', name: '滨江大桥工程分包2期结算', code: 'JS-2026-421', contract: 'ZYB-2026-161', subcontractor: '恒通模板工程队', project: '滨江大桥工程', amount: 390000, paidAmount: 234000, period: '2026-05', date: '2026-05-15', status: '已批准' },
    { id: 'ss2022', name: '地铁3号线二期土建分包1期结算', code: 'JS-2026-430', contract: 'ZYB-2026-165', subcontractor: '蓝天幕墙装饰公司', project: '地铁3号线二期土建', amount: 450000, paidAmount: 270000, period: '2026-06', date: '2026-06-15', status: '已批准' },
    { id: 'ss2023', name: '地铁3号线二期土建分包2期结算', code: 'JS-2026-431', contract: 'LWB-2026-166', subcontractor: '永固桩基工程公司', project: '地铁3号线二期土建', amount: 540000, paidAmount: 540000, period: '2026-06', date: '2026-06-15', status: '待审批' },
    { id: 'ss2024', name: '高铁站交通枢纽分包1期结算', code: 'JS-2026-440', contract: 'LWB-2026-170', subcontractor: '蓝天砌筑劳务队', project: '高铁站交通枢纽', amount: 600000, paidAmount: 600000, period: '2026-07', date: '2026-07-15', status: '待审批' },
    { id: 'ss2025', name: '高铁站交通枢纽分包2期结算', code: 'JS-2026-441', contract: 'ZYB-2026-171', subcontractor: '蓝天幕墙装饰公司', project: '高铁站交通枢纽', amount: 690000, paidAmount: 414000, period: '2026-07', date: '2026-07-15', status: '已支付' },
    { id: 'ss2026', name: '城北新区道路改造分包1期结算', code: 'JS-2026-450', contract: 'ZYB-2026-175', subcontractor: '明宇防水工程公司', project: '城北新区道路改造', amount: 750000, paidAmount: 450000, period: '2026-08', date: '2026-08-15', status: '已支付' },
    { id: 'ss2027', name: '城北新区道路改造分包2期结算', code: 'JS-2026-451', contract: 'LWB-2026-176', subcontractor: '蓝天砌筑劳务队', project: '城北新区道路改造', amount: 840000, paidAmount: 840000, period: '2026-08', date: '2026-08-15', status: '已批准' },
    { id: 'ss2028', name: '城南商业综合体分包1期结算', code: 'JS-2026-460', contract: 'LWB-2026-180', subcontractor: '金城建筑劳务有限公司', project: '城南商业综合体', amount: 900000, paidAmount: 900000, period: '2026-01', date: '2026-01-15', status: '已批准' },
    { id: 'ss2029', name: '城南商业综合体分包2期结算', code: 'JS-2026-461', contract: 'ZYB-2026-181', subcontractor: '明宇防水工程公司', project: '城南商业综合体', amount: 990000, paidAmount: 594000, period: '2026-01', date: '2026-01-15', status: '待审批' },
    { id: 'ss2030', name: '城北学校扩建工程分包1期结算', code: 'JS-2026-470', contract: 'ZYB-2026-185', subcontractor: '众诚综合劳务公司', project: '城北学校扩建工程', amount: 1050000, paidAmount: 630000, period: '2026-02', date: '2026-02-15', status: '待审批' },
    { id: 'ss2031', name: '城北学校扩建工程分包2期结算', code: 'JS-2026-471', contract: 'LWB-2026-186', subcontractor: '金城建筑劳务有限公司', project: '城北学校扩建工程', amount: 1140000, paidAmount: 1140000, period: '2026-02', date: '2026-02-15', status: '已支付' },
    { id: 'ss2032', name: '滨江景观带工程分包1期结算', code: 'JS-2026-480', contract: 'LWB-2026-190', subcontractor: '华安钢结构工程有限公司', project: '滨江景观带工程', amount: 1200000, paidAmount: 1200000, period: '2026-03', date: '2026-03-15', status: '已支付' },
    { id: 'ss2033', name: '滨江景观带工程分包2期结算', code: 'JS-2026-481', contract: 'ZYB-2026-191', subcontractor: '众诚综合劳务公司', project: '滨江景观带工程', amount: 1290000, paidAmount: 774000, period: '2026-03', date: '2026-03-15', status: '已批准' },
    { id: 'ss2034', name: '城东物流园工程分包1期结算', code: 'JS-2026-490', contract: 'ZYB-2026-195', subcontractor: '恒通模板工程队', project: '城东物流园工程', amount: 1350000, paidAmount: 810000, period: '2026-04', date: '2026-04-15', status: '已批准' },
    { id: 'ss2035', name: '城东物流园工程分包2期结算', code: 'JS-2026-491', contract: 'LWB-2026-196', subcontractor: '华安钢结构工程有限公司', project: '城东物流园工程', amount: 1440000, paidAmount: 1440000, period: '2026-04', date: '2026-04-15', status: '待审批' },
  ];
  collections['subcontractPayments'] = [
    { id: 'sp1', name: '清河水库主体劳务6月付款', code: 'FK-2026-001', contract: 'LWB-2026-001', subcontractor: '金城建筑劳务有限公司', project: '清河水库除险加固工程', amount: 420000, method: '银行转账', date: '2026-07-08', status: '已支付' },
    { id: 'sp2', name: '滨江大桥钢构首期付款', code: 'FK-2026-002', contract: 'ZYB-2026-001', subcontractor: '华安钢结构工程有限公司', project: '滨江大桥工程', amount: 1000000, method: '银行转账', date: '2026-08-12', status: '已支付' },
    { id: 'sp3', name: '流域治理模板劳务7月付款', code: 'FK-2026-003', contract: 'LWB-2026-002', subcontractor: '恒通模板工程队', project: '流域综合治理工程', amount: 380000, method: '承兑汇票', date: '2026-08-20', status: '待支付' },
    { id: 'sp4', name: '支线渠系综合劳务预付', code: 'FK-2026-004', contract: 'LWB-2026-004', subcontractor: '众诚综合劳务公司', project: '南水北调支线渠系工程', amount: 800000, method: '银行转账', date: '2026-08-25', status: '待支付' },
    { id: 'sp2036', name: '清河水库除险加固工程分包2期付款', code: 'FK-2026-401', contract: 'LWB-2026-001', subcontractor: '金城建筑劳务有限公司', project: '清河水库除险加固工程', amount: 280000, method: '承兑汇票', date: '2026-01-20', status: '待支付' },
    { id: 'sp2037', name: '南水北调支线渠系工程分包2期付款', code: 'FK-2026-411', contract: 'LWB-2026-106', subcontractor: '金城建筑劳务有限公司', project: '南水北调支线渠系工程', amount: 400000, method: '支票', date: '2026-02-20', status: '已支付' },
    { id: 'sp2038', name: '城市防洪堤加固工程分包1期付款', code: 'FK-2026-420', contract: 'LWB-2026-003', subcontractor: '蓝天砌筑劳务队', project: '城市防洪堤加固工程', amount: 440000, method: '支票', date: '2026-03-20', status: '已支付' },
    { id: 'sp2039', name: '城市防洪堤加固工程分包2期付款', code: 'FK-2026-421', contract: 'LWB-2026-003', subcontractor: '蓝天砌筑劳务队', project: '城市防洪堤加固工程', amount: 520000, method: '银行转账', date: '2026-03-20', status: '待支付' },
    { id: 'sp2040', name: '流域综合治理工程分包2期付款', code: 'FK-2026-431', contract: 'LWB-2026-116', subcontractor: '华安钢结构工程有限公司', project: '流域综合治理工程', amount: 640000, method: '承兑汇票', date: '2026-04-20', status: '已支付' },
    { id: 'sp2041', name: '农田水利灌溉工程分包1期付款', code: 'FK-2026-440', contract: 'ZYB-2026-003', subcontractor: '明宇防水工程公司', project: '农田水利灌溉工程', amount: 680000, method: '承兑汇票', date: '2026-05-20', status: '已支付' },
    { id: 'sp2042', name: '农田水利灌溉工程分包2期付款', code: 'FK-2026-441', contract: 'ZYB-2026-003', subcontractor: '明宇防水工程公司', project: '农田水利灌溉工程', amount: 760000, method: '支票', date: '2026-05-20', status: '待支付' },
    { id: 'sp2043', name: '湿地公园水系工程分包1期付款', code: 'FK-2026-450', contract: 'ZYB-2026-125', subcontractor: '蓝天幕墙装饰公司', project: '湿地公园水系工程', amount: 800000, method: '支票', date: '2026-06-20', status: '待支付' },
    { id: 'sp2044', name: '湿地公园水系工程分包2期付款', code: 'FK-2026-451', contract: 'ZYB-2026-125', subcontractor: '蓝天幕墙装饰公司', project: '湿地公园水系工程', amount: 880000, method: '银行转账', date: '2026-06-20', status: '已支付' },
    { id: 'sp2045', name: '污水处理厂升级工程分包1期付款', code: 'FK-2026-460', contract: 'LWB-2026-130', subcontractor: '蓝天砌筑劳务队', project: '污水处理厂升级工程', amount: 920000, method: '银行转账', date: '2026-07-20', status: '已支付' },
    { id: 'sp2046', name: '污水处理厂升级工程分包2期付款', code: 'FK-2026-461', contract: 'LWB-2026-130', subcontractor: '蓝天砌筑劳务队', project: '污水处理厂升级工程', amount: 1000000, method: '承兑汇票', date: '2026-07-20', status: '待支付' },
    { id: 'sp2047', name: '跨河大桥水文监测站分包1期付款', code: 'FK-2026-470', contract: 'ZYB-2026-135', subcontractor: '明宇防水工程公司', project: '跨河大桥水文监测站', amount: 1040000, method: '承兑汇票', date: '2026-08-20', status: '待支付' },
    { id: 'sp2048', name: '跨河大桥水文监测站分包2期付款', code: 'FK-2026-471', contract: 'ZYB-2026-135', subcontractor: '明宇防水工程公司', project: '跨河大桥水文监测站', amount: 1120000, method: '支票', date: '2026-08-20', status: '已支付' },
    { id: 'sp2049', name: '滨江生态廊道工程分包1期付款', code: 'FK-2026-480', contract: 'LWB-2026-140', subcontractor: '金城建筑劳务有限公司', project: '滨江生态廊道工程', amount: 1160000, method: '支票', date: '2026-01-20', status: '已支付' },
    { id: 'sp2050', name: '滨江生态廊道工程分包2期付款', code: 'FK-2026-481', contract: 'LWB-2026-140', subcontractor: '金城建筑劳务有限公司', project: '滨江生态廊道工程', amount: 240000, method: '银行转账', date: '2026-01-20', status: '待支付' },
    { id: 'sp2051', name: '灌区现代化改造工程分包1期付款', code: 'FK-2026-490', contract: 'ZYB-2026-145', subcontractor: '众诚综合劳务公司', project: '灌区现代化改造工程', amount: 280000, method: '银行转账', date: '2026-02-20', status: '待支付' },
    { id: 'sp2052', name: '灌区现代化改造工程分包2期付款', code: 'FK-2026-491', contract: 'ZYB-2026-145', subcontractor: '众诚综合劳务公司', project: '灌区现代化改造工程', amount: 360000, method: '承兑汇票', date: '2026-02-20', status: '已支付' },
    { id: 'sp2053', name: '山区小型水库建设分包1期付款', code: 'FK-2026-500', contract: 'LWB-2026-150', subcontractor: '华安钢结构工程有限公司', project: '山区小型水库建设', amount: 400000, method: '承兑汇票', date: '2026-03-20', status: '已支付' },
    { id: 'sp2054', name: '山区小型水库建设分包2期付款', code: 'FK-2026-501', contract: 'LWB-2026-150', subcontractor: '华安钢结构工程有限公司', project: '山区小型水库建设', amount: 480000, method: '支票', date: '2026-03-20', status: '待支付' },
    { id: 'sp2055', name: '城南地铁站项目分包1期付款', code: 'FK-2026-510', contract: 'ZYB-2026-155', subcontractor: '恒通模板工程队', project: '城南地铁站项目', amount: 520000, method: '支票', date: '2026-04-20', status: '待支付' },
    { id: 'sp2056', name: '城南地铁站项目分包2期付款', code: 'FK-2026-511', contract: 'ZYB-2026-155', subcontractor: '恒通模板工程队', project: '城南地铁站项目', amount: 600000, method: '银行转账', date: '2026-04-20', status: '已支付' },
    { id: 'sp2057', name: '滨江大桥工程分包2期付款', code: 'FK-2026-521', contract: 'ZYB-2026-001', subcontractor: '华安钢结构工程有限公司', project: '滨江大桥工程', amount: 720000, method: '承兑汇票', date: '2026-05-20', status: '待支付' },
    { id: 'sp2058', name: '地铁3号线二期土建分包1期付款', code: 'FK-2026-530', contract: 'ZYB-2026-165', subcontractor: '蓝天幕墙装饰公司', project: '地铁3号线二期土建', amount: 760000, method: '承兑汇票', date: '2026-06-20', status: '待支付' },
    { id: 'sp2059', name: '地铁3号线二期土建分包2期付款', code: 'FK-2026-531', contract: 'ZYB-2026-165', subcontractor: '蓝天幕墙装饰公司', project: '地铁3号线二期土建', amount: 840000, method: '支票', date: '2026-06-20', status: '已支付' },
    { id: 'sp2060', name: '高铁站交通枢纽分包1期付款', code: 'FK-2026-540', contract: 'LWB-2026-170', subcontractor: '蓝天砌筑劳务队', project: '高铁站交通枢纽', amount: 880000, method: '支票', date: '2026-07-20', status: '已支付' },
    { id: 'sp2061', name: '高铁站交通枢纽分包2期付款', code: 'FK-2026-541', contract: 'LWB-2026-170', subcontractor: '蓝天砌筑劳务队', project: '高铁站交通枢纽', amount: 960000, method: '银行转账', date: '2026-07-20', status: '待支付' },
    { id: 'sp2062', name: '城北新区道路改造分包1期付款', code: 'FK-2026-550', contract: 'ZYB-2026-175', subcontractor: '明宇防水工程公司', project: '城北新区道路改造', amount: 1000000, method: '银行转账', date: '2026-08-20', status: '待支付' },
    { id: 'sp2063', name: '城北新区道路改造分包2期付款', code: 'FK-2026-551', contract: 'ZYB-2026-175', subcontractor: '明宇防水工程公司', project: '城北新区道路改造', amount: 1080000, method: '承兑汇票', date: '2026-08-20', status: '已支付' },
    { id: 'sp2064', name: '城南商业综合体分包1期付款', code: 'FK-2026-560', contract: 'LWB-2026-180', subcontractor: '金城建筑劳务有限公司', project: '城南商业综合体', amount: 1120000, method: '承兑汇票', date: '2026-01-20', status: '已支付' },
    { id: 'sp2065', name: '城南商业综合体分包2期付款', code: 'FK-2026-561', contract: 'LWB-2026-180', subcontractor: '金城建筑劳务有限公司', project: '城南商业综合体', amount: 200000, method: '支票', date: '2026-01-20', status: '待支付' },
    { id: 'sp2066', name: '城北学校扩建工程分包1期付款', code: 'FK-2026-570', contract: 'ZYB-2026-185', subcontractor: '众诚综合劳务公司', project: '城北学校扩建工程', amount: 240000, method: '支票', date: '2026-02-20', status: '待支付' },
    { id: 'sp2067', name: '城北学校扩建工程分包2期付款', code: 'FK-2026-571', contract: 'ZYB-2026-185', subcontractor: '众诚综合劳务公司', project: '城北学校扩建工程', amount: 320000, method: '银行转账', date: '2026-02-20', status: '已支付' },
    { id: 'sp2068', name: '滨江景观带工程分包1期付款', code: 'FK-2026-580', contract: 'LWB-2026-190', subcontractor: '华安钢结构工程有限公司', project: '滨江景观带工程', amount: 360000, method: '银行转账', date: '2026-03-20', status: '已支付' },
    { id: 'sp2069', name: '滨江景观带工程分包2期付款', code: 'FK-2026-581', contract: 'LWB-2026-190', subcontractor: '华安钢结构工程有限公司', project: '滨江景观带工程', amount: 440000, method: '承兑汇票', date: '2026-03-20', status: '待支付' },
    { id: 'sp2070', name: '城东物流园工程分包1期付款', code: 'FK-2026-590', contract: 'ZYB-2026-195', subcontractor: '恒通模板工程队', project: '城东物流园工程', amount: 480000, method: '承兑汇票', date: '2026-04-20', status: '待支付' },
    { id: 'sp2071', name: '城东物流园工程分包2期付款', code: 'FK-2026-591', contract: 'ZYB-2026-195', subcontractor: '恒通模板工程队', project: '城东物流园工程', amount: 560000, method: '支票', date: '2026-04-20', status: '已支付' },
  ];
  collections['subcontractEvaluations'] = [
    { id: 'se1', subcontractor: '金城建筑劳务有限公司', project: '清河水库除险加固工程', qualityScore: 92, progressScore: 88, safetyScore: 90, cooperationScore: 85, date: '2026-07-31', content: '钢筋绑扎质量好，进度配合积极', result: '优秀' },
    { id: 'se2', subcontractor: '恒通模板工程队', project: '流域综合治理工程', qualityScore: 85, progressScore: 82, safetyScore: 88, cooperationScore: 80, date: '2026-07-31', content: '模板工艺稳定，安全防护到位', result: '良好' },
    { id: 'se3', subcontractor: '华安钢结构工程有限公司', project: '滨江大桥工程', qualityScore: 88, progressScore: 78, safetyScore: 85, cooperationScore: 82, date: '2026-06-30', content: '制作安装质量良好，进度稍慢', result: '良好' },
    { id: 'se4', subcontractor: '蓝天幕墙装饰公司', project: '湿地公园水系工程', qualityScore: 60, progressScore: 55, safetyScore: 65, cooperationScore: 58, date: '2026-05-31', content: '施工质量问题多，配合较差', result: '不合格' },
    { id: 'se2109', subcontractor: '明宇防水工程公司', project: '清河水库除险加固工程', qualityScore: 78, progressScore: 77, safetyScore: 81, cooperationScore: 79, date: '2026-07-31', content: '清河水库除险加固工程分包施工考核评价', result: '良好' },
    { id: 'se2110', subcontractor: '众诚综合劳务公司', project: '南水北调支线渠系工程', qualityScore: 75, progressScore: 74, safetyScore: 81, cooperationScore: 75, date: '2026-07-31', content: '南水北调支线渠系工程分包施工考核评价', result: '良好' },
    { id: 'se2111', subcontractor: '金城建筑劳务有限公司', project: '南水北调支线渠系工程', qualityScore: 83, progressScore: 81, safetyScore: 87, cooperationScore: 84, date: '2026-07-31', content: '南水北调支线渠系工程分包施工考核评价', result: '良好' },
    { id: 'se2112', subcontractor: '华安钢结构工程有限公司', project: '城市防洪堤加固工程', qualityScore: 80, progressScore: 78, safetyScore: 87, cooperationScore: 80, date: '2026-07-31', content: '城市防洪堤加固工程分包施工考核评价', result: '良好' },
    { id: 'se2113', subcontractor: '众诚综合劳务公司', project: '城市防洪堤加固工程', qualityScore: 88, progressScore: 85, safetyScore: 93, cooperationScore: 89, date: '2026-07-31', content: '城市防洪堤加固工程分包施工考核评价', result: '优秀' },
    { id: 'se2114', subcontractor: '华安钢结构工程有限公司', project: '流域综合治理工程', qualityScore: 93, progressScore: 89, safetyScore: 99, cooperationScore: 94, date: '2026-07-31', content: '流域综合治理工程分包施工考核评价', result: '优秀' },
    { id: 'se2115', subcontractor: '永固桩基工程公司', project: '农田水利灌溉工程', qualityScore: 90, progressScore: 86, safetyScore: 99, cooperationScore: 90, date: '2026-07-31', content: '农田水利灌溉工程分包施工考核评价', result: '优秀' },
    { id: 'se2116', subcontractor: '恒通模板工程队', project: '农田水利灌溉工程', qualityScore: 98, progressScore: 93, safetyScore: 80, cooperationScore: 71, date: '2026-07-31', content: '农田水利灌溉工程分包施工考核评价', result: '优秀' },
    { id: 'se2117', subcontractor: '永固桩基工程公司', project: '湿地公园水系工程', qualityScore: 73, progressScore: 97, safetyScore: 86, cooperationScore: 76, date: '2026-07-31', content: '湿地公园水系工程分包施工考核评价', result: '良好' },
    { id: 'se2118', subcontractor: '蓝天砌筑劳务队', project: '污水处理厂升级工程', qualityScore: 70, progressScore: 94, safetyScore: 86, cooperationScore: 72, date: '2026-07-31', content: '污水处理厂升级工程分包施工考核评价', result: '良好' },
    { id: 'se2119', subcontractor: '蓝天幕墙装饰公司', project: '污水处理厂升级工程', qualityScore: 78, progressScore: 73, safetyScore: 92, cooperationScore: 81, date: '2026-07-31', content: '污水处理厂升级工程分包施工考核评价', result: '良好' },
    { id: 'se2120', subcontractor: '明宇防水工程公司', project: '跨河大桥水文监测站', qualityScore: 75, progressScore: 70, safetyScore: 92, cooperationScore: 77, date: '2026-07-31', content: '跨河大桥水文监测站分包施工考核评价', result: '良好' },
    { id: 'se2121', subcontractor: '蓝天砌筑劳务队', project: '跨河大桥水文监测站', qualityScore: 83, progressScore: 77, safetyScore: 98, cooperationScore: 86, date: '2026-07-31', content: '跨河大桥水文监测站分包施工考核评价', result: '优秀' },
    { id: 'se2122', subcontractor: '金城建筑劳务有限公司', project: '滨江生态廊道工程', qualityScore: 80, progressScore: 74, safetyScore: 98, cooperationScore: 82, date: '2026-07-31', content: '滨江生态廊道工程分包施工考核评价', result: '良好' },
    { id: 'se2123', subcontractor: '明宇防水工程公司', project: '滨江生态廊道工程', qualityScore: 88, progressScore: 81, safetyScore: 79, cooperationScore: 91, date: '2026-07-31', content: '滨江生态廊道工程分包施工考核评价', result: '良好' },
    { id: 'se2124', subcontractor: '众诚综合劳务公司', project: '灌区现代化改造工程', qualityScore: 85, progressScore: 78, safetyScore: 79, cooperationScore: 87, date: '2026-07-31', content: '灌区现代化改造工程分包施工考核评价', result: '良好' },
    { id: 'se2125', subcontractor: '金城建筑劳务有限公司', project: '灌区现代化改造工程', qualityScore: 93, progressScore: 85, safetyScore: 85, cooperationScore: 96, date: '2026-07-31', content: '灌区现代化改造工程分包施工考核评价', result: '优秀' },
    { id: 'se2126', subcontractor: '华安钢结构工程有限公司', project: '山区小型水库建设', qualityScore: 90, progressScore: 82, safetyScore: 85, cooperationScore: 92, date: '2026-07-31', content: '山区小型水库建设分包施工考核评价', result: '优秀' },
    { id: 'se2127', subcontractor: '众诚综合劳务公司', project: '山区小型水库建设', qualityScore: 98, progressScore: 89, safetyScore: 91, cooperationScore: 73, date: '2026-07-31', content: '山区小型水库建设分包施工考核评价', result: '优秀' },
    { id: 'se2128', subcontractor: '恒通模板工程队', project: '城南地铁站项目', qualityScore: 95, progressScore: 86, safetyScore: 91, cooperationScore: 97, date: '2026-07-31', content: '城南地铁站项目分包施工考核评价', result: '优秀' },
    { id: 'se2129', subcontractor: '华安钢结构工程有限公司', project: '城南地铁站项目', qualityScore: 73, progressScore: 93, safetyScore: 97, cooperationScore: 78, date: '2026-07-31', content: '城南地铁站项目分包施工考核评价', result: '优秀' },
    { id: 'se2130', subcontractor: '恒通模板工程队', project: '滨江大桥工程', qualityScore: 78, progressScore: 97, safetyScore: 78, cooperationScore: 83, date: '2026-07-31', content: '滨江大桥工程分包施工考核评价', result: '良好' },
    { id: 'se2131', subcontractor: '蓝天幕墙装饰公司', project: '地铁3号线二期土建', qualityScore: 75, progressScore: 94, safetyScore: 78, cooperationScore: 79, date: '2026-07-31', content: '地铁3号线二期土建分包施工考核评价', result: '良好' },
    { id: 'se2132', subcontractor: '永固桩基工程公司', project: '地铁3号线二期土建', qualityScore: 83, progressScore: 73, safetyScore: 84, cooperationScore: 88, date: '2026-07-31', content: '地铁3号线二期土建分包施工考核评价', result: '良好' },
    { id: 'se2133', subcontractor: '蓝天砌筑劳务队', project: '高铁站交通枢纽', qualityScore: 80, progressScore: 70, safetyScore: 84, cooperationScore: 84, date: '2026-07-31', content: '高铁站交通枢纽分包施工考核评价', result: '良好' },
    { id: 'se2134', subcontractor: '蓝天幕墙装饰公司', project: '高铁站交通枢纽', qualityScore: 88, progressScore: 77, safetyScore: 90, cooperationScore: 93, date: '2026-07-31', content: '高铁站交通枢纽分包施工考核评价', result: '优秀' },
    { id: 'se2135', subcontractor: '明宇防水工程公司', project: '城北新区道路改造', qualityScore: 85, progressScore: 74, safetyScore: 90, cooperationScore: 89, date: '2026-07-31', content: '城北新区道路改造分包施工考核评价', result: '良好' },
    { id: 'se2136', subcontractor: '蓝天砌筑劳务队', project: '城北新区道路改造', qualityScore: 93, progressScore: 81, safetyScore: 96, cooperationScore: 70, date: '2026-07-31', content: '城北新区道路改造分包施工考核评价', result: '优秀' },
    { id: 'se2137', subcontractor: '金城建筑劳务有限公司', project: '城南商业综合体', qualityScore: 90, progressScore: 78, safetyScore: 96, cooperationScore: 94, date: '2026-07-31', content: '城南商业综合体分包施工考核评价', result: '优秀' },
    { id: 'se2138', subcontractor: '明宇防水工程公司', project: '城南商业综合体', qualityScore: 98, progressScore: 85, safetyScore: 77, cooperationScore: 75, date: '2026-07-31', content: '城南商业综合体分包施工考核评价', result: '良好' },
    { id: 'se2139', subcontractor: '众诚综合劳务公司', project: '城北学校扩建工程', qualityScore: 95, progressScore: 82, safetyScore: 77, cooperationScore: 71, date: '2026-07-31', content: '城北学校扩建工程分包施工考核评价', result: '良好' },
    { id: 'se2140', subcontractor: '金城建筑劳务有限公司', project: '城北学校扩建工程', qualityScore: 73, progressScore: 89, safetyScore: 83, cooperationScore: 80, date: '2026-07-31', content: '城北学校扩建工程分包施工考核评价', result: '良好' },
    { id: 'se2141', subcontractor: '华安钢结构工程有限公司', project: '滨江景观带工程', qualityScore: 70, progressScore: 86, safetyScore: 83, cooperationScore: 76, date: '2026-07-31', content: '滨江景观带工程分包施工考核评价', result: '良好' },
    { id: 'se2142', subcontractor: '众诚综合劳务公司', project: '滨江景观带工程', qualityScore: 78, progressScore: 93, safetyScore: 89, cooperationScore: 85, date: '2026-07-31', content: '滨江景观带工程分包施工考核评价', result: '优秀' },
    { id: 'se2143', subcontractor: '恒通模板工程队', project: '城东物流园工程', qualityScore: 75, progressScore: 90, safetyScore: 89, cooperationScore: 81, date: '2026-07-31', content: '城东物流园工程分包施工考核评价', result: '良好' },
    { id: 'se2144', subcontractor: '华安钢结构工程有限公司', project: '城东物流园工程', qualityScore: 83, progressScore: 97, safetyScore: 95, cooperationScore: 90, date: '2026-07-31', content: '城东物流园工程分包施工考核评价', result: '优秀' },
  ];
  collections['subcontractReports'] = [
    { id: 'sr1', name: '2026年7月分包台账', type: '分包台账', date: '2026-07-31' , project: '清河水库除险加固工程' },
    { id: 'sr2', name: '2026年二季度分包结算汇总', type: '结算台账', date: '2026-06-30' , project: '清河水库除险加固工程' },
    { id: 'sr100', name: '清河水库除险加固工程分包台账', type: '分包台账', date: '2026-07-31', project: '清河水库除险加固工程' },
    { id: 'sr100', name: '清河水库除险加固工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '清河水库除险加固工程' },
    { id: 'sr102', name: '南水北调支线渠系工程分包台账', type: '分包台账', date: '2026-07-31', project: '南水北调支线渠系工程' },
    { id: 'sr101', name: '南水北调支线渠系工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '南水北调支线渠系工程' },
    { id: 'sr104', name: '城市防洪堤加固工程分包台账', type: '分包台账', date: '2026-07-31', project: '城市防洪堤加固工程' },
    { id: 'sr102', name: '城市防洪堤加固工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '城市防洪堤加固工程' },
    { id: 'sr106', name: '流域综合治理工程分包台账', type: '分包台账', date: '2026-07-31', project: '流域综合治理工程' },
    { id: 'sr103', name: '流域综合治理工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '流域综合治理工程' },
    { id: 'sr108', name: '农田水利灌溉工程分包台账', type: '分包台账', date: '2026-07-31', project: '农田水利灌溉工程' },
    { id: 'sr104', name: '农田水利灌溉工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '农田水利灌溉工程' },
    { id: 'sr110', name: '湿地公园水系工程分包台账', type: '分包台账', date: '2026-07-31', project: '湿地公园水系工程' },
    { id: 'sr105', name: '湿地公园水系工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '湿地公园水系工程' },
    { id: 'sr112', name: '污水处理厂升级工程分包台账', type: '分包台账', date: '2026-07-31', project: '污水处理厂升级工程' },
    { id: 'sr106', name: '污水处理厂升级工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '污水处理厂升级工程' },
    { id: 'sr114', name: '跨河大桥水文监测站分包台账', type: '分包台账', date: '2026-07-31', project: '跨河大桥水文监测站' },
    { id: 'sr107', name: '跨河大桥水文监测站分包结算汇总', type: '结算台账', date: '2026-06-30', project: '跨河大桥水文监测站' },
    { id: 'sr116', name: '滨江生态廊道工程分包台账', type: '分包台账', date: '2026-07-31', project: '滨江生态廊道工程' },
    { id: 'sr108', name: '滨江生态廊道工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '滨江生态廊道工程' },
    { id: 'sr118', name: '灌区现代化改造工程分包台账', type: '分包台账', date: '2026-07-31', project: '灌区现代化改造工程' },
    { id: 'sr109', name: '灌区现代化改造工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '灌区现代化改造工程' },
    { id: 'sr120', name: '山区小型水库建设分包台账', type: '分包台账', date: '2026-07-31', project: '山区小型水库建设' },
    { id: 'sr110', name: '山区小型水库建设分包结算汇总', type: '结算台账', date: '2026-06-30', project: '山区小型水库建设' },
    { id: 'sr122', name: '城南地铁站项目分包台账', type: '分包台账', date: '2026-07-31', project: '城南地铁站项目' },
    { id: 'sr111', name: '城南地铁站项目分包结算汇总', type: '结算台账', date: '2026-06-30', project: '城南地铁站项目' },
    { id: 'sr124', name: '滨江大桥工程分包台账', type: '分包台账', date: '2026-07-31', project: '滨江大桥工程' },
    { id: 'sr112', name: '滨江大桥工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '滨江大桥工程' },
    { id: 'sr126', name: '地铁3号线二期土建分包台账', type: '分包台账', date: '2026-07-31', project: '地铁3号线二期土建' },
    { id: 'sr113', name: '地铁3号线二期土建分包结算汇总', type: '结算台账', date: '2026-06-30', project: '地铁3号线二期土建' },
    { id: 'sr128', name: '高铁站交通枢纽分包台账', type: '分包台账', date: '2026-07-31', project: '高铁站交通枢纽' },
    { id: 'sr114', name: '高铁站交通枢纽分包结算汇总', type: '结算台账', date: '2026-06-30', project: '高铁站交通枢纽' },
    { id: 'sr130', name: '城北新区道路改造分包台账', type: '分包台账', date: '2026-07-31', project: '城北新区道路改造' },
    { id: 'sr115', name: '城北新区道路改造分包结算汇总', type: '结算台账', date: '2026-06-30', project: '城北新区道路改造' },
    { id: 'sr132', name: '城南商业综合体分包台账', type: '分包台账', date: '2026-07-31', project: '城南商业综合体' },
    { id: 'sr116', name: '城南商业综合体分包结算汇总', type: '结算台账', date: '2026-06-30', project: '城南商业综合体' },
    { id: 'sr134', name: '城北学校扩建工程分包台账', type: '分包台账', date: '2026-07-31', project: '城北学校扩建工程' },
    { id: 'sr117', name: '城北学校扩建工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '城北学校扩建工程' },
    { id: 'sr136', name: '滨江景观带工程分包台账', type: '分包台账', date: '2026-07-31', project: '滨江景观带工程' },
    { id: 'sr118', name: '滨江景观带工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '滨江景观带工程' },
    { id: 'sr138', name: '城东物流园工程分包台账', type: '分包台账', date: '2026-07-31', project: '城东物流园工程' },
    { id: 'sr119', name: '城东物流园工程分包结算汇总', type: '结算台账', date: '2026-06-30', project: '城东物流园工程' },
  ];

  // 采购订单
  collections['purchaseOrders'] = [
    { id: 'po1', project: '南水北调支线渠系工程', code: 'CG-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 200, unit: '吨', price: 480, status: '已收货' },
    { id: 'po2', project: '清河水库除险加固工程', code: 'CG-2026-002', supplier: '恒信钢材集团', material: 'HRB400螺纹钢', quantity: 80, unit: '吨', price: 3650, status: '已下单' },
    { id: 'po1000', code: 'CG-2026-301', supplier: '水利材料厂', project: '清河水库除险加固工程', material: 'HRB400螺纹钢', quantity: 53, unit: '吨', price: 3650, amount: 193450, status: '已下单', orderDate: '2026-01-02', expectedDate: '2026-01-02', owner: '张采购', contract: 'CGHT-2026-101' },
    { id: 'po1004', code: 'CG-2026-311', supplier: '监测设备公司', project: '南水北调支线渠系工程', material: '土工膜', quantity: 60, unit: '㎡', price: 220, amount: 13200, status: '部分到货', orderDate: '2026-02-02', expectedDate: '2026-02-02', owner: '张采购', contract: 'CGHT-2026-106' },
    { id: 'po1009', code: 'CG-2026-320', supplier: '华北建材有限公司', project: '城市防洪堤加固工程', material: '河沙', quantity: 54, unit: 'm³', price: 220, amount: 11880, status: '部分到货', orderDate: '2026-03-01', expectedDate: '2026-03-01', owner: '张采购', contract: 'CGHT-2026-110' },
    { id: 'po1010', code: 'CG-2026-321', supplier: '安达机械租赁', project: '城市防洪堤加固工程', material: '碎石', quantity: 67, unit: 'm³', price: 220, amount: 14740, status: '已收货', orderDate: '2026-03-02', expectedDate: '2026-03-02', owner: '张采购', contract: 'CGHT-2026-111' },
    { id: 'po1016', code: 'CG-2026-330', supplier: '水利材料厂', project: '流域综合治理工程', material: '防渗材料', quantity: 61, unit: '㎡', price: 220, amount: 13420, status: '已收货', orderDate: '2026-04-01', expectedDate: '2026-04-01', owner: '张采购', contract: 'CGHT-2026-115' },
    { id: 'po1017', code: 'CG-2026-331', supplier: '广丰设备租赁', project: '流域综合治理工程', material: '钢结构构件', quantity: 74, unit: '吨', price: 6800, amount: 503200, status: '待确认', orderDate: '2026-04-02', expectedDate: '2026-04-02', owner: '张采购', contract: 'CGHT-2026-116' },
    { id: 'po1023', code: 'CG-2026-340', supplier: '监测设备公司', project: '农田水利灌溉工程', material: 'P.O42.5水泥', quantity: 68, unit: '吨', price: 480, amount: 32640, status: '待确认', orderDate: '2026-05-01', expectedDate: '2026-05-01', owner: '张采购', contract: 'CGHT-2026-120' },
    { id: 'po1024', code: 'CG-2026-341', supplier: '华源水泥集团', project: '农田水利灌溉工程', material: 'HRB400螺纹钢', quantity: 81, unit: '吨', price: 3650, amount: 295650, status: '已下单', orderDate: '2026-05-02', expectedDate: '2026-05-02', owner: '张采购', contract: 'CGHT-2026-121' },
    { id: 'po1030', code: 'CG-2026-350', supplier: '安达机械租赁', project: '湿地公园水系工程', material: '预制混凝土板', quantity: 75, unit: '块', price: 220, amount: 16500, status: '已下单', orderDate: '2026-06-01', expectedDate: '2026-06-01', owner: '张采购', contract: 'CGHT-2026-125' },
    { id: 'po1031', code: 'CG-2026-351', supplier: '恒信钢材集团', project: '湿地公园水系工程', material: '土工膜', quantity: 88, unit: '㎡', price: 220, amount: 19360, status: '部分到货', orderDate: '2026-06-02', expectedDate: '2026-06-02', owner: '张采购', contract: 'CGHT-2026-126' },
    { id: 'po1038', code: 'CG-2026-360', supplier: '广丰设备租赁', project: '污水处理厂升级工程', material: '河沙', quantity: 82, unit: 'm³', price: 220, amount: 18040, status: '部分到货', orderDate: '2026-07-01', expectedDate: '2026-07-01', owner: '张采购', contract: 'CGHT-2026-130' },
    { id: 'po1039', code: 'CG-2026-361', supplier: '华北建材有限公司', project: '污水处理厂升级工程', material: '碎石', quantity: 95, unit: 'm³', price: 220, amount: 20900, status: '已收货', orderDate: '2026-07-02', expectedDate: '2026-07-02', owner: '张采购', contract: 'CGHT-2026-131' },
    { id: 'po1046', code: 'CG-2026-370', supplier: '华源水泥集团', project: '跨河大桥水文监测站', material: '防渗材料', quantity: 89, unit: '㎡', price: 220, amount: 19580, status: '已收货', orderDate: '2026-08-01', expectedDate: '2026-08-01', owner: '张采购', contract: 'CGHT-2026-135' },
    { id: 'po1047', code: 'CG-2026-371', supplier: '水利材料厂', project: '跨河大桥水文监测站', material: '钢结构构件', quantity: 102, unit: '吨', price: 6800, amount: 693600, status: '待确认', orderDate: '2026-08-02', expectedDate: '2026-08-02', owner: '张采购', contract: 'CGHT-2026-136' },
    { id: 'po1054', code: 'CG-2026-380', supplier: '恒信钢材集团', project: '滨江生态廊道工程', material: 'P.O42.5水泥', quantity: 96, unit: '吨', price: 480, amount: 46080, status: '待确认', orderDate: '2026-01-01', expectedDate: '2026-01-01', owner: '张采购', contract: 'CGHT-2026-140' },
    { id: 'po1055', code: 'CG-2026-381', supplier: '监测设备公司', project: '滨江生态廊道工程', material: 'HRB400螺纹钢', quantity: 109, unit: '吨', price: 3650, amount: 397850, status: '已下单', orderDate: '2026-01-02', expectedDate: '2026-01-02', owner: '张采购', contract: 'CGHT-2026-141' },
    { id: 'po1062', code: 'CG-2026-390', supplier: '华北建材有限公司', project: '灌区现代化改造工程', material: '预制混凝土板', quantity: 103, unit: '块', price: 220, amount: 22660, status: '已下单', orderDate: '2026-02-01', expectedDate: '2026-02-01', owner: '张采购', contract: 'CGHT-2026-145' },
    { id: 'po1063', code: 'CG-2026-391', supplier: '安达机械租赁', project: '灌区现代化改造工程', material: '土工膜', quantity: 116, unit: '㎡', price: 220, amount: 25520, status: '部分到货', orderDate: '2026-02-02', expectedDate: '2026-02-02', owner: '张采购', contract: 'CGHT-2026-146' },
    { id: 'po1070', code: 'CG-2026-400', supplier: '水利材料厂', project: '山区小型水库建设', material: '河沙', quantity: 110, unit: 'm³', price: 220, amount: 24200, status: '部分到货', orderDate: '2026-03-01', expectedDate: '2026-03-01', owner: '张采购', contract: 'CGHT-2026-150' },
    { id: 'po1071', code: 'CG-2026-401', supplier: '广丰设备租赁', project: '山区小型水库建设', material: '碎石', quantity: 123, unit: 'm³', price: 220, amount: 27060, status: '已收货', orderDate: '2026-03-02', expectedDate: '2026-03-02', owner: '张采购', contract: 'CGHT-2026-151' },
    { id: 'po1078', code: 'CG-2026-410', supplier: '监测设备公司', project: '城南地铁站项目', material: '防渗材料', quantity: 117, unit: '㎡', price: 220, amount: 25740, status: '已收货', orderDate: '2026-04-01', expectedDate: '2026-04-01', owner: '张采购', contract: 'CGHT-2026-155' },
    { id: 'po1079', code: 'CG-2026-411', supplier: '华源水泥集团', project: '城南地铁站项目', material: '钢结构构件', quantity: 130, unit: '吨', price: 6800, amount: 884000, status: '待确认', orderDate: '2026-04-02', expectedDate: '2026-04-02', owner: '张采购', contract: 'CGHT-2026-156' },
    { id: 'po1084', code: 'CG-2026-420', supplier: '安达机械租赁', project: '滨江大桥工程', material: 'P.O42.5水泥', quantity: 124, unit: '吨', price: 480, amount: 59520, status: '待确认', orderDate: '2026-05-01', expectedDate: '2026-05-01', owner: '张采购', contract: 'CGHT-2026-160' },
    { id: 'po1085', code: 'CG-2026-421', supplier: '恒信钢材集团', project: '滨江大桥工程', material: 'HRB400螺纹钢', quantity: 137, unit: '吨', price: 3650, amount: 500050, status: '已下单', orderDate: '2026-05-02', expectedDate: '2026-05-02', owner: '张采购', contract: 'CGHT-2026-161' },
    { id: 'po1089', code: 'CG-2026-430', supplier: '广丰设备租赁', project: '地铁3号线二期土建', material: '预制混凝土板', quantity: 131, unit: '块', price: 220, amount: 28820, status: '已下单', orderDate: '2026-06-01', expectedDate: '2026-06-01', owner: '张采购', contract: 'CGHT-2026-165' },
    { id: 'po1090', code: 'CG-2026-431', supplier: '华北建材有限公司', project: '地铁3号线二期土建', material: '土工膜', quantity: 144, unit: '㎡', price: 220, amount: 31680, status: '部分到货', orderDate: '2026-06-02', expectedDate: '2026-06-02', owner: '张采购', contract: 'CGHT-2026-166' },
    { id: 'po1097', code: 'CG-2026-440', supplier: '华源水泥集团', project: '高铁站交通枢纽', material: '河沙', quantity: 138, unit: 'm³', price: 220, amount: 30360, status: '部分到货', orderDate: '2026-07-01', expectedDate: '2026-07-01', owner: '张采购', contract: 'CGHT-2026-170' },
    { id: 'po1098', code: 'CG-2026-441', supplier: '水利材料厂', project: '高铁站交通枢纽', material: '碎石', quantity: 151, unit: 'm³', price: 220, amount: 33220, status: '已收货', orderDate: '2026-07-02', expectedDate: '2026-07-02', owner: '张采购', contract: 'CGHT-2026-171' },
    { id: 'po1105', code: 'CG-2026-450', supplier: '恒信钢材集团', project: '城北新区道路改造', material: '防渗材料', quantity: 145, unit: '㎡', price: 220, amount: 31900, status: '已收货', orderDate: '2026-08-01', expectedDate: '2026-08-01', owner: '张采购', contract: 'CGHT-2026-175' },
    { id: 'po1106', code: 'CG-2026-451', supplier: '监测设备公司', project: '城北新区道路改造', material: '钢结构构件', quantity: 158, unit: '吨', price: 6800, amount: 1074400, status: '待确认', orderDate: '2026-08-02', expectedDate: '2026-08-02', owner: '张采购', contract: 'CGHT-2026-176' },
    { id: 'po1113', code: 'CG-2026-460', supplier: '华北建材有限公司', project: '城南商业综合体', material: 'P.O42.5水泥', quantity: 152, unit: '吨', price: 480, amount: 72960, status: '待确认', orderDate: '2026-01-01', expectedDate: '2026-01-01', owner: '张采购', contract: 'CGHT-2026-180' },
    { id: 'po1114', code: 'CG-2026-461', supplier: '安达机械租赁', project: '城南商业综合体', material: 'HRB400螺纹钢', quantity: 165, unit: '吨', price: 3650, amount: 602250, status: '已下单', orderDate: '2026-01-02', expectedDate: '2026-01-02', owner: '张采购', contract: 'CGHT-2026-181' },
    { id: 'po1121', code: 'CG-2026-470', supplier: '水利材料厂', project: '城北学校扩建工程', material: '预制混凝土板', quantity: 159, unit: '块', price: 220, amount: 34980, status: '已下单', orderDate: '2026-02-01', expectedDate: '2026-02-01', owner: '张采购', contract: 'CGHT-2026-185' },
    { id: 'po1122', code: 'CG-2026-471', supplier: '广丰设备租赁', project: '城北学校扩建工程', material: '土工膜', quantity: 172, unit: '㎡', price: 220, amount: 37840, status: '部分到货', orderDate: '2026-02-02', expectedDate: '2026-02-02', owner: '张采购', contract: 'CGHT-2026-186' },
    { id: 'po1129', code: 'CG-2026-480', supplier: '监测设备公司', project: '滨江景观带工程', material: '河沙', quantity: 166, unit: 'm³', price: 220, amount: 36520, status: '部分到货', orderDate: '2026-03-01', expectedDate: '2026-03-01', owner: '张采购', contract: 'CGHT-2026-190' },
    { id: 'po1130', code: 'CG-2026-481', supplier: '华源水泥集团', project: '滨江景观带工程', material: '碎石', quantity: 179, unit: 'm³', price: 220, amount: 39380, status: '已收货', orderDate: '2026-03-02', expectedDate: '2026-03-02', owner: '张采购', contract: 'CGHT-2026-191' },
    { id: 'po1137', code: 'CG-2026-490', supplier: '安达机械租赁', project: '城东物流园工程', material: '防渗材料', quantity: 173, unit: '㎡', price: 220, amount: 38060, status: '已收货', orderDate: '2026-04-01', expectedDate: '2026-04-01', owner: '张采购', contract: 'CGHT-2026-195' },
    { id: 'po1138', code: 'CG-2026-491', supplier: '恒信钢材集团', project: '城东物流园工程', material: '钢结构构件', quantity: 186, unit: '吨', price: 6800, amount: 1264800, status: '待确认', orderDate: '2026-04-02', expectedDate: '2026-04-02', owner: '张采购', contract: 'CGHT-2026-196' },
  ];

  // 收料入库
  collections['materialReceiving'] = [
    { id: 'mr1', project: '南水北调支线渠系工程', code: 'RK-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 200, unit: '吨', date: '2026-08-05' },
    { id: 'mr2', project: '清河水库除险加固工程', code: 'RK-2026-002', supplier: '恒信钢材集团', material: 'HRB400螺纹钢', quantity: 50, unit: '吨', date: '2026-08-12' },
    { id: 'mr1001', code: 'RK-2026-201', supplier: '华北建材有限公司', project: '清河水库除险加固工程', material: 'HRB400螺纹钢', quantity: 47, unit: '吨', date: '2026-01-03' },
    { id: 'mr1006', code: 'RK-2026-211', supplier: '水利材料厂', project: '南水北调支线渠系工程', material: '河沙', quantity: 56, unit: 'm³', date: '2026-02-03' },
    { id: 'mr1012', code: 'RK-2026-220', supplier: '华北建材有限公司', project: '城市防洪堤加固工程', material: '防渗材料', quantity: 48, unit: '㎡', date: '2026-03-02' },
    { id: 'mr1013', code: 'RK-2026-221', supplier: '监测设备公司', project: '城市防洪堤加固工程', material: '钢结构构件', quantity: 65, unit: '吨', date: '2026-03-03' },
    { id: 'mr1019', code: 'RK-2026-230', supplier: '水利材料厂', project: '流域综合治理工程', material: 'HRB400螺纹钢', quantity: 57, unit: '吨', date: '2026-04-02' },
    { id: 'mr1020', code: 'RK-2026-231', supplier: '安达机械租赁', project: '流域综合治理工程', material: '预制混凝土板', quantity: 74, unit: '块', date: '2026-04-03' },
    { id: 'mr1026', code: 'RK-2026-240', supplier: '监测设备公司', project: '农田水利灌溉工程', material: '河沙', quantity: 66, unit: 'm³', date: '2026-05-02' },
    { id: 'mr1027', code: 'RK-2026-241', supplier: '广丰设备租赁', project: '农田水利灌溉工程', material: '碎石', quantity: 83, unit: 'm³', date: '2026-05-03' },
    { id: 'mr1034', code: 'RK-2026-250', supplier: '安达机械租赁', project: '湿地公园水系工程', material: '钢结构构件', quantity: 75, unit: '吨', date: '2026-06-02' },
    { id: 'mr1035', code: 'RK-2026-251', supplier: '华源水泥集团', project: '湿地公园水系工程', material: 'P.O42.5水泥', quantity: 92, unit: '吨', date: '2026-06-03' },
    { id: 'mr1042', code: 'RK-2026-260', supplier: '广丰设备租赁', project: '污水处理厂升级工程', material: '预制混凝土板', quantity: 84, unit: '块', date: '2026-07-02' },
    { id: 'mr1043', code: 'RK-2026-261', supplier: '恒信钢材集团', project: '污水处理厂升级工程', material: '土工膜', quantity: 101, unit: '㎡', date: '2026-07-03' },
    { id: 'mr1050', code: 'RK-2026-270', supplier: '华源水泥集团', project: '跨河大桥水文监测站', material: '碎石', quantity: 93, unit: 'm³', date: '2026-08-02' },
    { id: 'mr1051', code: 'RK-2026-271', supplier: '华北建材有限公司', project: '跨河大桥水文监测站', material: '防渗材料', quantity: 110, unit: '㎡', date: '2026-08-03' },
    { id: 'mr1058', code: 'RK-2026-280', supplier: '恒信钢材集团', project: '滨江生态廊道工程', material: 'P.O42.5水泥', quantity: 102, unit: '吨', date: '2026-01-02' },
    { id: 'mr1059', code: 'RK-2026-281', supplier: '水利材料厂', project: '滨江生态廊道工程', material: 'HRB400螺纹钢', quantity: 119, unit: '吨', date: '2026-01-03' },
    { id: 'mr1066', code: 'RK-2026-290', supplier: '华北建材有限公司', project: '灌区现代化改造工程', material: '土工膜', quantity: 111, unit: '㎡', date: '2026-02-02' },
    { id: 'mr1067', code: 'RK-2026-291', supplier: '监测设备公司', project: '灌区现代化改造工程', material: '河沙', quantity: 128, unit: 'm³', date: '2026-02-03' },
    { id: 'mr1074', code: 'RK-2026-300', supplier: '水利材料厂', project: '山区小型水库建设', material: '防渗材料', quantity: 120, unit: '㎡', date: '2026-03-02' },
    { id: 'mr1075', code: 'RK-2026-301', supplier: '安达机械租赁', project: '山区小型水库建设', material: '钢结构构件', quantity: 137, unit: '吨', date: '2026-03-03' },
    { id: 'mr1082', code: 'RK-2026-310', supplier: '监测设备公司', project: '城南地铁站项目', material: 'HRB400螺纹钢', quantity: 129, unit: '吨', date: '2026-04-02' },
    { id: 'mr1083', code: 'RK-2026-311', supplier: '广丰设备租赁', project: '城南地铁站项目', material: '预制混凝土板', quantity: 146, unit: '块', date: '2026-04-03' },
    { id: 'mr1087', code: 'RK-2026-320', supplier: '安达机械租赁', project: '滨江大桥工程', material: '河沙', quantity: 138, unit: 'm³', date: '2026-05-02' },
    { id: 'mr1088', code: 'RK-2026-321', supplier: '华源水泥集团', project: '滨江大桥工程', material: '碎石', quantity: 155, unit: 'm³', date: '2026-05-03' },
    { id: 'mr1093', code: 'RK-2026-330', supplier: '广丰设备租赁', project: '地铁3号线二期土建', material: '钢结构构件', quantity: 147, unit: '吨', date: '2026-06-02' },
    { id: 'mr1094', code: 'RK-2026-331', supplier: '恒信钢材集团', project: '地铁3号线二期土建', material: 'P.O42.5水泥', quantity: 164, unit: '吨', date: '2026-06-03' },
    { id: 'mr1101', code: 'RK-2026-340', supplier: '华源水泥集团', project: '高铁站交通枢纽', material: '预制混凝土板', quantity: 156, unit: '块', date: '2026-07-02' },
    { id: 'mr1102', code: 'RK-2026-341', supplier: '华北建材有限公司', project: '高铁站交通枢纽', material: '土工膜', quantity: 173, unit: '㎡', date: '2026-07-03' },
    { id: 'mr1109', code: 'RK-2026-350', supplier: '恒信钢材集团', project: '城北新区道路改造', material: '碎石', quantity: 165, unit: 'm³', date: '2026-08-02' },
    { id: 'mr1110', code: 'RK-2026-351', supplier: '水利材料厂', project: '城北新区道路改造', material: '防渗材料', quantity: 182, unit: '㎡', date: '2026-08-03' },
    { id: 'mr1117', code: 'RK-2026-360', supplier: '华北建材有限公司', project: '城南商业综合体', material: 'P.O42.5水泥', quantity: 174, unit: '吨', date: '2026-01-02' },
    { id: 'mr1118', code: 'RK-2026-361', supplier: '监测设备公司', project: '城南商业综合体', material: 'HRB400螺纹钢', quantity: 191, unit: '吨', date: '2026-01-03' },
    { id: 'mr1125', code: 'RK-2026-370', supplier: '水利材料厂', project: '城北学校扩建工程', material: '土工膜', quantity: 183, unit: '㎡', date: '2026-02-02' },
    { id: 'mr1126', code: 'RK-2026-371', supplier: '安达机械租赁', project: '城北学校扩建工程', material: '河沙', quantity: 200, unit: 'm³', date: '2026-02-03' },
    { id: 'mr1133', code: 'RK-2026-380', supplier: '监测设备公司', project: '滨江景观带工程', material: '防渗材料', quantity: 192, unit: '㎡', date: '2026-03-02' },
    { id: 'mr1134', code: 'RK-2026-381', supplier: '广丰设备租赁', project: '滨江景观带工程', material: '钢结构构件', quantity: 209, unit: '吨', date: '2026-03-03' },
    { id: 'mr1141', code: 'RK-2026-390', supplier: '安达机械租赁', project: '城东物流园工程', material: 'HRB400螺纹钢', quantity: 201, unit: '吨', date: '2026-04-02' },
    { id: 'mr1142', code: 'RK-2026-391', supplier: '华源水泥集团', project: '城东物流园工程', material: '预制混凝土板', quantity: 218, unit: '块', date: '2026-04-03' },
  ];

  // 物资管理
  collections['materialDiscount'] = [
    { id: 'md1', project: '南水北调支线渠系工程', code: 'ZK-2026-001', material: 'P.O42.5水泥', discount: 0.95, amount: 120000, date: '2026-08-01' },
    { id: 'md2', project: '清河水库除险加固工程', code: 'ZK-2026-002', material: '河沙', discount: 0.92, amount: 45000, date: '2026-08-10' },
  ];

  collections['materialIssue'] = [
    { id: 'mi1', code: 'LK-2026-001', project: '城南地铁站项目', team: '钢筋班组', material: 'HRB400螺纹钢', quantity: 30, unit: '吨', date: '2026-08-06' },
    { id: 'mi2', code: 'LK-2026-002', project: '滨江大桥工程', team: '混凝土班组', material: 'P.O42.5水泥', quantity: 120, unit: '吨', date: '2026-08-11' },
  ];

  collections['materialDirect'] = [
    { id: 'mdr1', code: 'ZR-2026-001', supplier: '华北建材有限公司', project: '城南地铁站项目', material: 'P.O42.5水泥', quantity: 60, unit: '吨', date: '2026-08-08' },
  ];

  collections['materialTransferOut'] = [
    { id: 'mto1', project: '清河水库除险加固工程', code: 'DC-2026-001', fromWarehouse: '城南一号仓', toWarehouse: '滨江材料仓', material: 'HRB400螺纹钢', quantity: 15, unit: '吨', date: '2026-08-09' },
  ];

  collections['materialTransferIn'] = [
    { id: 'mti1', project: '清河水库除险加固工程', code: 'DR-2026-001', fromWarehouse: '城南一号仓', toWarehouse: '滨江材料仓', material: 'HRB400螺纹钢', quantity: 15, unit: '吨', date: '2026-08-09' },
  ];

  collections['materialReturn'] = [
    { id: 'mrt1', code: 'TK-2026-001', project: '城南地铁站项目', team: '钢筋班组', material: '河沙', quantity: 5, unit: 'm³', date: '2026-08-12' },
  ];

  collections['materialReturnSupplier'] = [
    { id: 'mrs1', project: '南水北调支线渠系工程', code: 'TH-2026-001', supplier: '华北建材有限公司', material: 'P.O42.5水泥', quantity: 8, unit: '吨', reason: '检验不合格', date: '2026-08-13' },
  ];

  collections['warehouses'] = [
    { id: 'wh1', project: '城南地铁站项目', name: '城南一号仓', code: 'CK-001', keeper: '李材料', location: '城南地铁站项目部', capacity: 5000 },
    { id: 'wh2', project: '滨江大桥工程', name: '滨江材料仓', code: 'CK-002', keeper: '赵仓库', location: '滨江大桥项目部', capacity: 8000 },
  ];

  collections['inventories'] = [
    { id: 'in1', project: '城南地铁站项目', name: '城南一号仓8月盘点', warehouse: '城南一号仓', date: '2026-08-15', status: '盘点中' },
    { id: 'in2', project: '滨江大桥工程', name: '滨江材料仓7月盘点', warehouse: '滨江材料仓', date: '2026-07-31', status: '已确认' },
  ];

  collections['slowMovingMaterials'] = [
    { id: 'sm1', project: '清河水库除险加固工程', material: 'HRB400螺纹钢Φ32', quantity: 20, days: 160, solution: '调拨', status: '处理中' },
    { id: 'sm2', project: '流域综合治理工程', material: '旧模板', quantity: 300, days: 220, solution: '报废', status: '待处理' },
  ];

  collections['materialLedgers'] = [
    { id: 'ml1', project: '城南地铁站项目', name: '城南地铁站7月台账', type: '需用计划明细', date: '2026-07-31' },
    { id: 'ml2', project: '滨江大桥工程', name: '滨江大桥钢筋库存台账', type: '库存台账', date: '2026-08-14' },
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
    { id: 'rm1', title: '出差差旅费报销', applicant: '周海涛', type: '差旅费', amount: 3600, date: '2026-08-11', status: '待审批' },
    { id: 'rm2', title: '办公用品采购报销', applicant: '李材料', type: '办公费', amount: 1200, date: '2026-08-02', status: '已批准' },
    { id: 'rm3', title: '设备维修费报销', applicant: '张机械', type: '其他', amount: 15000, date: '2026-08-08', status: '待审批' },
    { id: 'rm4', title: '孙强出差差旅费报销', applicant: '孙强', type: '差旅费', amount: 2800, date: '2026-08-14', status: '待审批' },
    { id: 'rm5', title: '质量检测费报销', applicant: '吴刚', type: '交通费', amount: 4500, date: '2026-08-07', status: '已批准' },
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
    { id: 'st1', name: '陈国强', department: '工程管理部', position: '项目经理', gender: '男', birthDate: '1978-05-12', education: '本科', phone: '13811110001', hireDate: '2018-03-01', status: '在职' },
    { id: 'st2', name: '周海涛', department: '工程管理部', position: '项目总工', gender: '男', birthDate: '1985-09-23', education: '本科', phone: '13811110002', hireDate: '2019-06-15', status: '在职' },
    { id: 'st3', name: '王安全', department: '安全管理部', position: '安全员', gender: '男', birthDate: '1990-11-02', education: '大专', phone: '13811110003', hireDate: '2020-01-10', status: '在职' },
    { id: 'st4', name: '张伟', department: '工程管理部', position: '项目经理', gender: '男', birthDate: '1982-03-15', education: '本科', phone: '13800000001', hireDate: '2017-05-20', status: '在职' },
    { id: 'st5', name: '李明', department: '工程管理部', position: '技术负责人', gender: '男', birthDate: '1988-07-30', education: '硕士及以上', phone: '13800000002', hireDate: '2019-09-01', status: '在职' },
    { id: 'st6', name: '王磊', department: '市场经营部', position: '商务经理', gender: '男', birthDate: '1986-12-08', education: '本科', phone: '13800000003', hireDate: '2020-03-15', status: '在职' },
    { id: 'st7', name: '赵丽', department: '财务管理部', position: '财务主管', gender: '女', birthDate: '1990-01-20', education: '本科', phone: '13800000004', hireDate: '2018-07-01', status: '在职' },
    { id: 'st8', name: '孙强', department: '安全管理部', position: '安全员', gender: '男', birthDate: '1993-04-05', education: '大专', phone: '13800000005', hireDate: '2021-02-10', status: '在职' },
    { id: 'st9', name: '周芳', department: '物资管理部', position: '材料员', gender: '女', birthDate: '1992-08-16', education: '大专', phone: '13800000006', hireDate: '2020-06-01', status: '在职' },
    { id: 'st10', name: '吴刚', department: '质量管理部', position: '质检员', gender: '男', birthDate: '1991-10-11', education: '大专', phone: '13800000007', hireDate: '2021-08-15', status: '在职' },
    { id: 'st11', name: '郑敏', department: '综合管理部', position: '行政专员', gender: '女', birthDate: '1995-06-28', education: '本科', phone: '13800000008', hireDate: '2022-01-10', status: '在职' },
    { id: 'st12', name: '刘工', department: '城南地铁站项目部', position: '施工员', gender: '男', birthDate: '1989-12-03', education: '高中/中专', phone: '13800000009', hireDate: '2023-04-01', status: '在职' },
    { id: 'st13', name: '马师傅', department: '滨江大桥项目部', position: '班组长', gender: '男', birthDate: '1984-02-19', education: '初中及以下', phone: '13800000010', hireDate: '2022-09-01', status: '在职' },
    { id: 'st14', name: '钱建国', department: '工程管理部', position: '项目副经理', gender: '男', birthDate: '1975-08-07', education: '本科', phone: '13800000011', hireDate: '2016-11-20', status: '在职' },
    { id: 'st15', name: '孙建国', department: '工程管理部', position: '施工队长', gender: '男', birthDate: '1987-05-25', education: '高中/中专', phone: '13800000012', hireDate: '2021-05-01', status: '在职' },
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
  collections['riskLedgers'] = [
    { id: 'rl1', name: '深基坑开挖边坡坍塌', project: '城南地铁站项目', category: '施工', source: '深基坑开挖支护不到位易引发坍塌', level: '重大', method: '直接评定法', measures: '专项支护方案、分层开挖、及时支护、监测预警', monitor: '基坑位移/沉降自动化监测', owner: '王安全', status: '受控', updateDate: '2026-08-01' },
    { id: 'rl2', name: '隧洞爆破作业', project: '南水北调支线渠系工程', category: '施工', source: '火工品使用不当、爆破飞石', level: '重大', method: '直接评定法', measures: '爆破专项方案、警戒区设置、专人看管火工品', monitor: '爆破振动监测', owner: '孙强', status: '受控', updateDate: '2026-07-20' },
    { id: 'rl3', name: '围堰及导流明渠度汛', project: '流域综合治理工程', category: '施工', source: '汛期洪水超标准、围堰漫顶溃决', level: '重大', method: 'LS风险矩阵法', measures: '编制度汛方案、储备防汛物资、汛期值守', monitor: '水位/流量实时监测', owner: '陈国强', status: '预警', updateDate: '2026-08-10' },
    { id: 'rl4', name: '起重吊装作业', project: '滨江大桥工程', category: '设施设备', source: '塔吊吊物坠落、超载倾覆', level: '较大', method: 'LEC作业条件危险性评价法', measures: '持证上岗、吊装令制度、班前检查、限位保护', monitor: '吊装荷载视频监控', owner: '张机械', status: '受控', updateDate: '2026-08-03' },
    { id: 'rl5', name: '高处临边作业', project: '滨江大桥工程', category: '作业环境', source: '临边防护缺失、人员未系安全带坠落', level: '较大', method: 'LEC作业条件危险性评价法', measures: '设置临边护栏、安全网、安全带双钩', monitor: '现场巡查+视频', owner: '王安全', status: '受控', updateDate: '2026-08-06' },
    { id: 'rl6', name: '临时用电', project: '高铁站交通枢纽', category: '设施设备', source: '三级配电两级保护不到位引发触电', level: '较大', method: '安全检查表法', measures: '三级配电两级保护、漏电保护器、电工持证', monitor: '定期巡检+绝缘检测', owner: '孙强', status: '预警', updateDate: '2026-08-13' },
    { id: 'rl7', name: '有限空间作业', project: '地铁3号线二期土建', category: '作业环境', source: '缺氧、有毒气体积聚', level: '较大', method: 'LEC作业条件危险性评价法', measures: '先通风再检测后作业、专人监护、应急救援', monitor: '气体检测仪实时监测', owner: '孙强', status: '受控', updateDate: '2026-08-12' },
    { id: 'rl8', name: '脚手架搭设与拆除', project: '城南商业综合体', category: '施工', source: '架体失稳、人员高处坠落', level: '一般', method: '安全检查表法', measures: '专项方案、验收挂牌、荷载控制', monitor: '架体变形监测', owner: '王安全', status: '受控', updateDate: '2026-08-09' },
    { id: 'rl9', name: '混凝土模板支撑体系', project: '城北新区道路改造', category: '施工', source: '支撑体系失稳坍塌', level: '一般', method: 'LS风险矩阵法', measures: '专项方案、分层浇筑、拆模审批', monitor: '沉降观测', owner: '周海涛', status: '受控', updateDate: '2026-08-11' },
    { id: 'rl10', name: '汛期河道内施工', project: '流域综合治理工程', category: '作业环境', source: '洪水突涨、人员设备被困', level: '较大', method: '直接评定法', measures: '避开主汛期、撤离路线演练、水位预警联动', monitor: '水雨情信息平台', owner: '陈国强', status: '预警', updateDate: '2026-08-10' },
    { id: 'rl11', name: '施工机械车辆运输', project: '城北新区道路改造', category: '设施设备', source: '场内车辆伤害、机械伤人', level: '一般', method: '安全检查表法', measures: '人车分流、限速标识、专人指挥', monitor: '场内交通巡查', owner: '孙强', status: '受控', updateDate: '2026-08-11' },
    { id: 'rl12', name: '危化品及火工品库房存放', project: '南水北调支线渠系工程', category: '管理体系', source: '存放不当引发爆炸火灾', level: '重大', method: '直接评定法', measures: '专库存放、双人双锁、台账管理、消防设施', monitor: '温湿度+视频监控', owner: '孙强', status: '受控', updateDate: '2026-07-20' },
    { id: 'rl13', name: '安全教育培训不到位', project: '全集团在建项目', category: '人员行为', source: '工人安全意识薄弱、违章作业', level: '低风险', method: '安全检查表法', measures: '三级安全教育、班前讲话、警示教育', monitor: '培训台账核查', owner: '王安全', status: '受控', updateDate: '2026-08-12' },
    { id: 'rl14', name: '办公区及生活区消防安全', project: '全集团在建项目', category: '管理体系', source: '电气火灾、疏散通道堵塞', level: '低风险', method: '安全检查表法', measures: '灭火器配备、疏散演练、用电管理', monitor: '消防巡检', owner: '王安全', status: '受控', updateDate: '2026-08-09' },
    { id: 'rl15', name: '施工扬尘与噪声', project: '城北新区道路改造', category: '作业环境', source: '扬尘污染、噪声扰民', level: '低风险', method: '安全检查表法', measures: '洒水降尘、围挡封闭、合理安排作业时间', monitor: '环境监测', owner: '孙强', status: '受控', updateDate: '2026-08-11' },
  ];

  collections['emergencyPlans'] = [
    { id: 'ep1', name: '集团生产安全事故综合应急预案', type: '综合应急预案', scene: '全集团生产安全事故总体处置', responsible: '陈国强', drillDate: '2026-06-20', drillStatus: '已演练', content: '应急组织体系、响应分级、信息报告、资源保障' },
    { id: 'ep2', name: '基坑坍塌专项应急预案', type: '专项应急预案', scene: '深基坑开挖坍塌', responsible: '王安全', drillDate: '2026-05-18', drillStatus: '已演练', content: '先撤人后支护、坍塌救援、变形监测联动' },
    { id: 'ep3', name: '防汛度汛专项应急预案', type: '专项应急预案', scene: '汛期洪水超标准、围堰漫顶', responsible: '陈国强', drillDate: '2026-07-30', drillStatus: '已演练', content: '汛情预警、人员撤离、堤防抢护、物资调度' },
    { id: 'ep4', name: '隧洞爆破现场处置方案', type: '现场处置方案', scene: '隧洞爆破作业', responsible: '孙强', drillDate: '', drillStatus: '待演练', content: '盲炮处理、飞石伤人处置、警戒解除程序' },
    { id: 'ep5', name: '有限空间作业现场处置方案', type: '现场处置方案', scene: '有限空间中毒窒息', responsible: '孙强', drillDate: '2026-08-15', drillStatus: '已演练', content: '先通风检测、严禁盲目施救、佩戴呼吸器救援' },
    { id: 'ep6', name: '起重伤害现场处置方案', type: '现场处置方案', scene: '起重吊装吊物坠落', responsible: '张机械', drillDate: '', drillStatus: '待演练', content: '停机断电、伤员救治、事故报告' },
  ];

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
    { id: 'qi3', title: '清河水库大坝面板混凝土平整度检查', project: '清河水库除险加固工程', inspector: '吴刚', date: '2026-08-16', issues: '局部板面平整度偏差3mm，要求打磨修整', status: '待整改' },
    { id: 'qi4', title: '南水北调渠道衬砌板厚度抽检', project: '南水北调支线渠系工程', inspector: '周海涛', date: '2026-08-15', issues: '衬砌板厚度满足设计，观感良好', status: '已完成' },
    { id: 'qi5', title: '湿地公园水系工程防渗膜焊缝质量检查', project: '湿地公园水系工程', inspector: '吴刚', date: '2026-08-12', issues: '个别焊缝搭接宽度不足，安排补焊', status: '整改中' },
    { id: 'qi6', title: '跨河大桥支座安装质量专项检查', project: '跨河大桥水文监测站', inspector: '周海涛', date: '2026-08-18', issues: '支座标高偏差在允许范围内，质量合格', status: '已完成' },
  ];

  collections['qualityTrainings'] = [
    { id: 'qtn1', title: '混凝土施工质量控制要点', trainer: '周海涛', date: '2026-08-09', participants: 28, content: '混凝土浇筑、养护及验收标准' },
    { id: 'qtn2', title: '防水工程渗漏防控与验收标准', trainer: '吴刚', date: '2026-08-14', participants: 22, content: '防水卷材铺贴工艺、渗漏试验、质量验收' },
    { id: 'qtn3', title: '测量放线精度控制培训', trainer: '外部讲师', date: '2026-09-05', participants: 18, content: '全站仪使用、高程控制网复测、轴线偏差控制' },
  ];

  collections['qualityPunishments'] = [
    { id: 'qps1', code: 'ZLCF-2026-001', project: '城南地铁站项目', person: '孙建', reason: '钢筋搭接长度不足', amount: 400, date: '2026-08-13' },
    { id: 'qps2', code: 'ZLCF-2026-002', project: '湿地公园水系工程', person: '张班组', reason: '防渗膜焊缝搭接宽度不足', amount: 600, date: '2026-08-13' },
    { id: 'qps3', code: 'ZLCF-2026-003', project: '清河水库除险加固工程', person: '李技术', reason: '混凝土养护记录填写不及时', amount: 300, date: '2026-08-17' },
  ];

  collections['qualityRewards'] = [
    { id: 'qrw1', code: 'ZLJL-2026-001', project: '滨江大桥工程', person: '张班组', reason: '墩柱外观质量优良', amount: 1000, date: '2026-08-06' },
    { id: 'qrw2', code: 'ZLJL-2026-002', project: '清河水库除险加固工程', person: '刘工', reason: '面板平整度控制优良', amount: 1500, date: '2026-08-15' },
    { id: 'qrw3', code: 'ZLJL-2026-003', project: '跨河大桥水文监测站', person: '马师傅', reason: '支座安装一次验收合格', amount: 2000, date: '2026-08-19' },
  ];

  collections['qualityAccidents'] = [
    { id: 'qac1', title: '滨江大桥墩柱混凝土裂缝', project: '滨江大桥工程', level: '一般', date: '2026-07-18', description: '养护不到位产生收缩裂缝，已制定修补方案' },
    { id: 'qac2', title: '南水北调渠道衬砌板局部空鼓', project: '南水北调支线渠系工程', level: '一般', date: '2026-08-02', description: '局部衬砌板与基层结合不密实，已返工处理' },
  ];

  collections['qualityDefects'] = [
    { id: 'qd1', name: '混凝土蜂窝麻面', position: '墩柱/墙板浇筑面', cause: '振捣不密实、模板拼缝漏浆', measure: '加强振捣、严控坍落度、模板缝隙封堵', status: '已防治', date: '2026-08-05', project: '滨江大桥工程' },
    { id: 'qd2', name: '防水层渗漏', position: '地下室底板/屋面', cause: '卷材搭接不牢、基层潮湿', measure: '热熔满粘、搭接宽度≥100mm、基层干燥处理', status: '防治中', date: '2026-08-10', project: '湿地公园水系工程' },
    { id: 'qd3', name: '钢筋间距/保护层偏差', position: '梁柱节点', cause: '箍筋绑扎不到位、垫块缺失', measure: '钢筋定位卡具、加密垫块、隐蔽验收', status: '防治中', date: '2026-08-12', project: '城南地铁站项目' },
    { id: 'qd4', name: '抹灰空鼓开裂', position: '室内墙面', cause: '基层处理不当、养护不足', measure: '甩浆拉毛、分层抹压、喷水养护', status: '已防治', date: '2026-08-08', project: '城北学校扩建工程' },
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
    { id: 'lg3', operator: 'manager', action: '修改施工进度', module: '项目管理', date: '2026-08-15' },
    { id: 'lg4', operator: '赵丽', action: '审核差旅报销单', module: '财务管理', date: '2026-08-15' },
    { id: 'lg5', operator: '王磊', action: '更新商机推进阶段', module: '市场经营', date: '2026-08-14' },
    { id: 'lg6', operator: '周海涛', action: '发起质量检查整改', module: '质量管理', date: '2026-08-13' },
    { id: 'lg7', operator: '王安全', action: '登记危险源风险', module: '安全管理', date: '2026-08-12' },
    { id: 'lg8', operator: 'admin', action: '发布系统公告', module: '平台中心', date: '2026-08-18' },
    { id: 'lg9', operator: '郑敏', action: '更新员工档案', module: '人力资源', date: '2026-08-16' },
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

  // 组织架构（重构后：集团公司下设总经办/分公司组/子公司组/号码公司组/项目部组）
  collections['departments'] = [
    // ── 集团 ──
    { id: 'group', name: '集团公司', code: 'GRP', parentId: null, leader: '', phone: '', description: '集团公司', sortOrder: 0 },

    // ── 核心决策层 ──
    { id: 'board', name: '董事会/长', code: 'BOARD', parentId: 'group', leader: 'admin', phone: '13800000000', description: '最高决策机构', sortOrder: 0 },
    { id: 'gm-office', name: '总经办', code: 'GM-OFF', parentId: 'group', leader: 'manager', phone: '13800000099', description: '总经理日常管理', sortOrder: 1 },

    // ── 总经办直辖（副总C前移至三总师前）──
    { id: 'office', name: '办公室', code: 'OFFICE', parentId: 'gm-office', leader: '周芳', phone: '13900001006', description: '总经办直辖办公室', sortOrder: 0 },

    // ── 副总经理A分管 ──
    { id: 'dgm-a', name: '副总经理A', code: 'DGM-A', parentId: 'gm-office', leader: '张伟', phone: '13900001001', description: '分管工程、财务、安全、合同', sortOrder: 1 },
    { id: 'eng-mgmt', name: '工程管理部', code: 'ENG', parentId: 'dgm-a', leader: '王磊', phone: '13900001003', description: '负责工程管理', sortOrder: 0 },
    { id: 'finance', name: '财务部', code: 'FIN', parentId: 'dgm-a', leader: '赵丽', phone: '13900001004', description: '负责财务管理', sortOrder: 1 },
    { id: 'safety', name: '安全生产部', code: 'SAF', parentId: 'dgm-a', leader: '孙强', phone: '13900001005', description: '负责安全生产管理', sortOrder: 2 },
    { id: 'contract', name: '合同管理部', code: 'CON', parentId: 'dgm-a', leader: '朱商务', phone: '13900012003', description: '负责合同管理', sortOrder: 3 },

    // ── 副总经理B分管 ──
    { id: 'dgm-b', name: '副总经理B', code: 'DGM-B', parentId: 'gm-office', leader: '李明', phone: '13900001002', description: '分管人力、审计', sortOrder: 2 },
    { id: 'hr', name: '人力资源部', code: 'HR', parentId: 'dgm-b', leader: '李明', phone: '13900001002', description: '负责人力资源管理', sortOrder: 0 },
    { id: 'audit', name: '审计部', code: 'AUD', parentId: 'dgm-b', leader: '郑敏', phone: '13900001008', description: '负责审计监督', sortOrder: 1 },

    // ── 副总经理C分管（前移至三总师前）──
    { id: 'dgm-c', name: '副总经理C', code: 'DGM-C', parentId: 'gm-office', leader: '刘市场', phone: '13900001009', description: '分管市场、运维', sortOrder: 3 },
    { id: 'market-dev', name: '市场开发部', code: 'MKT', parentId: 'dgm-c', leader: '刘市场', phone: '13900001009', description: '负责市场开拓与开发', sortOrder: 0 },
    { id: 'ops', name: '运维部', code: 'OPS', parentId: 'dgm-c', leader: '吕客服', phone: '13900012007', description: '负责运维服务', sortOrder: 1 },

    // ── 三总师 ──
    { id: 'chief-eng', name: '三总师', code: 'CHIEF', parentId: 'gm-office', leader: '', phone: '', description: '技术/专业线指导', sortOrder: 4 },

    // ── 分公司组（新增分组容器，直属集团）──
    { id: 'branch-group', name: '分公司', code: 'BR-GROUP', parentId: 'group', leader: '钱建国', phone: '13800000011', description: '分公司组', sortOrder: 2 },
    { id: 'branch-a', name: '分公司A', code: 'BR-A', parentId: 'branch-group', leader: '钱建国', phone: '13800000011', description: '分公司A', sortOrder: 0 },
    { id: 'branch-b', name: '分公司B', code: 'BR-B', parentId: 'branch-group', leader: '陈国强', phone: '13811110001', description: '分公司B', sortOrder: 1 },
    { id: 'branch-c', name: '分公司C', code: 'BR-C', parentId: 'branch-group', leader: '周海涛', phone: '13811110002', description: '分公司C', sortOrder: 2 },

    // ── 子公司组（新增分组容器，直属集团）──
    { id: 'sub-group', name: '子公司', code: 'SUB-GROUP', parentId: 'group', leader: '孙建国', phone: '13800000012', description: '子公司组', sortOrder: 3 },
    { id: 'sub-alpha', name: '子公司甲', code: 'SUB-A', parentId: 'sub-group', leader: '孙建国', phone: '13800000012', description: '子公司甲', sortOrder: 0 },
    { id: 'sub-beta', name: '子公司乙', code: 'SUB-B', parentId: 'sub-group', leader: '', phone: '', description: '子公司乙', sortOrder: 1 },

    // ── 号码公司组（新增分组容器，直属集团）──
    { id: 'co-group', name: '号码公司', code: 'CO-GROUP', parentId: 'group', leader: '钱建国', phone: '13800000011', description: '号码公司组（一/二/三公司）', sortOrder: 4 },
    { id: 'co-1', name: '一公司', code: 'CO-1', parentId: 'co-group', leader: '钱建国', phone: '13800000011', description: '一公司', sortOrder: 0 },
    { id: 'co-2', name: '二公司', code: 'CO-2', parentId: 'co-group', leader: '陈国强', phone: '13811110001', description: '二公司', sortOrder: 1 },
    { id: 'co-3', name: '三公司', code: 'CO-3', parentId: 'co-group', leader: '周海涛', phone: '13811110002', description: '三公司', sortOrder: 2 },

    // ── 项目部组（直属集团，下设各实际工程项目部）──
    { id: 'group_proj', name: '项目部', code: 'PROJ-GROUP', parentId: 'group', leader: '', phone: '', description: '项目部组（直属集团）', sortOrder: 5 },
  ];

  // ── 为每个实际工程项目创建对应的项目部（确保与 projectArchives 一一对应，修复不匹配）──
  for (const pa of collections['projectArchives'] || []) {
    const deptId = `project-${pa.id}`;
    if (!collections['departments'].some((d: any) => d.id === deptId)) {
      collections['departments'].push({
        id: deptId,
        name: pa.name,
        code: `PROJ-${pa.id.toUpperCase()}`,
        parentId: 'group_proj',
        leader: pa.manager || '',
        phone: '',
        description: `${pa.name}项目部`,
        sortOrder: 10,
      });
    }
  }
  // 项目部组按真实工程项目细分：每项目一子组（简称_项目群），便于通讯录按项目展开
  const projGroup = (collections['chatGroups'] as any[])?.find((g: any) => g.id === 'group_proj');
  if (projGroup) {
    // 父组清空直属部门，成员由子组聚合（避免重复）
    projGroup.departmentIds = [];
    for (const pa of collections['projectArchives'] || []) {
      const deptId = `project-${pa.id}`;
      // 简称：取项目名前4-6字，去掉“工程/项目”等冗余
      const short = pa.name.replace(/工程|项目|建设|改造|加固/g, '').slice(0, 6) || pa.name.slice(0, 4);
      const subId = `sub_proj_${pa.id}`;
      if (!(collections['chatGroups'] as any[]).some((g: any) => g.id === subId)) {
        (collections['chatGroups'] as any[]).push({
          id: subId,
          name: `${short}_项目群`,
          icon: '🏗',
          color: 'emerald',
          sortOrder: (collections['projectArchives'] as any[]).indexOf(pa),
          description: pa.name,
          parentId: 'group_proj',
          departmentIds: [deptId],
        });
      } else {
        const ex = (collections['chatGroups'] as any[]).find((g: any) => g.id === subId);
        if (ex) ex.departmentIds = [deptId];
      }
    }
  }

  // 为每个实际工程项目创建对应的项目群聊（与 projectArchives 一一对应）
  for (const pa of collections['projectArchives'] || []) {
    const deptId = `project-${pa.id}`;
    const groupId = `dg_${deptId}`;
    if (!conversations.some((c: any) => c.departmentId === deptId)) {
      conversations.push({
        id: groupId,
        type: 'group',
        name: `${pa.name}项目群`,
        category: 'department',
        departmentId: deptId,
        members: [pa.manager, 'admin'].filter(Boolean),
        admins: [pa.manager].filter(Boolean),
        owner: pa.manager || 'admin',
      });
    }
  }

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
        // 启动时对齐部门群与部门成员（钉钉/飞书式自动联动）
        this.syncAllDepartmentGroups();
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
    // 启动时对齐部门群与部门成员（钉钉/飞书式自动联动）
    this.syncAllDepartmentGroups();
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
    conv.description = '';
    conv.avatar = '';
    conv.pinnedMessageId = '';
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

  // 会话级用户偏好（置顶/静音/归档/草稿/隐藏），惰性初始化
  getConversationPrefs(conversationId: string, username: string): any {
    const c = this.getConversation(conversationId);
    if (!c) return {};
    if (!c.userPrefs) c.userPrefs = {};
    if (!c.userPrefs[username]) c.userPrefs[username] = {};
    return c.userPrefs[username];
  }

  setConversationPref(conversationId: string, username: string, key: string, value: any) {
    const c = this.getConversation(conversationId);
    if (!c) return null;
    if (!c.userPrefs) c.userPrefs = {};
    if (!c.userPrefs[username]) c.userPrefs[username] = {};
    c.userPrefs[username][key] = value;
    this.save();
    return c.userPrefs[username];
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
    // 按 sortOrder 排序，保证导航不混乱
    const sortTree = (nodes: any[]) => {
      nodes.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      nodes.forEach((n: any) => n.children && sortTree(n.children));
    };
    sortTree(roots);
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

  // 群查看权限：返回用户可见的部门 id 集合（本级 + 全部下级）
  // 超管(admin)与总经理(gm-office)返回全部部门；普通用户按组织树「本级+下级」过滤
  getVisibleDeptIds(username: string): string[] | null {
    const departments = this.getCollectionItems('departments');
    const user = this.getUserByUsername(username);
    if (!user) return null;
    if (user.role === 'super_admin' || user.department === '总经理办公室') {
      return departments.map((d) => d.id);
    }
    const dept = departments.find((d) => d.name === user.department);
    if (!dept) return null;
    return [dept.id, ...this.getDescendantIds(dept.id, departments)];
  }

  // ── 通讯录可见范围（钉钉/飞书式地址簿权限）──
  // - 超管(admin)与总经理办公室(gm-office)：全部部门
  // - 部门负责人(isHead 或部门 leader)：本部门 + 全部下级部门
  // - 普通成员 / 外协人员：仅本部门
  getAddressBookDeptIds(username: string): string[] | null {
    const departments = this.getCollectionItems('departments');
    const user = this.getUserByUsername(username);
    if (!user) return null;
    if (user.role === 'super_admin' || user.department === '总经理办公室') {
      return departments.map((d) => d.id);
    }
    const dept = departments.find((d) => d.name === user.department);
    if (!dept) return null;
    const isDeptLeader = user.isHead === true || dept.leader === username;
    if (isDeptLeader) {
      return [dept.id, ...this.getDescendantIds(dept.id, departments)];
    }
    return [dept.id];
  }

  // 返回用户通讯录可见的部门名集合（用于过滤用户列表）；返回 null 表示无可见范围
  getAddressBookVisibleDeptNames(username: string): Set<string> | null {
    const ids = this.getAddressBookDeptIds(username);
    if (!ids) return null;
    const departments = this.getCollectionItems('departments');
    return new Set(departments.filter((d) => ids.includes(d.id)).map((d) => d.name));
  }

  // 按通讯录可见范围过滤组织树：
  // - 可见部门节点保留完整信息
  // - 含可见后代的不可见节点保留为路径骨架（清空成员/岗位/计数，仅作导航）
  // - 完全不可见的节点移除
  filterOrgTreeByVisible(nodes: any[], visible: Set<string>): any[] {
    const result: any[] = [];
    for (const node of nodes) {
      if (visible.has(node.id)) {
        result.push({ ...node, children: this.filterOrgTreeByVisible(node.children || [], visible) });
      } else {
        const filteredChildren = this.filterOrgTreeByVisible(node.children || [], visible);
        if (filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren,
            positions: [],
            members: [],
            directMembers: [],
            memberCount: 0,
          });
        }
      }
    }
    return result;
  }

  // ── 部门群自动联动（钉钉/飞书式：部门群=本部门直属成员+超管，负责人为群主，负责人/副职为管理员）──

  private getDeptDirectUsernames(deptId: string): string[] {
    const dept = this.getCollectionItems('departments').find((d: any) => d.id === deptId);
    if (!dept) return [];
    return this.users
      .filter((u: any) => u.isActive !== false && u.department === dept.name)
      .map((u: any) => u.username);
  }

  // 同步部门群（不存在则自动创建）：成员/群主/管理员/群名
  syncDepartmentGroup(deptId: string): any {
    const dept = this.getCollectionItems('departments').find((d: any) => d.id === deptId);
    if (!dept) return null;
    const groupId = `dg_${deptId}`;
    let conv = this.conversations.find((c) => c.category === 'department' && c.departmentId === deptId);
    if (!conv) {
      conv = {
        id: groupId,
        type: 'group',
        name: `${dept.name}群`,
        category: 'department',
        departmentId: deptId,
        members: [],
        admins: [],
        owner: dept.leader || '',
        createdAt: new Date().toISOString(),
        description: `${dept.name}部门群`,
        avatar: '',
        pinnedMessageId: '',
      };
      this.conversations.push(conv);
    }
    const direct = this.getDeptDirectUsernames(deptId);
    const superAdmins = this.users
      .filter((u: any) => u.role === 'super_admin' && u.isActive !== false)
      .map((u: any) => u.username);
    const leader = dept.leader;
    const members = Array.from(new Set([...direct, ...superAdmins]));
    const admins = this.users
      .filter((u: any) => u.isActive !== false && u.department === dept.name && (u.isHead || u.isDeputy || u.username === leader))
      .map((u: any) => u.username);
    conv.name = `${dept.name}群`;
    conv.owner = leader || superAdmins[0] || '';
    conv.members = members;
    conv.admins = Array.from(new Set(admins));
    if (conv.id !== groupId) {
      // 历史 id 不一致：迁移为规范 id，并迁移消息
      this.conversations.forEach((c, idx) => { if (c.id === groupId) this.conversations.splice(idx, 1); });
      const oldId = conv.id;
      conv.id = groupId;
      for (const m of this.chatMessages) {
        if (m.conversationId === oldId) m.conversationId = groupId;
      }
    }
    this.save();
    return conv;
  }

  // 用户部门调动/停用/删除时，自动进出部门群
  syncUserDepartmentGroups(oldDepartment: string | undefined, newDepartment: string | undefined, username: string) {
    const departments = this.getCollectionItems('departments');
    const user = this.getUserByUsername(username);
    // 用户停用或删除：从所有部门群移除
    if (!user || user.isActive === false) {
      for (const conv of this.conversations) {
        if (conv.category === 'department') {
          conv.members = conv.members.filter((m: any) => m !== username);
          conv.admins = (conv.admins || []).filter((m: any) => m !== username);
          if (conv.owner === username) conv.owner = '';
        }
      }
      this.save();
      return;
    }
    // 部门调动：重新同步旧部门与新部门的部门群
    const affected = new Set<string>();
    for (const d of departments) {
      if (d.name === oldDepartment || d.name === newDepartment) affected.add(d.id);
    }
    for (const id of affected) this.syncDepartmentGroup(id);
  }

  // 部门改名/负责人变更后同步部门群
  syncDepartmentGroupByName(oldName: string | undefined, deptId: string) {
    const departments = this.getCollectionItems('departments');
    const affected = new Set<string>([deptId]);
    for (const d of departments) {
      if (d.name === oldName) affected.add(d.id);
    }
    for (const id of affected) this.syncDepartmentGroup(id);
  }

  getDepartmentIdByName(name: string): string | undefined {
    const dept = this.getCollectionItems('departments').find((d: any) => d.name === name);
    return dept?.id;
  }

  // 删除部门时清理对应部门群及消息
  removeDepartmentGroup(deptId: string) {
    const groupId = `dg_${deptId}`;
    const groups = this.conversations.filter((c) => c.category === 'department' && c.departmentId === deptId);
    for (const conv of groups) {
      const idx = this.conversations.findIndex((c) => c.id === conv.id);
      if (idx !== -1) this.conversations.splice(idx, 1);
      this.chatMessages = this.chatMessages.filter((m: any) => m.conversationId !== conv.id);
    }
    // 兼容历史非规范 id
    const idx = this.conversations.findIndex((c) => c.id === groupId);
    if (idx !== -1) this.conversations.splice(idx, 1);
    this.chatMessages = this.chatMessages.filter((m: any) => m.conversationId !== groupId);
    this.save();
  }

  // 全量同步所有部门群（初始化/修复数据用）
  syncAllDepartmentGroups() {
    for (const dept of this.getCollectionItems('departments')) {
      this.syncDepartmentGroup(dept.id);
    }
  }
}