import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCvDto, ListCvsQuery, UpdateCvDto } from './cvs.dto.js';

const json = (value: Record<string, unknown>) => value as Prisma.InputJsonObject;

/** CVs, always scoped to the user who owns them. */
@Injectable()
export class CvsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Newest first; `search` matches the CV name. */
  async list(userId: string, { search, page, pageSize }: ListCvsQuery) {
    const where: Prisma.CvWhereInput = {
      userId,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cv.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cv.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async get(userId: string, id: string) {
    const cv = await this.prisma.cv.findFirst({ where: { id, userId } });
    if (!cv) throw new NotFoundException('CV not found');
    return cv;
  }

  create(userId: string, { name, data, appearance }: CreateCvDto) {
    return this.prisma.cv.create({
      data: { userId, name, data: json(data), appearance: json(appearance) },
    });
  }

  async update(userId: string, id: string, dto: UpdateCvDto) {
    await this.get(userId, id);
    return this.prisma.cv.update({
      where: { id },
      data: {
        name: dto.name,
        data: dto.data && json(dto.data),
        appearance: dto.appearance && json(dto.appearance),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.cv.delete({ where: { id } });
  }
}
