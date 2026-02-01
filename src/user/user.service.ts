import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company no encontrada');
  }

  private userSelect = {
    id: true,
    companyId: true,
    email: true,
    username: true,
    fullName: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    company: true,
  };

  async create(dto: CreateUserDto) {
    await this.ensureCompany(dto.companyId);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          companyId: dto.companyId,
          email: dto.email,
          username: dto.username,
          fullName: dto.fullName,
          password: hashedPassword,
          isActive: dto.isActive,
        },
        select: this.userSelect,
      });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new ConflictException('Email o username ya existe en la company');
      throw e;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.companyId) await this.ensureCompany(dto.companyId);

    const data: any = {
      companyId: dto.companyId,
      email: dto.email,
      username: dto.username,
      fullName: dto.fullName,
      isActive: dto.isActive,
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: this.userSelect,
      });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new ConflictException('Email o username ya existe en la company');
      throw e;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException('User no encontrado');
    return user;
  }

  async findByCompany(companyId: string) {
    await this.ensureCompany(companyId);

    return this.prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...this.userSelect,
        company: false, // aquí no hace falta incluir company si no quieres
      },
    });
  }

  async remove(id: string) {
    // valida existencia
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User no encontrado');

    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }

  //Modules

  async getModules(userId: string) {
    // valida user
    await this.findOne(userId);

    const rows = await this.prisma.userModule.findMany({
      where: { userId },
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => r.module);
  }

  async assignModules(userId: string, moduleIds: string[]) {
    // valida user
    await this.findOne(userId);

    // opcional: valida que existan los módulos
    const found = await this.prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true },
    });

    if (found.length !== moduleIds.length) {
      const foundIds = new Set(found.map((x) => x.id));
      const missing = moduleIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Módulos no encontrados: ${missing.join(', ')}`,
      );
    }

    // Crea relaciones (si ya existe, ignora)
    await this.prisma.userModule.createMany({
      data: moduleIds.map((moduleId) => ({ userId, moduleId })),
      skipDuplicates: true,
    });

    return this.getModules(userId);
  }

  async removeModule(userId: string, moduleId: string) {
    await this.findOne(userId);

    // borra si existe (idempotente)
    await this.prisma.userModule.deleteMany({
      where: { userId, moduleId },
    });

    return this.getModules(userId);
  }

  async clearModules(userId: string) {
    await this.findOne(userId);

    await this.prisma.userModule.deleteMany({ where: { userId } });
    return [];
  }
}
