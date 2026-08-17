import { Controller, Get, Put, Delete, Param, UseGuards, Req, Res } from '@nestjs/common';
import type { Request } from 'express';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { SseJwtGuard } from '../../guards/sse-jwt.guard';

interface AuthedRequest extends Request {
  user?: { sub?: string; username?: string; role?: string };
}

@Controller('notifications')
export class NotificationController {
  constructor(private dataService: DataService) {}

  private getUsername(req: AuthedRequest): string {
    return req.user?.username || '';
  }

  // SSE 实时推送：EventSource 不支持自定义 Header，因此 token 支持通过 query ?token= 读取
  @Get('stream')
  @UseGuards(SseJwtGuard)
  stream(@Req() req: AuthedRequest, @Res() res: any) {
    const username = this.getUsername(req);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, payload: any) => {
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {}
    };

    send('connected', { message: '已连接实时通知' });

    const unsubscribe = this.dataService.subscribeNotifications(username, (n) => {
      send('notification', { notification: n });
    });

    req.on('close', () => {
      unsubscribe();
      try { res.end(); } catch {}
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getNotifications(@Req() req: AuthedRequest) {
    return this.dataService.getNotifications(this.getUsername(req));
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Req() req: AuthedRequest) {
    return { count: this.dataService.getUnreadCount(this.getUsername(req)) };
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Req() req: AuthedRequest) {
    const ok = this.dataService.markNotificationRead(id, this.getUsername(req));
    if (!ok) return { message: '通知不存在' };
    return { message: '已标记为已读' };
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Req() req: AuthedRequest) {
    const count = this.dataService.markAllNotificationsRead(this.getUsername(req));
    return { message: `已将 ${count} 条通知标记为已读` };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    const ok = this.dataService.deleteNotification(id, this.getUsername(req));
    if (!ok) return { message: '通知不存在' };
    return { message: '通知已删除' };
  }
}