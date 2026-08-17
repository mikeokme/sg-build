# SG-Build 施工企业管理系统

施工企业项目管理平台，支持多项目并行管理与全流程业务协同。面向施工企业的高频场景设计，覆盖市场经营、工程进度、物资设备、财务、质量安全、人力资源与协同办公。

> 当前版本以本地运行为主，全部数据存于后端内存（重启即重置），后续逐步接入持久化与网络部署。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | NestJS 10 + JWT 认证 + WebSocket 实时通信 + 内存存储（端口 3000） |
| PC 端 | Next.js 16 + shadcn/ui + Tailwind CSS + Dark Mode（端口 3001） |
| 移动端 | Expo (React Native) + React Navigation |

## 功能模块（11 大业务中心）

| 中心 | 说明 |
| --- | --- |
| 协同办公 oa | 公告通知、待办审批、日程安排、会议管理、任务分派、制度文档 |
| 市场经营 market | 客户管理、商机管理、投标管理、投标报告、合同管理、项目立项 |
| 工程管理 engineering | 项目档案、施工进度、计划管理、产值、预算、租赁计划、分包计划、变更、竣工 |
| 采购管理 procurement | 大宗需求、集团合同、采购合同、采购订单、租赁合同、分包合同、采购报告 |
| 物资管理 material | 收料、折扣、领料、直发、调出/调入、退料、退供应商、仓库、库存、积压、台账 |
| 设备管理 equipment | 设备档案、设备租赁、派单、维保、维修 |
| 财务管理 finance | 发票、报销、资金、付款、成本分析 |
| 质量安全 quality | 安全检查/培训/奖惩/事故/投入台账、质量检查/培训/奖惩/事故 |
| 人力资源 hr | 员工档案、考勤、班组、培训、奖惩、办公资产 |
| 平台中心 platform | 系统信息、预警、日志、用户与权限、系统设置 |
| 基础资源 resource | 材料、供应商、项目字典 |

## 核心特性

### 1. 阅后即焚消息（即时通讯）
- 群聊中可发送阅后即焚消息，指定接收人后仅对方可见
- 支持 5/10/30/60 秒倒计时自动销毁
- 消息揭示后启动焚毁倒计时，仅发送者和接收者可见
- 加密消息与阅后即焚双重保护

### 2. 项目部配置
- 系统设置页面支持配置站点名称、公司名称
- 数据保留天数、会话超时时间等参数可调
- 支持上传企业 Logo

### 3. 主题与语言设置
- 右上角配置按钮一键切换主题：明（太阳）/ 暗（月亮）/ 随系统
- 支持中英文切换
- 设置自动保存到 localStorage

### 4. 权限体系
5 级角色，注册时凭注册码申请，**一律先为普通用户，需超级管理员二次确认后才生效**：

| 角色 | 级别 | 说明 |
| --- | --- | --- |
| super_admin | 100 | 董事长 / 总经理 / 系统超管 |
| high_admin | 80 | 部门 / 分子公司 / 号码公司负责人 |
| general_admin | 60 | 副手 / 业务主管 |
| employee | 40 | 普通职工 |
| outsource | 10 | 项目外协人员（仅工程 / 协同办公写入，无删除） |

粒度控制：查看 / 新增 / 编辑 / 删除四级独立门槛，前端按钮级显隐 + 后端接口强制校验双重拦截。

| 角色 | 注册码 |
| --- | --- |
| super_admin | `SGB-ROOT-2026` |
| high_admin | `SGB-HIGH-2026` |
| general_admin | `SGB-GEN-2026` |
| employee | `SGB-EMP-2026` |
| outsource | `SGB-OUT-2026` |

## 页面类型引擎

业务功能由配置驱动，统一渲染为 6 种页面：

- `list` 通用列表（增删改查）
- `dashboard` 统计看板（汇总 + 分布 + 明细）
- `approval` 审批流（待审批 / 已批准 / 已驳回）
- `gantt` 进度甘特图
- `calendar` 日程日历
- `doc` 制度文档
- `user-manage` 用户权限管理（平台中心）

## 快速开始

### 1. 后端（端口 3000）

```bash
cd backend
npm install
npm start
```

### 2. PC 前端（端口 3001）

```bash
cd frontend-web
npm install
npm run dev -- -p 3001
```

### 3. 移动端（可选）

```bash
cd frontend-mobile
npm install
npm run start
```

## 默认账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123` | super_admin |
| `manager` | `admin123` | high_admin |

> 本地测试也可在注册页用注册码自助注册（审批需用 admin 在「平台中心 → 用户与权限」确认）。

## 项目结构

```
├── backend/              # NestJS 后端 (3000)
│   └── src/
│       ├── modules/      # auth、chat、collection、dashboard、org
│       ├── services/     # 内存数据服务 + 种子数据
│       └── guards/       # JWT + 集合权限守卫
├── frontend-web/         # Next.js PC 端 (3001)
│   └── src/
│       ├── app/          # 路由（动态 [category]/[feature]）
│       ├── components/   # 页面引擎 + UI 组件
│       ├── context/      # SettingsContext（主题/语言设置）
│       └── config/       # features.ts 模块注册表、roles.ts 权限配置
├── frontend-mobile/      # Expo 移动端
├── docs/                 # 架构规划文档
└── sg-build-main/        # 原型参考代码
```

## API 接口

| 接口 | 说明 |
| --- | --- |
| `POST /auth/login` | 用户登录 |
| `POST /auth/register` | 用户注册 |
| `GET /auth/users` | 获取用户列表（管理员） |
| `GET /auth/settings` | 获取系统设置 |
| `PUT /auth/settings` | 更新系统设置 |
| `GET /collections/:name` | 获取集合数据 |
| `POST /collections/:name` | 新增数据 |
| `PUT /collections/:name/:id` | 更新数据 |
| `DELETE /collections/:name/:id` | 删除数据 |
| `GET /chat/conversations` | 获取聊天会话列表 |
| `GET /chat/conversations/:id/messages` | 获取消息列表 |
| `WebSocket /chat` | 实时聊天（Socket.IO） |
| `GET /notifications` | 获取通知列表 |
| `GET /notifications/stream` | SSE 实时通知推送 |
| `GET /dashboard/stats` | 工作台统计数据 |
| `GET /org/departments` | 组织架构数据 |

## 架构设计

详见 [`docs/架构规划.md`](docs/架构规划.md)：三层架构（接入层 / 业务层 / 数据层）、配置驱动的页面引擎、按角色级别的权限矩阵。

## 说明

- 数据为内存存储，服务重启后重置（含种子演示数据）
- 后端接口统一前缀 `/collections/:name`（集合 CRUD），`/auth/*` 为认证与用户管理
- 业务中心 / 功能 / 字段全部由 `frontend-web/src/config/features.ts` 配置驱动，新增功能无需新写页面
- 主题和语言设置持久化到 localStorage
