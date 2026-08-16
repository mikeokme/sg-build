import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { guardCanView, guardCanCreate, guardCanEdit, guardCanDelete } from '../../guards/collection-permissions';

import { DataService } from '../../services/data.service';

interface AuthedRequest extends Request {
  user?: { role?: string; username?: string };
}

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(
    private collectionService: CollectionService,
    private dataService: DataService,
  ) {}

  @Get(':name')
  findAll(@Param('name') name: string, @Req() req: AuthedRequest) {
    guardCanView(name, req.user?.role || 'employee');
    return this.collectionService.findAll(name);
  }

  @Post(':name')
  create(@Param('name') name: string, @Body() data: any, @Req() req: AuthedRequest) {
    guardCanCreate(name, req.user?.role || 'employee');
    this.dataService.logAudit({
      action: '新增',
      module: name,
      detail: data,
      operator: req.user?.username,
      role: req.user?.role,
    });
    return this.collectionService.create(name, data);
  }

  @Put(':name/:id')
  update(@Param('name') name: string, @Param('id') id: string, @Body() data: any, @Req() req: AuthedRequest) {
    guardCanEdit(name, req.user?.role || 'employee');
    this.dataService.logAudit({
      action: '修改',
      module: name,
      detail: { id, ...data },
      operator: req.user?.username,
      role: req.user?.role,
    });
    return this.collectionService.update(name, id, data);
  }

  @Delete(':name/:id')
  remove(@Param('name') name: string, @Param('id') id: string, @Req() req: AuthedRequest) {
    guardCanDelete(name, req.user?.role || 'employee');
    this.dataService.logAudit({
      action: '删除',
      module: name,
      detail: { id },
      operator: req.user?.username,
      role: req.user?.role,
    });
    return this.collectionService.remove(name, id);
  }
}
