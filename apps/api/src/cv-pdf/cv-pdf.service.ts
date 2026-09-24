import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import puppeteer from 'puppeteer';

/** How long the /print page gets to render and settle its page breaks. */
const RENDER_TIMEOUT = 30_000;

/** Where the web app (and its /print page) is served. */
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

const isCvDocument = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  'data' in value &&
  'appearance' in value;

@Injectable()
export class CvPdfService {
  private readonly logger = new Logger(CvPdfService.name);

  /**
   * Renders the CV on the web app's /print page in headless Chrome and returns
   * it as a PDF with real, selectable text.
   */
  async render(cvDocument: unknown): Promise<Uint8Array> {
    if (!isCvDocument(cvDocument)) {
      throw new BadRequestException('Invalid CV');
    }

    // Uses Puppeteer's own Chrome; set PUPPETEER_EXECUTABLE_PATH to use another.
    const browser = await puppeteer.launch();

    try {
      const page = await browser.newPage();
      // Handshake with the /print page: it reads the CV from this global and
      // sets `__CV_READY__` once its page breaks have settled.
      await page.evaluateOnNewDocument((document) => {
        (globalThis as Record<string, unknown>).__CV_DOCUMENT__ = document;
      }, cvDocument);

      await page.goto(new URL('/print', WEB_URL).toString(), {
        waitUntil: 'load',
        timeout: RENDER_TIMEOUT,
      });
      await page.waitForFunction(
        'window.__CV_READY__ === true && document.fonts.status === "loaded"',
        { timeout: RENDER_TIMEOUT },
      );

      return await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } catch (error) {
      this.logger.error('CV PDF failed', error);
      throw new InternalServerErrorException('Could not create the PDF');
    } finally {
      await browser.close();
    }
  }
}
