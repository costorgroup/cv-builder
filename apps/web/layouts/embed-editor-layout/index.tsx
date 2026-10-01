"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@costor/ui";
import { EMBED_EVENTS } from "@repo/cv-core";
import { useEmbed } from "@/layouts/embed-layout/context";
import {
  ManageCvLayoutContent,
  ManageCvLayoutSkeleton,
} from "@/layouts/manage-cv-layout";
import { SManageCvLayoutMessage } from "@/layouts/manage-cv-layout/styles";
import {
  CvEditorEnvProvider,
  type TCvEditorEnv,
} from "@/providers/cv-editor-env";
import { CvProvider } from "@/providers/cv-provider";
import { ApiError } from "@/utils/api-client";
import type { TSavedCv } from "@/utils/cvs-api";
import { embedApi, notifyEmbedParent } from "@/utils/embed-api";
import { embedEditorPath, embedPath } from "@/utils/embed-path";
import { offeredTemplates } from "@/utils/offered-templates";
import { SEmbedEditorLayoutBrand } from "@/layouts/embed-editor-layout/styles";

type TLoad = { cv: TSavedCv } | { error: string };

/**
 * The editor inside an embed: the app's own editor, with the embed's steps,
 * templates, branding and download rule, saving through the embed session.
 */
const EmbedEditorLayout = ({
  cvId,
  children,
}: {
  cvId?: string;
  children: ReactNode;
}) => {
  const { publicKey, config } = useEmbed();
  const router = useRouter();
  const [load, setLoad] = useState<TLoad>();

  useEffect(() => {
    if (!cvId) return;
    let active = true;
    embedApi.get(cvId).then(
      (cv) => active && setLoad({ cv }),
      (error: unknown) =>
        active &&
        setLoad({
          error:
            error instanceof ApiError
              ? error.message
              : "Couldn't reach the server. Try again.",
        }),
    );
    return () => {
      active = false;
    };
  }, [cvId]);

  const env = useMemo<TCvEditorEnv>(() => {
    const templates = offeredTemplates(
      config.templateIds.map((id) => ({
        id,
        tier: config.freeTemplateIds.includes(id) ? "FREE" : "PREMIUM",
        category: null,
      })),
    );
    return {
      editorPath: (id) => embedEditorPath(publicKey, id),
      steps: config.sections,
      brand: (
        <SEmbedEditorLayoutBrand title={config.branding.companyName}>
          {config.branding.logoUrl ? (
            // A customer's own logo, from their own site.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.branding.logoUrl} alt="" />
          ) : (
            (config.branding.companyName ?? "CV").slice(0, 2)
          )}
        </SEmbedEditorLayoutBrand>
      ),
      themeToggle: false,
      save: embedApi.save,
      fetchPdf: embedApi.pdf,
      canDownload: config.features.includes("pdf.download"),
      onSaved: (cv) => {
        notifyEmbedParent(EMBED_EVENTS.saved, { id: cv.id, name: cv.name });
        router.push(embedPath(publicKey));
      },
      templateCatalog: {
        status: "ready",
        templates,
        free: config.freeTemplateIds,
      },
      showUpgrades: false,
    };
  }, [config, publicKey, router]);

  if (!cvId) {
    return (
      <CvEditorEnvProvider env={env}>
        <CvProvider initialAppearance={{ templateId: config.templateIds[0] }}>
          <ManageCvLayoutContent>{children}</ManageCvLayoutContent>
        </CvProvider>
      </CvEditorEnvProvider>
    );
  }
  if (!load) return <ManageCvLayoutSkeleton />;
  if ("error" in load) {
    return (
      <SManageCvLayoutMessage>
        <Empty variant="surface" radius="lg">
          <EmptyHeader>
            <EmptyTitle>Couldn&apos;t open this CV</EmptyTitle>
            <EmptyDescription>{load.error}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push(embedPath(publicKey))}>
              Back to your CVs
            </Button>
          </EmptyContent>
        </Empty>
      </SManageCvLayoutMessage>
    );
  }
  const { cv } = load;
  return (
    <CvEditorEnvProvider env={env}>
      <CvProvider
        key={cv.id}
        initialData={cv.data}
        initialAppearance={cv.appearance}
        savedAppearance={cv.appearance}
        initialFileName={cv.name}
      >
        <ManageCvLayoutContent cvId={cv.id}>{children}</ManageCvLayoutContent>
      </CvProvider>
    </CvEditorEnvProvider>
  );
};

export default EmbedEditorLayout;
