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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true },
    });
    if (!user) throw new NotFoundException('User no encontrado');

    const enabledSet = await this.getEnabledCompanyModuleIds(user.companyId);

    const rows = await this.prisma.userModule.findMany({
      where: { userId },
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });

    // efectivos: asignados al user + habilitados para su company + activos en catálogo
    return rows
      .map((r) => r.module)
      .filter((m) => m.isActive && enabledSet.has(m.id));
  }

  async assignModules(userId: string, moduleIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true },
    });
    if (!user) throw new NotFoundException('User no encontrado');

    // 1) valida que existan los módulos
    const found = await this.prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, isActive: true },
    });

    if (found.length !== moduleIds.length) {
      const foundIds = new Set(found.map((x) => x.id));
      const missing = moduleIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Módulos no encontrados: ${missing.join(', ')}`,
      );
    }

    // opcional: bloquea asignación de módulos inactivos en catálogo
    const inactive = found.filter((m) => !m.isActive).map((m) => m.id);
    if (inactive.length) {
      throw new ConflictException(
        `No puedes asignar módulos inactivos: ${inactive.join(', ')}`,
      );
    }

    // 2) valida que estén habilitados para la company del usuario
    const enabledSet = await this.getEnabledCompanyModuleIds(user.companyId);

    const notEnabled = moduleIds.filter((mid) => !enabledSet.has(mid));
    if (notEnabled.length) {
      throw new ConflictException(
        `No puedes asignar módulos no habilitados para la empresa: ${notEnabled.join(', ')}`,
      );
    }

    // 3) crea relaciones (si ya existe, ignora)
    await this.prisma.userModule.createMany({
      data: moduleIds.map((moduleId) => ({ userId, moduleId })),
      skipDuplicates: true,
    });

    return this.getModules(userId);
  }

  private async getEnabledCompanyModuleIds(companyId: string) {
    const rows = await this.prisma.companyModule.findMany({
      where: { companyId, isEnabled: true },
      select: { moduleId: true },
    });
    return new Set(rows.map((r) => r.moduleId));
  }

  async getAvailableModulesForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true },
    });
    if (!user) throw new NotFoundException('User no encontrado');

    const rows = await this.prisma.companyModule.findMany({
      where: { companyId: user.companyId, isEnabled: true },
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });

    // solo módulos activos
    return rows.map((r) => r.module).filter((m) => m.isActive);
  }

  async setUserModules(userId: string, moduleIds: string[]) {
    // 1) trae usuario+company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true },
    });
    if (!user) throw new NotFoundException('User no encontrado');

    // 2) validar que los módulos existan
    const found = await this.prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, isActive: true },
    });

    if (found.length !== moduleIds.length) {
      const foundIds = new Set(found.map((x) => x.id));
      const missing = moduleIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Módulos no encontrados: ${missing.join(', ')}`,
      );
    }

    const inactive = found.filter((m) => !m.isActive).map((m) => m.id);
    if (inactive.length) {
      throw new ConflictException(`Módulos inactivos: ${inactive.join(', ')}`);
    }

    // 3) validar contra company_module (isEnabled=true)
    const enabled = await this.prisma.companyModule.findMany({
      where: { companyId: user.companyId, isEnabled: true },
      select: { moduleId: true },
    });
    const enabledSet = new Set(enabled.map((x) => x.moduleId));

    const notAllowed = moduleIds.filter((id) => !enabledSet.has(id));
    if (notAllowed.length) {
      throw new ConflictException(
        `Módulos no habilitados para la empresa: ${notAllowed.join(', ')}`,
      );
    }

    // 4) reemplazo total: borra y crea
    await this.prisma.userModule.deleteMany({ where: { userId } });

    if (moduleIds.length) {
      await this.prisma.userModule.createMany({
        data: moduleIds.map((moduleId) => ({ userId, moduleId })),
        skipDuplicates: true,
      });
    }

    // 5) devolver efectivos
    return this.getModules(userId); // tu getModules ya filtra por company_module + isActive si lo actualizaste
  }
}
