# SG-Build 施工管理系统

施工企业项目管理平台，支持多项目并行管理。

## 技术栈

- **后端**: NestJS + JWT认证 + 内存存储
- **PC端**: Next.js 15 + shadcn/ui + Tailwind CSS + React Flow
- **移动端**: Expo (React Native) + React Navigation

## 项目结构

```
E:\Desktop\APP\
├── backend/          # NestJS 后端服务 (端口 3000)
├── frontend-web/     # Next.js PC端 (端口 3001)
├── frontend-mobile/  # Expo 移动端
└── sg-build/README.md
```

## 业务模块

1. 用户认证（登录/注册/JWT）
2. 组织架构管理（拖拽架构图 + 列表模式）
3. 项目管理（多项目并行）
4. 审批流程
5. 现场记录（支持GPS定位+离线）
6. 材料管理
7. 设备管理
8. 安全管理
9. 数据报表

## 快速启动

### 后端
```bash
cd E:\Desktop\APP\backend
npm run start:dev
```

### PC端
```bash
cd E:\Desktop\APP\frontend-web
npm run dev
```

## 默认账户

- 用户名: admin
- 密码: admin123

## 访问地址

- PC端: http://localhost:3001
- 后端: http://localhost:3000

## 组织架构功能

### 图表模式
- 拖拽节点调整位置
- 从节点底部拖出连线到目标节点创建上下级关系
- 节点显示：部门名称、负责人、人数
- 支持缩放、平移、重置视图

### 列表模式
- 传统表格展示部门信息
- 支持搜索过滤
- 可切换回图表模式继续编辑
