"use client";

import {
  Button,
  CheckIcon,
  CloseIcon,
  Container,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  Flex,
  FolderIcon,
  Heading,
  Marquee,
  SectionGroup,
  SettingsIcon,
  Text,
  UserIcon,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import FaqList, { type TFaqItem } from "@/components/faq-list";
import PlanCard from "@/components/plan-card";
import SiteSection from "@/components/site-section";
import TemplatePreview from "@/components/template-preview";
import { cvFonts } from "@/fonts";
import { DEFAULT_CURRENCY } from "@repo/cv-core";
import { toPlan } from "@/utils/pricing";
import { PRICING_PATH, SECTION_VARIANT } from "@/utils/site";
import { useStartCvHref } from "@/utils/start-cv";
import {
  SHomeComparison,
  SHomeComparisonRow,
  SHomeCta,
  SHomeCtaText,
  SHomeFaq,
  SHomeFeature,
  SHomeFeatureIcon,
  SHomeGrid,
  SHomeHero,
  SHomeHeroEyebrow,
  SHomeHeroLead,
  SHomeHeroPage,
  SHomeHeroText,
  SHomeHeroTitle,
  SHomeHeroVisual,
  SHomeNo,
  SHomePage,
  SHomePlans,
  SHomeSectionBody,
  SHomeSectionDescription,
  SHomeStat,
  SHomeStats,
  SHomeStepNumber,
  SHomeTemplateCard,
  SHomeTemplates,
  SHomeTemplatesTrack,
  SHomeYes,
} from "@/views/home-page/styles";
import type { TTemplate } from "@/templates";
import { fallbackTemplates, offeredTemplates } from "@/utils/offered-templates";
import type {
  THomeComparisonRow,
  THomeFeature,
  THomePageProps,
  THomeStep,
} from "@/views/home-page/types";

const colorSchemeCountOf = (templates: TTemplate[]) =>
  templates.reduce(
    (count, template) => count + template.colorSchemes.length,
    0,
  );

/** Left, right, then the one in front. */
const HERO_TEMPLATE_IDS = ["modern", "creative", "default"];
const heroTemplatesOf = (templates: TTemplate[]) =>
  HERO_TEMPLATE_IDS.map(
    (id, index) =>
      templates.find((template) => template.id === id) ?? templates[index],
  ).filter((template) => template !== undefined);

const featuresOf = (
  templateCount: number,
  colorSchemeCount: number,
): THomeFeature[] => [
  {
    icon: <FileIcon />,
    title: `${templateCount} professional templates`,
    description:
      "From classic to creative, every template is designed to be clear, readable and easy for recruiters to scan.",
  },
  {
    icon: <SettingsIcon />,
    title: "Make it yours",
    description: `Choose from ${colorSchemeCount} color schemes and ${cvFonts.length} fonts, scale the text and resize sections until everything fits.`,
  },
  {
    icon: <EyeIcon />,
    title: "Live preview",
    description:
      "See your CV update as you type. Sample content fills the gaps, so you always know what the finished page looks like.",
  },
  {
    icon: <DownloadIcon />,
    title: "Pixel-perfect PDF",
    description:
      "Download a print-ready A4 PDF that looks exactly like the preview, with page breaks in the right places.",
  },
  {
    icon: <FolderIcon />,
    title: "All your CVs in one place",
    description:
      "Keep a version for every role you apply to. Search, edit and re-download them from your dashboard any time.",
  },
  {
    icon: <UserIcon />,
    title: "Private by design",
    description:
      "No ads and no tracking. Your CV is yours: we never sell your data or show it to anyone without your say-so.",
  },
];

const STEPS: THomeStep[] = [
  {
    title: "Pick a template",
    description:
      "Browse the templates and choose the one that fits your style. You can switch at any time without retyping a thing.",
  },
  {
    title: "Fill in your details",
    description:
      "Add your experience, education, skills and more, step by step. The preview updates live as you go.",
  },
  {
    title: "Download and apply",
    description:
      "Tweak colors and fonts, then download your CV as a PDF and start sending applications.",
  },
];

const COMPARISON: THomeComparisonRow[] = [
  ["Layout that never breaks as you type", true, false],
  ["Switch templates without retyping", true, false],
  ["Live preview with sample content", true, false],
  ["Consistent, print-ready PDF", true, false],
  ["Every version saved in one dashboard", true, false],
];

const FAQ: TFaqItem[] = [
  {
    question: "Is CV Builder free?",
    answer:
      "Yes. You can create an account, build your CV and download it as a PDF on the free plan. Premium unlocks every template, color scheme and font, plus unlimited saved CVs.",
  },
  {
    question: "What's the difference between a CV and a resume?",
    answer:
      'In most of Europe, "CV" is the everyday word for the document you send with a job application; in the US and Canada it\'s usually called a resume. Our templates work for both.',
  },
  {
    question: "Can I change the template after I've filled in my details?",
    answer:
      "Absolutely. Your content is kept separately from the design, so you can switch templates, colors and fonts at any time and everything moves over.",
  },
  {
    question: "What format can I download my CV in?",
    answer:
      "Your CV downloads as an A4 PDF, the format recruiters and job portals expect. What you see in the preview is exactly what you get.",
  },
  {
    question: "Will my CV get through applicant tracking systems (ATS)?",
    answer:
      "Our PDFs contain real, selectable text rather than images, so ATS software can read your name, experience and skills.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Your CVs are stored in your account and only you can see them. We don't use advertising or analytics trackers. Read our privacy policy for the details.",
  },
];

const SectionDescription = ({ children }: { children: string }) => (
  <SHomeSectionDescription color="secondary">
    {children}
  </SHomeSectionDescription>
);

const HomePage = ({ plans, templates: published }: THomePageProps) => {
  const startHref = useStartCvHref();
  const templates = published
    ? offeredTemplates(published)
    : fallbackTemplates();
  const colorSchemeCount = colorSchemeCountOf(templates);
  const heroTemplates = heroTemplatesOf(templates);
  const features = featuresOf(templates.length, colorSchemeCount);

  return (
    <SHomePage direction="column">
      <SHomeHero>
        <SHomeHeroText direction="column" align="flex-start">
          <SHomeHeroEyebrow>Free online CV builder</SHomeHeroEyebrow>
          <SHomeHeroTitle as="h1">
            Build a CV that gets you noticed
          </SHomeHeroTitle>
          <SHomeHeroLead>
            Pick a professionally designed template, fill in your details with a
            live preview, and download a polished PDF in minutes. No design
            skills needed.
          </SHomeHeroLead>
          <Flex gap={3} wrap="wrap">
            <Button
              as={ButtonLink}
              href={startHref}
              variant="solid"
              color="light"
              size="lg"
            >
              Create my CV
            </Button>
            <Button
              as={ButtonLink}
              href="/#templates"
              variant="outline"
              color="light"
              size="lg"
              appearance="transparent"
            >
              Browse templates
            </Button>
          </Flex>
          <SHomeStats>
            <SHomeStat>
              <dt>Templates</dt>
              <dd>{templates.length}</dd>
            </SHomeStat>
            <SHomeStat>
              <dt>Color schemes</dt>
              <dd>{colorSchemeCount}</dd>
            </SHomeStat>
            <SHomeStat>
              <dt>To get started</dt>
              <dd>€0</dd>
            </SHomeStat>
          </SHomeStats>
        </SHomeHeroText>
        <SHomeHeroVisual aria-hidden>
          {heroTemplates.map((template, index) => (
            <SHomeHeroPage key={template.id} index={index}>
              <TemplatePreview template={template} />
            </SHomeHeroPage>
          ))}
        </SHomeHeroVisual>
      </SHomeHero>

      <Container maxWidth="lg" disableGutters>
        <SectionGroup
          variant={SECTION_VARIANT}
          align="center"
          color="primary"
          gap={16}
        >
          <SiteSection
            id="features"
            title="Everything you need for a standout CV"
          >
            <SHomeSectionBody direction="column">
              <SectionDescription>
                {
                  "A focused editor that takes care of the layout, so you can focus on what you've achieved."
                }
              </SectionDescription>
              <SHomeGrid columns={3}>
                {features.map(({ icon, title, description }) => (
                  <SHomeFeature key={title} radius="lg">
                    <SHomeFeatureIcon>{icon}</SHomeFeatureIcon>
                    <Heading as="h5">{title}</Heading>
                    <Text color="secondary">{description}</Text>
                  </SHomeFeature>
                ))}
              </SHomeGrid>
            </SHomeSectionBody>
          </SiteSection>

          <SiteSection id="templates" title="Templates for every career">
            <SHomeSectionBody direction="column">
              <SectionDescription>
                {
                  "Whether you're a graduate or an executive, there's a design that fits. Drag to browse, then make it yours."
                }
              </SectionDescription>
              <SHomeTemplates radius="none">
                <SHomeTemplatesTrack>
                  <Marquee autoPlay pauseOnHover speed={30} gap="lg">
                    {templates.map((template) => (
                      <SHomeTemplateCard key={template.id}>
                        <TemplatePreview template={template} />
                        <figcaption>{template.name}</figcaption>
                      </SHomeTemplateCard>
                    ))}
                  </Marquee>
                </SHomeTemplatesTrack>
              </SHomeTemplates>
              <Flex justify="center">
                <Button
                  as={ButtonLink}
                  href={startHref}
                  variant="solid"
                  color="primary"
                  size="lg"
                >
                  Choose a template
                </Button>
              </Flex>
            </SHomeSectionBody>
          </SiteSection>

          <SiteSection id="how-it-works" title="Your new CV in three steps">
            <SHomeSectionBody direction="column">
              <SectionDescription>
                {
                  "No blank pages and no fiddling with margins. Just answer a few questions and we'll do the rest."
                }
              </SectionDescription>
              <SHomeGrid columns={3}>
                {STEPS.map(({ title, description }, index) => (
                  <SHomeFeature key={title} radius="lg">
                    <SHomeStepNumber>{index + 1}</SHomeStepNumber>
                    <Heading as="h5">{title}</Heading>
                    <Text color="secondary">{description}</Text>
                  </SHomeFeature>
                ))}
              </SHomeGrid>
            </SHomeSectionBody>
          </SiteSection>

          <SiteSection title="Better than a blank document">
            <SHomeSectionBody direction="column">
              <SectionDescription>
                {
                  "Word processors are great for letters. For CVs, a purpose-built editor saves you hours."
                }
              </SectionDescription>
              <SHomeComparison
                radius="lg"
                role="table"
                aria-label="CV Builder compared with a word processor"
              >
                <SHomeComparisonRow header role="row">
                  <span role="columnheader">Feature</span>
                  <span role="columnheader">CV Builder</span>
                  <span role="columnheader">Word processor</span>
                </SHomeComparisonRow>
                {COMPARISON.map(([feature, ours, theirs]) => (
                  <SHomeComparisonRow key={feature} role="row">
                    <span role="rowheader">{feature}</span>
                    {[ours, theirs].map((value, index) => (
                      <span role="cell" key={index}>
                        {value ? (
                          <SHomeYes aria-label="Yes">
                            <CheckIcon />
                          </SHomeYes>
                        ) : (
                          <SHomeNo aria-label="No">
                            <CloseIcon />
                          </SHomeNo>
                        )}
                      </span>
                    ))}
                  </SHomeComparisonRow>
                ))}
              </SHomeComparison>
            </SHomeSectionBody>
          </SiteSection>

          <SiteSection title="Start free, upgrade when you're ready">
            <SHomeSectionBody direction="column">
              <SectionDescription>
                {
                  "Build and download your CV for free. Go Premium for every template and unlimited CVs."
                }
              </SectionDescription>
              <SHomePlans>
                {(plans?.plans ?? []).map((plan) => (
                  <PlanCard
                    key={plan.key}
                    plan={toPlan(
                      plan,
                      plans?.currency ?? DEFAULT_CURRENCY,
                      plans?.approximate,
                      plans?.freeTemplateCount,
                    )}
                    period="yearly"
                  />
                ))}
              </SHomePlans>
              <Flex justify="center">
                <Button as={ButtonLink} href={PRICING_PATH} variant="outline">
                  Compare plans
                </Button>
              </Flex>
            </SHomeSectionBody>
          </SiteSection>

          <SiteSection id="faq" title="Frequently asked questions">
            <SHomeSectionBody direction="column">
              <SHomeFaq>
                <FaqList items={FAQ} />
              </SHomeFaq>
            </SHomeSectionBody>
          </SiteSection>

          <SiteSection aria-labelledby="cta-title">
            <SHomeCta radius="lg">
              <Heading as="h2" id="cta-title">
                Ready to land your next job?
              </Heading>
              <SHomeCtaText>
                Create your CV in minutes with a template that makes a great
                first impression.
              </SHomeCtaText>
              <Button
                as={ButtonLink}
                href={startHref}
                variant="solid"
                color="light"
                size="lg"
              >
                Create my CV now
              </Button>
            </SHomeCta>
          </SiteSection>
        </SectionGroup>
      </Container>
    </SHomePage>
  );
};

export default HomePage;
