import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { DataService } from '../../services/data.service';

// WebSocket 命名空间 /chat，用于单聊/群聊实时消息与在线状态
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // 在线用户：username -> socket
  private online = new Map<string, Socket>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private dataService: DataService,
  ) {
    // ChatService 通过 emitter 向对应会话房间广播实时事件
    this.chatService.setEmitter((event, payload) => {
      this.broadcastToConversation(payload?.conversationId, event, payload);
    });
    // 订阅 org 变更事件，广播给所有客户端
    this.dataService.subscribeOrgChange((payload) => {
      this.server.emit('org:changed', payload);
    });
  }

  private broadcastToConversation(conversationId: string, event: string, payload: any) {
    if (!conversationId) return;
    try {
      // 阅后即焚定向通知：仅发送给指定用户
      const targetUsers = payload?._targetUsers;
      if (targetUsers && Array.isArray(targetUsers) && targetUsers.length > 0) {
        targetUsers.forEach((u: string) => {
          try { this.server.to(`user:${u}`).emit(event, payload); } catch {}
        });
      } else {
        this.server.to(`conv:${conversationId}`).emit(event, payload);
      }
    } catch {}
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new Error('no token');
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'sgbuild-secret-key-change-in-production',
      });
      const username = payload.username;
      if (!username) throw new Error('no username');

      client.data.username = username;
      // 同一用户多端：关闭旧连接
      const old = this.online.get(username);
      if (old && old.id !== client.id) old.disconnect(true);

      this.online.set(username, client);
      client.join(`user:${username}`);
      // 加入其所有会话房间
      this.joinUserConversations(client);

      this.broadcastPresence(username, true);
      client.emit('chat:ready', { username });
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const username = client.data.username;
    if (!username) return;
    if (this.online.get(username)?.id === client.id) {
      this.online.delete(username);
      this.broadcastPresence(username, false);
    }
  }

  private joinUserConversations(client: Socket) {
    const username = client.data.username;
    try {
      const convs = this.chatService.listConversations(username);
      for (const c of convs) client.join(`conv:${c.id}`);
    } catch {}
  }

  private broadcastPresence(username: string, online: boolean) {
    this.server.emit('chat:presence', { username, online, at: new Date().toISOString() });
  }

  // 用户点击某会话（进入房间 + 通知对方在线）
  @SubscribeMessage('chat:open')
  handleOpen(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const username = client.data.username;
    if (!body?.conversationId) return;
    client.join(`conv:${body.conversationId}`);
    this.server.to(`conv:${body.conversationId}`).emit('chat:peer-online', { conversationId: body.conversationId, username, online: true });
  }

  // 发送消息
  @SubscribeMessage('chat:send')
  handleSend(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const username = client.data.username;
    const result = this.chatService.sendMessage(username, body || {});
    if (result.error) {
      return { error: result.error };
    }
    client.join(`conv:${body.conversationId}`);
    return { ok: true, message: result.message };
  }

  // 揭示阅后即焚消息（点击火焰图标触发，开始焚毁倒计时）
  @SubscribeMessage('chat:reveal')
  handleReveal(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; messageId: string }) {
    const username = client.data.username;
    return this.chatService.revealMessage(username, body?.conversationId, body?.messageId);
  }

  // 指定接收人加密：接收人用密码解密
  @SubscribeMessage('chat:secret-reveal')
  handleSecretReveal(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; messageId: string; password: string }) {
    const username = client.data.username;
    return this.chatService.revealSecret(username, body?.conversationId, body?.messageId, body?.password);
  }

  // 复制密码后自动销毁密码卡片
  @SubscribeMessage('chat:secret-copied')
  handleSecretCopied(@ConnectedSocket() client: Socket, @MessageBody() body: { cardId: string }) {
    const username = client.data.username;
    return this.chatService.destroySecretKey(username, body?.cardId);
  }

  // 标记已读
  @SubscribeMessage('chat:read')
  handleRead(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const username = client.data.username;
    return this.chatService.markRead(username, body?.conversationId);
  }

  // 删除消息
  @SubscribeMessage('chat:delete')
  handleDelete(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; messageId: string }) {
    const username = client.data.username;
    return this.chatService.deleteMessage(username, body?.conversationId, body?.messageId);
  }

  // 输入中状态
  @SubscribeMessage('chat:typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const username = client.data.username;
    if (!body?.conversationId) return;
    this.server.to(`conv:${body.conversationId}`).emit('chat:typing', { conversationId: body.conversationId, username });
  }

  // 新成员加入会话房间
  @SubscribeMessage('chat:join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const username = client.data.username;
    if (!body?.conversationId) return;
    client.join(`conv:${body.conversationId}`);
    this.server.to(`conv:${body.conversationId}`).emit('chat:peer-online', { conversationId: body.conversationId, username, online: true });
  }

  // ── 语音/视频通话信令转发（仅在参与者之间） ──
  @SubscribeMessage('chat:call:offer')
  handleCallOffer(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; target: string; offer: any }) {
    const from = client.data.username;
    if (!body?.target || !body?.offer) return;
    this.server.to(`user:${body.target}`).emit('chat:call:offer', { from, conversationId: body.conversationId, offer: body.offer });
  }

  @SubscribeMessage('chat:call:answer')
  handleCallAnswer(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; target: string; answer: any }) {
    const from = client.data.username;
    if (!body?.target || !body?.answer) return;
    this.server.to(`user:${body.target}`).emit('chat:call:answer', { from, conversationId: body.conversationId, answer: body.answer });
  }

  @SubscribeMessage('chat:call:ice')
  handleCallIce(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; target: string; candidate: any }) {
    const from = client.data.username;
    if (!body?.target || !body?.candidate) return;
    this.server.to(`user:${body.target}`).emit('chat:call:ice', { from, conversationId: body.conversationId, candidate: body.candidate });
  }

  @SubscribeMessage('chat:call:end')
  handleCallEnd(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; target: string }) {
    const from = client.data.username;
    if (!body?.target) return;
    this.server.to(`user:${body.target}`).emit('chat:call:end', { from, conversationId: body.conversationId });
  }

  @SubscribeMessage('chat:call:decline')
  handleCallDecline(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; target: string }) {
    const from = client.data.username;
    if (!body?.target) return;
    this.server.to(`user:${body.target}`).emit('chat:call:decline', { from, conversationId: body.conversationId });
  }

  // 在线状态查询
  @SubscribeMessage('chat:presence-query')
  handlePresenceQuery(@ConnectedSocket() client: Socket) {
    const onlineList = Array.from(this.online.keys());
    client.emit('chat:presence-list', { online: onlineList });
  }

  getOnlineUsernames(): string[] {
    return Array.from(this.online.keys());
  }

  isOnline(username: string): boolean {
    return this.online.has(username);
  }
}
