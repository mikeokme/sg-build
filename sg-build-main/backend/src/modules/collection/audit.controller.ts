import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AuditController {
  constructor(private dataService: DataService) {}

  @Get('logs')
  getLogs(@Query('action') action?: string, @Query('module') module?: string, @Query('operator') operator?: string) {
    let logs = this.dataService.getAuditLogs();
    if (action) logs = logs.filter((l) => l.action === action);
    if (module) logs = logs.filter((l) => l.module === module);
    if (operator) logs = logs.filter((l) => l.operator === operator);
    return logs;
  }
}