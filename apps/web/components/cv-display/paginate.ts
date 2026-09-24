import { CV_PAGE_HEIGHT_CQW } from "@/templates/shared/styles";

/**
 * Marks a rendered CV document. Its value identifies one CvDisplay, so break
 * rules only apply to that display's copies (several can be on screen).
 */
export const CV_DOCUMENT_ATTRIBUTE = "data-cv-document";

/** Blocks that are moved to the next page as a whole instead of being cut. */
const BLOCK_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "p",
  "li",
  "dt",
  "dd",
  "blockquote",
  ".cv-entry",
  ".cv-chips",
  ".cv-inline-list",
].join(", ");

const HEADING_SELECTOR = "h2, h3";

/** Space kept free above and below every page break, in `cqw`. */
const PAGE_MARGIN_CQW = 6;

/** Safety cap on how many blocks get moved in one run. */
const MAX_BREAKS = 200;

export type TCvPagination = {
  /** CSS that pushes blocks past page breaks; same for every copy. */
  css: string;
  pages: number;
};

type TBreak = {
  selector: string;
  /** Margin the block had before, in px. */
  baseMargin: number;
  /** Space added to push it onto the next page, in px. */
  shift: number;
};

/**
 * `nth-child` path from the document to `element`. Every copy of the CV
 * renders the same tree, so the path finds the same block in each of them.
 */
const selectorFor = (document: Element, element: Element) => {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    parts.unshift(
      `:nth-child(${Array.from(parent.children).indexOf(node) + 1})`,
    );
    node = parent;
  }
  const scope = document.getAttribute(CV_DOCUMENT_ATTRIBUTE) ?? "";
  return `[${CV_DOCUMENT_ATTRIBUTE}="${scope}"] > ${parts.join(" > ")}`;
};

/**
 * A heading directly above `element` moves with it, so a section title is
 * never left alone at the bottom of a page.
 */
const withHeading = (document: Element, element: Element) => {
  let node: Element = element;
  for (let depth = 0; depth < 3; depth += 1) {
    const previous = node.previousElementSibling;
    if (previous)
      return previous.matches(HEADING_SELECTOR) ? previous : element;
    const parent = node.parentElement;
    if (!parent || parent === document) break;
    node = parent;
  }
  return element;
};

/**
 * Finds blocks of `document` that would be cut by a page break (or sit in
 * the margin around one) and pushes each onto the next page. Works on a
 * rendered, visible-to-layout copy; `style` is where the break rules go.
 */
export const paginate = (
  document: HTMLElement,
  style: HTMLStyleElement,
): TCvPagination | null => {
  const width = document.getBoundingClientRect().width;
  if (!width) return null;

  const cqw = width / 100;
  const pageHeight = CV_PAGE_HEIGHT_CQW * cqw;
  const margin = PAGE_MARGIN_CQW * cqw;
  const breaks = new Map<Element, TBreak>();

  const toCss = () =>
    Array.from(breaks.values())
      .map(
        ({ selector, baseMargin, shift }) =>
          `${selector} { margin-top: ${((baseMargin + shift) / cqw).toFixed(3)}cqw !important; }`,
      )
      .join("\n");

  style.textContent = "";

  for (let run = 0; run < MAX_BREAKS; run += 1) {
    const documentTop = document.getBoundingClientRect().top;
    let target: Element | null = null;
    let targetTop = Infinity;
    let boundary = 0;

    for (const element of document.querySelectorAll(BLOCK_SELECTOR)) {
      if (getComputedStyle(element).position === "absolute") continue;
      const rect = element.getBoundingClientRect();
      // Blocks taller than a page can't be kept whole; let them split.
      if (!rect.height || rect.height > pageHeight - 2 * margin) continue;

      const top = rect.top - documentTop;
      const bottom = rect.bottom - documentTop;
      const page = Math.floor(top / pageHeight);

      // The break at the top of this block's page, and the one below it.
      for (const edge of [page * pageHeight, (page + 1) * pageHeight]) {
        if (edge < pageHeight) continue;
        // Sub-pixel overlaps don't count, so a moved block isn't picked again.
        const inMargin =
          bottom > edge - margin + 0.5 && top < edge + margin - 0.5;
        // Topmost first; on a tie, the outer block (e.g. the entry, not its title).
        const better =
          top < targetTop ||
          (top === targetTop && target && element.contains(target));
        if (inMargin && better) {
          target = element;
          targetTop = top;
          boundary = edge;
        }
      }
    }

    if (!target) break;

    const block = withHeading(document, target);
    const top = block.getBoundingClientRect().top - documentTop;
    const shift = boundary + margin - top;
    if (shift < 0.5) break;

    const existing = breaks.get(block);
    if (existing) {
      existing.shift += shift;
    } else {
      breaks.set(block, {
        selector: selectorFor(document, block),
        baseMargin: parseFloat(getComputedStyle(block).marginTop) || 0,
        shift,
      });
    }
    style.textContent = toCss();
  }

  const height = document.getBoundingClientRect().height;
  return {
    css: toCss(),
    pages: Math.max(1, Math.ceil((height - 1) / pageHeight)),
  };
};
