"use client";

import NextLink from "next/link";
import LegalDocument, { type TLegalSection } from "@/components/legal-document";
import { SLegalDocumentTable } from "@/components/legal-document/styles";
import { CONTACT_EMAIL, SITE_NAME } from "@/utils/site";

/** Every cookie the app sets; keep in sync with the API and ThemeProvider. */
const COOKIES = [
  {
    name: "access_token",
    purpose: "Proves you're signed in on each request.",
    type: "Strictly necessary",
    duration: "15 minutes",
  },
  {
    name: "refresh_token",
    purpose: "Keeps you signed in by renewing the access token.",
    type: "Strictly necessary",
    duration: "30 days",
  },
  {
    name: "cui-theme",
    purpose: "Remembers whether you chose the light or dark theme.",
    type: "Preference",
    duration: "Persistent, until you clear it",
  },
];

const SECTIONS: TLegalSection[] = [
  {
    id: "what-are-cookies",
    title: "What cookies are",
    content: (
      <p>
        Cookies are small text files a website stores in your browser. They let
        the site remember things between pages and visits, like the fact that
        you&apos;re signed in.
      </p>
    ),
  },
  {
    id: "cookies-we-use",
    title: "Cookies we use",
    content: (
      <>
        <p>
          {SITE_NAME} sets only the cookies below, all first-party (from our own
          domain).
        </p>
        <SLegalDocumentTable>
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Purpose</th>
                <th scope="col">Type</th>
                <th scope="col">Duration</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map(({ name, purpose, type, duration }) => (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td>{purpose}</td>
                  <td>{type}</td>
                  <td>{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SLegalDocumentTable>
        <p>
          The sign-in cookies can&apos;t be read by scripts on the page and are
          only sent over encrypted connections in production.
        </p>
      </>
    ),
  },
  {
    id: "no-tracking",
    title: "No tracking or advertising cookies",
    content: (
      <p>
        We don&apos;t use analytics, advertising or social media cookies, and no
        third party sets cookies through our site. Because we only use strictly
        necessary and preference cookies, we don&apos;t show a cookie consent
        banner.
      </p>
    ),
  },
  {
    id: "managing-cookies",
    title: "Managing cookies",
    content: (
      <p>
        You can delete or block cookies in your browser settings. If you block
        the sign-in cookies you won&apos;t be able to sign in; if you clear the
        theme cookie, the site goes back to your device&apos;s theme.
      </p>
    ),
  },
  {
    id: "more-information",
    title: "More information",
    content: (
      <p>
        See our <NextLink href="/privacy-policy">privacy policy</NextLink> for
        how we handle personal data, or email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

const CookiePolicyPage = () => (
  <LegalDocument
    title="Cookie policy"
    summary="The few cookies we use and why. No trackers, no ads."
    sections={SECTIONS}
  />
);

export default CookiePolicyPage;
