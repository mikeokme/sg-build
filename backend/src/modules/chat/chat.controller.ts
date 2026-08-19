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

  // 获取可发起聊天的用户列表（排除自己），按通讯录可见范围过滤
  @Get('users')
  listUsers(@Req() req: AuthedRequest) {
    const me = this.username(req);
    const visibleDeptNames = this.dataService.getAddressBookVisibleDeptNames(me);
    const all = this.dataService
      .getUsers()
      .filter((u) => u.username !== me && u.isActive !== false);
    const filtered = visibleDeptNames
      ? all.filter((u) => !u.department || visibleDeptNames.has(u.department))
      : all;
    return filtered.map((u) => ({
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

  // 通讯录：复用组织架构树数据，保证与组织架构模块完全一致
  // 按钉钉/飞书式可见范围过滤：admin/总经理见全部，部门负责人见本部门+下级，普通成员仅见本部门
  @Get('contacts')
  getContacts(@Req() req: AuthedRequest) {
    const me = this.username(req);
    const departments = this.dataService.getCollectionItems('departments');
    const positions = this.dataService.getCollectionItems('orgPositions');
    const tree = this.dataService.buildOrgTree(departments, positions);
    const visibleDeptNames = this.dataService.getAddressBookVisibleDeptNames(me);
    const visibleDeptIds = this.dataService.getAddressBookDeptIds(me);

    // 可见范围过滤组织树
    const visibleTree = visibleDeptIds
      ? this.dataService.filterOrgTreeByVisible(tree, new Set(visibleDeptIds))
      : [];

    // 全体人员虚拟组（仅含可见部门成员）
    const users = this.dataService.getUsers().filter((u: any) => u.isActive !== false);
    const allMembers = users
      .filter((u) => !visibleDeptNames || !u.department || visibleDeptNames.has(u.department))
      .map((u: any) => ({
        username: u.username, name: u.name || u.username, role: u.role,
        position: u.position || '', phone: u.phone || '',
        department: u.department || '', isHead: !!u.isHead, isDeputy: !!u.isDeputy, avatar: u.avatar || '',
      }));
    visibleTree.push({
      id: '_all',
      name: '全体人员',
      code: 'ALL',
      isGroup: true,
      isVirtual: true,
      leader: '',
      memberCount: allMembers.length,
      members: allMembers.sort((a: any, b: any) => (a.department || '').localeCompare(b.department || '') || (b.isHead ? 1 : 0) - (a.isHead ? 1 : 0)),
      children: [],
    });

    return visibleTree;
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

  // 设置/取消管理员
  @Put('conversations/:id/admins/:username')
  setAdmin(@Param('id') id: string, @Param('username') username: string, @Req() req: AuthedRequest) {
    return this.chatService.setAdmin(id, username, this.username(req));
  }

  // 转让群主
  @Put('conversations/:id/transfer-owner')
  transferOwner(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: { username: string }) {
    return this.chatService.transferOwner(id, body?.username || '', this.username(req));
  }

  // 通过 REST 发送（备用；实时消息走 WebSocket）
  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: any) {
    return this.chatService.sendMessage(this.username(req), { conversationId: id, ...body });
  }

  // 标记已读（备用；实时消息走 WebSocket）
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
    return { message: `已删除用户${username}` };
  }

  // 揭示阅后即焚消息
  @Post('conversations/:id/reveal/:messageId')
  revealMessage(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: AuthedRequest) {
    return this.chatService.revealMessage(this.username(req), id, messageId);
  }

  // ── Telegram 风格社交功能 ──

  // 会话偏好（置顶/静音/归档/草稿）
  @Put('conversations/:id/prefs')
  setPrefs(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: { pinned?: boolean; muted?: boolean; archived?: boolean; draft?: string }) {
    return this.chatService.setPrefs(id, this.username(req), body || {});
  }

  // 清空聊天记录
  @Delete('conversations/:id/history')
  clearHistory(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.chatService.clearHistory(id, this.username(req));
  }

  // 删除会话（隐藏给自己）
  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.chatService.deleteConversation(id, this.username(req));
  }

  // 退群
  @Post('conversations/:id/leave')
  leaveGroup(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.chatService.leaveGroup(id, this.username(req));
  }

  // 群信息编辑
  @Put('conversations/:id/profile')
  updateProfile(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: { name?: string; description?: string; avatar?: string }) {
    return this.chatService.updateProfile(id, this.username(req), body || {});
  }

  // 编辑消息
  @Put('conversations/:id/messages/:messageId')
  editMessage(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: AuthedRequest, @Body() body: { content?: string }) {
    return this.chatService.editMessage(this.username(req), id, messageId, body?.content || '');
  }

  // 转发消息
  @Post('messages/:messageId/forward')
  forwardMessage(@Param('messageId') messageId: string, @Req() req: AuthedRequest, @Body() body: { conversationId?: string; sourceConversationId?: string }) {
    return this.chatService.forwardMessage(this.username(req), body?.sourceConversationId || '', messageId, body?.conversationId || '');
  }

  // 表情回应（切换）
  @Post('conversations/:id/messages/:messageId/reaction')
  toggleReaction(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: AuthedRequest, @Body() body: { emoji?: string }) {
    return this.chatService.toggleReaction(this.username(req), id, messageId, body?.emoji || '');
  }

  // 群公告置顶/取消
  @Put('conversations/:id/pinned-message')
  pinMessage(@Param('id') id: string, @Req() req: AuthedRequest, @Body() body: { messageId?: string | null }) {
    return this.chatService.pinMessage(this.username(req), id, body?.messageId ?? null);
  }
}
