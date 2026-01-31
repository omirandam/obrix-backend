import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        modules: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const payload = {
      sub: user.id,
      companyId: user.companyId,
      username: user.username,
    };

    const access_token = await this.jwt.signAsync(payload);

    // ✅ Transformamos la relación (user_module) en lista de módulos
    const modules = user.modules
      .map((um) => um.module)
      .filter((m) => m.isActive); // opcional: solo activos

    return {
      access_token,
      token_type: 'Bearer',
      user: {
        id: user.id,
        companyId: user.companyId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
      modules: modules.map((m) => ({
        id: m.id,
        key: m.key,
        name: m.name,
        icon: m.icon,
      })),
    };
  }
}
