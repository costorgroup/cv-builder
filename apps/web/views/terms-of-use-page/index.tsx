"use client";

import NextLink from "next/link";
import LegalDocument, { type TLegalSection } from "@/components/legal-document";
import { CONTACT_EMAIL, SITE_NAME } from "@/utils/site";

const SECTIONS: TLegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    content: (
      <p>
        By creating an account or otherwise using {SITE_NAME} (the
        &quot;Service&quot;), you agree to these Terms of Use. If you don&apos;t
        agree, please don&apos;t use the Service.
      </p>
    ),
  },
  {
    id: "the-service",
    title: "The service",
    content: (
      <p>
        {SITE_NAME} lets you write a CV in an online editor, style it with
        templates, colors and fonts, save it to your account and download it as
        a PDF. We may add, change or remove features over time, and we&apos;ll
        try to give you notice of changes that materially affect you.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    content: (
      <ul>
        <li>You must be at least 16 years old to create an account.</li>
        <li>
          Give us accurate details when you sign up, and keep your password
          secret. You&apos;re responsible for everything done with your account.
        </li>
        <li>
          Tell us straight away at {CONTACT_EMAIL} if you think someone else has
          access to your account.
        </li>
      </ul>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    content: (
      <>
        <p>
          You own the CVs and everything you put in them. You give us a limited
          permission to store, process and display that content only as needed
          to run the Service for you (for example, to show the preview and
          generate your PDF).
        </p>
        <p>
          You&apos;re responsible for making sure your content is accurate and
          that you have the right to use it, including any photo you upload.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>
            use the Service for anything unlawful, fraudulent or misleading;
          </li>
          <li>upload content that infringes someone else&apos;s rights;</li>
          <li>
            try to break, overload or get around the security of the Service,
            including by automated scraping or excessive requests;
          </li>
          <li>
            resell or redistribute the Service or our templates as your own.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans and payments",
    content: (
      <p>
        The free plan is free of charge. Paid plans, when offered, are described
        on our <NextLink href="/pricing">pricing page</NextLink>, including
        their price, what&apos;s included and how long they last. Any taxes that
        apply are shown before you pay.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Our intellectual property",
    content: (
      <p>
        The Service, including its software, design and templates, belongs to us
        or our licensors. You may use the templates to create CVs for yourself;
        you may not copy, sell or distribute them separately.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and closing your account",
    content: (
      <p>
        You can stop using the Service at any time and ask us to delete your
        account. We may suspend or close accounts that break these terms. When
        an account is deleted, its CVs are deleted with it.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimers and liability",
    content: (
      <>
        <p>
          We work hard to keep the Service available and your data safe, but
          it&apos;s provided &quot;as is&quot; without guarantees. We can&apos;t
          promise that a CV made with {SITE_NAME} will get you an interview or a
          job.
        </p>
        <p>
          To the extent the law allows, we&apos;re not liable for indirect or
          consequential losses. Nothing in these terms limits rights you have as
          a consumer that can&apos;t be limited by law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        We may update these terms. If a change is significant we&apos;ll let you
        know, for example by email or a notice in the app. The date at the top
        shows when they last changed.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these terms? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

const TermsOfUsePage = () => (
  <LegalDocument
    title="Terms of use"
    summary={`The rules for using ${SITE_NAME}, in plain language.`}
    sections={SECTIONS}
  />
);

export default TermsOfUsePage;
