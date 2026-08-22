import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { DataService } from '../../services/data.service';

@Controller('org')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrgController {
  constructor(private data: DataService) {}

  @Get('tree')
  getTree(@Req() req: any) {
    const departments = this.data.getCollectionItems('departments');
    const positions = this.data.getCollectionItems('orgPositions');
    const tree = this.data.buildOrgTree(departments, positions);
    const username = req.user?.username || '';
    const visibleDeptIds = this.data.getAddressBookDeptIds(username);
    return visibleDeptIds
      ? this.data.filterOrgTreeByVisible(tree, new Set(visibleDeptIds))
      : [];
  }

  @Get('departments')
  getDepartments() {
    return this.data.getCollectionItems('departments');
  }

  @Get('positions')
  getPositions() {
    return this.data.getCollectionItems('orgPositions');
  }

  // 聊天分组配置
  @Get('chat-groups')
  getChatGroups() {
    return this.data.getCollectionItems('chatGroups');
  }

  @Post('chat-groups')
  @Roles('super_admin')
  createChatGroup(@Body() body: any) {
    return this.data.addCollectionItem('chatGroups', {
      id: body.id || this.data.generateId(),
      name: body.name,
      icon: body.icon || '💬',
      color: body.color || 'gray',
      sortOrder: body.sortOrder || 0,
      description: body.description || '',
      departmentIds: body.departmentIds || [],
    });
  }

  @Put('chat-groups/:id')
  @Roles('super_admin')
  updateChatGroup(@Param('id') id: string, @Body() body: any) {
    return this.data.updateCollectionItem('chatGroups', id, {
      name: body.name,
      icon: body.icon,
      color: body.color,
      sortOrder: body.sortOrder,
      description: body.description,
      departmentIds: body.departmentIds,
    });
  }

  @Delete('chat-groups/:id')
  @Roles('super_admin')
  deleteChatGroup(@Param('id') id: string) {
    return this.data.deleteCollectionItem('chatGroups', id);
  }

  @Post('departments')
  @Roles('super_admin', 'high_admin', 'general_admin')
  createDepartment(@Body() body: any) {
    const dept = {
      name: body.name,
      code: body.code || '',
      parentId: body.parentId || null,
      leader: body.leader || '',
      phone: body.phone || '',
      description: body.description || '',
      sortOrder: body.sortOrder || 0,
    };
    const created = this.data.addCollectionItem('departments', dept);
    // 新建部门自动创建部门群并同步成员（钉钉/飞书式联动）
    this.data.syncDepartmentGroup(created.id);
    return created;
  }

  @Put('departments/:id')
  @Roles('super_admin', 'high_admin', 'general_admin')
  updateDepartment(@Param('id') id: string, @Body() body: any) {
    const prev = this.data.getCollectionItems('departments').find((d: any) => d.id === id);
    const updated = this.data.updateCollectionItem('departments', id, body);
    // 部门改名/负责人变更 → 同步部门群
    if (updated) this.data.syncDepartmentGroup(id);
    return updated;
  }

  @Delete('departments/:id')
  @Roles('super_admin', 'high_admin')
  deleteDepartment(@Param('id') id: string) {
    const departments = this.data.getCollectionItems('departments');
    const idsToDelete = this.data.getDescendantIds(id, departments);
    idsToDelete.push(id);

    // Delete positions in those departments
    const positions = this.data.getCollectionItems('orgPositions');
    for (const pos of positions) {
      if (idsToDelete.includes(pos.departmentId)) {
        this.data.deleteCollectionItem('orgPositions', pos.id);
      }
    }

    // Delete departments + 清理对应部门群
    for (const did of idsToDelete) {
      this.data.deleteCollectionItem('departments', did);
      this.data.removeDepartmentGroup(did);
    }

    return { deleted: idsToDelete.length };
  }

  @Put('departments/:id/move')
  @Roles('super_admin', 'high_admin', 'general_admin')
  moveDepartment(@Param('id') id: string, @Body() body: { parentId: string | null }) {
    return this.data.updateCollectionItem('departments', id, { parentId: body.parentId });
  }

  @Post('positions')
  @Roles('super_admin', 'high_admin', 'general_admin')
  createPosition(@Body() body: any) {
    const pos = {
      name: body.name,
      departmentId: body.departmentId,
      level: body.level || 40,
      description: body.description || '',
      sortOrder: body.sortOrder || 0,
    };
    return this.data.addCollectionItem('orgPositions', pos);
  }

  @Put('positions/:id')
  @Roles('super_admin', 'high_admin', 'general_admin')
  updatePosition(@Param('id') id: string, @Body() body: any) {
    return this.data.updateCollectionItem('orgPositions', id, body);
  }

  @Delete('positions/:id')
  @Roles('super_admin', 'high_admin')
  deletePosition(@Param('id') id: string) {
    return this.data.deleteCollectionItem('orgPositions', id);
  }

  // ── 成员管理（组织架构与消息联动：调部门自动进/退部门群）──

  // 全部成员（含未分配部门的），供组织架构页成员管理使用
  @Get('members')
  @Roles('super_admin', 'high_admin', 'general_admin')
  getMembers() {
    return this.data.getUsers().map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
  }

  // 调整单个成员组织属性（部门/岗位/负责人/副职/启用停用）
  @Put('members/:username')
  @Roles('super_admin', 'high_admin', 'general_admin')
  updateMember(@Param('username') username: string, @Body() body: any) {
    const prev = this.data.getUserByUsername(username);
    if (!prev) throw new Error('用户不存在');
    const patch: any = {};
    if (body.department !== undefined) patch.department = body.department;
    if (body.position !== undefined) patch.position = body.position;
    if (body.isHead !== undefined) patch.isHead = !!body.isHead;
    if (body.isDeputy !== undefined) patch.isDeputy = !!body.isDeputy;
    if (body.isActive !== undefined) patch.isActive = !!body.isActive;
    if (body.name !== undefined) patch.name = body.name;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (Object.keys(patch).length === 0) return prev;
    const updated = this.data.updateUser(prev.id, patch);
    // 部门调动/停用联动部门群；负责人/副职变更同步群管理员
    this.data.syncUserDepartmentGroups(prev.department, updated.department, username);
    // 若该用户是某部门负责人，其所在部门群需同步群主
    this.data.syncDepartmentGroupByName(prev.department, this.data.getDepartmentIdByName(updated.department) || '');
    const { password, ...rest } = updated;
    return rest;
  }

  // 批量设置部门直属成员（钉钉式：在部门下勾选成员）
  @Put('departments/:id/members')
  @Roles('super_admin', 'high_admin', 'general_admin')
  setDepartmentMembers(@Param('id') id: string, @Body() body: { usernames: string[] }) {
    const dept = this.data.getCollectionItems('departments').find((d: any) => d.id === id);
    if (!dept) throw new Error('部门不存在');
    const target = new Set(body.usernames || []);
    const changed: string[] = [];
    for (const u of this.data.getUsers()) {
      const wasIn = u.department === dept.name;
      const shouldIn = target.has(u.username) && u.isActive !== false;
      if (wasIn && !shouldIn) {
        this.data.updateUser(u.id, { department: '' });
        changed.push(u.username);
      } else if (!wasIn && shouldIn) {
        this.data.updateUser(u.id, { department: dept.name });
        changed.push(u.username);
      }
    }
    // 同步部门群成员
    this.data.syncDepartmentGroup(id);
    return { message: '成员已更新', changed, memberCount: target.size };
  }
}
