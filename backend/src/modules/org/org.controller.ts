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
    return this.data.buildOrgTree(departments, positions);
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
    const idsToDelete = this.data.getDescendantIds(id, departments);
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
}
