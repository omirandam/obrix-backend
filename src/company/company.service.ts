import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({ data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('RFC ya existe');
      throw e;
    }
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company no encontrada');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    try {
      return await this.prisma.company.update({
        where: { id },
        data: dto,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('RFC ya existe');
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    // Si tienes FK User.companyId -> Company.id, borrar company con users fallará.
    // Por ahora lo dejamos así (borrado duro).
    return this.prisma.company.delete({ where: { id } });
  }
}
