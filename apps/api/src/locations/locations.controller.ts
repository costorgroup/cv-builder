import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { SearchCitiesQuery } from './locations.dto.js';
import { LocationsService } from './locations.service.js';

/** Reference data only changes when re-seeded, so browsers may cache it. */
const CACHE_A_DAY = 'public, max-age=86400';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  @Header('Cache-Control', CACHE_A_DAY)
  countries() {
    return this.locationsService.countries();
  }

  @Get('countries/:code/states')
  @Header('Cache-Control', CACHE_A_DAY)
  states(@Param('code') code: string) {
    return this.locationsService.states(code);
  }

  @Get('cities')
  cities(@Query() query: SearchCitiesQuery) {
    return this.locationsService.cities(query);
  }
}
