import styled from "@emotion/styled";
import { Card, Flex, Heading, Text } from "@costor/ui";
import { accentText } from "@/utils/accent-text";
import { waveMask } from "@/utils/wave-mask";
import type {
  TSHomeComparisonRowProps,
  TSHomeGridProps,
  TSHomeHeroPageProps,
} from "@/views/home-page/types";

export const SHomePage = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    gap: ${theme.spacing(16)};

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

export const SHomeSectionBody = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    gap: ${theme.spacing(10)};

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(8)};
    }
  `}
`;

/** Intro under a section's heading. */
export const SHomeSectionDescription = styled(Text)`
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
`;

/* ---------- Hero ---------- */

/**
 * Full-bleed gradient banner. Breaks out of the site layout's side padding
 * and slides up under the transparent top bar, to the top of the page.
 */
export const SHomeHero = styled.section`
  ${({ theme }) => {
    const { main, light, dark, contrastText } = theme.palette.primary;
    return `
      --wave: ${theme.spacing(24)};
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      align-items: center;
      gap: ${theme.spacing(10)};
      margin: calc((var(--site-nav-height) + var(--site-gutter)) * -1)
        calc(var(--site-gutter) * -1) 0;
      padding: calc(var(--site-nav-height) + ${theme.spacing(10)})
        max(${theme.spacing(10)}, calc((100% - 1200px) / 2))
        calc(${theme.spacing(16)} + var(--wave));
      overflow: hidden;
      color: ${contrastText};
      background:
        radial-gradient(circle at 10% 15%, ${light}aa, transparent 45%),
        radial-gradient(circle at 90% 25%, color-mix(in srgb, ${main} 55%, #ff6fb5), transparent 50%),
        radial-gradient(circle at 55% 100%, color-mix(in srgb, ${dark} 70%, #3b1d8f), transparent 60%),
        linear-gradient(135deg, ${main}, ${dark});
      ${waveMask("bottom", "var(--wave)")}

      ${theme.breakpoints.down("md")} {
        grid-template-columns: minmax(0, 1fr);
      }
      ${theme.breakpoints.down("sm")} {
        --wave: ${theme.spacing(12)};
        padding: calc(var(--site-nav-height) + ${theme.spacing(10)})
          ${theme.spacing(5)} calc(${theme.spacing(10)} + var(--wave));
      }
    `;
  }}
`;

/** Small glassy pill above the hero title. */
export const SHomeHeroEyebrow = styled.span`
  ${({ theme }) => `
    padding: ${theme.spacing(1, 3)};
    border: 1px solid rgb(255 255 255 / 0.35);
    border-radius: ${theme.radius.pill};
    background-color: rgb(255 255 255 / 0.15);
    backdrop-filter: blur(6px);
    font-size: 0.8125rem;
    font-weight: 600;
  `}
`;

export const SHomeHeroText = styled(Flex)`
  ${({ theme }) => `
    gap: ${theme.spacing(6)};
    min-width: 0;
  `}
`;

export const SHomeHeroTitle = styled(Heading)`
  color: inherit;
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
`;

export const SHomeHeroLead = styled.p`
  margin: 0;
  max-width: 540px;
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.9;
`;

export const SHomeStats = styled.dl`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(3, minmax(0, max-content));
    gap: ${theme.spacing(8)};
    margin: ${theme.spacing(4, 0, 0)};
    padding-top: ${theme.spacing(6)};
    border-top: 1px solid rgb(255 255 255 / 0.25);

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(5)};
    }
  `}
`;

export const SHomeStat = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};

    & dt {
      order: 2;
      font-size: 0.875rem;
      opacity: 0.8;
    }

    & dd {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
    }
  `}
`;

/** Three fanned-out CV pages. */
export const SHomeHeroVisual = styled.div`
  ${({ theme }) => `
    position: relative;
    width: 100%;
    max-width: 520px;
    aspect-ratio: 1 / 1;
    margin: 0 auto;

    ${theme.breakpoints.down("md")} {
      max-width: 420px;
    }
  `}
`;

export const SHomeHeroPage = styled("div", {
  shouldForwardProp: (prop) => prop !== "index",
})<TSHomeHeroPageProps>`
  ${({ index }) => {
    const layouts = [
      "left: 0; top: 12%; transform: rotate(-8deg); z-index: 1;",
      "right: 0; top: 12%; transform: rotate(8deg); z-index: 1;",
      "left: 50%; top: 0; transform: translateX(-50%); z-index: 2;",
    ];
    return `
      position: absolute;
      width: 52%;
      transition: transform 400ms ease-in-out;
      ${layouts[index] ?? ""}
    `;
  }}
`;

/* ---------- Features & steps ---------- */

export const SHomeGrid = styled("div", {
  shouldForwardProp: (prop) => prop !== "columns",
})<TSHomeGridProps>`
  ${({ theme, columns }) => `
    display: grid;
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
    gap: ${theme.spacing(5)};
    text-align: left;

    ${theme.breakpoints.down("md")} {
      grid-template-columns: repeat(${Math.min(columns, 2)}, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("sm")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SHomeFeature = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    padding: ${theme.spacing(8)};
    transition: transform 200ms ease-in-out;

    &:hover {
      transform: translateY(-4px);
    }
  `}
`;

export const SHomeFeatureIcon = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing(2)};
    border-radius: ${theme.radius.md};
    background-color: ${theme.palette.primary.main}18;
    color: ${accentText(theme)};
    font-size: 1.375rem;
  `}
`;

export const SHomeStepNumber = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: ${theme.spacing(2)};
    border-radius: ${theme.radius.full};
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.primary.contrastText};
    font-weight: 700;
  `}
`;

/* ---------- Templates ---------- */

/** Full-bleed strip: stretches from the centered container to the viewport edges. */
export const SHomeTemplates = styled(Card)`
  ${({ theme }) => `
    width: 100vw;
    margin-left: calc(50% - 50vw);
    border-left: none;
    border-right: none;
    padding: ${theme.spacing(8, 0)};
    overflow: hidden;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  `}
`;

/** Fades the sliding pages out at both edges instead of cutting them off. */
export const SHomeTemplatesTrack = styled.div`
  ${({ theme }) => `
    --fade: ${theme.spacing(24)};
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 var(--fade),
      #000 calc(100% - var(--fade)),
      transparent
    );

    ${theme.breakpoints.down("sm")} {
      --fade: ${theme.spacing(10)};
    }
  `}
`;

export const SHomeTemplateCard = styled.figure`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    width: 240px;
    margin: 0;
    padding: ${theme.spacing(3)};
    text-align: center;

    & figcaption {
      color: ${theme.palette.default.main};
      font-weight: 600;
    }
  `}
`;

/* ---------- Comparison ---------- */

export const SHomeComparison = styled(Card)`
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
  text-align: left;
`;

export const SHomeComparisonRow = styled("div", {
  shouldForwardProp: (prop) => prop !== "header",
})<TSHomeComparisonRowProps>`
  ${({ theme, header }) => `
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 120px;
    align-items: center;
    gap: ${theme.spacing(4)};
    padding: ${theme.spacing(4, 6)};
    background-color: ${header ? `${theme.palette.primary.main}10` : "transparent"};
    color: ${theme.palette.default.main};
    font-weight: ${header ? 700 : 400};

    & + & {
      border-top: 1px solid ${theme.surfaces.divider};
    }

    & > :not(:first-of-type) {
      justify-self: center;
      text-align: center;
    }

    ${theme.breakpoints.down("sm")} {
      grid-template-columns: minmax(0, 1fr) 72px 72px;
      padding: ${theme.spacing(3, 4)};
      font-size: 0.875rem;
    }
  `}
`;

export const SHomeYes = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    color: ${theme.palette.success.main};
    font-size: 1.25rem;
  `}
`;

export const SHomeNo = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    color: ${theme.palette.error.main};
    font-size: 1.125rem;
  `}
`;

/* ---------- Pricing & FAQ ---------- */

export const SHomePlans = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${theme.spacing(5)};
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    text-align: left;

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SHomeFaq = styled.div`
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  text-align: left;
`;

/* ---------- Final call to action ---------- */

export const SHomeCta = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(5)};
    padding: ${theme.spacing(16, 10)};
    text-align: center;
    background: linear-gradient(
      135deg,
      ${theme.palette.primary.main},
      ${theme.palette.primary.dark}
    );
    color: ${theme.palette.primary.contrastText};

    & h2,
    & p {
      color: inherit;
    }

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(10, 5)};
    }
  `}
`;

export const SHomeCtaText = styled.p`
  margin: 0;
  max-width: 560px;
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.9;
`;
