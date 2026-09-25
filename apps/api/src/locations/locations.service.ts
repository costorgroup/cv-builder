import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SearchCitiesQuery } from './locations.dto.js';

/** Countries, states and cities for the CV location fields. */
@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  countries() {
    return this.prisma.country.findMany({
      select: { code: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Empty for an unknown country or one without states. */
  states(countryCode: string) {
    return this.prisma.state.findMany({
      where: { countryCode: countryCode.toUpperCase() },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Cities whose name (with or without accents) starts with `search`, biggest
   * first.
   */
  cities({ country, state, search, limit }: SearchCitiesQuery) {
    return this.prisma.city.findMany({
      where: {
        countryCode: country,
        ...(state !== undefined && { stateId: state }),
        ...(search && {
          OR: [
            { name: { startsWith: search, mode: 'insensitive' } },
            { asciiName: { startsWith: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        state: { select: { name: true } },
      },
      orderBy: [{ population: 'desc' }, { name: 'asc' }],
      take: limit,
    });
  }
}
