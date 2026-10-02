"use client";

import NextLink from "next/link";
import LegalDocument, { type TLegalSection } from "@/components/legal-document";
import { CONTACT_EMAIL, SITE_NAME } from "@/utils/site";

const SECTIONS: TLegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <p>
        {SITE_NAME} is responsible for the personal data described in this
        policy. You can reach us about anything privacy-related at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: "data-we-collect",
    title: "What we collect",
    content: (
      <ul>
        <li>
          <strong>Account details</strong>: your first and last name, email
          address and a securely hashed version of your password. We never store
          your password itself.
        </li>
        <li>
          <strong>CV content</strong>: everything you enter in the editor, such
          as contact details, work history, education, skills, social links and
          an optional photo, plus the template and style you choose.
        </li>
        <li>
          <strong>Session data</strong>: hashed sign-in tokens so you stay
          signed in, and one-time hashed tokens for verifying your email or
          resetting your password.
        </li>
        <li>
          <strong>Technical data</strong>: your IP address is used briefly to
          protect the Service from abuse (rate limiting) and isn&apos;t stored
          with your account.
        </li>
      </ul>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    content: (
      <ul>
        <li>to create and secure your account and keep you signed in;</li>
        <li>to save your CVs and show them in the editor and dashboard;</li>
        <li>to generate PDF files of your CVs;</li>
        <li>
          to send you service emails, such as verifying your address or
          resetting your password;
        </li>
        <li>to prevent abuse and keep the Service running.</li>
      </ul>
    ),
  },
  {
    id: "legal-bases",
    title: "Legal bases",
    content: (
      <p>
        We process your data to provide the Service you signed up for
        (performance of a contract), and to keep it secure (our legitimate
        interest). Where we need your consent for something, we&apos;ll ask for
        it first and you can withdraw it at any time.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    content: (
      <>
        <p>
          We don&apos;t sell your data, and we don&apos;t use advertising or
          analytics trackers. PDFs are generated on our own servers, so your CV
          isn&apos;t sent to an outside service to be converted.
        </p>
        <p>
          We only share data with providers that help us run the Service (such
          as hosting), under contracts that protect it, or when the law requires
          it. See{" "}
          <NextLink href="/third-party-tools">third-party tools</NextLink> for
          the full list.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    content: (
      <ul>
        <li>
          Your account and CVs are kept until you delete them or ask us to
          delete your account.
        </li>
        <li>A deleted CV is removed straight away.</li>
        <li>Sign-in sessions expire after 30 days without use.</li>
        <li>
          Email verification links expire after 24 hours, and password reset
          links after 1 hour.
        </li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <p>
        Passwords and tokens are stored only as hashes, session cookies
        can&apos;t be read by scripts on the page, and traffic is encrypted in
        transit. No system is perfectly secure, but we take reasonable steps to
        protect your data.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>access the personal data we hold about you;</li>
          <li>correct data that&apos;s wrong or incomplete;</li>
          <li>have your data deleted;</li>
          <li>receive your data in a portable format;</li>
          <li>object to or restrict how we process it;</li>
          <li>complain to your local data protection authority.</li>
        </ul>
        <p>
          You can edit or delete your CVs yourself at any time. For anything
          else, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
          and we&apos;ll respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    content: (
      <p>
        We only use cookies needed to keep you signed in and to remember your
        theme. Read the <NextLink href="/cookie-policy">cookie policy</NextLink>{" "}
        for details.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: (
      <p>
        {SITE_NAME} isn&apos;t meant for children under 16, and we don&apos;t
        knowingly collect their data.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        If we change how we handle your data, we&apos;ll update this page and,
        for significant changes, let you know by email or in the app.
      </p>
    ),
  },
];

const PrivacyPolicyPage = () => (
  <LegalDocument
    title="Privacy policy"
    summary="What personal data we collect, why, and the choices you have."
    sections={SECTIONS}
  />
);

export default PrivacyPolicyPage;
