export type PageType = 'list' | 'dashboard' | 'approval' | 'gantt' | 'calendar' | 'doc' | 'user-manage' | 'project-archives' | 'project-documents';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  required?: boolean;
  width?: string;
}

export interface FeatureDef {
  key: string;
  title: string;
  collection: string;
  pageType?: PageType;
  fields: FieldDef[];
}

export interface CategoryDef {
  key: string;
  title: string;
  icon: string;
  features: FeatureDef[];
}

const statusOptions = (vals: string[]) => vals.map((v) => ({ value: v, label: v }));

export const categories: CategoryDef[] = [
  {
    key: 'engineering',
    title: '工程管理',
    icon: 'Building2',
    features: [
      {
        key: 'project-archives',
        title: '项目档案',
        collection: 'projectArchives',
        pageType: 'project-archives',
        fields: [
          { key: 'name', label: '项目名称', required: true },
          { key: 'code', label: '项目编号' },
          { key: 'location', label: '项目地点' },
          { key: 'type', label: '工程类型', type: 'select', options: statusOptions(['水利枢纽', '渠道工程', '防洪工程', '灌溉工程', '水库工程', '生态工程', '环保工程', '监测工程', '景观工程', '综合治理', '其他']) },
          { key: 'scope', label: '工程范围', type: 'textarea' },
          { key: 'manager', label: '项目经理' },
          { key: 'supervisor', label: '监理负责人' },
          { key: 'customer', label: '建设单位' },
          { key: 'contractType', label: '合同类型', type: 'select', options: statusOptions(['总价合同', '单价合同', 'EPC总承包', '其他']) },
          { key: 'amount', label: '合同金额（元）', type: 'number' },
          { key: 'qualityTarget', label: '质量目标', type: 'select', options: statusOptions(['合格', '优良', '优秀']) },
          { key: 'safetyTarget', label: '安全目标', type: 'select', options: statusOptions(['零事故', '一般事故以下']) },
          { key: 'startDate', label: '开工日期', type: 'date' },
          { key: 'endDate', label: '计划竣工', type: 'date' },
          { key: 'planDuration', label: '计划工期（天）', type: 'number' },
          { key: 'status', label: '项目状态', type: 'select', options: statusOptions(['立项', '在建', '竣工', '完工', '停工', '暂缓']) },
          { key: 'description', label: '项目简介', type: 'textarea' },
        ],
      },
      {
        key: 'project-documents',
        title: '项目文档库',
        collection: 'projectDocuments',
        pageType: 'project-documents',
        fields: [
          { key: 'projectId', label: '所属项目', type: 'text' },
          { key: 'name', label: '文档名称', required: true },
          { key: 'type', label: '文档类型', type: 'select', options: statusOptions(['技术方案', '图纸', '检测报告', '验收记录', '设计变更', '评估报告', '设备清单', '合同文件', '其他']) },
          { key: 'fileName', label: '文件名' },
          { key: 'size', label: '文件大小（字节）', type: 'number' },
          { key: 'uploader', label: '上传人' },
          { key: 'date', label: '上传日期', type: 'date' },
          { key: 'description', label: '描述', type: 'textarea' },
        ],
      },
      {
        key: 'progress',
        title: '施工进度',
        collection: 'progress',
        pageType: 'gantt',
        fields: [
          { key: 'project', label: '项目', required: true },
          { key: 'task', label: '工作项' },
          { key: 'startDate', label: '开始日期', type: 'date' },
          { key: 'endDate', label: '结束日期', type: 'date' },
          { key: 'progress', label: '完成度', type: 'number' },
          { key: 'owner', label: '负责人' },
        ],
      },
      {
        key: 'plans',
        title: '需用计划',
        collection: 'plans',
        fields: [
          { key: 'name', label: '计划名称', required: true },
          { key: 'project', label: '所属项目' },
          { key: 'material', label: '物资' },
          { key: 'quantity', label: '数量', type: 'number' },
          { key: 'unit', label: '单位' },
          { key: 'planDate', label: '计划日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['待审批', '已批准', '已驳回']) },
        ],
      },
      {
        key: 'production-value',
        title: '产值统计',
        collection: 'productionValues',
        pageType: 'dashboard',
        fields: [
          { key: 'project', label: '项目', required: true },
          { key: 'month', label: '统计月份', type: 'text' },
          { key: 'value', label: '产值', type: 'number' },
          { key: 'owner', label: '责任人' },
        ],
      },
      {
        key: 'budgets',
        title: '施工预算',
        collection: 'budgets',
        fields: [
          { key: 'name', label: '预算名称', required: true },
          { key: 'project', label: '所属项目' },
          { key: 'amount', label: '预算金额', type: 'number' },
          { key: 'date', label: '编制日期', type: 'date' },
        ],
      },
      {
        key: 'rental-plans',
        title: '租赁计划',
        collection: 'rentalPlans',
        fields: [
          { key: 'name', label: '计划名称', required: true },
          { key: 'equipment', label: '设备' },
          { key: 'quantity', label: '数量', type: 'number' },
          { key: 'duration', label: '租赁时长', type: 'number' },
          { key: 'startDate', label: '开始日期', type: 'date' },
        ],
      },
      {
        key: 'subcontract-plans',
        title: '分包计划',
        collection: 'subcontractPlans',
        fields: [
          { key: 'name', label: '计划名称', required: true },
          { key: 'project', label: '所属项目' },
          { key: 'content', label: '分包内容', type: 'textarea' },
          { key: 'amount', label: '分包金额', type: 'number' },
          { key: 'team', label: '分包队伍' },
        ],
      },
      {
        key: 'changes',
        title: '变更签证',
        collection: 'changes',
        fields: [
          { key: 'title', label: '变更事项', required: true },
          { key: 'project', label: '项目' },
          { key: 'type', label: '变更类型', type: 'select', options: statusOptions(['设计变更', '签证变更', '材料代换', '其他']) },
          { key: 'amount', label: '变更金额', type: 'number' },
          { key: 'content', label: '变更内容', type: 'textarea' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['待审批', '已批准', '已驳回']) },
        ],
      },
      {
        key: 'completion',
        title: '竣工结算',
        collection: 'completions',
        fields: [
          { key: 'project', label: '项目', required: true },
          { key: 'settleAmount', label: '结算金额', type: 'number' },
          { key: 'settleDate', label: '结算日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['办理中', '已完成']) },
        ],
      },
    ],
  },
  {
    key: 'procurement',
    title: '采购管理',
    icon: 'ShoppingCart',
    features: [
      {
        key: 'major-requests',
        title: '大宗采购请示',
        collection: 'majorRequests',
        fields: [
          { key: 'name', label: '请示名称', required: true },
          { key: 'project', label: '所属项目' },
          { key: 'material', label: '采购物资' },
          { key: 'amount', label: '金额', type: 'number' },
          { key: 'date', label: '请示日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['待审批', '已批准', '已驳回']) },
        ],
      },
      {
        key: 'group-contracts',
        title: '集采合同',
        collection: 'groupContracts',
        fields: [
          { key: 'name', label: '合同名称', required: true },
          { key: 'code', label: '合同编号' },
          { key: 'supplier', label: '供应商' },
          { key: 'amount', label: '合同金额', type: 'number' },
          { key: 'signDate', label: '签订日期', type: 'date' },
        ],
      },
      {
        key: 'purchase-contracts',
        title: '采购合同',
        collection: 'purchaseContracts',
        fields: [
          { key: 'name', label: '合同名称', required: true },
          { key: 'code', label: '合同编号' },
          { key: 'supplier', label: '供应商' },
          { key: 'amount', label: '合同金额', type: 'number' },
          { key: 'signDate', label: '签订日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['草稿', '已生效', '履行中', '已结束']) },
        ],
      },
      {
        key: 'orders',
        title: '采购订单',
        collection: 'purchaseOrders',
        fields: [
          { key: 'code', label: '订单编号', required: true },
          { key: 'supplier', label: '供应商' },
          { key: 'material', label: '物资' },
          { key: 'quantity', label: '数量', type: 'number' },
          { key: 'unit', label: '单位' },
          { key: 'price', label: '单价', type: 'number' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['待确认', '已下单', '已收货', '已完成']) },
        ],
      },
      {
        key: 'rental-contracts',
        title: '租赁合同',
        collection: 'rentalContracts',
        fields: [
          { key: 'name', label: '合同名称', required: true },
          { key: 'code', label: '合同编号' },
          { key: 'supplier', label: '出租方' },
          { key: 'equipment', label: '设备' },
          { key: 'amount', label: '合同金额', type: 'number' },
          { key: 'signDate', label: '签订日期', type: 'date' },
        ],
      },
      {
        key: 'subcontracts',
        title: '分包合同',
        collection: 'subcontracts',
        fields: [
          { key: 'name', label: '合同名称', required: true },
          { key: 'code', label: '合同编号' },
          { key: 'team', label: '分包队伍' },
          { key: 'amount', label: '合同金额', type: 'number' },
          { key: 'project', label: '所属项目' },
          { key: 'signDate', label: '签订日期', type: 'date' },
        ],
      },
      {
        key: 'reports',
        title: '采购报表',
        collection: 'procurementReports',
        pageType: 'dashboard',
        fields: [
          { key: 'name', label: '报表名称', required: true },
          { key: 'type', label: '报表类型', type: 'select', options: statusOptions(['采购台账', '调拨台账', '物资价格']) },
          { key: 'date', label: '统计日期', type: 'date' },
        ],
      },
    ],
  },
  {
    key: 'material',
    title: '物资管理',
    icon: 'Boxes',
    features: [
      { key: 'receiving', title: '收料入库', collection: 'materialReceiving', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'supplier', label: '供应商' }, { key: 'material', label: '物资' },
        { key: 'quantity', label: '数量', type: 'number' }, { key: 'unit', label: '单位' }, { key: 'date', label: '入库日期', type: 'date' },
      ] },
      { key: 'discount', title: '入库折扣单', collection: 'materialDiscount', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'material', label: '物资' },
        { key: 'discount', label: '折扣率', type: 'number' }, { key: 'amount', label: '折扣金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'issue', title: '领料出库', collection: 'materialIssue', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'project', label: '领用项目' }, { key: 'team', label: '领用班组' },
        { key: 'material', label: '物资' }, { key: 'quantity', label: '数量', type: 'number' }, { key: 'unit', label: '单位' }, { key: 'date', label: '出库日期', type: 'date' },
      ] },
      { key: 'direct', title: '直入直出', collection: 'materialDirect', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'supplier', label: '供应商' }, { key: 'project', label: '项目' },
        { key: 'material', label: '物资' }, { key: 'quantity', label: '数量', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'transfer-out', title: '调拨出库', collection: 'materialTransferOut', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'fromWarehouse', label: '调出仓库' }, { key: 'toWarehouse', label: '调入仓库' },
        { key: 'material', label: '物资' }, { key: 'quantity', label: '数量', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'transfer-in', title: '调拨入库', collection: 'materialTransferIn', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'fromWarehouse', label: '调出仓库' }, { key: 'toWarehouse', label: '调入仓库' },
        { key: 'material', label: '物资' }, { key: 'quantity', label: '数量', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'return', title: '领料退库', collection: 'materialReturn', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'project', label: '项目' }, { key: 'team', label: '班组' },
        { key: 'material', label: '物资' }, { key: 'quantity', label: '数量', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'return-supplier', title: '物资退货', collection: 'materialReturnSupplier', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'supplier', label: '供应商' }, { key: 'material', label: '物资' },
        { key: 'quantity', label: '数量', type: 'number' }, { key: 'reason', label: '退货原因', type: 'textarea' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'warehouse', title: '仓库管理', collection: 'warehouses', fields: [
        { key: 'name', label: '仓库名称', required: true }, { key: 'code', label: '仓库编号' }, { key: 'keeper', label: '保管员' },
        { key: 'location', label: '位置' }, { key: 'capacity', label: '容量', type: 'number' },
      ] },
      { key: 'inventory', title: '盘点管理', collection: 'inventories', fields: [
        { key: 'name', label: '盘点单', required: true }, { key: 'warehouse', label: '仓库' }, { key: 'date', label: '盘点日期', type: 'date' },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['盘点中', '已确认']) },
      ] },
      { key: 'slow-moving', title: '呆滞物料处理', collection: 'slowMovingMaterials', fields: [
        { key: 'material', label: '物资', required: true }, { key: 'quantity', label: '数量', type: 'number' },
        { key: 'days', label: '呆滞天数', type: 'number' }, { key: 'solution', label: '处理方案', type: 'select', options: statusOptions(['调拨', '退货', '报废', '促销']) },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['待处理', '处理中', '已处理']) },
      ] },
      { key: 'ledgers', title: '物资台账', collection: 'materialLedgers', fields: [
        { key: 'name', label: '台账名称', required: true }, { key: 'type', label: '类型', type: 'select', options: statusOptions(['需用计划明细', '入库明细', '出库明细', '库存台账']) }, { key: 'date', label: '统计日期', type: 'date' },
      ] },
    ],
  },
  {
    key: 'equipment',
    title: '设备管理',
    icon: 'Truck',
    features: [
      { key: 'register', title: '设备台账', collection: 'equipments', fields: [
        { key: 'name', label: '设备名称', required: true }, { key: 'code', label: '设备编号' }, { key: 'category', label: '设备类别' },
        { key: 'owner', label: '归属单位' }, { key: 'status', label: '状态', type: 'select', options: statusOptions(['在用', '闲置', '维修', '报废']) }, { key: 'date', label: '购置日期', type: 'date' },
      ] },
      { key: 'lease', title: '设备租赁', collection: 'equipmentLeases', fields: [
        { key: 'name', label: '租赁设备', required: true }, { key: 'lessor', label: '出租方' }, { key: 'amount', label: '租金', type: 'number' },
        { key: 'startDate', label: '起租日期', type: 'date' }, { key: 'endDate', label: '到期日期', type: 'date' }, { key: 'status', label: '状态', type: 'select', options: statusOptions(['租用中', '已归还']) },
      ] },
      { key: 'dispatch', title: '设备调度', collection: 'equipmentDispatches', fields: [
        { key: 'equipment', label: '设备', required: true }, { key: 'fromProject', label: '调出项目' }, { key: 'toProject', label: '调入项目' },
        { key: 'date', label: '调度日期', type: 'date' }, { key: 'owner', label: '经办人' },
      ] },
      { key: 'maintenance', title: '维护保养', collection: 'equipmentMaintenances', fields: [
        { key: 'equipment', label: '设备', required: true }, { key: 'type', label: '保养类型', type: 'select', options: statusOptions(['日常保养', '定期保养', '大修']) },
        { key: 'date', label: '保养日期', type: 'date' }, { key: 'cost', label: '费用', type: 'number' }, { key: 'content', label: '保养内容', type: 'textarea' },
      ] },
      { key: 'repair', title: '故障维修', collection: 'equipmentRepairs', fields: [
        { key: 'equipment', label: '设备', required: true }, { key: 'fault', label: '故障描述', type: 'textarea' }, { key: 'date', label: '报修日期', type: 'date' },
        { key: 'cost', label: '维修费用', type: 'number' }, { key: 'status', label: '状态', type: 'select', options: statusOptions(['待维修', '维修中', '已修复']) },
      ] },
    ],
  },
  {
    key: 'oa',
    title: '协同办公',
    icon: 'Bell',
    features: [
      {
        key: 'notices',
        title: '公告通知',
        collection: 'notices',
        pageType: 'doc',
        fields: [
          { key: 'title', label: '公告标题', required: true },
          { key: 'publisher', label: '发布人' },
          { key: 'content', label: '公告内容', type: 'textarea' },
          { key: 'date', label: '发布日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['草稿', '已发布', '已撤回']) },
        ],
      },
      {
        key: 'approvals',
        title: '审批中心',
        collection: 'approvals',
        pageType: 'approval',
        fields: [
          { key: 'title', label: '审批事项', required: true },
          { key: 'applicant', label: '申请人' },
          { key: 'type', label: '审批类型', type: 'select', options: statusOptions(['采购审批', '报销审批', '合同审批', '请假审批', '用款审批', '其他']) },
          { key: 'amount', label: '金额', type: 'number' },
          { key: 'date', label: '申请日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['待审批', '已批准', '已驳回', '已撤回']) },
        ],
      },
      {
        key: 'calendar',
        title: '日程管理',
        collection: 'schedules',
        pageType: 'calendar',
        fields: [
          { key: 'title', label: '日程主题', required: true },
          { key: 'date', label: '日程日期', type: 'date' },
          { key: 'owner', label: '负责人' },
          { key: 'location', label: '地点' },
          { key: 'content', label: '日程内容', type: 'textarea' },
        ],
      },
      {
        key: 'meetings',
        title: '会议管理',
        collection: 'meetings',
        fields: [
          { key: 'title', label: '会议主题', required: true },
          { key: 'date', label: '会议日期', type: 'date' },
          { key: 'location', label: '会议室' },
          { key: 'host', label: '主持人' },
          { key: 'participants', label: '参会人' },
          { key: 'content', label: '会议纪要', type: 'textarea' },
        ],
      },
      {
        key: 'tasks',
        title: '任务协作',
        collection: 'tasks',
        fields: [
          { key: 'title', label: '任务标题', required: true },
          { key: 'assignee', label: '负责人' },
          { key: 'project', label: '关联项目' },
          { key: 'priority', label: '优先级', type: 'select', options: statusOptions(['低', '中', '高', '紧急']) },
          { key: 'dueDate', label: '截止日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['未开始', '进行中', '已完成', '已逾期']) },
        ],
      },
      {
        key: 'documents',
        title: '文档中心',
        collection: 'documents',
        pageType: 'doc',
        fields: [
          { key: 'title', label: '文档标题', required: true },
          { key: 'category', label: '文档分类', type: 'select', options: statusOptions(['制度文件', '合同文件', '图纸资料', '报告总结', '其他']) },
          { key: 'author', label: '作者' },
          { key: 'content', label: '文档内容', type: 'textarea' },
          { key: 'date', label: '上传日期', type: 'date' },
        ],
      },
    ],
  },
  {
    key: 'market',
    title: '市场经营',
    icon: 'Target',
    features: [
      {
        key: 'customers',
        title: '客户档案',
        collection: 'customers',
        fields: [
          { key: 'name', label: '客户名称', required: true },
          { key: 'level', label: '客户级别', type: 'select', options: statusOptions(['战略', '重要', '一般']) },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系电话' },
          { key: 'address', label: '地址', type: 'textarea' },
        ],
      },
      {
        key: 'opportunities',
        title: '商机跟单',
        collection: 'opportunities',
        fields: [
          { key: 'name', label: '商机名称', required: true },
          { key: 'customer', label: '客户' },
          { key: 'amount', label: '预计金额', type: 'number' },
          { key: 'stage', label: '跟进阶段', type: 'select', options: statusOptions(['初步接触', '方案沟通', '报价谈判', '投标', '中标', '流失']) },
          { key: 'owner', label: '跟进人' },
          { key: 'date', label: '登记日期', type: 'date' },
        ],
      },
      {
        key: 'bids',
        title: '投标管理',
        collection: 'bids',
        fields: [
          { key: 'name', label: '投标项目', required: true },
          { key: 'customer', label: '招标单位' },
          { key: 'bidAmount', label: '投标金额', type: 'number' },
          { key: 'bidDate', label: '投标日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['准备中', '已投标', '中标', '未中标']) },
        ],
      },
      {
        key: 'bid-reports',
        title: '投标结果报表',
        collection: 'bidReports',
        pageType: 'dashboard',
        fields: [
          { key: 'name', label: '投标项目', required: true },
          { key: 'result', label: '结果', type: 'select', options: statusOptions(['中标', '未中标']) },
          { key: 'amount', label: '中标金额', type: 'number' },
          { key: 'date', label: '公布日期', type: 'date' },
        ],
      },
      {
        key: 'contracts',
        title: '合同登记',
        collection: 'contracts',
        fields: [
          { key: 'name', label: '合同名称', required: true },
          { key: 'code', label: '合同编号' },
          { key: 'party', label: '对方单位' },
          { key: 'amount', label: '合同金额', type: 'number' },
          { key: 'signDate', label: '签订日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['草稿', '已生效', '履行中', '已结束']) },
        ],
      },
      {
        key: 'project-init',
        title: '项目立项',
        collection: 'projectInits',
        fields: [
          { key: 'name', label: '项目名称', required: true },
          { key: 'customer', label: '建设单位' },
          { key: 'amount', label: '合同金额', type: 'number' },
          { key: 'approvalDate', label: '立项日期', type: 'date' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions(['待审批', '已立项', '已驳回']) },
        ],
      },
    ],
  },
  {
    key: 'finance',
    title: '财务管理',
    icon: 'Wallet',
    features: [
      { key: 'invoices', title: '发票管理', collection: 'invoices', fields: [
        { key: 'code', label: '发票号码', required: true }, { key: 'type', label: '类型', type: 'select', options: statusOptions(['进项', '销项']) },
        { key: 'amount', label: '金额', type: 'number' }, { key: 'tax', label: '税额', type: 'number' },
        { key: 'date', label: '开票日期', type: 'date' }, { key: 'party', label: '往来单位' },
      ] },
      { key: 'reimbursements', title: '报销管理', collection: 'reimbursements', fields: [
        { key: 'title', label: '报销事由', required: true }, { key: 'applicant', label: '申请人' }, { key: 'amount', label: '金额', type: 'number' },
        { key: 'date', label: '报销日期', type: 'date' }, { key: 'status', label: '状态', type: 'select', options: statusOptions(['待审批', '已批准', '已驳回']) },
      ] },
      { key: 'funds', title: '资金管理', collection: 'funds', fields: [
        { key: 'title', label: '资金项目', required: true }, { key: 'type', label: '类型', type: 'select', options: statusOptions(['收款', '付款']) },
        { key: 'amount', label: '金额', type: 'number' }, { key: 'party', label: '往来单位' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'payments', title: '付款管理', collection: 'payments', fields: [
        { key: 'title', label: '付款事项', required: true }, { key: 'payee', label: '收款方' }, { key: 'amount', label: '金额', type: 'number' },
        { key: 'date', label: '付款日期', type: 'date' }, { key: 'method', label: '付款方式', type: 'select', options: statusOptions(['银行转账', '支票', '现金', '承兑汇票']) },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['待付款', '已付款']) },
      ] },
      { key: 'cost-analysis', title: '项目成本分析', collection: 'costAnalyses', pageType: 'dashboard', fields: [
        { key: 'project', label: '项目', required: true }, { key: 'plannedCost', label: '计划成本', type: 'number' },
        { key: 'actualCost', label: '实际成本', type: 'number' }, { key: 'profit', label: '利润', type: 'number' }, { key: 'date', label: '统计日期', type: 'date' },
      ] },
    ],
  },
  {
    key: 'quality',
    title: '安全与质量',
    icon: 'ShieldCheck',
    features: [
      { key: 'safety-inspection', title: '安全检查与整改', collection: 'safetyInspections', fields: [
        { key: 'title', label: '检查主题', required: true }, { key: 'project', label: '项目' }, { key: 'inspector', label: '检查人' },
        { key: 'date', label: '检查日期', type: 'date' }, { key: 'issues', label: '发现问题', type: 'textarea' },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['待整改', '整改中', '已完成']) },
      ] },
      { key: 'safety-training', title: '安全培训', collection: 'safetyTrainings', fields: [
        { key: 'title', label: '培训主题', required: true }, { key: 'trainer', label: '培训讲师' }, { key: 'date', label: '培训日期', type: 'date' },
        { key: 'participants', label: '参训人数', type: 'number' }, { key: 'content', label: '培训内容', type: 'textarea' },
      ] },
      { key: 'safety-punishment', title: '安全处罚单', collection: 'safetyPunishments', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'project', label: '项目' }, { key: 'person', label: '当事人' },
        { key: 'reason', label: '处罚原因', type: 'textarea' }, { key: 'amount', label: '处罚金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'safety-reward', title: '安全奖励单', collection: 'safetyRewards', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'project', label: '项目' }, { key: 'person', label: '受奖人' },
        { key: 'reason', label: '奖励原因', type: 'textarea' }, { key: 'amount', label: '奖励金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'safety-accident', title: '安全事故汇报', collection: 'safetyAccidents', fields: [
        { key: 'title', label: '事故标题', required: true }, { key: 'project', label: '项目' },
        { key: 'level', label: '事故等级', type: 'select', options: statusOptions(['一般', '较大', '重大', '特别重大']) },
        { key: 'date', label: '发生日期', type: 'date' }, { key: 'description', label: '事故描述', type: 'textarea' },
      ] },
      { key: 'safety-input-ledger', title: '安全投入台账', collection: 'safetyInputLedgers', fields: [
        { key: 'project', label: '项目', required: true }, { key: 'item', label: '投入项目' },
        { key: 'amount', label: '投入金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'quality-inspection', title: '质量检查与整改', collection: 'qualityInspections', fields: [
        { key: 'title', label: '检查主题', required: true }, { key: 'project', label: '项目' }, { key: 'inspector', label: '检查人' },
        { key: 'date', label: '检查日期', type: 'date' }, { key: 'issues', label: '发现问题', type: 'textarea' },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['待整改', '整改中', '已完成']) },
      ] },
      { key: 'quality-training', title: '质量培训', collection: 'qualityTrainings', fields: [
        { key: 'title', label: '培训主题', required: true }, { key: 'trainer', label: '培训讲师' }, { key: 'date', label: '培训日期', type: 'date' },
        { key: 'participants', label: '参训人数', type: 'number' }, { key: 'content', label: '培训内容', type: 'textarea' },
      ] },
      { key: 'quality-punishment', title: '质量处罚单', collection: 'qualityPunishments', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'project', label: '项目' }, { key: 'person', label: '当事人' },
        { key: 'reason', label: '处罚原因', type: 'textarea' }, { key: 'amount', label: '处罚金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'quality-reward', title: '质量奖励单', collection: 'qualityRewards', fields: [
        { key: 'code', label: '单据编号', required: true }, { key: 'project', label: '项目' }, { key: 'person', label: '受奖人' },
        { key: 'reason', label: '奖励原因', type: 'textarea' }, { key: 'amount', label: '奖励金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'quality-accident', title: '质量事故汇报', collection: 'qualityAccidents', fields: [
        { key: 'title', label: '事故标题', required: true }, { key: 'project', label: '项目' },
        { key: 'level', label: '事故等级', type: 'select', options: statusOptions(['一般', '较大', '重大', '特别重大']) },
        { key: 'date', label: '发生日期', type: 'date' }, { key: 'description', label: '事故描述', type: 'textarea' },
      ] },
    ],
  },
  {
    key: 'hr',
    title: '人力资源',
    icon: 'Users',
    features: [
      { key: 'staff', title: '人事档案', collection: 'staff', fields: [
        { key: 'name', label: '姓名', required: true }, { key: 'department', label: '部门' }, { key: 'position', label: '职位' },
        { key: 'phone', label: '联系电话' }, { key: 'hireDate', label: '入职日期', type: 'date' },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['在职', '离职', '休假']) },
      ] },
      { key: 'attendance', title: '考勤管理', collection: 'attendances', pageType: 'calendar', fields: [
        { key: 'name', label: '姓名', required: true }, { key: 'date', label: '日期', type: 'date' },
        { key: 'status', label: '出勤状态', type: 'select', options: statusOptions(['出勤', '迟到', '早退', '请假', '缺勤']) },
      ] },
      { key: 'teams', title: '施工班组', collection: 'teams', fields: [
        { key: 'name', label: '班组名称', required: true }, { key: 'leader', label: '班组长' }, { key: 'members', label: '成员数', type: 'number' },
        { key: 'project', label: '所属项目' }, { key: 'phone', label: '联系电话' },
      ] },
      { key: 'training', title: '培训管理', collection: 'trainings', fields: [
        { key: 'title', label: '培训主题', required: true }, { key: 'trainer', label: '讲师' }, { key: 'date', label: '培训日期', type: 'date' },
        { key: 'participants', label: '参训人数', type: 'number' }, { key: 'status', label: '状态', type: 'select', options: statusOptions(['计划中', '进行中', '已完成']) },
      ] },
      { key: 'rewards', title: '奖惩记录', collection: 'rewards', fields: [
        { key: 'person', label: '人员', required: true }, { key: 'type', label: '类型', type: 'select', options: statusOptions(['奖励', '处罚']) },
        { key: 'reason', label: '事由', type: 'textarea' }, { key: 'amount', label: '金额', type: 'number' }, { key: 'date', label: '日期', type: 'date' },
      ] },
      { key: 'admin-assets', title: '行政物资', collection: 'adminAssets', fields: [
        { key: 'name', label: '物资名称', required: true }, { key: 'category', label: '类别' },
        { key: 'quantity', label: '数量', type: 'number' }, { key: 'unit', label: '单位' }, { key: 'location', label: '存放位置' },
      ] },
    ],
  },
  {
    key: 'platform',
    title: '平台中心',
    icon: 'Settings',
    features: [
      { key: 'info', title: '信息管理', collection: 'platformInfo', pageType: 'doc', fields: [
        { key: 'title', label: '信息标题', required: true }, { key: 'type', label: '类型', type: 'select', options: statusOptions(['公告', '通知', '制度', '新闻']) },
        { key: 'content', label: '内容', type: 'textarea' }, { key: 'date', label: '发布时间', type: 'date' },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['草稿', '已发布']) },
      ] },
      { key: 'alerts', title: '预警中心', collection: 'alerts', pageType: 'dashboard', fields: [
        { key: 'title', label: '预警事项', required: true }, { key: 'level', label: '级别', type: 'select', options: statusOptions(['提示', '警告', '严重']) },
        { key: 'content', label: '内容', type: 'textarea' }, { key: 'date', label: '日期', type: 'date' },
        { key: 'status', label: '状态', type: 'select', options: statusOptions(['未处理', '已处理']) },
      ] },
      { key: 'logs', title: '日志中心', collection: 'logs', fields: [
        { key: 'operator', label: '操作人', required: true }, { key: 'action', label: '操作内容' },
        { key: 'module', label: '模块' }, { key: 'date', label: '操作时间', type: 'date' },
      ] },
      { key: 'users', title: '用户与权限', collection: 'users', pageType: 'user-manage', fields: [
        { key: 'username', label: '用户名', required: true }, { key: 'email', label: '邮箱' },
        { key: 'role', label: '角色', type: 'select', options: statusOptions(['super_admin', 'high_admin', 'general_admin', 'employee', 'outsource']) },
      ] },
    ],
  },
  {
    key: 'resource',
    title: '资源中心',
    icon: 'Database',
    features: [
      { key: 'customers', title: '客户档案', collection: 'customers', fields: [
        { key: 'name', label: '客户名称', required: true }, { key: 'contact', label: '联系人' },
        { key: 'phone', label: '联系电话' }, { key: 'address', label: '地址', type: 'textarea' },
      ] },
      { key: 'materials', title: '物料中心', collection: 'materials', fields: [
        { key: 'name', label: '物料名称', required: true }, { key: 'spec', label: '规格型号' }, { key: 'unit', label: '单位' },
        { key: 'price', label: '参考单价', type: 'number' }, { key: 'category', label: '类别' },
      ] },
      { key: 'suppliers', title: '供应商档案', collection: 'suppliers', fields: [
        { key: 'name', label: '供应商名称', required: true }, { key: 'contact', label: '联系人' }, { key: 'phone', label: '联系电话' },
        { key: 'material', label: '供应物资' }, { key: 'address', label: '地址', type: 'textarea' },
      ] },
      { key: 'projects', title: '项目库', collection: 'projects', fields: [
        { key: 'name', label: '项目名称', required: true }, { key: 'code', label: '项目编号' }, { key: 'manager', label: '项目经理' },
        { key: 'budget', label: '预算金额', type: 'number' }, { key: 'status', label: '状态', type: 'select', options: statusOptions(['立项', '在建', '竣工', '停工']) },
      ] },
      { key: 'teams', title: '施工班组', collection: 'teams', fields: [
        { key: 'name', label: '班组名称', required: true }, { key: 'leader', label: '班组长' }, { key: 'members', label: '成员数', type: 'number' },
        { key: 'project', label: '所属项目' }, { key: 'phone', label: '联系电话' },
      ] },
    ],
  },
];

export function getFeature(categoryKey: string, featureKey: string): FeatureDef | null {
  const cat = categories.find((c) => c.key === categoryKey);
  if (!cat) return null;
  return cat.features.find((f) => f.key === featureKey) || null;
}

export function getCategory(categoryKey: string): CategoryDef | null {
  return categories.find((c) => c.key === categoryKey) || null;
}