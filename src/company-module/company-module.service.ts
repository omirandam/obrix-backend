import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyModuleService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCompany(companyId: string) {
    const c = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Company no encontrada');
  }

  private async ensureModulesExist(moduleIds: string[]) {
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
  }

  // ✅ Lista módulos de una empresa (con detalle del módulo)
  async listByCompany(companyId: string) {
    await this.ensureCompany(companyId);

    return this.prisma.companyModule.findMany({
      where: { companyId },
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ Lista solo los habilitados (para UI y validaciones)
  async listEnabledByCompany(companyId: string) {
    await this.ensureCompany(companyId);

    return this.prisma.companyModule.findMany({
      where: { companyId, isEnabled: true },
      include: { module: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ Toggle puntual (enable/disable) para un módulo específico
  async toggle(companyId: string, moduleId: string, isEnabled: boolean) {
    await this.ensureCompany(companyId);

    // valida que exista el módulo
    const m = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true },
    });
    if (!m) throw new NotFoundException('Module no encontrado');

    // upsert usando unique compuesto companyId+moduleId
    return this.prisma.companyModule.upsert({
      where: { companyId_moduleId: { companyId, moduleId } },
      create: { companyId, moduleId, isEnabled },
      update: { isEnabled },
      include: { module: true },
    });
  }

  // ✅ Set masivo (sincroniza: deja enabled solo los que mandas)
  // - crea faltantes
  // - habilita los enviados
  // - deshabilita los que ya no vienen
  async setCompanyModules(companyId: string, moduleIds: string[]) {
    await this.ensureCompany(companyId);
    await this.ensureModulesExist(moduleIds);

    // Traer actuales
    const current = await this.prisma.companyModule.findMany({
      where: { companyId },
      select: { moduleId: true },
    });
    const currentSet = new Set(current.map((x) => x.moduleId));
    const desiredSet = new Set(moduleIds);

    const toCreate = moduleIds.filter((id) => !currentSet.has(id));
    const toEnable = moduleIds; // todos los deseados quedan enabled
    const toDisable = current
      .map((x) => x.moduleId)
      .filter((id) => !desiredSet.has(id));

    // Crear los que no existían
    if (toCreate.length) {
      await this.prisma.companyModule.createMany({
        data: toCreate.map((moduleId) => ({
          companyId,
          moduleId,
          isEnabled: true,
        })),
        skipDuplicates: true,
      });
    }

    // Habilitar deseados
    await this.prisma.companyModule.updateMany({
      where: { companyId, moduleId: { in: toEnable } },
      data: { isEnabled: true },
    });

    // Deshabilitar los que ya no deben estar
    if (toDisable.length) {
      await this.prisma.companyModule.updateMany({
        where: { companyId, moduleId: { in: toDisable } },
        data: { isEnabled: false },
      });
    }

    return this.listByCompany(companyId);
  }

  // (Opcional) borrar relación dura
  async remove(companyId: string, moduleId: string) {
    await this.ensureCompany(companyId);
    // idempotente
    await this.prisma.companyModule.deleteMany({
      where: { companyId, moduleId },
    });
    return { ok: true };
  }

  async getCatalogWithStatus(companyId: string) {
    await this.ensureCompany(companyId);

    const [allModules, companyRows] = await Promise.all([
      this.prisma.module.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.companyModule.findMany({
        where: { companyId },
        select: { moduleId: true, isEnabled: true },
      }),
    ]);

    const map = new Map(companyRows.map((r) => [r.moduleId, r.isEnabled]));

    return allModules.map((m) => ({
      id: m.id,
      key: m.key,
      name: m.name,
      icon: m.icon,
      description: m.description,
      isActive: m.isActive,
      // si no existe relación, lo consideramos disabled
      isEnabled: map.get(m.id) ?? false,
    }));
  }
}
