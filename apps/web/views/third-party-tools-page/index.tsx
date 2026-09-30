"use client";

import NextLink from "next/link";
import LegalDocument, { type TLegalSection } from "@/components/legal-document";
import { SLegalDocumentTable } from "@/components/legal-document/styles";
import { CONTACT_EMAIL, SITE_NAME } from "@/utils/site";

/** Outside tools and data the Service relies on; keep in sync with the code. */
const TOOLS = [
  {
    name: "Google Fonts",
    use: "Typefaces for the site and CV templates (Inter, Roboto, Lato and more).",
    data: "None. Fonts are downloaded when the site is built and served from our own domain, so your browser never contacts Google.",
    link: "https://fonts.google.com",
  },
  {
    name: "GeoNames",
    use: "Country, region and city names for the location fields in the editor.",
    data: "None. The data is copied into our own database; your searches stay on our servers. Licensed under CC BY 4.0.",
    link: "https://www.geonames.org",
  },
  {
    name: "Chromium (via Puppeteer)",
    use: "Turns your CV into a PDF file.",
    data: "Your CV content, processed on our own servers only. Nothing is sent to Google or any other outside service.",
    link: "https://pptr.dev",
  },
  {
    name: "PostgreSQL",
    use: "The database that stores your account and CVs.",
    data: "Your account details and CVs, on infrastructure we control.",
    link: "https://www.postgresql.org",
  },
];

const SECTIONS: TLegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <p>
        {SITE_NAME} is built to keep your data with us. We don&apos;t embed
        analytics, advertising, chat widgets or social media plugins, and no
        third-party scripts run on our pages.
      </p>
    ),
  },
  {
    id: "tools",
    title: "Tools and data we use",
    content: (
      <SLegalDocumentTable>
        <table>
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">What it&apos;s for</th>
              <th scope="col">Your data involved</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map(({ name, use, data, link }) => (
              <tr key={name}>
                <td>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {name}
                  </a>
                </td>
                <td>{use}</td>
                <td>{data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SLegalDocumentTable>
    ),
  },
  {
    id: "open-source",
    title: "Open-source software",
    content: (
      <p>
        {SITE_NAME} is built with open-source software including Next.js,
        React, Emotion, React Hook Form, NestJS and Prisma. These run as part of
        our own application and don&apos;t send your data to their authors.
      </p>
    ),
  },
  {
    id: "attribution",
    title: "Attribution",
    content: (
      <p>
        Location data ©{" "}
        <a
          href="https://www.geonames.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          GeoNames
        </a>
        , licensed under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        .
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    content: (
      <p>
        If we add a provider that handles your personal data, such as an email
        or payment service, we&apos;ll list it here and update our{" "}
        <NextLink href="/privacy-policy">privacy policy</NextLink>. Questions?
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

const ThirdPartyToolsPage = () => (
  <LegalDocument
    title="Third-party tools"
    summary="The outside tools and data behind our service, and what they can see."
    sections={SECTIONS}
  />
);

export default ThirdPartyToolsPage;
