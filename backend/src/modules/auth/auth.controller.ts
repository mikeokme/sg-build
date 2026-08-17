import { Controller, Post, Get, Put, Delete, Body, Param, Req, HttpCode, HttpStatus, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DataService, ROLE_LABELS } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import type { Request } from 'express';
import * as bcrypt from 'bcryptjs';

interface AuthedRequest extends Request {
  user?: { sub: string; username?: string; role?: string };
}

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

  // ── 我的账户 / 个人信息 ──

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthedRequest) {
    const u = this.dataService.getUser(req.user?.sub || '');
    if (!u) throw new UnauthorizedException('用户不存在');
    const { password, ...rest } = u;
    return { ...rest, roleLabel: ROLE_LABELS[u.role] || u.role };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: AuthedRequest, @Body() body: any) {
    const u = this.dataService.updateProfile(req.user?.sub || '', body);
    if (!u) throw new UnauthorizedException('用户不存在');
    const { password, ...rest } = u;
    this.dataService.logAudit({ action: '更新个人信息', module: 'auth/profile', operator: u.username, role: u.role, detail: { fields: Object.keys(body) } });
    return { ...rest, message: '个人信息已更新' };
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: AuthedRequest, @Body() body: { oldPassword: string; newPassword: string }) {
    const u = this.dataService.getUser(req.user?.sub || '');
    if (!u) throw new UnauthorizedException('用户不存在');
    const isOldValid = await bcrypt.compare(body.oldPassword || '', u.password);
    if (!isOldValid) throw new BadRequestException('原密码不正确');
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('新密码长度至少 6 位');
    }
    const hashed = await bcrypt.hash(body.newPassword, 10);
    const updated = this.dataService.updateUser(u.id, { password: hashed });
    this.dataService.logAudit({ action: '修改密码', module: 'auth/password', operator: u.username, role: u.role });
    return { message: '密码修改成功' };
  }

  // ── 系统设置（仅超级管理员）──

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getSettings() {
    return this.dataService.getSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updateSettings(@Body() body: any) {
    const updated = this.dataService.updateSettings(body);
    this.dataService.logAudit({ action: '更新系统设置', module: 'auth/settings', operator: 'system', role: 'super_admin', detail: { fields: Object.keys(body) } });
    return { ...updated, message: '系统设置已保存' };
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
    this.dataService.addNotification(u.username, {
      title: '您的账户权限申请已通过',
      content: `您申请的「${ROLE_LABELS[u.appliedRole] || u.appliedRole}」权限已生效`,
      type: 'system',
      link: '/account',
    });
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
    this.dataService.addNotification(u.username, {
      title: '您的账户权限申请未通过',
      content: `您申请的「${ROLE_LABELS[u.appliedRole] || u.appliedRole}」权限未通过审批，如有疑问请联系管理员`,
      type: 'system',
      link: '/account',
    });
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