import { BadRequestException } from '@nestjs/common';
import {
  findTemplateSpec,
  getDefaultSizes,
  normalizeCvAppearance,
  premiumFeaturesNeeded,
  type TCvAppearance,
  type TTemplateCatalog,
} from '@repo/cv-core';
import { PlanFeatureRequiredException } from '../entitlements/entitlements.errors.js';
import { resolveEntitlements } from '../entitlements/resolve-entitlements.js';
import {
  assertAppearanceAllowed,
  cvSizeBytes,
  parseAppearance,
} from './cv-appearance.js';

const NOW = new Date();
const free = resolveEntitlements(
  null,
  { key: 'free', name: 'Free', features: [], limits: {} },
  NOW,
);

/** As seeded: every template published; default, classic and minimal free. */
const CATALOG: TTemplateCatalog = {
  available: [
    'default',
    'modern',
    'classic',
    'minimal',
    'executive',
    'creative',
    'columns',
    'elegant',
    'tech',
    'timeline',
    'bold',
  ],
  free: ['default', 'classic', 'minimal'],
};
const FREE_IDS = CATALOG.free;

/** The `modern` template with everything at its defaults. */
const modernDefaults = () => parseAppearance({ templateId: 'modern' });

describe('normalizeCvAppearance', () => {
  it('fills in the template defaults, as the editor does', () => {
    expect(parseAppearance({ templateId: 'modern' })).toEqual({
      templateId: 'modern',
      colorSchemeId: 'ocean',
      fontId: 'montserrat',
      fontScale: 1,
      sizes: getDefaultSizes(findTemplateSpec('modern')!),
    });
  });

  it('keeps valid choices and drops unknown fields', () => {
    const appearance = parseAppearance({
      templateId: 'modern',
      colorSchemeId: 'sunset',
      fontId: 'lato',
      fontScale: 0.9,
      sizes: { columns: { main: 60, sidebar: 40 } },
      extra: 'dropped',
    });

    expect(appearance).toEqual({
      templateId: 'modern',
      colorSchemeId: 'sunset',
      fontId: 'lato',
      fontScale: 0.9,
      sizes: { columns: { main: 60, sidebar: 40 } },
    });
  });

  it.each([
    ['not an object', 'modern', /must be an object/],
    ['unknown template', { templateId: 'nope' }, /Unknown template/],
    [
      "another template's color scheme",
      { templateId: 'modern', colorSchemeId: 'navy' },
      /color scheme/,
    ],
    ['unknown font', { templateId: 'modern', fontId: 'comic-sans' }, /font/],
    ['text size too big', { templateId: 'modern', fontScale: 3 }, /Text size/],
    [
      'unknown section group',
      { templateId: 'modern', sizes: { rows: {} } },
      /unknown section group/,
    ],
    [
      'section below its minimum',
      { templateId: 'modern', sizes: { columns: { main: 40, sidebar: 60 } } },
      /must be 55–72/,
    ],
    [
      'sizes not adding up to 100',
      { templateId: 'modern', sizes: { columns: { main: 60, sidebar: 30 } } },
      /add up to 100/,
    ],
  ])('rejects %s', (_, input, message) => {
    const result = normalizeCvAppearance(input);
    expect('error' in result && result.error).toMatch(message);
    expect(() => parseAppearance(input)).toThrow(BadRequestException);
  });
});

describe('premiumFeaturesNeeded', () => {
  it('needs nothing for a free template at its defaults', () => {
    expect(
      premiumFeaturesNeeded(
        parseAppearance({ templateId: 'classic' }),
        null,
        FREE_IDS,
      ),
    ).toEqual([]);
  });

  it('needs a feature for each premium choice', () => {
    const appearance: TCvAppearance = {
      ...modernDefaults(),
      colorSchemeId: 'sunset',
      fontId: 'lato',
      sizes: { columns: { main: 60, sidebar: 40 } },
    };

    expect(premiumFeaturesNeeded(appearance, null, FREE_IDS)).toEqual([
      'template.premium',
      'appearance.allColorSchemes',
      'appearance.allFonts',
      'appearance.resizeSections',
    ]);
  });

  it('keeps what the saved CV already used (after a downgrade)', () => {
    const saved: TCvAppearance = {
      ...modernDefaults(),
      colorSchemeId: 'sunset',
    };

    expect(
      premiumFeaturesNeeded({ ...saved, fontScale: 1.1 }, saved, FREE_IDS),
    ).toEqual([]);
  });

  it('needs the feature again once that choice changes', () => {
    const saved: TCvAppearance = {
      ...modernDefaults(),
      colorSchemeId: 'sunset',
    };

    expect(
      premiumFeaturesNeeded(
        { ...saved, colorSchemeId: 'slate' },
        saved,
        FREE_IDS,
      ),
    ).toEqual(['appearance.allColorSchemes']);
  });

  it('allows going back to a default after a downgrade', () => {
    const saved: TCvAppearance = {
      ...modernDefaults(),
      colorSchemeId: 'sunset',
    };

    expect(
      premiumFeaturesNeeded(
        { ...saved, colorSchemeId: 'ocean' },
        saved,
        FREE_IDS,
      ),
    ).toEqual([]);
  });

  it('checks everything when the saved CV was on another template', () => {
    const saved = modernDefaults();
    const next: TCvAppearance = {
      ...parseAppearance({ templateId: 'bold' }),
    };

    expect(premiumFeaturesNeeded(next, saved, FREE_IDS)).toEqual([
      'template.premium',
    ]);
  });

  it('needs nothing for a template an admin made free', () => {
    expect(
      premiumFeaturesNeeded(modernDefaults(), null, [...FREE_IDS, 'modern']),
    ).toEqual([]);
  });
});

describe('assertAppearanceAllowed', () => {
  it('throws a PLAN_FEATURE_REQUIRED 403 for a premium template on Free', () => {
    expect(() =>
      assertAppearanceAllowed(free, CATALOG, modernDefaults(), null),
    ).toThrow(PlanFeatureRequiredException);
  });

  it('lets Free keep a premium CV it already has', () => {
    const saved = modernDefaults();
    expect(() =>
      assertAppearanceAllowed(
        free,
        CATALOG,
        { ...saved, fontScale: 0.9 },
        saved,
      ),
    ).not.toThrow();
  });

  const withoutClassic: TTemplateCatalog = {
    available: CATALOG.available.filter((id) => id !== 'classic'),
    free: CATALOG.free.filter((id) => id !== 'classic'),
  };

  it("won't switch a CV to a hidden template", () => {
    expect(() =>
      assertAppearanceAllowed(
        free,
        withoutClassic,
        parseAppearance({ templateId: 'classic' }),
        parseAppearance({ templateId: 'default' }),
      ),
    ).toThrow(BadRequestException);
  });

  it('lets a CV keep a hidden template it already has', () => {
    const saved = parseAppearance({ templateId: 'classic' });
    expect(() =>
      assertAppearanceAllowed(
        free,
        withoutClassic,
        { ...saved, fontScale: 1.1 },
        saved,
      ),
    ).not.toThrow();
  });
});

describe('cvSizeBytes', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(cvSizeBytes({ name: 'Niš' }, {})).toBe(
      Buffer.byteLength('{"name":"Niš"}') + 2,
    );
  });
});
