import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// 供 SSE (EventSource) 使用：EventSource 无法设置自定义 Header，
// 因此 token 支持从 query 参数 ?token= 读取，也兼容 Authorization header。
@Injectable()
export class SseJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = headerToken || request.query?.token;

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'sgbuild-secret-key-change-in-production',
      });
      request.user = payload;
    } catch (e) {
      throw new UnauthorizedException('令牌无效或已过期');
    }

    return true;
  }
}
