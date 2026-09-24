import puppeteer from "puppeteer";
import type { TCvDocument } from "@/providers/cv-provider/types";

export const runtime = "nodejs";

/** How long the /print page gets to render and settle its page breaks. */
const RENDER_TIMEOUT = 30_000;

const isCvDocument = (value: unknown): value is TCvDocument =>
  typeof value === "object" &&
  value !== null &&
  "data" in value &&
  "appearance" in value;

/**
 * Renders the posted CV on the /print page in headless Chrome and returns it
 * as a PDF with real, selectable text.
 */
export const POST = async (request: Request) => {
  const cvDocument: unknown = await request.json().catch(() => null);
  if (!isCvDocument(cvDocument)) {
    return Response.json({ error: "Invalid CV" }, { status: 400 });
  }

  // Uses Puppeteer's own Chrome; set PUPPETEER_EXECUTABLE_PATH to use another.
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((document) => {
      window.__CV_DOCUMENT__ = document;
    }, cvDocument);

    await page.goto(new URL("/print", request.url).toString(), {
      waitUntil: "load",
      timeout: RENDER_TIMEOUT,
    });
    await page.waitForFunction(
      () => window.__CV_READY__ === true && document.fonts.status === "loaded",
      { timeout: RENDER_TIMEOUT },
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="cv.pdf"',
      },
    });
  } catch (error) {
    console.error("CV PDF failed", error);
    return Response.json(
      { error: "Could not create the PDF" },
      { status: 500 },
    );
  } finally {
    await browser.close();
  }
};
