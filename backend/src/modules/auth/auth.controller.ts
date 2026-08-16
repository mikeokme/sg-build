import { Controller, Post, Get, Put, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DataService, ROLE_LABELS } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private dataService: DataService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { username: string; email: string; password: string; appliedRole: string; regCode: string }) {
    return this.authService.register(body.username, body.email, body.password, body.appliedRole, body.regCode);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('accessToken') accessToken: string) {
    return { message: 'Token refresh endpoint' };
  }

  // ── 用户管理（仅超级管理员 root）──

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getUsers() {
    return this.dataService.getUsers().map((u) => {
      const { password, ...rest } = u;
      return { ...rest, roleLabel: ROLE_LABELS[u.role] || u.role };
    });
  }

  @Get('users/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getPendingUsers() {
    return this.dataService.getPendingUsers().map((u) => {
      const { password, ...rest } = u;
      return { ...rest, roleLabel: ROLE_LABELS[u.appliedRole] || u.appliedRole };
    });
  }

  @Post('users/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  approveUser(@Param('id') id: string) {
    const u = this.dataService.approveUser(id);
    if (!u) throw new Error('用户不存在');
    const { password, ...rest } = u;
    this.dataService.logAudit({ action: '审批通过', module: 'auth/users', operator: 'system', role: 'super_admin', detail: { target: u.username } });
    return { ...rest, message: '已通过审批，权限已生效' };
  }

  @Post('users/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  rejectUser(@Param('id') id: string) {
    const u = this.dataService.rejectUser(id);
    if (!u) throw new Error('用户不存在');
    const { password, ...rest } = u;
    this.dataService.logAudit({ action: '审批驳回', module: 'auth/users', operator: 'system', role: 'super_admin', detail: { target: u.username } });
    return { ...rest, message: '已驳回申请' };
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updateUser(@Param('id') id: string, @Body() body: any) {
    const u = this.dataService.updateUser(id, body);
    if (!u) throw new Error('用户不存在');
    const { password, ...rest } = u;
    this.dataService.logAudit({ action: '修改用户', module: 'auth/users', operator: 'system', role: 'super_admin', detail: { target: u.username, change: body } });
    return rest;
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  deleteUser(@Param('id') id: string) {
    const u = this.dataService.getUser(id);
    this.dataService.deleteUser(id);
    this.dataService.logAudit({ action: '删除用户', module: 'auth/users', operator: 'system', role: 'super_admin', detail: { target: u?.username } });
    return { message: '已删除用户' };
  }
}