"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useCv } from "@/providers/cv-provider/context";
import CvSectionResizers from "@/components/cv-section-resizers";
import {
  CV_DOCUMENT_ATTRIBUTE,
  paginate,
  type TCvPagination,
} from "@/components/cv-display/paginate";
import {
  SCvDisplay,
  SCvDisplayDocument,
  SCvDisplayMeasure,
  SCvDisplayPage,
  SCvDisplayPageFrame,
} from "@/components/cv-display/styles";
import type { TCvDisplayProps } from "@/components/cv-display/types";

/**
 * The CV preview. Content that doesn't fit on one page continues on the next;
 * pages are shown one under another. See `variant` for the read-only and
 * PDF versions.
 */
export const CvDisplay = ({
  variant = "preview",
  onReady,
  page,
  ...props
}: TCvDisplayProps) => {
  const { template, colors, sizes, typography } = useCv();
  // Scopes this display's page-break rules to its own copies of the CV.
  const documentAttributes = { [CV_DOCUMENT_ATTRIBUTE]: useId() };
  const measureRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement>(null);
  const [pagination, setPagination] = useState<TCvPagination>({
    css: "",
    pages: 1,
  });
  // Bumped when the layout can change without a re-render (resize, fonts).
  const [layoutVersion, setLayoutVersion] = useState(0);
  const onReadyRef = useRef(onReady);
  useLayoutEffect(() => {
    onReadyRef.current = onReady;
  });

  const content = template.render({ colors, sizes, typography });

  useEffect(() => {
    const bump = () => setLayoutVersion((version) => version + 1);
    const observer = new ResizeObserver(bump);
    if (measureRef.current) observer.observe(measureRef.current);
    document.fonts.addEventListener("loadingdone", bump);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, []);

  // Re-measures whenever the rendered CV or its layout may have changed. Only
  // stores a result that differs, so it settles after one extra render.
  useLayoutEffect(() => {
    const cvDocument = measureRef.current;
    const style = styleRef.current;
    if (!cvDocument || !style) return;

    const next = paginate(cvDocument, style);
    if (
      next &&
      (next.css !== pagination.css || next.pages !== pagination.pages)
    ) {
      setPagination(next);
    } else {
      style.textContent = pagination.css;
      // Nothing changed: the page breaks have settled.
      onReadyRef.current?.(pagination.pages);
    }
  }, [content, layoutVersion, pagination]);

  return (
    <SCvDisplay variant={variant} {...props}>
      <style ref={styleRef}>{pagination.css}</style>
      <SCvDisplayMeasure aria-hidden>
        <SCvDisplayDocument
          ref={measureRef}
          pages={1}
          offset={0}
          {...documentAttributes}
        >
          {content}
        </SCvDisplayDocument>
      </SCvDisplayMeasure>
      {Array.from({ length: pagination.pages }, (_, index) => index)
        .filter((index) => page === undefined || index === page)
        .map((index) => (
          <SCvDisplayPageFrame key={index} variant={variant}>
            <SCvDisplayPage
              variant={variant}
              aria-label={`Page ${index + 1} of ${pagination.pages}`}
            >
              <SCvDisplayDocument
                pages={pagination.pages}
                offset={index}
                {...documentAttributes}
              >
                {content}
              </SCvDisplayDocument>
            </SCvDisplayPage>
            {variant === "preview" && index === 0 && <CvSectionResizers />}
          </SCvDisplayPageFrame>
        ))}
    </SCvDisplay>
  );
};

export default CvDisplay;
