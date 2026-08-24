import { Controller, Get, Query, UseGuards, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'high_admin')
export class AuditController {
  constructor(private dataService: DataService) {}

  private filterLogs(action?: string, module?: string, operator?: string, start?: string, end?: string) {
    let logs = this.dataService.getAuditLogs();
    if (action) logs = logs.filter((l) => l.action === action);
    if (module) logs = logs.filter((l) => l.module === module);
    if (operator) logs = logs.filter((l) => l.operator === operator);
    if (start) logs = logs.filter((l) => l.date >= start);
    if (end) logs = logs.filter((l) => l.date <= `${end}T23:59:59.999Z`);
    return logs;
  }

  @Get('logs')
  getLogs(
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('operator') operator?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const logs = this.filterLogs(action, module, operator, start, end);
    const p = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(200, Math.max(1, parseInt(pageSize, 10) || 50));
    return {
      total: logs.length,
      page: p,
      pageSize: size,
      items: logs.slice((p - 1) * size, p * size),
    };
  }

  @Get('logs/export')
  exportCsv(
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('operator') operator?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Res() res?: Response,
  ) {
    const logs = this.filterLogs(action, module, operator, start, end);
    if (!res) throw new NotFoundException();
    const headers = ['date', 'action', 'module', 'operator', 'role', 'detail'];
    const esc = (v: any) => {
      if (v === null || v === undefined) return '';
      let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = [headers.join(',')];
    for (const l of logs) rows.push(headers.map((h) => esc((l as any)[h])).join('\r\n'));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + rows.join('\r\n'));
  }
}
