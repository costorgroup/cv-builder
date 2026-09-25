/**
 * Loads countries, states and cities from GeoNames (https://www.geonames.org,
 * CC BY 4.0). Run with `pnpm db:seed`; running it again replaces the data.
 *
 * The source files are downloaded once into `prisma/.geonames` (gitignored);
 * delete that folder to fetch fresh ones.
 */
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { strFromU8, unzipSync } from 'fflate';
import { PrismaClient } from '../src/generated/prisma/client.js';

const SOURCE_URL = 'https://download.geonames.org/export/dump';
const CACHE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '.geonames',
);
const BATCH_SIZE = 5_000;

/** Listed by GeoNames but no longer exist. */
const OBSOLETE_COUNTRIES = new Set(['AN', 'CS']);

/**
 * Populated-place feature codes left out: neighbourhoods (PPLX) and places
 * that are historical, abandoned or destroyed.
 */
const SKIPPED_FEATURES = new Set(['PPLX', 'PPLH', 'PPLQ', 'PPLW', 'PPLCH']);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** The file from the cache, downloading it first if needed. */
const download = async (fileName: string) => {
  const cached = path.join(CACHE_DIR, fileName);
  if (!existsSync(cached)) {
    console.log(`Downloading ${fileName}…`);
    const response = await fetch(`${SOURCE_URL}/${fileName}`);
    if (!response.ok) {
      throw new Error(`${fileName}: HTTP ${response.status}`);
    }
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cached, Buffer.from(await response.arrayBuffer()));
  }
  return readFile(cached);
};

/** Tab-separated rows, skipping blank lines and `#` comments. */
const rows = (text: string) =>
  text
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.replace(/\r$/, '').split('\t'));

const inBatches = async <T>(
  items: T[],
  insert: (batch: T[]) => Promise<unknown>,
) => {
  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    await insert(items.slice(start, start + BATCH_SIZE));
  }
};

const main = async () => {
  const [countryFile, stateFile, cityZip] = await Promise.all([
    download('countryInfo.txt'),
    download('admin1CodesASCII.txt'),
    download('cities1000.zip'),
  ]);

  // ISO, ISO3, ISO-Numeric, fips, Country, …
  const countries = rows(countryFile.toString('utf8'))
    .map(([code, , , , name]) => ({ code, name }))
    .filter(({ code, name }) => code && name && !OBSOLETE_COUNTRIES.has(code));
  const countryCodes = new Set(countries.map(({ code }) => code));

  // "RS.SE", name, ascii name, geonameid
  const states = rows(stateFile.toString('utf8'))
    .map(([fullCode, name, , id]) => {
      const [countryCode, ...code] = fullCode.split('.');
      return { id: Number(id), countryCode, code: code.join('.'), name };
    })
    .filter(({ countryCode }) => countryCodes.has(countryCode));
  const stateIds = new Map(
    states.map(({ id, countryCode, code }) => [`${countryCode}.${code}`, id]),
  );

  // geonameid, name, asciiname, alternatenames, lat, lng, feature class,
  // feature code, country code, cc2, admin1 code, …, population (14)
  const cityText = strFromU8(unzipSync(cityZip)['cities1000.txt']);
  const cities = rows(cityText)
    .filter(
      (cols) =>
        countryCodes.has(cols[8]) && !SKIPPED_FEATURES.has(cols[7]),
    )
    .map((cols) => ({
      id: Number(cols[0]),
      name: cols[1],
      asciiName: cols[2] || cols[1],
      countryCode: cols[8],
      stateId: stateIds.get(`${cols[8]}.${cols[10]}`) ?? null,
      population: Number(cols[14]) || 0,
    }));

  console.log(
    `Loading ${countries.length} countries, ${states.length} states, ${cities.length} cities…`,
  );

  // All or nothing, so a failed run leaves the previous data in place.
  await prisma.$transaction(
    async (tx) => {
      await tx.city.deleteMany();
      await tx.state.deleteMany();
      await tx.country.deleteMany();
      await tx.country.createMany({ data: countries });
      await inBatches(states, (data) => tx.state.createMany({ data }));
      await inBatches(cities, (data) => tx.city.createMany({ data }));
    },
    { timeout: 10 * 60_000 },
  );

  console.log('Done.');
};

try {
  await main();
} finally {
  await prisma.$disconnect();
}
