import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { DataService } from '../../services/data.service';

@Controller('org')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrgController {
  constructor(private data: DataService) {}

  @Get('tree')
  getTree() {
    const departments = this.data.getCollectionItems('departments');
    const positions = this.data.getCollectionItems('orgPositions');
    return this.buildTree(departments, positions);
  }

  @Get('departments')
  getDepartments() {
    return this.data.getCollectionItems('departments');
  }

  @Get('positions')
  getPositions() {
    return this.data.getCollectionItems('orgPositions');
  }

  @Post('departments')
  @Roles('super_admin', 'high_admin')
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
    return this.data.addCollectionItem('departments', dept);
  }

  @Put('departments/:id')
  @Roles('super_admin', 'high_admin')
  updateDepartment(@Param('id') id: string, @Body() body: any) {
    return this.data.updateCollectionItem('departments', id, body);
  }

  @Delete('departments/:id')
  @Roles('super_admin')
  deleteDepartment(@Param('id') id: string) {
    const departments = this.data.getCollectionItems('departments');
    const idsToDelete = this.getDescendantIds(id, departments);
    idsToDelete.push(id);

    // Delete positions in those departments
    const positions = this.data.getCollectionItems('orgPositions');
    for (const pos of positions) {
      if (idsToDelete.includes(pos.departmentId)) {
        this.data.deleteCollectionItem('orgPositions', pos.id);
      }
    }

    // Delete departments
    for (const did of idsToDelete) {
      this.data.deleteCollectionItem('departments', did);
    }

    return { deleted: idsToDelete.length };
  }

  @Put('departments/:id/move')
  @Roles('super_admin')
  moveDepartment(@Param('id') id: string, @Body() body: { parentId: string | null }) {
    return this.data.updateCollectionItem('departments', id, { parentId: body.parentId });
  }

  @Post('positions')
  @Roles('super_admin', 'high_admin')
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
  @Roles('super_admin', 'high_admin')
  updatePosition(@Param('id') id: string, @Body() body: any) {
    return this.data.updateCollectionItem('orgPositions', id, body);
  }

  @Delete('positions/:id')
  @Roles('super_admin')
  deletePosition(@Param('id') id: string) {
    return this.data.deleteCollectionItem('orgPositions', id);
  }

  private buildTree(departments: any[], positions: any[]): any[] {
    const users = this.data.getUsers().filter((u: any) => u.isActive !== false);
    // 构建部门名称到部门的映射
    const deptByName = new Map<string, any>();
    for (const dept of departments) {
      deptByName.set(dept.name, dept);
    }
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const dept of departments) {
      // 统计该部门及子部门的成员（通过部门名称匹配）
      const memberCount = this.countMembersInDept(dept.name, departments, users);
      const members = this.getMembersInDept(dept.name, departments, users);
      map.set(dept.id, {
        ...dept,
        children: [],
        positions: positions.filter((p: any) => p.departmentId === dept.id),
        memberCount,
        members: members.slice(0, 50),
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

  // 递归统计部门及子部门的成员数（通过部门名称匹配）
  private countMembersInDept(deptName: string, departments: any[], users: any[]): number {
    const directMembers = users.filter((u: any) => u.department === deptName).length;
    const childDepts = departments.filter((d: any) => d.parentId === deptName);
    let total = directMembers;
    for (const child of childDepts) {
      total += this.countMembersInDept(child.name, departments, users);
    }
    return total;
  }

  // 递归获取部门及子部门的成员列表
  private getMembersInDept(deptName: string, departments: any[], users: any[]): any[] {
    const directMembers = users.filter((u: any) => u.department === deptName).map((u: any) => ({
      username: u.username,
      name: u.name,
      position: u.position,
      role: u.role,
      isHead: u.isHead,
      isDeputy: u.isDeputy,
    }));
    const children = departments.filter((d) => d.parentId === deptName);
    let allMembers = [...directMembers];
    for (const child of children) {
      allMembers = allMembers.concat(this.getMembersInDept(child.name, departments, users));
    }
    return allMembers;
  }

  private getDescendantIds(parentId: string, departments: any[]): string[] {
    const children = departments.filter((d) => d.parentId === parentId);
    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      ids.push(...this.getDescendantIds(child.id, departments));
    }
    return ids;
  }
}
