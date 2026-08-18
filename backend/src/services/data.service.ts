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
  const conversations = [
    // ── 部门群（category: 'department'）──
    { id: 'dg_hq', type: 'group', name: '集团总部群', category: 'department', departmentId: 'hq', members: ['admin','manager','test1','test2','test3','test4','test5','test6','test7','test8','test49','test50','test51','test52','test53','test54','test55','test56','test57','test58'], owner: 'admin', createdAt: new Date(now - 86400000 * 10).toISOString() },
    { id: 'dg_biz', type: 'group', name: '业务部门群', category: 'department', departmentId: 'biz', members: ['test9','test59','test60','test61','test62','test63','test64','test65','test66'], owner: 'test9', createdAt: new Date(now - 86400000 * 10).toISOString() },
    { id: 'dg_sub', type: 'group', name: '分子公司群', category: 'department', departmentId: 'sub', members: ['test10','test67','test68','test69','test70','test71','test72','test73','test74','test75','test76','test77','test78','test79','test80','test81','test82','test83','test84','test85'], owner: 'test10', createdAt: new Date(now - 86400000 * 10).toISOString() },
    { id: 'dg_proj', type: 'group', name: '项目部群', category: 'department', departmentId: 'proj', members: ['test86','test87','test88','test89','test90','test91','test92','test93','test94','test95','test96','test97','test98','test99','test100','test101','test102','test103','test104','test105','test106','test107','test108'], owner: 'test86', createdAt: new Date(now - 86400000 * 10).toISOString() },
    // ── 子部门群（category: 'department', departmentId 为具体部门）──
    { id: 'dg_hq_hr',   type: 'group', name: '人力资源部群', category: 'department', departmentId: 'hq_hr',   members: ['test2','test3','test50'], owner: 'test2', createdAt: new Date(now - 86400000 * 9).toISOString() },
    { id: 'dg_hq_fin',  type: 'group', name: '财务管理部群', category: 'department', departmentId: 'hq_fin',  members: ['test4','test51','test52'], owner: 'test4', createdAt: new Date(now - 86400000 * 9).toISOString() },
    { id: 'dg_hq_adm',  type: 'group', name: '综合管理部群', category: 'department', departmentId: 'hq_adm',  members: ['test6','test8','test49'], owner: 'test6', createdAt: new Date(now - 86400000 * 9).toISOString() },
    { id: 'dg_hq_it',   type: 'group', name: '信息技术部群', category: 'department', departmentId: 'hq_it',   members: ['test53','test54'], owner: 'test53', createdAt: new Date(now - 86400000 * 9).toISOString() },
    { id: 'dg_hq_saf',  type: 'group', name: '安全管理部群', category: 'department', departmentId: 'hq_saf',  members: ['test5','test55','test56'], owner: 'test5', createdAt: new Date(now - 86400000 * 9).toISOString() },
    { id: 'dg_hq_qua',  type: 'group', name: '质量管理部群', category: 'department', departmentId: 'hq_qua',  members: ['test7','test57','test58'], owner: 'test7', createdAt: new Date(now - 86400000 * 9).toISOString() },
    { id: 'dg_biz_mkt', type: 'group', name: '市场经营部群', category: 'department', departmentId: 'biz_market', members: ['test9','test59','test60'], owner: 'test9', createdAt: new Date(now - 86400000 * 8).toISOString() },
    { id: 'dg_biz_con', type: 'group', name: '商务合约部群', category: 'department', departmentId: 'biz_contract', members: ['test61','test62'], owner: 'test61', createdAt: new Date(now - 86400000 * 8).toISOString() },
    { id: 'dg_biz_bid', type: 'group', name: '投标管理部群', category: 'department', departmentId: 'biz_bid',   members: ['test63','test64'], owner: 'test63', createdAt: new Date(now - 86400000 * 8).toISOString() },
    { id: 'dg_biz_svc', type: 'group', name: '客户服务部群', category: 'department', departmentId: 'biz_service', members: ['test65','test66'], owner: 'test65', createdAt: new Date(now - 86400000 * 8).toISOString() },
    { id: 'dg_sub1',    type: 'group', name: '一公司群',     category: 'department', departmentId: 'sub1', members: ['test10','test67','test68','test69','test70'], owner: 'test10', createdAt: new Date(now - 86400000 * 7).toISOString() },
    { id: 'dg_sub2',    type: 'group', name: '二公司群',     category: 'department', departmentId: 'sub2', members: ['test71','test72','test73','test74','test75'], owner: 'test71', createdAt: new Date(now - 86400000 * 7).toISOString() },
    { id: 'dg_sub3',    type: 'group', name: '三公司群',     category: 'department', departmentId: 'sub3', members: ['test76','test77','test78','test79','test80'], owner: 'test76', createdAt: new Date(now - 86400000 * 7).toISOString() },
    { id: 'dg_sub4',    type: 'group', name: '四公司群',     category: 'department', departmentId: 'sub4', members: ['test81','test82','test83','test84','test85'], owner: 'test81', createdAt: new Date(now - 86400000 * 7).toISOString() },
    // ── 项目部群（category: 'project'）──
    { id: 'g1', type: 'group', name: '城南地铁站群', category: 'project', projectId: 'p1', members: ['admin','test86','test87','test88','test89','test90','test91'], owner: 'test86', createdAt: new Date(now - 86400000 * 7).toISOString() },
    { id: 'g2', type: 'group', name: '滨江大桥群', category: 'project', projectId: 'p2', members: ['admin','test92','test93','test94','test95','test96','test97'], owner: 'test92', createdAt: new Date(now - 86400000 * 5).toISOString() },
    { id: 'g3', type: 'group', name: '地铁3号线群', category: 'project', projectId: 'p4', members: ['admin','test98','test99','test100'], owner: 'test98', createdAt: new Date(now - 86400000 * 3).toISOString() },
    { id: 'g6', type: 'group', name: '城北道路群', category: 'project', projectId: 'p5', members: ['admin','test101','test102'], owner: 'test101', createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: 'g7', type: 'group', name: '高铁站群', category: 'project', projectId: 'p8', members: ['admin','test103','test104'], owner: 'test103', createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: 'g8', type: 'group', name: '城南商业群', category: 'project', projectId: 'p9', members: ['admin','test105','test106'], owner: 'test105', createdAt: new Date(now - 86400000 * 1).toISOString() },
    { id: 'g9', type: 'group', name: '城北学校群', category: 'project', projectId: 'p11', members: ['admin','test107','test108'], owner: 'test107', createdAt: new Date(now - 86400000 * 1).toISOString() },
    // ── 普通群聊 ──
    { id: 'g4', type: 'group', name: '安全管理群', members: ['admin', 'test5', 'test7', 'test55', 'test56'], owner: 'admin', createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: 'g5', type: 'group', name: '综合事务群', members: ['admin', 'manager', 'test6', 'test8', 'test49'], owner: 'manager', createdAt: new Date(now - 86400000 * 1).toISOString() },
    // 单聊
    { id: 's1', type: 'single', name: 'test5', members: ['test5', 'test7'], owner: 'test5', createdAt: new Date(now - 86400000 * 4).toISOString() },
    { id: 's2', type: 'single', name: 'test1', members: ['test1', 'test4'], owner: 'test1', createdAt: new Date(now - 86400000 * 3).toISOString() },
    { id: 's3', type: 'single', name: 'test9', members: ['test9', 'test10'], owner: 'test9', createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: 's4', type: 'single', name: 'test6', members: ['test6', 'test8'], owner: 'test6', createdAt: new Date(now - 86400000 * 1).toISOString() },
    { id: 's5', type: 'single', name: 'test2', members: ['test2', 'test4'], owner: 'test2', createdAt: new Date(now - 3600000 * 12).toISOString() },
  ];

  const chatMessages = [
    // ── 部门群消息 ──
    { id: 'dgm1', conversationId: 'dg_hq', sender: 'admin', content: '集团总部各位同事，本周五下午召开季度总结会', type: 'text', readBy: ['admin','manager','test1'], createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: 'dgm2', conversationId: 'dg_hq', sender: 'manager', content: '收到，我准备汇报材料', type: 'text', readBy: ['admin','manager'], createdAt: new Date(now - 86400000 * 2 + 600000).toISOString() },
    { id: 'dgm3', conversationId: 'dg_biz', sender: 'test9', content: '业务部门本月新签合同3份，总额2.8亿', type: 'text', readBy: ['test9','test59'], createdAt: new Date(now - 86400000 * 1).toISOString() },
    { id: 'dgm4', conversationId: 'dg_sub', sender: 'test10', content: '各子公司注意：下月启动年度审计', type: 'text', readBy: ['test10','test71'], createdAt: new Date(now - 86400000 * 1).toISOString() },
    { id: 'dgm5', conversationId: 'dg_proj', sender: 'test86', content: '项目部本月在建项目7个，请各项目经理报送进度', type: 'text', readBy: ['test86','test92'], createdAt: new Date(now - 3600000 * 12).toISOString() },
    { id: 'dgm6', conversationId: 'dg_hq_fin', sender: 'test4', content: '财务部：请各位同事8月25日前完成报销', type: 'text', readBy: ['test4'], createdAt: new Date(now - 86400000 * 1).toISOString() },
    { id: 'dgm7', conversationId: 'dg_hq_saf', sender: 'test5', content: '安全月检查结果已出，发现2项隐患需整改', type: 'text', readBy: ['test5','test55'], createdAt: new Date(now - 3600000 * 8).toISOString() },
    { id: 'dgm8', conversationId: 'dg_sub1', sender: 'test10', content: '一公司本月产值目标1200万，进度如何？', type: 'text', readBy: ['test10'], createdAt: new Date(now - 86400000 * 1).toISOString() },
    { id: 'dgm9', conversationId: 'dg_sub2', sender: 'test71', content: '二公司滨江大桥项目进度正常', type: 'text', readBy: ['test71'], createdAt: new Date(now - 3600000 * 6).toISOString() },
    // ── 城南地铁站项目群 ──
    { id: 'cm1', conversationId: 'g1', sender: 'admin', content: '各位，城南地铁站主体结构验收安排在下周三', type: 'text', readBy: ['admin','test86','test87'], createdAt: new Date(now - 86400000 * 6).toISOString() },
    { id: 'cm2', conversationId: 'g1', sender: 'test86', content: '收到，我提前准备好验收资料', type: 'text', readBy: ['admin','test86'], createdAt: new Date(now - 86400000 * 6 + 600000).toISOString() },
    { id: 'cm3', conversationId: 'g1', sender: 'test87', content: '技术方案已经过监理审核，没问题', type: 'text', readBy: ['admin','test87'], createdAt: new Date(now - 86400000 * 5).toISOString() },
    { id: 'cm4', conversationId: 'g1', sender: 'test88', content: '现场钢筋绑扎已完成，等待验收', type: 'text', readBy: ['admin','test88'], createdAt: new Date(now - 86400000 * 4).toISOString() },
    // ── 滨江大桥项目群 ──
    { id: 'cm7', conversationId: 'g2', sender: 'test92', content: '滨江大桥桩基检测报告已出，全部合格', type: 'text', readBy: ['admin','test92'], createdAt: new Date(now - 86400000 * 4).toISOString() },
    { id: 'cm8', conversationId: 'g2', sender: 'test93', content: '好的，下一步墩柱施工准备', type: 'text', readBy: ['admin','test93'], createdAt: new Date(now - 86400000 * 3).toISOString() },
    // ── 安全管理群 ──
    { id: 'cm14', conversationId: 'g4', sender: 'test5', content: '本月安全检查发现3项隐患，已下发整改通知', type: 'text', readBy: ['admin','test5'], createdAt: new Date(now - 86400000 * 1).toISOString() },
    // ── 综合事务群 ──
    { id: 'cm17', conversationId: 'g5', sender: 'manager', content: '下周一下午2点全员例会，请准时参加', type: 'text', readBy: ['admin','manager'], createdAt: new Date(now - 86400000 * 1).toISOString() },
    // ── 单聊 ──
    { id: 'sm1', conversationId: 's1', sender: 'test5', content: '吴刚，明天城南站有个高处作业，你去检查一下', type: 'text', readBy: ['test5','test7'], createdAt: new Date(now - 86400000 * 3 - 3600000 * 5).toISOString() },
    { id: 'sm2', conversationId: 's1', sender: 'test7', content: '好的，我上午过去', type: 'text', readBy: ['test5','test7'], createdAt: new Date(now - 86400000 * 3 - 3600000 * 4).toISOString() },
    { id: 'sm6', conversationId: 's2', sender: 'test1', content: '赵丽，3号线的投标报价你核对了吗？', type: 'text', readBy: ['test1','test4'], createdAt: new Date(now - 86400000 * 2 - 3600000 * 6).toISOString() },
    { id: 'sm7', conversationId: 's2', sender: 'test4', content: '核对了，总价没问题', type: 'text', readBy: ['test1','test4'], createdAt: new Date(now - 86400000 * 2 - 3600000 * 5).toISOString() },
    { id: 'sm11', conversationId: 's3', sender: 'test9', content: '马师傅，明天几点到场？', type: 'text', readBy: ['test9','test10'], createdAt: new Date(now - 86400000 * 1 - 3600000 * 8).toISOString() },
    { id: 'sm12', conversationId: 's3', sender: 'test10', content: '早上7点，钢筋班组全员到', type: 'text', readBy: ['test9','test10'], createdAt: new Date(now - 86400000 * 1 - 3600000 * 7).toISOString() },
    { id: 'sm15', conversationId: 's4', sender: 'test6', content: '郑敏，这个月办公用品采购单你帮我审一下', type: 'text', readBy: ['test6','test8'], createdAt: new Date(now - 3600000 * 10).toISOString() },
    { id: 'sm16', conversationId: 's4', sender: 'test8', content: '好的，发过来我看看', type: 'text', readBy: ['test6','test8'], createdAt: new Date(now - 3600000 * 9).toISOString() },
    { id: 'sm18', conversationId: 's5', sender: 'test2', content: '赵丽，城北道路那个变更签证的费用什么时候能批？', type: 'text', readBy: ['test2','test4'], createdAt: new Date(now - 3600000 * 12).toISOString() },
    { id: 'sm19', conversationId: 's5', sender: 'test4', content: '财务这边已经审核完了，等总经理签字', type: 'text', readBy: ['test2','test4'], createdAt: new Date(now - 3600000 * 11).toISOString() },
  ];

  collections['suppliers'] = [
    { id: 's1', name: '华北建材有限公司', contact: '王强', phone: '13900000001', material: '水泥、钢筋' },
    { id: 's2', name: '恒信钢材集团', contact: '刘洋', phone: '13900000002', material: '钢材' },
    { id: 's3', name: '安达机械租赁', contact: '马丽', phone: '13900000003', material: '塔吊、汽车吊' },
  ];

  collections['materials'] = [
    { id: 'm1', name: 'P.O42.5水泥', spec: '50kg/袋', unit: '吨', price: 480 },
    { id: 'm2', name: 'HRB400螺纹钢', spec: 'Φ20', unit: '吨', price: 3650 },
    { id: 'm3', name: '河沙', spec: '中砂', unit: 'm³', price: 150 },
    { id: 'm4', name: '商品混凝土C30', spec: '泵送', unit: 'm³', price: 430 },
  ];

  collections['teams'] = [
    { id: 't1', name: '钢筋班组', leader: '赵铁柱', members: 25, project: '城南地铁站' },
    { id: 't2', name: '混凝土班组', leader: '孙建国', members: 18, project: '滨江大桥' },
    { id: 't3', name: '防水班组', leader: '蓝云天', members: 12, project: '城南地铁站' },
    { id: 't4', name: '桩基班组', leader: 'test10', members: 20, project: '高铁站交通枢纽' },
    { id: 't5', name: '土方班组', leader: '赵铁柱', members: 15, project: '城北道路改造' },
    { id: 't6', name: '钢筋班组', leader: 'test9', members: 22, project: '地铁3号线' },
    { id: 't7', name: '模板班组', leader: '孙建国', members: 16, project: '城南商业综合体' },
    { id: 't8', name: '水电班组', leader: '张师傅', members: 10, project: '城北学校扩建' },
  ];

  collections['projects'] = [
    { id: 'p1', name: '城南地铁站项目', code: 'XM-2024-001', manager: '陈国强', budget: 8500, startDate: '2024-03-01', endDate: '2026-06-30', status: '在建' },
    { id: 'p2', name: '滨江大桥工程', code: 'XM-2024-002', manager: '周海涛', budget: 12000, startDate: '2024-05-15', endDate: '2027-01-31', status: '在建' },
    { id: 'p3', name: '城东物流园工程', code: 'XM-2023-007', manager: '钱建国', budget: 5000, startDate: '2023-09-01', endDate: '2026-03-31', status: '竣工' },
    { id: 'p4', name: '地铁3号线二期土建', code: 'XM-2025-003', manager: 'test1', budget: 98000, startDate: '2025-01-15', endDate: '2027-12-31', status: '在建' },
    { id: 'p5', name: '城北新区道路改造', code: 'XM-2025-004', manager: 'test2', budget: 5600, startDate: '2025-06-01', endDate: '2026-12-31', status: '在建' },
    { id: 'p6', name: '滨江景观带工程', code: 'XM-2024-005', manager: 'test3', budget: 4380, startDate: '2024-08-01', endDate: '2026-06-30', status: '完工' },
    { id: 'p7', name: '城西污水处理厂', code: 'XM-2023-006', manager: 'test4', budget: 12000, startDate: '2023-03-01', endDate: '2025-12-31', status: '完工' },
    { id: 'p8', name: '高铁站交通枢纽', code: 'XM-2026-008', manager: 'test5', budget: 156000, startDate: '2026-01-01', endDate: '2029-06-30', status: '在建' },
    { id: 'p9', name: '城南商业综合体', code: 'XM-2025-009', manager: 'test6', budget: 7800, startDate: '2025-04-01', endDate: '2027-03-31', status: '在建' },
    { id: 'p10', name: '经济开发区标准厂房', code: 'XM-2023-010', manager: '陈国强', budget: 3200, startDate: '2023-06-01', endDate: '2025-08-31', status: '竣工' },
    { id: 'p11', name: '城北学校扩建工程', code: 'XM-2026-011', manager: 'test7', budget: 4500, startDate: '2026-03-01', endDate: '2027-08-31', status: '在建' },
  ];

  // 工程管理
  collections['projectArchives'] = [
    { id: 'pa1', name: '城南地铁站项目', code: 'XM-2024-001', manager: '陈国强', customer: '城投集团', amount: 85000000, startDate: '2024-03-01', endDate: '2026-06-30', status: '在建' },
    { id: 'pa2', name: '滨江大桥工程', code: 'XM-2024-002', manager: '周海涛', customer: '市交通集团', amount: 120000000, startDate: '2024-05-15', endDate: '2027-01-31', status: '在建' },
    { id: 'pa3', name: '地铁3号线二期土建', code: 'XM-2025-003', manager: 'test1', customer: '轨道交通集团', amount: 980000000, startDate: '2025-01-15', endDate: '2027-12-31', status: '在建' },
    { id: 'pa4', name: '城北新区道路改造', code: 'XM-2025-004', manager: 'test2', customer: '城投集团', amount: 56000000, startDate: '2025-06-01', endDate: '2026-12-31', status: '在建' },
    { id: 'pa5', name: '滨江景观带工程', code: 'XM-2024-005', manager: 'test3', customer: '市建委', amount: 43800000, startDate: '2024-08-01', endDate: '2026-06-30', status: '完工' },
    { id: 'pa6', name: '城西污水处理厂', code: 'XM-2023-006', manager: 'test4', customer: '市环保局', amount: 120000000, startDate: '2023-03-01', endDate: '2025-12-31', status: '完工' },
    { id: 'pa7', name: '高铁站交通枢纽', code: 'XM-2026-008', manager: 'test5', customer: '铁路集团', amount: 1560000000, startDate: '2026-01-01', endDate: '2029-06-30', status: '在建' },
    { id: 'pa8', name: '城南商业综合体', code: 'XM-2025-009', manager: 'test6', customer: '万达集团', amount: 78000000, startDate: '2025-04-01', endDate: '2027-03-31', status: '在建' },
    { id: 'pa9', name: '经济开发区标准厂房', code: 'XM-2023-010', manager: '陈国强', customer: '经开区管委会', amount: 32000000, startDate: '2023-06-01', endDate: '2025-08-31', status: '竣工' },
    { id: 'pa10', name: '城北学校扩建工程', code: 'XM-2026-011', manager: 'test7', customer: '市教育局', amount: 45000000, startDate: '2026-03-01', endDate: '2027-08-31', status: '在建' },
  ];

  collections['plans'] = [
    { id: 'pl1', name: '城南地铁站主体结构钢筋需用计划', project: '城南地铁站项目', material: 'HRB400螺纹钢', quantity: 320, unit: '吨', planDate: '2026-07-01', status: '已批准' },
    { id: 'pl2', name: '滨江大桥墩柱混凝土需用计划', project: '滨江大桥工程', material: 'P.O42.5水泥', quantity: 1500, unit: '吨', planDate: '2026-07-15', status: '待审批' },
    { id: 'pl3', name: '城南地铁站机电安装电缆需用计划', project: '城南地铁站项目', material: '电缆', quantity: 5000, unit: '米', planDate: '2026-08-01', status: '待审批' },
  ];

  collections['productionValues'] = [
    { id: 'pv1', project: '城南地铁站项目', month: '2026-07', value: 1250, owner: '陈国强' },
    { id: 'pv2', project: '滨江大桥工程', month: '2026-07', value: 980, owner: '周海涛' },
    { id: 'pv3', project: '城南地铁站项目', month: '2026-06', value: 1100, owner: '陈国强' },
    { id: 'pv4', project: '地铁3号线二期土建', month: '2026-07', value: 3200, owner: 'test1' },
    { id: 'pv5', project: '城北新区道路改造', month: '2026-07', value: 850, owner: 'test2' },
    { id: 'pv6', project: '高铁站交通枢纽', month: '2026-07', value: 4500, owner: 'test5' },
    { id: 'pv7', project: '城南商业综合体', month: '2026-07', value: 1600, owner: 'test6' },
    { id: 'pv8', project: '城北学校扩建工程', month: '2026-07', value: 680, owner: 'test7' },
    { id: 'pv9', project: '城南地铁站项目', month: '2026-05', value: 1050, owner: '陈国强' },
    { id: 'pv10', project: '滨江大桥工程', month: '2026-06', value: 920, owner: '周海涛' },
  ];

  collections['budgets'] = [
    { id: 'bd1', name: '城南地铁站项目施工预算', project: '城南地铁站项目', amount: 78000000, date: '2024-04-01' },
    { id: 'bd2', name: '滨江大桥工程概预算', project: '滨江大桥工程', amount: 108000000, date: '2024-06-15' },
    { id: 'bd3', name: '地铁3号线二期预算', project: '地铁3号线二期土建', amount: 890000000, date: '2025-02-01' },
    { id: 'bd4', name: '城北道路改造预算', project: '城北新区道路改造', amount: 52000000, date: '2025-07-01' },
    { id: 'bd5', name: '高铁站交通枢纽预算', project: '高铁站交通枢纽', amount: 1400000000, date: '2026-02-01' },
    { id: 'bd6', name: '城南商业综合体预算', project: '城南商业综合体', amount: 72000000, date: '2025-05-01' },
  ];

  collections['rentalPlans'] = [
    { id: 'rp1', name: '城南地铁站塔吊租赁计划', equipment: '塔式起重机', quantity: 2, duration: 12, startDate: '2026-09-01' },
    { id: 'rp2', name: '滨江大桥汽车吊租赁计划', equipment: '汽车吊50t', quantity: 1, duration: 6, startDate: '2026-08-15' },
  ];

  collections['subcontractPlans'] = [
    { id: 'sp1', name: '城南地铁站防水工程分包计划', project: '城南地铁站项目', content: '地下结构防水施工', amount: 2600000, team: '蓝天防水班组' },
    { id: 'sp2', name: '滨江大桥钢结构安装分包计划', project: '滨江大桥工程', content: '钢箱梁现场安装', amount: 5800000, team: '华安钢构班组' },
  ];

  collections['changes'] = [
    { id: 'ch1', title: '城南地铁站出站口变更', project: '城南地铁站项目', type: '设计变更', amount: 850000, content: '东侧出站口新增雨棚', status: '已批准' },
    { id: 'ch2', title: '滨江大桥桩基签证', project: '滨江大桥工程', type: '签证变更', amount: 320000, content: '岩层加固签证', status: '待审批' },
    { id: 'ch3', title: '城南地铁站钢筋型号代换', project: '城南地铁站项目', type: '材料代换', amount: 45000, content: 'Φ20→Φ22 部分代换', status: '待审批' },
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
    { id: 'a5', title: '地铁3号线钢材采购', applicant: 'test1', type: '采购审批', amount: 5600000, date: '2026-08-12', status: '待审批' },
    { id: 'a6', title: '城北道路改造混凝土采购', applicant: 'test2', type: '采购审批', amount: 1200000, date: '2026-08-13', status: '待审批' },
    { id: 'a7', title: 'test5出差差旅费报销', applicant: 'test5', type: '报销审批', amount: 2800, date: '2026-08-14', status: '待审批' },
    { id: 'a8', title: '高铁站项目设备租赁', applicant: 'test1', type: '用款审批', amount: 350000, date: '2026-08-09', status: '已批准' },
    { id: 'a9', title: 'test7质量检测费报销', applicant: 'test7', type: '报销审批', amount: 4500, date: '2026-08-07', status: '已批准' },
    { id: 'a10', title: '安全防护用品采购', applicant: 'test5', type: '采购审批', amount: 68000, date: '2026-08-06', status: '已批准' },
    { id: 'a11', title: '城南商业综合体设计变更', applicant: 'test6', type: '合同审批', amount: 230000, date: '2026-08-15', status: '待审批' },
    { id: 'a12', title: 'test9外协人员进场申请', applicant: 'test9', type: '其他', amount: 0, date: '2026-08-16', status: '待审批' },
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
    { id: 'pr6', project: '地铁3号线二期土建', task: '地质勘察', startDate: '2026-01-15', endDate: '2026-04-30', progress: 100, owner: 'test1' },
    { id: 'pr7', project: '地铁3号线二期土建', task: '围护结构施工', startDate: '2026-05-01', endDate: '2026-10-31', progress: 45, owner: 'test2' },
    { id: 'pr8', project: '城北新区道路改造', task: '路基处理', startDate: '2026-06-01', endDate: '2026-08-31', progress: 70, owner: 'test2' },
    { id: 'pr9', project: '城北新区道路改造', task: '路面铺设', startDate: '2026-09-01', endDate: '2026-11-30', progress: 0, owner: 'test2' },
    { id: 'pr10', project: '高铁站交通枢纽', task: '基坑开挖', startDate: '2026-03-01', endDate: '2026-06-30', progress: 100, owner: 'test5' },
    { id: 'pr11', project: '高铁站交通枢纽', task: '主体结构', startDate: '2026-07-01', endDate: '2027-06-30', progress: 35, owner: 'test5' },
    { id: 'pr12', project: '城南商业综合体', task: '桩基施工', startDate: '2026-04-01', endDate: '2026-07-31', progress: 90, owner: 'test6' },
    { id: 'pr13', project: '城南商业综合体', task: '地下室施工', startDate: '2026-08-01', endDate: '2026-12-31', progress: 20, owner: 'test6' },
    { id: 'pr14', project: '城北学校扩建工程', task: '基础施工', startDate: '2026-03-01', endDate: '2026-05-31', progress: 100, owner: 'test7' },
    { id: 'pr15', project: '城北学校扩建工程', task: '主体施工', startDate: '2026-06-01', endDate: '2026-10-31', progress: 55, owner: 'test7' },
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
    { id: 'rm4', title: 'test5出差差旅费报销', applicant: 'test5', amount: 2800, date: '2026-08-14', status: '待审批' },
    { id: 'rm5', title: '质量检测费报销', applicant: 'test7', amount: 4500, date: '2026-08-07', status: '已批准' },
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
    { id: 'at18', name: 'test5', date: '2026-08-14', status: '出勤' },
    { id: 'at19', name: 'test6', date: '2026-08-14', status: '出勤' },
    { id: 'at20', name: 'test7', date: '2026-08-14', status: '出勤' },
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
    { id: 'si3', title: '地铁3号线基坑安全检查', project: '地铁3号线二期土建', inspector: 'test5', date: '2026-08-12', issues: '围挡缺失2处', status: '整改中' },
    { id: 'si4', title: '城北道路施工安全检查', project: '城北新区道路改造', inspector: 'test5', date: '2026-08-11', issues: '交通疏导标识不足', status: '已完成' },
    { id: 'si5', title: '高铁站项目临电检查', project: '高铁站交通枢纽', inspector: 'test5', date: '2026-08-13', issues: '三级配电箱未上锁', status: '整改中' },
    { id: 'si6', title: '城南商业综合体消防检查', project: '城南商业综合体', inspector: 'test5', date: '2026-08-09', issues: '灭火器过期3具', status: '已完成' },
  ];

  collections['safetyTrainings'] = [
    { id: 'stn1', title: '新入场工人三级安全教育', trainer: '王安全', date: '2026-08-12', participants: 32, content: '入场安全须知、事故案例' },
    { id: 'stn2', title: '起重吊装作业专项培训', trainer: '张机械', date: '2026-08-03', participants: 15, content: '吊装操作规程与信号指挥' },
    { id: 'stn3', title: '高处作业安全培训', trainer: 'test5', date: '2026-08-08', participants: 28, content: '安全带使用、临边防护' },
    { id: 'stn4', title: '临时用电安全培训', trainer: 'test5', date: '2026-08-05', participants: 20, content: '三级配电、两级保护' },
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
    { id: 'mt3', title: '地铁3号线项目启动会', date: '2026-08-22', location: '集团会议室', host: 'test1', participants: '项目全体成员', content: '项目启动动员与任务分工' },
    { id: 'mt4', title: '高铁站项目进度协调会', date: '2026-08-19', location: '项目部', host: 'test5', participants: '各部门负责人', content: '基坑开挖进度协调' },
    { id: 'mt5', title: '8月经营分析会', date: '2026-08-25', location: '集团会议室', host: 'manager', participants: '各部门经理', content: '月度经营指标分析' },
  ];

  collections['tasks'] = [
    { id: 'ts1', title: '编制城南地铁站8月进度计划', assignee: '陈国强', project: '城南地铁站项目', priority: '高', dueDate: '2026-08-18', status: '进行中' },
    { id: 'ts2', title: '整理滨江大桥桩基验收资料', assignee: '周海涛', project: '滨江大桥工程', priority: '中', dueDate: '2026-08-22', status: '未开始' },
    { id: 'ts3', title: '统计7月物资出入库数据', assignee: '李材料', project: '城南地铁站项目', priority: '低', dueDate: '2026-08-15', status: '已完成' },
    { id: 'ts4', title: '编制地铁3号线施工方案', assignee: 'test1', project: '地铁3号线二期土建', priority: '高', dueDate: '2026-08-20', status: '进行中' },
    { id: 'ts5', title: '城北道路改造投标文件', assignee: 'test2', project: '城北新区道路改造', priority: '高', dueDate: '2026-08-25', status: '进行中' },
    { id: 'ts6', title: '滨江景观带竣工资料整理', assignee: 'test3', project: '滨江景观带工程', priority: '中', dueDate: '2026-08-19', status: '已完成' },
    { id: 'ts7', title: '安全月活动总结报告', assignee: 'test5', project: '安全管理', priority: '中', dueDate: '2026-08-17', status: '进行中' },
    { id: 'ts8', title: '8月钢材对账单编制', assignee: 'test4', project: '财务管理', priority: '低', dueDate: '2026-08-28', status: '未开始' },
    { id: 'ts9', title: '高铁站项目开工报告', assignee: 'test5', project: '高铁站交通枢纽', priority: '高', dueDate: '2026-08-30', status: '未开始' },
    { id: 'ts10', title: '物资盘点表更新', assignee: 'test6', project: '物资管理', priority: '低', dueDate: '2026-08-21', status: '进行中' },
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
    { id: 'op4', name: '高新区产业园建设', customer: '高新区管委会', amount: 230000000, stage: '方案沟通', owner: 'test3', date: '2026-07-15' },
    { id: 'op5', name: '城际铁路站房改造', customer: '铁路集团', amount: 450000000, stage: '初步接触', owner: 'test3', date: '2026-08-08' },
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
    // ── 集团总部 ──
    { id: 'hq', name: '集团总部', code: 'HQ', parentId: null, leader: 'admin', phone: '', description: '集团总部', sortOrder: 0 },
    { id: 'hq_president', name: '总裁办公室', code: 'HQ-PRE', parentId: 'hq', leader: 'admin', phone: '13800000000', description: '集团最高管理层', sortOrder: 0 },
    { id: 'hq_hr', name: '人力资源部', code: 'HQ-HR', parentId: 'hq', leader: '孙行政', phone: '', description: '负责人力资源管理', sortOrder: 1 },
    { id: 'hq_finance', name: '财务管理部', code: 'HQ-FIN', parentId: 'hq', leader: '赵丽', phone: '13900001004', description: '负责财务核算与资金管理', sortOrder: 2 },
    { id: 'hq_admin', name: '综合管理部', code: 'HQ-ADM', parentId: 'hq', leader: '郑敏', phone: '13900001008', description: '负责行政后勤与综合事务', sortOrder: 3 },
    { id: 'hq_it', name: '信息技术部', code: 'HQ-IT', parentId: 'hq', leader: '经理', phone: '13800000099', description: '负责信息化建设与系统维护', sortOrder: 4 },
    { id: 'hq_safety', name: '安全管理部', code: 'HQ-SAF', parentId: 'hq', leader: '孙强', phone: '13900001005', description: '负责安全生产管理', sortOrder: 5 },
    { id: 'hq_quality', name: '质量管理部', code: 'HQ-QUA', parentId: 'hq', leader: '吴刚', phone: '13900001007', description: '负责工程质量控制', sortOrder: 6 },

    // ── 业务部门 ──
    { id: 'biz', name: '业务部门', code: 'BIZ', parentId: null, leader: '', phone: '', description: '市场与业务拓展', sortOrder: 1 },
    { id: 'biz_market', name: '市场经营部', code: 'BIZ-MKT', parentId: 'biz', leader: '王磊', phone: '13900001003', description: '负责市场开拓与经营管理', sortOrder: 0 },
    { id: 'biz_contract', name: '商务合约部', code: 'BIZ-CON', parentId: 'biz', leader: '张伟涛', phone: '13900008001', description: '负责商务谈判与合同管理', sortOrder: 1 },
    { id: 'biz_bid', name: '投标管理部', code: 'BIZ-BID', parentId: 'biz', leader: '李强', phone: '13900008002', description: '负责投标文件编制与管理', sortOrder: 2 },
    { id: 'biz_service', name: '客户服务部', code: 'BIZ-SVC', parentId: 'biz', leader: '王刚', phone: '13900008003', description: '负责客户关系维护', sortOrder: 3 },

    // ── 分子公司 ──
    { id: 'sub', name: '分子公司', code: 'SUB', parentId: null, leader: '', phone: '', description: '下属子公司与分公司', sortOrder: 2 },
    { id: 'sub1', name: '一公司', code: 'SUB-01', parentId: 'sub', leader: '钱建国', phone: '13800000011', description: '第一工程公司', sortOrder: 0 },
    { id: 'sub2', name: '二公司', code: 'SUB-02', parentId: 'sub', leader: '陈国强', phone: '13811110001', description: '第二工程公司', sortOrder: 1 },
    { id: 'sub3', name: '三公司', code: 'SUB-03', parentId: 'sub', leader: '周海涛', phone: '13811110002', description: '第三工程公司', sortOrder: 2 },
    { id: 'sub4', name: '四公司', code: 'SUB-04', parentId: 'sub', leader: '孙建国', phone: '13800000012', description: '第四工程公司', sortOrder: 3 },

    // ── 项目部 ──
    { id: 'proj', name: '项目部', code: 'PROJ', parentId: null, leader: '', phone: '', description: '各项目现场管理', sortOrder: 3 },
    { id: 'proj1', name: '城南地铁站项目部', code: 'PROJ-01', parentId: 'proj', leader: '陈国强', phone: '13811110001', description: '城南地铁站项目现场管理', sortOrder: 0 },
    { id: 'proj2', name: '滨江大桥项目部', code: 'PROJ-02', parentId: 'proj', leader: '周海涛', phone: '13811110002', description: '滨江大桥工程现场管理', sortOrder: 1 },
    { id: 'proj3', name: '地铁3号线项目部', code: 'PROJ-03', parentId: 'proj', leader: '张伟', phone: '13900001001', description: '地铁3号线二期土建管理', sortOrder: 2 },
    { id: 'proj4', name: '城北道路项目部', code: 'PROJ-04', parentId: 'proj', leader: '李明', phone: '13900001002', description: '城北新区道路改造管理', sortOrder: 3 },
    { id: 'proj5', name: '高铁站项目部', code: 'PROJ-05', parentId: 'proj', leader: '孙强', phone: '13900001005', description: '高铁站交通枢纽管理', sortOrder: 4 },
    { id: 'proj6', name: '城南商业项目部', code: 'PROJ-06', parentId: 'proj', leader: '周芳', phone: '13900001006', description: '城南商业综合体管理', sortOrder: 5 },
    { id: 'proj7', name: '城北学校项目部', code: 'PROJ-07', parentId: 'proj', leader: '吴刚', phone: '13900001007', description: '城北学校扩建工程管理', sortOrder: 6 },
  ];

  collections['orgPositions'] = [
    { id: 'op1', name: '董事长', departmentId: 'd1', level: 100, description: '集团最高决策人', sortOrder: 0 },
    { id: 'op2', name: '总经理', departmentId: 'd1', level: 100, description: '集团日常运营负责人', sortOrder: 1 },
    { id: 'op3', name: '副总经理', departmentId: 'd1', level: 80, description: '协助总经理管理', sortOrder: 2 },
    { id: 'op4', name: '部门经理', departmentId: 'd2', level: 80, description: '工程管理部负责人', sortOrder: 0 },
    { id: 'op5', name: '项目经理', departmentId: 'd2', level: 80, description: '项目现场管理', sortOrder: 1 },
    { id: 'op6', name: '项目总工', departmentId: 'd2', level: 80, description: '项目技术总负责', sortOrder: 2 },
    { id: 'op7', name: '部门经理', departmentId: 'd3', level: 80, description: '安全管理部负责人', sortOrder: 0 },
    { id: 'op8', name: '安全员', departmentId: 'd3', level: 60, description: '安全检查与巡查', sortOrder: 1 },
    { id: 'op9', name: '部门经理', departmentId: 'd4', level: 80, description: '质量管理部负责人', sortOrder: 0 },
    { id: 'op10', name: '质检员', departmentId: 'd4', level: 60, description: '质量检查与验收', sortOrder: 1 },
    { id: 'op11', name: '部门经理', departmentId: 'd5', level: 80, description: '物资管理部负责人', sortOrder: 0 },
    { id: 'op12', name: '材料员', departmentId: 'd5', level: 60, description: '材料管理与收发', sortOrder: 1 },
    { id: 'op13', name: '部门经理', departmentId: 'd6', level: 80, description: '财务管理部负责人', sortOrder: 0 },
    { id: 'op14', name: '会计', departmentId: 'd6', level: 60, description: '财务核算', sortOrder: 1 },
    { id: 'op15', name: '部门经理', departmentId: 'd7', level: 80, description: '综合管理部负责人', sortOrder: 0 },
    { id: 'op16', name: '行政专员', departmentId: 'd7', level: 40, description: '行政事务处理', sortOrder: 1 },
    { id: 'op17', name: '部门经理', departmentId: 'd8', level: 80, description: '市场经营部负责人', sortOrder: 0 },
    { id: 'op18', name: '商务经理', departmentId: 'd8', level: 60, description: '市场开拓与投标', sortOrder: 1 },
    { id: 'op19', name: '技术负责人', departmentId: 'd11', level: 80, description: '技术质量管理', sortOrder: 0 },
    { id: 'op20', name: '安全主管', departmentId: 'd12', level: 80, description: '安全监督管理', sortOrder: 0 },
  ];

  // 用户（admin 为超级管理员 root）
  const PWD_HASH = '$2b$10$ARne.woqFHP.PUouPN.EB.UDZilAuRihH54pAG/3mEkg9NsfDKo4G'; // admin123
  const users: any[] = [
    // ── 集团总部 ──
    {
      id: 'admin', username: 'admin', email: 'admin@test.com', password: PWD_HASH,
      role: 'super_admin', appliedRole: 'super_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(),
      name: '管理员', department: '总裁办公室', position: '超级管理员', phone: '13800000000', isHead: true,
    },
    {
      id: 'u2', username: 'manager', email: 'manager@test.com', password: PWD_HASH,
      role: 'high_admin', appliedRole: 'high_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(),
      name: '王总', department: '总裁办公室', position: '总经理', phone: '13800000099', isHead: false, isDeputy: true,
    },
    { id: 'u3',  username: 'test1',  email: 'test1@test.com',  password: PWD_HASH, role: 'high_admin',     appliedRole: 'high_admin',     roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张伟',   department: '总裁办公室', position: '副总经理', phone: '13900001001', isDeputy: true },
    { id: 'u4',  username: 'test2',  email: 'test2@test.com',  password: PWD_HASH, role: 'general_admin',  appliedRole: 'general_admin',  roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李明',   department: '人力资源部', position: '部门经理', phone: '13900001002', isHead: true },
    { id: 'u5',  username: 'test3',  email: 'test3@test.com',  password: PWD_HASH, role: 'general_admin',  appliedRole: 'general_admin',  roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王磊',   department: '人力资源部', position: '副经理', phone: '13900001003', isDeputy: true },
    { id: 'u6',  username: 'test4',  email: 'test4@test.com',  password: PWD_HASH, role: 'general_admin',  appliedRole: 'general_admin',  roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵丽',   department: '财务管理部', position: '部门经理', phone: '13900001004', isHead: true },
    { id: 'u7',  username: 'test5',  email: 'test5@test.com',  password: PWD_HASH, role: 'employee',       appliedRole: 'employee',       roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙强',   department: '安全管理部', position: '部门经理', phone: '13900001005', isHead: true },
    { id: 'u8',  username: 'test6',  email: 'test6@test.com',  password: PWD_HASH, role: 'employee',       appliedRole: 'employee',       roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周芳',   department: '综合管理部', position: '部门经理', phone: '13900001006', isHead: true },
    { id: 'u9',  username: 'test7',  email: 'test7@test.com',  password: PWD_HASH, role: 'employee',       appliedRole: 'employee',       roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴刚',   department: '质量管理部', position: '部门经理', phone: '13900001007', isHead: true },
    { id: 'u10', username: 'test8',  email: 'test8@test.com',  password: PWD_HASH, role: 'employee',       appliedRole: 'employee',       roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑敏',   department: '综合管理部', position: '副经理', phone: '13900001008', isDeputy: true },
    { id: 'u51', username: 'test49', email: 'test49@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '马行政', department: '综合管理部', position: '行政专员', phone: '13900011001' },
    { id: 'u52', username: 'test50', email: 'test50@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱人事', department: '人力资源部', position: '人事专员', phone: '13900011002' },
    { id: 'u53', username: 'test51', email: 'test51@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵会计', department: '财务管理部', position: '会计', phone: '13900011003', isDeputy: true },
    { id: 'u54', username: 'test52', email: 'test52@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周出纳', department: '财务管理部', position: '出纳', phone: '13900011004' },
    { id: 'u55', username: 'test53', email: 'test53@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '陈IT',   department: '信息技术部', position: '部门经理', phone: '13900011005', isHead: true },
    { id: 'u56', username: 'test54', email: 'test54@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '林IT',   department: '信息技术部', position: '开发工程师', phone: '13900011006' },
    { id: 'u57', username: 'test55', email: 'test55@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '何安全', department: '安全管理部', position: '副经理', phone: '13900011007', isDeputy: true },
    { id: 'u58', username: 'test56', email: 'test56@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '高安全', department: '安全管理部', position: '安全员', phone: '13900011008' },
    { id: 'u59', username: 'test57', email: 'test57@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '梁质量', department: '质量管理部', position: '副经理', phone: '13900011009', isDeputy: true },
    { id: 'u60', username: 'test58', email: 'test58@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '宋质量', department: '质量管理部', position: '质检员', phone: '13900011010' },

    // ── 业务部门 ──
    { id: 'u11', username: 'test9',  email: 'test9@test.com',  password: PWD_HASH, role: 'general_admin',  appliedRole: 'general_admin',  roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '刘市场',  department: '市场经营部', position: '部门经理', phone: '13900001009', isHead: true },
    { id: 'u61', username: 'test59', email: 'test59@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '韩市场', department: '市场经营部', position: '副经理', phone: '13900012001', isDeputy: true },
    { id: 'u62', username: 'test60', email: 'test60@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '杨市场', department: '市场经营部', position: '市场专员', phone: '13900012002' },
    { id: 'u63', username: 'test61', email: 'test61@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '朱商务', department: '商务合约部', position: '部门经理', phone: '13900012003', isHead: true },
    { id: 'u64', username: 'test62', email: 'test62@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '秦商务', department: '商务合约部', position: '商务专员', phone: '13900012004' },
    { id: 'u65', username: 'test63', email: 'test63@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '许投标', department: '投标管理部', position: '部门经理', phone: '13900012005', isHead: true },
    { id: 'u66', username: 'test64', email: 'test64@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '何投标', department: '投标管理部', position: '投标专员', phone: '13900012006' },
    { id: 'u67', username: 'test65', email: 'test65@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吕客服', department: '客户服务部', position: '部门经理', phone: '13900012007', isHead: true },
    { id: 'u68', username: 'test66', email: 'test66@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '施客服', department: '客户服务部', position: '客服专员', phone: '13900012008' },

    // ── 分子公司：一公司 ──
    { id: 'u12', username: 'test10', email: 'test10@test.com', password: PWD_HASH, role: 'high_admin',    appliedRole: 'high_admin',    roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '钱建国', department: '一公司', position: '公司经理', phone: '13900001010', isHead: true },
    { id: 'u69', username: 'test67', email: 'test67@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙一',   department: '一公司', position: '副经理', phone: '13900013001', isDeputy: true },
    { id: 'u70', username: 'test68', email: 'test68@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周一',   department: '一公司', position: '技术负责人', phone: '13900013002' },
    { id: 'u71', username: 'test69', email: 'test69@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴一',   department: '一公司', position: '安全员', phone: '13900013003' },
    { id: 'u72', username: 'test70', email: 'test70@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑一',   department: '一公司', position: '施工员', phone: '13900013004' },

    // ── 分子公司：二公司 ──
    { id: 'u73', username: 'test71', email: 'test71@test.com', password: PWD_HASH, role: 'high_admin',    appliedRole: 'high_admin',    roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '陈国强', department: '二公司', position: '公司经理', phone: '13900013005', isHead: true },
    { id: 'u74', username: 'test72', email: 'test72@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙二',   department: '二公司', position: '副经理', phone: '13900013006', isDeputy: true },
    { id: 'u75', username: 'test73', email: 'test73@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周二',   department: '二公司', position: '技术负责人', phone: '13900013007' },
    { id: 'u76', username: 'test74', email: 'test74@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴二',   department: '二公司', position: '安全员', phone: '13900013008' },
    { id: 'u77', username: 'test75', email: 'test75@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑二',   department: '二公司', position: '施工员', phone: '13900013009' },

    // ── 分子公司：三公司 ──
    { id: 'u78', username: 'test76', email: 'test76@test.com', password: PWD_HASH, role: 'high_admin',    appliedRole: 'high_admin',    roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周海涛', department: '三公司', position: '公司经理', phone: '13900013010', isHead: true },
    { id: 'u79', username: 'test77', email: 'test77@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙三',   department: '三公司', position: '副经理', phone: '13900013011', isDeputy: true },
    { id: 'u80', username: 'test78', email: 'test78@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周三',   department: '三公司', position: '技术负责人', phone: '13900013012' },
    { id: 'u81', username: 'test79', email: 'test79@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴三',   department: '三公司', position: '安全员', phone: '13900013013' },
    { id: 'u82', username: 'test80', email: 'test80@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑三',   department: '三公司', position: '施工员', phone: '13900013014' },

    // ── 分子公司：四公司 ──
    { id: 'u83', username: 'test81', email: 'test81@test.com', password: PWD_HASH, role: 'high_admin',    appliedRole: 'high_admin',    roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙建国', department: '四公司', position: '公司经理', phone: '13900013015', isHead: true },
    { id: 'u84', username: 'test82', email: 'test82@test.com', password: PWD_HASH, role: 'general_admin', appliedRole: 'general_admin', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙四',   department: '四公司', position: '副经理', phone: '13900013016', isDeputy: true },
    { id: 'u85', username: 'test83', email: 'test83@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周四',   department: '四公司', position: '技术负责人', phone: '13900013017' },
    { id: 'u86', username: 'test84', email: 'test84@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴四',   department: '四公司', position: '安全员', phone: '13900013018' },
    { id: 'u87', username: 'test85', email: 'test85@test.com', password: PWD_HASH, role: 'employee',      appliedRole: 'employee',      roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑四',   department: '四公司', position: '施工员', phone: '13900013019' },

    // ── 项目部：城南地铁站 ──
    { id: 'u88', username: 'test86', email: 'test86@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '刘工',   department: '城南地铁站项目部', position: '项目经理', phone: '13900014001', isHead: true },
    { id: 'u89', username: 'test87', email: 'test87@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张刚',   department: '城南地铁站项目部', position: '施工员', phone: '13900014002' },
    { id: 'u90', username: 'test88', email: 'test88@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李强',   department: '城南地铁站项目部', position: '钢筋工长', phone: '13900014003' },
    { id: 'u91', username: 'test89', email: 'test89@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王伟',   department: '城南地铁站项目部', position: '木工工长', phone: '13900014004' },
    { id: 'u92', username: 'test90', email: 'test90@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '刘磊',   department: '城南地铁站项目部', position: '混凝土工长', phone: '13900014005' },
    { id: 'u93', username: 'test91', email: 'test91@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵刚',   department: '城南地铁站项目部', position: '安全员', phone: '13900014006' },

    // ── 项目部：滨江大桥 ──
    { id: 'u94', username: 'test92', email: 'test92@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '马师傅', department: '滨江大桥项目部', position: '项目经理', phone: '13900014007', isHead: true },
    { id: 'u95', username: 'test93', email: 'test93@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张伟',   department: '滨江大桥项目部', position: '施工员', phone: '13900014008' },
    { id: 'u96', username: 'test94', email: 'test94@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李刚',   department: '滨江大桥项目部', position: '桩基工长', phone: '13900014009' },
    { id: 'u97', username: 'test95', email: 'test95@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王强',   department: '滨江大桥项目部', position: '电焊工长', phone: '13900014010' },
    { id: 'u98', username: 'test96', email: 'test96@test.com', password: PWD_HASH, role: 'outsource', appliedRole: 'outsource', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '刘伟',   department: '滨江大桥项目部', position: '起重工', phone: '13900014011' },
    { id: 'u99', username: 'test97', email: 'test97@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '赵强',   department: '滨江大桥项目部', position: '安全员', phone: '13900014012' },

    // ── 项目部：地铁3号线 ──
    { id: 'u100', username: 'test98',  email: 'test98@test.com',  password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张经理', department: '地铁3号线项目部', position: '项目经理', phone: '13900015001', isHead: true },
    { id: 'u101', username: 'test99',  email: 'test99@test.com',  password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李技术', department: '地铁3号线项目部', position: '技术负责人', phone: '13900015002' },
    { id: 'u102', username: 'test100', email: 'test100@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '王施工', department: '地铁3号线项目部', position: '施工员', phone: '13900015003' },

    // ── 项目部：城北道路 ──
    { id: 'u103', username: 'test101', email: 'test101@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '李经理', department: '城北道路项目部', position: '项目经理', phone: '13900015004', isHead: true },
    { id: 'u104', username: 'test102', email: 'test102@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '张测量', department: '城北道路项目部', position: '测量员', phone: '13900015005' },

    // ── 项目部：高铁站 ──
    { id: 'u105', username: 'test103', email: 'test103@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '孙经理', department: '高铁站项目部', position: '项目经理', phone: '13900015006', isHead: true },
    { id: 'u106', username: 'test104', email: 'test104@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周施工', department: '高铁站项目部', position: '施工员', phone: '13900015007' },

    // ── 项目部：城南商业 ──
    { id: 'u107', username: 'test105', email: 'test105@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '周经理', department: '城南商业项目部', position: '项目经理', phone: '13900015008', isHead: true },
    { id: 'u108', username: 'test106', email: 'test106@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴采购', department: '城南商业项目部', position: '采购员', phone: '13900015009' },

    // ── 项目部：城北学校 ──
    { id: 'u109', username: 'test107', email: 'test107@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '吴经理', department: '城北学校项目部', position: '项目经理', phone: '13900015010', isHead: true },
    { id: 'u110', username: 'test108', email: 'test108@test.com', password: PWD_HASH, role: 'employee', appliedRole: 'employee', roleStatus: 'approved', isActive: true, createdAt: new Date().toISOString(), name: '郑施工', department: '城北学校项目部', position: '施工员', phone: '13900015011' },
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
}