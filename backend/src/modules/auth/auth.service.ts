import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DataService, REG_CODES, ROLE_LABELS } from '../../services/data.service';

@Injectable()
export class AuthService {
  constructor(
    private dataService: DataService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string, appliedRole: string, regCode: string) {
    const existingUser = this.dataService.getUserByUsername(username);
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 校验注册码
    const validCode = REG_CODES[appliedRole];
    if (!validCode) {
      throw new BadRequestException('无效的注册类别');
    }
    if (regCode !== validCode) {
      throw new BadRequestException('注册码不正确，请检查后重试');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.dataService.addUser({
      username,
      email,
      password: hashedPassword,
      role: 'employee', // 注册用户一律为普通用户
      appliedRole,
      roleStatus: 'pending', // 待 root 二次确认
      isActive: true,
    });

    const { password: _, ...result } = user;
    const accessToken = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role });
    return { accessToken, user: result };
  }

  async login(username: string, password: string) {
    const user = this.dataService.getUserByUsername(username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    const { password: _, ...result } = user;
    const accessToken = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role });
    return { accessToken, user: result };
  }
}
