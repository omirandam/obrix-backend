import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateModuleDto) {
    try {
      return await this.prisma.module.create({ data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new ConflictException('Module key ya existe');
      throw e;
    }
  }

  async findAll() {
    return this.prisma.module.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const m = await this.prisma.module.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Module no encontrado');
    return m;
  }

  async update(id: string, dto: UpdateModuleDto) {
    await this.findOne(id);
    try {
      return await this.prisma.module.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new ConflictException('Module key ya existe');
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.module.delete({ where: { id } });
  }
}
