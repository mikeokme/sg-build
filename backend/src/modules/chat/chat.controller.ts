import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { DataService, ROLE_LABELS } from '../../services/data.service';

interface AuthedRequest extends Request {
  user?: { sub?: string; username?: string; role?: string };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private dataService: DataService,
  ) {}

  private username(req: AuthedRequest): string {
    return req.user?.username || '';
  }

  // 我的会话列表（含未读数）
  @Get('conversations')
  listConversations(@Req() req: AuthedRequest) {
    return this.chatService.listConversations(this.username(req));
  }

  // 获取可发起聊天的用户列表（排除自己）
  @Get('users')
  listUsers(@Req() req: AuthedRequest) {
    const me = this.username(req);
    return this.dataService
      .getUsers()
      .filter((u) => u.username !== me && u.isActive !== false)
      .map((u) => ({
        username: u.username,
        name: u.name || u.username,
        role: u.role,
        department: u.department || '',
        position: u.position || '',
        phone: u.phone || '',
        isHead: !!u.isHead,
        isDeputy: !!u.isDeputy,
        avatar: u.avatar || '',
      }));
  }

  // 通讯录：按部门分组返回
  @Get('contacts')
  getContacts(@Req() req: AuthedRequest) {
    const me = this.username(req);
    const users = this.dataService.getUsers().filter((u) => u.username !== me && u.isActive !== false);
    const departments = this.dataService.getCollectionItems('departments');

    // 部门层级映射
    const deptMap = new Map<string, any>();
    for (const d of departments) {
      deptMap.set(d.id, { ...d, members: [] as any[] });
    }

    // 将用户分配到部门
    for (const u of users) {
      const deptName = u.department || '未分配';
      // 找到对应部门
      let found = false;
      for (const [, dept] of deptMap) {
        if (dept.name === deptName) {
          dept.members.push({
            username: u.username,
            name: u.name || u.username,
            role: u.role,
            position: u.position || '',
            phone: u.phone || '',
            isHead: !!u.isHead,
            isDeputy: !!u.isDeputy,
            avatar: u.avatar || '',
          });
          found = true;
          break;
        }
      }
      if (!found) {
        // 创建临时部门
        const tempId = '_temp_' + deptName;
        if (!deptMap.has(tempId)) {
          deptMap.set(tempId, { id: tempId, name: deptName, code: '', parentId: null, leader: '', members: [] });
        }
        deptMap.get(tempId)!.members.push({
          username: u.username,
          name: u.name || u.username,
          role: u.role,
          position: u.position || '',
          phone: u.phone || '',
          isHead: !!u.isHead,
          isDeputy: !!u.isDeputy,
          avatar: u.avatar || '',
        });
      }
    }

    // 构建层级树（只保留有成员的部门）
    const result: any[] = [];
    for (const [, dept] of deptMap) {
      if (dept.members.length === 0 && dept.id !== 'd1') continue; // 跳过空部门（保留集团总部）
      if (dept.id === 'd1') continue; // 跳过集团总部节点本身
      // 只保留直属部门（parentId === 'd1'）和子部门
      if (dept.parentId === 'd1' || dept.id.startsWith('_temp_')) {
        const children = Array.from(deptMap.values())
          .filter((d) => d.parentId === dept.id && d.members.length > 0)
          .map((d) => ({ id: d.id, name: d.name, code: d.code, leader: d.leader, members: d.members }));
        result.push({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          leader: dept.leader,
          memberCount: dept.members.length,
          members: dept.members.sort((a: any, b: any) => (b.isHead ? 1 : 0) - (a.isHead ? 1 : 0) || (b.isDeputy ? 1 : 0) - (a.isDeputy ? 1 : 0)),
          children,
        });
      }
    }

    // 也把未分配的用户放到最前面
    const unassigned = deptMap.get('_temp_未分配');
    if (unassigned && unassigned.members.length > 0) {
      result.unshift({ id: '_unassigned', name: '未分配部门', code: '', leader: '', memberCount: unassigned.members.length, members: unassigned.members, children: [] });
    }

    return result;
  }

  // 发起/进入单聊
  @Post('conversations/single')
  openSingle(@Req() req: AuthedRequest, @Body() body: { username: string }) {
    return this.chatService.getOrCreateSingle(this.username(req), body?.username);
  }

  // 创建群聊
  @Post('conversations/group')
  createGroup(@Req() req: AuthedRequest, @Body() body: { name: string; members: string[] }) {
    const owner = this.username(req);
    const conv = this.chatService.createGroup(body?.name, body?.members || [], owner);
    this.dataService.addNotification(owner, {
      title: '群聊创建成功',
      content: `「${conv.name}」已创建，共 ${conv.members.length} 人`,
      type: 'system',
      link: '/chat',
    });
    return conv;
  }

  // 会话消息
  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.chatService.listMessages(this.username(req), id);
  }

  // 获取群成员列表
  @Get('conversations/:id/members')
  getMembers(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.chatService.getGroupMembers(id, this.username(req));
  }

  // 添加群成员
  @Post('conversations/:id/members')
  addMembers(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: { usernames: string[] }) {
    return this.chatService.addMembers(id, body?.usernames || [], this.username(req));
  }

  // 移除群成员
  @Delete('conversations/:id/members/:username')
  removeMember(@Param('id') id: string, @Param('username') username: string, @Req() req: AuthedRequest) {
    return this.chatService.removeMember(id, username, this.username(req));
  }

  // 通过 REST 发送（备用；实时消息走 WS）
  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: any) {
    return this.chatService.sendMessage(this.username(req), { conversationId: id, ...body });
  }

  // 标记已读（备用；实时走 WS）
  @Put('conversations/:id/read')
  markRead(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.chatService.markRead(this.username(req), id);
  }

  // 删除/撤回消息
  @Delete('conversations/:id/messages/:messageId')
  deleteMessage(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: AuthedRequest) {
    return this.chatService.deleteMessage(this.username(req), id, messageId);
  }

  // 删除联系人（仅超管和高管）
  @Delete('users/:username')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'high_admin')
  deleteContact(@Param('username') username: string, @Req() req: AuthedRequest) {
    const me = this.dataService.getUserByUsername(this.username(req));
    const target = this.dataService.getUserByUsername(username);
    if (!target) throw new ForbiddenException('用户不存在');
    if (target.role === 'super_admin' && me?.role !== 'super_admin') {
      throw new ForbiddenException('无法删除超级管理员');
    }
    this.dataService.deleteUser(target.id);
    this.dataService.logAudit({ action: '删除联系人', module: 'chat/contacts', operator: this.username(req), role: me?.role, detail: { target: username } });
    return { message: `已删除用户 ${username}` };
  }
}
