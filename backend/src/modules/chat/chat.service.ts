import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataService, ROLE_LEVELS } from '../../services/data.service';
import { encryptMessage, decryptMessage, encryptWithPassword, decryptWithPassword, generateSecretPassword } from './chat-crypto';

export type ChatEventFn = (event: string, payload: any) => void;

@Injectable()
export class ChatService {
  private emitter: ChatEventFn = () => {};
  private burnTimers = new Map<string, NodeJS.Timeout>();

  constructor(private dataService: DataService) {}

  setEmitter(fn: ChatEventFn) { this.emitter = fn; }
  emit(event: string, payload: any) { try { this.emitter(event, payload); } catch {} }

  // 判断用户是否有权访问某会话（部门群按可见部门放宽；其余按成员）
  private canAccess(username: string, c: any): boolean {
    if (c.type !== 'group' || c.category !== 'department' || !c.departmentId) {
      return c.members.includes(username);
    }
    const visibleDepts = this.dataService.getVisibleDeptIds(username);
    if (!visibleDepts) return c.members.includes(username);
    return visibleDepts.includes(c.departmentId);
  }

  // 向指定用户列表发送事件（用于阅后即焚消息的定向通知）
  emitToUsers(event: string, payload: any, targetUsers: string[]) {
    if (!targetUsers.length) return;
    try { this.emitter(event, { ...payload, _targetUsers: targetUsers }); } catch {}
  }

  // ── 会话 ──

  listConversations(username: string): any[] {
    const visibleDepts = this.dataService.getVisibleDeptIds(username);
    const convs = this.dataService
      .getConversations()
      .filter((c) => {
        // 单聊：仅显示自己参与的
        if (c.type !== 'group') return c.members.includes(username);
        // 群查看权限：部门类群聊显示「本级 + 下级」部门对应的群（即使非成员也可查看）
        if (c.category === 'department' && c.departmentId) {
          if (!visibleDepts) return c.members.includes(username);
          return visibleDepts.includes(c.departmentId);
        }
        // 自建群：按成员过滤
        return c.members.includes(username);
      });
    return convs.map((c) => {
      const prefs = this.dataService.getConversationPrefs(c.id, username);
      if (prefs.hidden) return null;
      const msgs = this.dataService.getChatMessages(c.id);
      // 群内加密/阅后即焚消息提示仅发送者和指定接收者可见：取用户可见的最后一条消息作为预览
      const isBurnParticipant = (m: any) => {
        if (!m.burn || c.type !== 'group') return true;
        return m.sender === username || m.burnTarget === username;
      };
      const isSecretParticipant = (m: any) => {
        if (!m.encrypted || !m.secretTarget || c.type !== 'group') return true;
        return m.sender === username || m.secretTarget === username;
      };
      let last: any = null;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (!isBurnParticipant(msgs[i]) || !isSecretParticipant(msgs[i])) continue;
        last = msgs[i];
        break;
      }
      const unread = msgs.filter((m) => {
        if (m.sender === username || m.readBy.includes(username)) return false;
        if (m.burn && c.type === 'group') {
          const isTarget = m.burnTarget === username;
          const isSender = m.sender === username;
          if (!isTarget && !isSender) return false;
        }
        if (m.encrypted && m.secretTarget && c.type === 'group') {
          const isTarget = m.secretTarget === username;
          const isSender = m.sender === username;
          if (!isTarget && !isSender) return false;
        }
        return true;
      }).length;
      let lastMsgText = '';
      if (last) {
        if (last.contentType === 'secret-key') {
          lastMsgText = '🔑 加密消息密码';
        } else if (last.burn && !(last.revealedBy || []).includes(username)) {
          lastMsgText = `🔥 阅后即焚${last.burnTarget ? ' → ' + last.burnTarget : ''}`;
        } else if (last.burn) {
          lastMsgText = '[已焚毁]';
        } else if (last.encrypted) {
          lastMsgText = '🔒 加密消息';
        } else {
          lastMsgText = last.content;
        }
      }
      if (prefs.draft) lastMsgText = `[草稿] ${prefs.draft}`;
      const pinnedMessage = c.pinnedMessageId
        ? msgs.find((m) => m.id === c.pinnedMessageId) || null
        : null;
      return {
        id: c.id,
        type: c.type,
        name: c.name,
        category: c.category || '',
        departmentId: c.departmentId || '',
        projectId: c.projectId || '',
        members: c.members,
        owner: c.owner,
        createdAt: c.createdAt,
        description: c.description || '',
        avatar: c.avatar || '',
        pinnedMessageId: c.pinnedMessageId || '',
        pinnedMessage: pinnedMessage ? this.decorateForClient(pinnedMessage, c.id, username) : null,
        pinned: !!prefs.pinned,
        muted: !!prefs.muted,
        archived: !!prefs.archived,
        draft: prefs.draft || '',
        lastMessage: lastMsgText,
        lastMessageAt: last?.createdAt || '',
        lastSender: last?.sender || '',
        unread,
      };
    }).filter((x: any) => !!x).sort((a: any, b: any) => {
      // 置顶优先，其次按最近消息
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime();
    });
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

  // ── 会话偏好（置顶/静音/归档/草稿） ──

  setPrefs(conversationId: string, username: string, patch: { pinned?: boolean; muted?: boolean; archived?: boolean; draft?: string }) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (!c.members.includes(username)) throw new ForbiddenException('无权操作该会话');
    const result: any = {};
    if (typeof patch.pinned === 'boolean') {
      this.dataService.setConversationPref(conversationId, username, 'pinned', patch.pinned);
      result.pinned = patch.pinned;
    }
    if (typeof patch.muted === 'boolean') {
      this.dataService.setConversationPref(conversationId, username, 'muted', patch.muted);
      result.muted = patch.muted;
    }
    if (typeof patch.archived === 'boolean') {
      this.dataService.setConversationPref(conversationId, username, 'archived', patch.archived);
      result.archived = patch.archived;
    }
    if (typeof patch.draft === 'string') {
      this.dataService.setConversationPref(conversationId, username, 'draft', patch.draft || '');
      result.draft = patch.draft || '';
    }
    return { ok: true, ...result };
  }

  // 清空聊天记录（所有人）
  clearHistory(conversationId: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (!this.canAccess(requester, c)) throw new ForbiddenException('无权操作该会话');
    this.dataService.deleteConversationMessages(conversationId);
    this.emit('chat:history-cleared', { conversationId, by: requester });
    return { ok: true };
  }

  // 删除会话（隐藏给自己，双方单聊隐藏）
  deleteConversation(conversationId: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (!c.members.includes(requester)) throw new ForbiddenException('无权操作该会话');
    this.dataService.setConversationPref(conversationId, requester, 'hidden', true);
    return { ok: true };
  }

  // 退群
  leaveGroup(conversationId: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持退群');
    if (!c.members.includes(requester)) throw new ForbiddenException('您不在该群中');
    if (c.owner === requester) throw new ForbiddenException('群主请先转让群主后再退群');
    this.dataService.removeConversationMember(conversationId, requester);
    this.dataService.setConversationPref(conversationId, requester, 'hidden', true);
    this.emit('chat:left', { conversationId, username: requester, members: c.members });
    return { ok: true };
  }

  // 群信息编辑（名称/描述/头像）——群主或管理员
  updateProfile(conversationId: string, requester: string, patch: { name?: string; description?: string; avatar?: string }) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持信息编辑');
    if (!c.members.includes(requester)) throw new ForbiddenException('无权操作该会话');
    const reqUser = this.dataService.getUserByUsername(requester);
    const reqLevel = ROLE_LEVELS[reqUser?.role || ''] || 0;
    const isOwner = c.owner === requester;
    const isAdmin = reqLevel >= 60;
    if (!isOwner && !isAdmin) throw new ForbiddenException('仅群主和管理员可编辑群信息');
    const data: any = {};
    if (typeof patch.name === 'string' && patch.name.trim()) data.name = patch.name.trim();
    if (typeof patch.description === 'string') data.description = patch.description;
    if (typeof patch.avatar === 'string') data.avatar = patch.avatar;
    this.dataService.updateConversation(conversationId, data);
    this.emit('chat:group-updated', { conversationId, ...data, by: requester });
    return { ok: true, ...data };
  }

  // ── 群成员管理 ──

  getGroupMembers(conversationId: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持成员管理');
    if (!this.canAccess(requester, c)) throw new ForbiddenException('无权查看该群成员');
    const admins = c.admins || [];
    return c.members.map((username: string) => {
      const u = this.dataService.getUserByUsername(username);
      return {
        username,
        name: u?.name || username,
        role: u?.role || 'employee',
        department: u?.department || '',
        position: u?.position || '',
        avatar: u?.avatar || '',
        phone: u?.phone || '',
        isOwner: c.owner === username,
        isAdmin: admins.includes(username) || c.owner === username,
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

  setAdmin(conversationId: string, targetUsername: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持此操作');
    if (!c.members.includes(requester)) throw new ForbiddenException('无权操作该群');
    if (targetUsername === c.owner) throw new ForbiddenException('群主无需设置管理员');
    const isOwner = c.owner === requester;
    if (!isOwner) throw new ForbiddenException('仅群主可设置管理员');
    if (!c.members.includes(targetUsername)) throw new ForbiddenException('该用户不在群中');
    if (!c.admins) c.admins = [];
    const idx = c.admins.indexOf(targetUsername);
    if (idx >= 0) {
      c.admins.splice(idx, 1);
    } else {
      c.admins.push(targetUsername);
    }
    this.dataService.updateConversation(conversationId, { admins: c.admins });
    const action = idx >= 0 ? 'cancel_admin' : 'set_admin';
    this.emit('chat:members-changed', { conversationId, members: c.members, action, target: targetUsername, by: requester });
    return { ok: true, admins: c.admins, action };
  }

  transferOwner(conversationId: string, targetUsername: string, requester: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持此操作');
    if (c.owner !== requester) throw new ForbiddenException('仅群主可转让群主');
    if (targetUsername === requester) throw new ForbiddenException('不能转让给自己');
    if (!c.members.includes(targetUsername)) throw new ForbiddenException('该用户不在群中');
    const oldOwner = c.owner;
    c.owner = targetUsername;
    if (!c.admins) c.admins = [];
    // 新群主加入管理员列表，旧群主保留在管理员列表
    if (!c.admins.includes(targetUsername)) c.admins.push(targetUsername);
    this.dataService.updateConversation(conversationId, { owner: c.owner, admins: c.admins });
    this.emit('chat:members-changed', { conversationId, members: c.members, action: 'transfer_owner', target: targetUsername, from: oldOwner, by: requester });
    return { ok: true, owner: c.owner, admins: c.admins };
  }

  // ── 消息 ──

  listMessages(username: string, conversationId: string): { error?: string; messages?: any[] } {
    const c = this.dataService.getConversation(conversationId);
    if (!c) return { error: '会话不存在' };
    if (!this.canAccess(username, c)) return { error: '无权访问该会话' };
    const senderRole = this.dataService.getUserByUsername(username)?.role || '';
    const messages = this.dataService.getChatMessages(conversationId)
      .filter((m) => {
        // 群聊阅后即焚：只显示发给自己的或自己发的
        if (m.burn && m.burnTarget && c.type === 'group') {
          return m.sender === username || m.burnTarget === username;
        }
        // 指定接收人加密消息：仅发送者和指定接收人可见
        if (m.encrypted && m.secretTarget && c.type === 'group') {
          return m.sender === username || m.secretTarget === username;
        }
        // 超级管理员在群里发的消息，其他成员不可见
        const sender = this.dataService.getUserByUsername(m.sender);
        if (sender?.role === 'super_admin' && senderRole !== 'super_admin' && m.sender !== username) {
          return false;
        }
        return true;
      })
      .map((m) => this.decorateForClient(m, c.id, username));
    return { messages };
  }

  sendMessage(username: string, payload: { conversationId: string; content: string; encrypted?: boolean; burn?: boolean; burnSeconds?: number; burnTarget?: string; secretTarget?: string; replyTo?: string; mention?: string[]; contentType?: string; duration?: number; fileName?: string; fileSize?: number }) {
    const c = this.dataService.getConversation(payload.conversationId);
    if (!c) return { error: '会话不存在' };
    if (!this.canAccess(username, c)) return { error: '无权发送消息' };
    const isVoice = payload.contentType === 'voice';
    const isFile = payload.contentType === 'file' || payload.contentType === 'image';
    const content = isVoice ? String(payload.content || '') : isFile ? String(payload.content || '') : String(payload.content || '').trim();
    if (!content) return { error: '消息内容不能为空' };
    if (isVoice && !payload.duration) return { error: '语音时长缺失' };

    const encrypted = !!payload.encrypted;
    const burn = !!payload.burn;
    const burnTarget = payload.burnTarget || '';
    const replyTo = payload.replyTo || '';
    const mention = payload.mention || [];

    // 禁止回复加密/阅后即焚消息（防止内容经引用泄露）
    if (replyTo) {
      const r = this.dataService.getChatMessage(replyTo);
      if (r && (r.encrypted || r.burn)) return { error: '加密/阅后即焚消息不可回复' };
    }

    // 指定接收人加密：需要明确接收人（单聊自动为对方，群聊必须指定）
    let secretTarget = '';
    let secretPassword = '';
    let stored = content;
    if (encrypted) {
      if (c.type === 'single') {
        secretTarget = c.members.find((m: string) => m !== username) || '';
      } else {
        secretTarget = payload.secretTarget || '';
      }
      if (!secretTarget || secretTarget === username) return { error: '请为加密消息指定接收人' };
      if (!c.members.includes(secretTarget)) return { error: '指定的接收人不在会话中' };
      secretPassword = generateSecretPassword();
      stored = encryptWithPassword(secretPassword, content);
    }

    const message = this.dataService.addChatMessage({
      conversationId: c.id,
      sender: username,
      contentType: isVoice ? 'voice' : encrypted ? 'encrypted' : 'text',
      content: stored,
      encrypted: isVoice ? false : encrypted,
      secretTarget: isVoice ? '' : encrypted ? secretTarget : '',
      secretKey: isVoice ? '' : encrypted && secretTarget ? secretPassword : '',
      burn: isVoice ? false : burn,
      burnSeconds: isVoice ? 0 : burn ? (Number(payload.burnSeconds) || 10) : 0,
      burnTarget: isVoice ? '' : c.type === 'group' ? burnTarget : '',
      replyTo,
      mentionedUsers: [],
      revealedBy: [],
      readBy: [username],
      createdAt: new Date().toISOString(),
      ...(isVoice ? { duration: Number(payload.duration) || 0 } : {}),
      ...(isFile ? {
        fileName: payload.fileName || '文件',
        fileSize: Number(payload.fileSize) || 0,
      } : {}),
    });

    // 处理@提及
    const mentionedUsers: string[] = [];
    mention.forEach((m: string) => {
      if (c.members.includes(m) && m !== username) {
        mentionedUsers.push(m);
      }
    });
    if (mentionedUsers.length) {
      this.dataService.updateChatMessage(message.id, { mentionedUsers });
    }

    this.dataService.updateConversation(c.id, { lastMessageAt: message.createdAt });

    const clientMsg = this.decorateForClient(message, c.id, username);

    // 群聊阅后即焚 / 指定接收人加密：仅通知发送者和指定接收者
    if ((burn && burnTarget && c.type === 'group') || (encrypted && secretTarget && c.type === 'group')) {
      this.emitToUsers('chat:message', { conversationId: c.id, message: clientMsg }, [username, secretTarget || burnTarget]);
    } else {
      this.emit('chat:message', { conversationId: c.id, message: clientMsg });
    }

    // 指定接收人加密：私发随机密码（发送者 ↔ 接收者的单聊卡片）
    if (encrypted && secretTarget) {
      this.sendSecretKeyCard(username, secretTarget, message.id, secretPassword);
    }

    // 通知被@的用户
    if (mentionedUsers.length > 0) {
      this.emitToUsers('chat:mention', {
        conversationId: c.id,
        messageId: message.id,
        sender: username,
        mentionedUsers,
      }, mentionedUsers);
    }

    return { message: clientMsg };
  }

  // 私发随机密码：在发送者与接收者之间的单聊创建一张密码卡片
  private sendSecretKeyCard(fromUsername: string, toUsername: string, forMessageId: string, password: string) {
    try {
      const sc = this.dataService.getOrCreateSingleConversation(fromUsername, toUsername);
      const card = this.dataService.addChatMessage({
        conversationId: sc.id,
        sender: fromUsername,
        contentType: 'secret-key',
        content: password,
        secretFor: forMessageId,
        readBy: [fromUsername],
        createdAt: new Date().toISOString(),
      });
      this.dataService.updateConversation(sc.id, { lastMessageAt: card.createdAt });
      const clientCard = this.decorateForClient(card, sc.id, fromUsername);
      this.emitToUsers('chat:message', { conversationId: sc.id, message: clientCard }, [fromUsername, toUsername]);
    } catch {}
  }

  // 指定接收人加密：接收人用密码解密
  revealSecret(username: string, conversationId: string, messageId: string, password: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c || !this.canAccess(username, c)) return { error: '会话不存在或无权访问' };
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.conversationId !== conversationId) return { error: '消息不存在' };
    if (!m.encrypted || !m.secretTarget) return { error: '该消息不是指定接收人加密消息' };
    if (m.secretTarget !== username && m.sender !== username) return { error: '仅发送者和指定接收人可解密' };
    const plain = decryptWithPassword(String(password || ''), m.content);
    if (plain === '[密码错误或无法解密]') return { error: '密码错误' };
    const revealedBy = m.secretRevealedBy || [];
    if (!revealedBy.includes(username)) {
      const next = [...revealedBy, username];
      this.dataService.updateChatMessage(messageId, {
        secretRevealedBy: next,
        readBy: Array.from(new Set([...(m.readBy || []), username])),
      });
    }
    const updated = this.dataService.getChatMessage(messageId);
    const clientMsg = this.decorateForClient(updated, conversationId, username);
    this.emitToUsers('chat:secret-revealed', { conversationId, message: clientMsg }, [m.sender, m.secretTarget]);
    return { ok: true, message: clientMsg, content: plain };
  }

  // 复制密码后自动销毁密码卡片
  destroySecretKey(username: string, cardId: string) {
    const card = this.dataService.getChatMessage(cardId);
    if (!card || card.contentType !== 'secret-key') return { ok: true };
    const c = this.dataService.getConversation(card.conversationId);
    if (!c || !c.members.includes(username)) return { error: '无权操作' };
    this.dataService.deleteChatMessage(cardId);
    this.emit('chat:deleted', { conversationId: card.conversationId, messageId: cardId, by: username });
    return { ok: true };
  }

  // ── 揭示阅后即焚消息（点击火焰图标触发） ──
  revealMessage(username: string, conversationId: string, messageId: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c || !this.canAccess(username, c)) return { error: '会话不存在或无权访问' };
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

    // 仅首次揭示时启动焚毁倒计时并记录时间戳
    if (isFirstReveal) {
      this.dataService.updateChatMessage(messageId, { burnRevealedAt: new Date().toISOString() });
      this.scheduleBurn(conversationId, messageId);
    }

    const seconds = m.burnSeconds || 10;
    const content = m.encrypted ? decryptMessage(conversationId, m.content) : m.content;

    // 通知指定用户：消息被揭示（仅发送者和所有已揭示者）
    const targetUsers = m.burnTarget ? [m.sender, m.burnTarget, ...newRevealedBy] : newRevealedBy;
    const burnRevealedAt = isFirstReveal ? new Date().toISOString() : m.burnRevealedAt || '';
    this.emitToUsers('chat:revealed', {
      conversationId,
      messageId,
      revealedBy: newRevealedBy,
      revealedByUser: username,
      seconds,
      isFirstReveal,
      content,
      burnRevealedAt,
    }, targetUsers);

    return { ok: true, seconds, content };
  }

  // 标记已读（非焚毁消息）
  markRead(username: string, conversationId: string) {
    const c = this.dataService.getConversation(conversationId);
    if (!c || !this.canAccess(username, c)) return { error: '会话不存在或无权访问' };
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

  // 编辑消息（仅发送者，非焚毁中）
  editMessage(username: string, conversationId: string, messageId: string, content: string) {
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.conversationId !== conversationId) return { error: '消息不存在' };
    const text = String(content || '').trim();
    if (!text) return { error: '内容不能为空' };
    if (m.sender !== username) return { error: '只能编辑自己发送的消息' };
    if (m.burn) return { error: '阅后即焚消息不可编辑' };
    const stored = m.encrypted ? encryptMessage(conversationId, text) : text;
    const updated = this.dataService.updateChatMessage(messageId, {
      content: stored,
      edited: true,
      editedAt: new Date().toISOString(),
    });
    const clientMsg = this.decorateForClient(updated, conversationId, username);
    this.emit('chat:edited', { conversationId, message: clientMsg, by: username });
    return { ok: true, message: clientMsg };
  }

  // 转发消息到目标会话
  forwardMessage(username: string, sourceConvId: string, messageId: string, targetConvId: string) {
    const src = this.dataService.getConversation(sourceConvId);
    const dst = this.dataService.getConversation(targetConvId);
    if (!src || !dst) return { error: '会话不存在' };
    if (!this.canAccess(username, src) || !this.canAccess(username, dst)) return { error: '无权操作该会话' };
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.conversationId !== sourceConvId) return { error: '消息不存在' };
    if (m.burn) return { error: '阅后即焚消息不可转发' };
    if (m.encrypted) return { error: '加密消息不可转发' };
    const content = m.encrypted ? decryptMessage(sourceConvId, m.content) : m.content;
    const msg = this.dataService.addChatMessage({
      conversationId: targetConvId,
      sender: username,
      contentType: 'text',
      content,
      forwardFrom: { conversationId: sourceConvId, sender: m.sender, messageId },
    });
    const clientMsg = this.decorateForClient(msg, targetConvId, username);
    this.emit('chat:message', { conversationId: targetConvId, message: clientMsg });
    return { ok: true, message: clientMsg };
  }

  // 切换表情回应
  toggleReaction(username: string, conversationId: string, messageId: string, emoji: string) {
    const c = this.dataService.getConversation(conversationId);
    const m = this.dataService.getChatMessage(messageId);
    if (!m || m.conversationId !== conversationId) return { error: '消息不存在' };
    if (!c || !this.canAccess(username, c)) return { error: '无权操作该会话' };
    if (m.burn || m.encrypted) return { error: '加密/阅后即焚消息不可回应' };
    const reactions = m.reactions || [];
    let idx = reactions.findIndex((r: any) => r.emoji === emoji);
    if (idx === -1) {
      reactions.push({ emoji, users: [username] });
    } else {
      const users = reactions[idx].users || [];
      const ui = users.indexOf(username);
      if (ui >= 0) users.splice(ui, 1); else users.push(username);
      if (users.length === 0) reactions.splice(idx, 1);
    }
    const updated = this.dataService.updateChatMessage(messageId, { reactions });
    const clientMsg = this.decorateForClient(updated, conversationId, username);
    this.emit('chat:reaction', { conversationId, message: clientMsg, by: username });
    return { ok: true, message: clientMsg };
  }

  // 群公告置顶/取消置顶
  pinMessage(username: string, conversationId: string, messageId: string | null) {
    const c = this.dataService.getConversation(conversationId);
    if (!c) throw new ForbiddenException('会话不存在');
    if (c.type !== 'group') throw new ForbiddenException('仅群聊支持公告置顶');
    if (!c.members.includes(username)) throw new ForbiddenException('无权操作该群');
    const reqUser = this.dataService.getUserByUsername(username);
    const reqLevel = ROLE_LEVELS[reqUser?.role || ''] || 0;
    const isOwner = c.owner === username;
    const isAdmin = reqLevel >= 60;
    if (!isOwner && !isAdmin) throw new ForbiddenException('仅群主和管理员可设置公告');
    if (messageId) {
      const m = this.dataService.getChatMessage(messageId);
      if (!m || m.conversationId !== conversationId) throw new ForbiddenException('消息不存在');
      if (m.burn || m.encrypted) throw new ForbiddenException('加密/阅后即焚消息不可设为公告');
    }
    this.dataService.updateConversation(conversationId, { pinnedMessageId: messageId || '' });
    this.emit('chat:message-pinned', { conversationId, messageId: messageId || '', by: username });
    return { ok: true, pinnedMessageId: messageId || '' };
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
    const isSecretKey = m.contentType === 'secret-key';
    const isSecretEncrypted = m.encrypted && m.secretTarget;
    // 密码卡片：明文展示密码（仅发送者与接收者的单聊中）
    let content = isSecretKey ? m.content : m.content;
    if (!isSecretKey) {
      if (isSecretEncrypted) {
        // 指定接收人加密：发送者可见；接收人解密后方可见
        const isSender = username ? m.sender === username : false;
        const isTarget = username ? m.secretTarget === username : false;
        const revealed = username ? (m.secretRevealedBy || []).includes(username) : false;
        content = (isSender || (isTarget && revealed)) ? decryptWithPassword(m.secretKey || '', m.content) : '🔒 加密消息';
      } else {
        content = m.encrypted ? decryptMessage(conversationId, m.content) : m.content;
      }
    }
    const revealedBy = m.revealedBy || [];
    const revealedForMe = username ? revealedBy.includes(username) : false;
    const isSender = username ? m.sender === username : false;
    // 发送者始终可见内容；接收者需揭示后才可见
    const displayContent = m.burn && !isSender && !revealedForMe ? '' : content;
    const canSeeTarget = m.burn && m.burnTarget ? (isSender || m.burnTarget === username) : true;
    return {
      id: m.id,
      conversationId: m.conversationId,
      sender: m.sender,
      contentType: m.contentType,
      encrypted: m.encrypted,
      content: displayContent,
      secretTarget: m.secretTarget || '',
      secretFor: m.secretFor || '',
      secretRevealedBy: m.secretRevealedBy || [],
      burn: m.burn,
      burnSeconds: m.burnSeconds,
      burnTarget: canSeeTarget ? (m.burnTarget || '') : '',
      burnScheduled: m.burnScheduled,
      burnRevealedAt: m.burnRevealedAt || '',
      revealedBy,
      revealedForMe,
      readBy: m.readBy || [],
      edited: m.edited,
      editedAt: m.editedAt || '',
      forwardFrom: m.forwardFrom || null,
      reactions: m.reactions || [],
      createdAt: m.createdAt,
    };
  }

  // ── Telegram 风格：全局搜索 ──
  globalSearch(username: string, query: string): { results: any[] } {
    if (!query || query.length < 2) return { results: [] };
    const q = query.toLowerCase();
    const results: any[] = [];
    const conversations = this.dataService.getConversations().filter(c => c.members.includes(username));
    for (const conv of conversations) {
      const msgs = this.dataService.getChatMessages(conv.id);
      for (const m of msgs) {
        const content = (m.content || '').toLowerCase();
        if (content.includes(q)) {
          const searchStart = content.indexOf(q);
          results.push({
            convId: conv.id,
            convName: conv.type === 'single'
              ? (conv.members.find((u: string) => u !== username) || '')
              : conv.name,
            convType: conv.type,
            msgId: m.id,
            sender: m.sender,
            senderName: this.dataService.getUserByUsername(m.sender)?.name || m.sender,
            contentType: m.contentType,
            content: m.content,
            searchStart,
            searchText: query,
            createdAt: m.createdAt,
          });
        }
      }
    }
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { results };
  }

  // ── Telegram 风格：已保存消息 ──
  getSavedMessages(username: string): { messages: any[] } {
    const settings = this.dataService.getSettings();
    const saved: any[] = (settings.savedMessages as any[]) || [];
    const userSaved = saved.filter((s: any) => s.username === username);
    const messages: any[] = [];
    for (const s of userSaved) {
      const msg = this.dataService.getChatMessage(s.messageId);
      if (msg && this.canAccess(username, this.dataService.getConversation(msg.conversationId))) {
        messages.push(this.decorateForClient(msg, msg.conversationId, username));
      }
    }
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { messages };
  }

  saveMessage(username: string, messageId: string): { ok: boolean; message?: string; error?: string } {
    if (!messageId) return { ok: false, error: '消息ID不能为空' };
    const msg = this.dataService.getChatMessage(messageId);
    if (!msg) return { ok: false, error: '消息不存在' };
    if (!this.canAccess(username, this.dataService.getConversation(msg.conversationId))) {
      return { ok: false, error: '无权操作该消息' };
    }
    const settings = this.dataService.getSettings();
    const saved: any[] = (settings.savedMessages as any[]) || [];
    // 检查是否已保存
    const existing = saved.find((s: any) => s.username === username && s.messageId === messageId);
    if (existing) return { ok: true, message: '已存在于已保存消息中' };
    saved.push({ username, messageId, savedAt: new Date().toISOString() });
    this.dataService.updateSettings({ savedMessages: saved });
    return { ok: true };
  }

  deleteSavedMessage(username: string, messageId: string): { ok: boolean; error?: string } {
    if (!messageId) return { ok: false, error: '消息ID不能为空' };
    const settings = this.dataService.getSettings();
    const saved: any[] = (settings.savedMessages as any[]) || [];
    const filtered = saved.filter((s: any) => !(s.username === username && s.messageId === messageId));
    if (filtered.length === saved.length) return { ok: false, error: '消息未保存' };
    this.dataService.updateSettings({ savedMessages: filtered });
    return { ok: true };
  }
}
