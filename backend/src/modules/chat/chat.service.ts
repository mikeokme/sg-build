import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataService, ROLE_LEVELS } from '../../services/data.service';
import { encryptMessage, decryptMessage } from './chat-crypto';

export type ChatEventFn = (event: string, payload: any) => void;

@Injectable()
export class ChatService {
  private emitter: ChatEventFn = () => {};
  private burnTimers = new Map<string, NodeJS.Timeout>();

  constructor(private dataService: DataService) {}

  setEmitter(fn: ChatEventFn) { this.emitter = fn; }
  emit(event: string, payload: any) { try { this.emitter(event, payload); } catch {} }

  // 向指定用户列表发送事件（用于阅后即焚消息的定向通知）
  emitToUsers(event: string, payload: any, targetUsers: string[]) {
    if (!targetUsers.length) return;
    try { this.emitter(event, { ...payload, _targetUsers: targetUsers }); } catch {}
  }

  // ── 会话 ──

  listConversations(username: string): any[] {
    const convs = this.dataService
      .getConversations()
      .filter((c) => c.members.includes(username));
    return convs.map((c) => {
      const msgs = this.dataService.getChatMessages(c.id);
      const last = msgs[msgs.length - 1] || null;
      const unread = msgs.filter((m) => m.sender !== username && !m.readBy.includes(username)).length;
      return {
        id: c.id,
        type: c.type,
        name: c.name,
        category: c.category || '',
        projectId: c.projectId || '',
        members: c.members,
        owner: c.owner,
        createdAt: c.createdAt,
        lastMessage: last
          ? (last.burn && !(last.revealedBy || []).includes(username) ? `🔥 阅后即焚${last.burnTarget ? ' → ' + last.burnTarget : ''}` : last.burn ? '[已焚毁]' : last.encrypted ? '[加密消息]' : last.content)
          : '',
        lastMessageAt: last?.createdAt || '',
        lastSender: last?.sender || '',
        unread,
      };
    }).sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
  }

  getOrCreateSingle(myUsername: string, otherUsername: string) {
    if (!this.dataService.getUserByUsername(otherUsername)) {
      return { error: '用户不存在' };
    }
    return this.dataService.getOrCreateSingleConversation(myUsername, otherUsername);
  }

  createGroup(name: string, members: string[], owner: string) {
    const valid = members.filter((m) => this.dataService.getUserByUsername(m));
    return this.dataService.createGroupConversation(name, valid, owner);
  }

  // ── 群成员管理 ──

  getGroupMembers(conversationId: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持成员管理');
    if (!c.members.includes(requester)) throw new ForbiddenException('无权查看该群成员');
    return c.members.map((username: string) => {
      const u = this.dataService.getUserByUsername(username);
      return {
        username,
        name: u?.name || username,
        role: u?.role || 'employee',
        department: u?.department || '',
        position: u?.position || '',
        avatar: u?.avatar || '',
        isOwner: c.owner === username,
      };
    });
  }

  addMembers(conversationId: string, usernames: string[], requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持添加成员');
    if (!c.members.includes(requester)) throw new ForbiddenException('无权操作该群');
    const reqUser = this.dataService.getUserByUsername(requester);
    if (!reqUser) throw new ForbiddenException('操作人不存在');
    const reqLevel = ROLE_LEVELS[reqUser.role] || 0;
    // 检查是否为群主或管理员（群主 / 群内最高权限）
    const isOwner = c.owner === requester;
    const isAdmin = reqLevel >= 60; // general_admin 及以上
    if (!isOwner && !isAdmin) throw new ForbiddenException('仅群主和管理员可添加成员');
    const added: string[] = [];
    for (const un of usernames) {
      if (c.members.includes(un)) continue;
      const target = this.dataService.getUserByUsername(un);
      if (!target) continue;
      const targetLevel = ROLE_LEVELS[target.role] || 0;
      // 权限校验：只能添加同级及向下
      if (targetLevel > reqLevel) throw new ForbiddenException(`无权添加 ${un}（权限高于自己）`);
      this.dataService.addConversationMember(conversationId, un);
      added.push(un);
      this.dataService.addNotification(un, {
        title: '群聊邀请',
        content: `你已被加入「${c.name}」群聊`,
        type: 'system',
        link: '/chat',
      });
    }
    // 重新获取会话并通知所有成员
    const updated = this.dataService.getConversation(conversationId);
    if (updated) {
      this.emit('chat:members-changed', {
        conversationId,
        members: updated.members,
        action: 'add',
        added,
        by: requester,
      });
    }
    return { ok: true, added, members: updated?.members || [] };
  }

  removeMember(conversationId: string, targetUsername: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持移除成员');
    if (!c.members.includes(requester)) throw new ForbiddenException('无权操作该群');
    if (targetUsername === c.owner) throw new ForbiddenException('无法移除群主');
    const reqUser = this.dataService.getUserByUsername(requester);
    if (!reqUser) throw new ForbiddenException('操作人不存在');
    const reqLevel = ROLE_LEVELS[reqUser.role] || 0;
    const isOwner = c.owner === requester;
    const isAdmin = reqLevel >= 60;
    if (!isOwner && !isAdmin) throw new ForbiddenException('仅群主和管理员可移除成员');
    const target = this.dataService.getUserByUsername(targetUsername);
    if (!target) throw new ForbiddenException('目标用户不存在');
    const targetLevel = ROLE_LEVELS[target.role] || 0;
    if (targetLevel > reqLevel) throw new ForbiddenException(`无权移除 ${targetUsername}（权限高于自己）`);
    if (!c.members.includes(targetUsername)) throw new ForbiddenException('该用户不在群中');
    this.dataService.removeConversationMember(conversationId, targetUsername);
    this.dataService.addNotification(targetUsername, {
      title: '群聊移除通知',
      content: `你已被移出「${c.name}」群聊`,
      type: 'system',
      link: '/chat',
    });
    const updated = this.dataService.getConversation(conversationId);
    if (updated) {
      this.emit('chat:members-changed', {
        conversationId,
        members: updated.members,
        action: 'remove',
        removed: targetUsername,
        by: requester,
      });
    }
    return { ok: true, members: updated?.members || [] };
  }

  // ── 消息 ──

  listMessages(username: string, conversationId: string): { error?: string; messages?: any[] } {
    const c = this.dataService.getConversation(conversationId);
    if (!c) return { error: '会话不存在' };
    if (!c.members.includes(username)) return { error: '无权访问该会话' };
    const messages = this.dataService.getChatMessages(conversationId)
      .filter((m) => {
        // 群聊阅后即焚：只显示发给自己的或自己发的
        if (m.burn && m.burnTarget && c.type === 'group') {
          return m.sender === username || m.burnTarget === username;
        }
        return true;
      })
      .map((m) => this.decorateForClient(m, c.id, username));
    return { messages };
  }

  sendMessage(username: string, payload: { conversationId: string; content: string; encrypted?: boolean; burn?: boolean; burnSeconds?: number; burnTarget?: string }) {
    const c = this.dataService.getConversation(payload.conversationId);
    if (!c) return { error: '会话不存在' };
    if (!c.members.includes(username)) return { error: '无权发送消息' };
    const content = String(payload.content || '').trim();
    if (!content) return { error: '消息内容不能为空' };

    const encrypted = !!payload.encrypted;
    const burn = !!payload.burn;
    const burnTarget = payload.burnTarget || '';
    const stored = encrypted ? encryptMessage(c.id, content) : content;
    const message = this.dataService.addChatMessage({
      conversationId: c.id,
      sender: username,
      contentType: encrypted ? 'encrypted' : 'text',
      content: stored,
      encrypted,
      burn,
      burnSeconds: burn ? (Number(payload.burnSeconds) || 10) : 0,
      burnTarget: c.type === 'group' ? burnTarget : '',
      revealedBy: [],
      readBy: [username],
    });

    this.dataService.updateConversation(c.id, { lastMessageAt: message.createdAt });

    const clientMsg = this.decorateForClient(message, c.id, username);

    // 群聊阅后即焚：仅通知发送者和指定接收者，其他人无通知无显示
    if (burn && burnTarget && c.type === 'group') {
      this.emitToUsers('chat:message', { conversationId: c.id, message: clientMsg }, [username, burnTarget]);
    } else {
      this.emit('chat:message', { conversationId: c.id, message: clientMsg });
    }
    return { message: clientMsg };
  }

  // ── 揭示阅后即焚消息（点击火焰图标触发） ──
  revealMessage(username: string, conversationId: string, messageId: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c || !c.members.includes(username)) return { error: '会话不存在或无权访问' };
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.conversationId !== conversationId) return { error: '消息不存在' };
    if (!m.burn) return { ok: true };

    const revealedBy = m.revealedBy || [];
    if (revealedBy.includes(username)) {
      // 已揭示过：如果计时器已启动，返回剩余时间
      if (m.burnScheduled && m.burnScheduledAt) {
        const elapsed = (Date.now() - new Date(m.burnScheduledAt).getTime()) / 1000;
        const remaining = Math.max(0, (m.burnSeconds || 10) - elapsed);
        return { ok: true, seconds: Math.ceil(remaining), alreadyRevealed: true };
      }
      return { ok: true, seconds: m.burnSeconds || 10, alreadyRevealed: true };
    }

    // 添加到 revealedBy
    const newRevealedBy = [...revealedBy, username];
    this.dataService.updateChatMessage(messageId, {
      revealedBy: newRevealedBy,
      readBy: Array.from(new Set([...(m.readBy || []), username])),
    });

    const isFirstReveal = revealedBy.length === 0;

    // 仅首次揭示时启动焚毁倒计时
    if (isFirstReveal) {
      this.scheduleBurn(conversationId, messageId);
    }

    const seconds = m.burnSeconds || 10;
    const content = m.encrypted ? decryptMessage(conversationId, m.content) : m.content;

    // 通知指定用户：消息被揭示（仅发送者和所有已揭示者）
    const targetUsers = m.burnTarget ? [m.sender, m.burnTarget, ...newRevealedBy] : newRevealedBy;
    this.emitToUsers('chat:revealed', {
      conversationId,
      messageId,
      revealedBy: newRevealedBy,
      revealedByUser: username,
      seconds,
      isFirstReveal,
      content,
    }, targetUsers);

    return { ok: true, seconds, content };
  }

  // 标记已读（非焚毁消息）
  markRead(username: string, conversationId: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c || !c.members.includes(username)) return { error: '会话不存在或无权访问' };
    const msgs = this.dataService.getChatMessages(conversationId);
    let changed = false;
    for (const m of msgs) {
      if (m.sender !== username && !m.readBy.includes(username)) {
        m.readBy.push(username);
        this.dataService.updateChatMessage(m.id, { readBy: m.readBy });
        changed = true;
      }
    }
    if (changed) {
      this.emit('chat:read', { conversationId, username });
    }
    return { ok: true };
  }

  deleteMessage(username: string, conversationId: string, messageId: string) {
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.conversationId !== conversationId) return { error: '消息不存在' };
    if (m.sender !== username) return { error: '只能删除自己发送的消息' };
    const removed = this.dataService.deleteChatMessage(messageId);
    if (removed) {
      const timer = this.burnTimers.get(messageId);
      if (timer) { clearTimeout(timer); this.burnTimers.delete(messageId); }
      this.emit('chat:deleted', { conversationId, messageId });
    }
    return { ok: true };
  }

  // ── 焚毁倒计时 ──
  private scheduleBurn(conversationId: string, messageId: string) {
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.burnScheduled) return;

    this.dataService.updateChatMessage(messageId, {
      burnScheduled: true,
      burnScheduledAt: new Date().toISOString(),
    });

    const seconds = m.burnSeconds || 10;
    // 仅通知相关用户燃烧中状态
    const targetUsers = m.burnTarget ? [m.sender, m.burnTarget] : [];
    this.emitToUsers('chat:burning', { conversationId, messageId, seconds }, targetUsers);

    const timer = setTimeout(() => {
      const still = this.dataService.getChatMessage(messageId);
      if (still && still.burn) {
        this.dataService.deleteChatMessage(messageId);
        this.burnTimers.delete(messageId);
        // 仅通知相关用户消息已焚毁
        const targetUsers = still.burnTarget ? [still.sender, still.burnTarget] : [];
        this.emitToUsers('chat:burned', { conversationId, messageId }, targetUsers);
      }
    }, seconds * 1000);

    this.burnTimers.set(messageId, timer);
  }

  // 发送给客户端的消息形态（per-user: 检查当前用户是否已揭示）
  private decorateForClient(m: any, conversationId: string, username?: string) {
    const content = m.encrypted ? decryptMessage(conversationId, m.content) : m.content;
    const revealedBy = m.revealedBy || [];
    const revealedForMe = username ? revealedBy.includes(username) : false;
    const isSender = username ? m.sender === username : false;
    // 发送者始终可见内容；接收者需揭示后才可见
    const displayContent = m.burn && !isSender && !revealedForMe ? '' : content;
    return {
      id: m.id,
      conversationId: m.conversationId,
      sender: m.sender,
      contentType: m.contentType,
      encrypted: m.encrypted,
      content: displayContent,
      burn: m.burn,
      burnSeconds: m.burnSeconds,
      burnTarget: m.burnTarget || '',
      burnScheduled: m.burnScheduled,
      revealedBy,
      revealedForMe,
      readBy: m.readBy || [],
      createdAt: m.createdAt,
    };
  }
}
