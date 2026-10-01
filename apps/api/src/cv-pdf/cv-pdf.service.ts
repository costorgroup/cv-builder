import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import puppeteer, { type Browser } from 'puppeteer';

/** How long the /print page gets to render and settle its page breaks. */
const RENDER_TIMEOUT = 30_000;

/**
 * PDFs rendered at once; the rest wait their turn. Each render is a Chrome
 * tab, so this is what bounds the API's memory under load.
 */
const MAX_CONCURRENT_RENDERS = 3;

/** Where the web app (and its /print page) is served. */
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

const isCvDocument = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  'data' in value &&
  'appearance' in value;

@Injectable()
export class CvPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(CvPdfService.name);
  /** One Chrome for every render, started on first use. */
  private browser?: Promise<Browser>;
  private running = 0;
  private readonly queue: (() => void)[] = [];

  async onModuleDestroy() {
    const browser = await this.browser?.catch(() => undefined);
    await browser?.close();
  }

  /**
   * Renders the CV on the web app's /print page in headless Chrome and returns
   * it as a PDF with real, selectable text.
   */
  async render(cvDocument: unknown): Promise<Uint8Array> {
    if (!isCvDocument(cvDocument)) {
      throw new BadRequestException('Invalid CV');
    }

    await this.acquire();
    try {
      // A fresh context per render, so no page state leaks between CVs.
      const context = await (await this.getBrowser()).createBrowserContext();
      try {
        const page = await context.newPage();
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
      } finally {
        await context.close();
      }
    } catch (error) {
      this.logger.error('CV PDF failed', error);
      throw new InternalServerErrorException('Could not create the PDF');
    } finally {
      this.release();
    }
  }

  /** The shared browser, (re)started if it isn't running. */
  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      // Uses Puppeteer's own Chrome; set PUPPETEER_EXECUTABLE_PATH to use another.
      const launching = puppeteer.launch();
      this.browser = launching;
      launching.then(
        (browser) =>
          browser.once('disconnected', () => {
            if (this.browser === launching) this.browser = undefined;
          }),
        () => {
          if (this.browser === launching) this.browser = undefined;
        },
      );
    }
    return this.browser;
  }

  private async acquire() {
    if (this.running < MAX_CONCURRENT_RENDERS) {
      this.running++;
      return;
    }
    // The slot is handed over by `release`, so `running` stays the same.
    await new Promise<void>((resolve) => this.queue.push(resolve));
  }

  private release() {
    const next = this.queue.shift();
    if (next) next();
    else this.running--;
  }
}
