import { Controller, Get } from '@nestjs/common';
import { TemplatesService } from './templates.service.js';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  /** Public: the site and the editor list these. */
  @Get()
  list() {
    return this.templates.listPublic();
  }
}
