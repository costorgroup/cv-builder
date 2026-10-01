"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Flex,
  Heading,
  Skeleton,
  Small,
  Strong,
} from "@costor/ui";
import { useEmbed } from "@/layouts/embed-layout/context";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { ApiError } from "@/utils/api-client";
import type { TSavedCv } from "@/utils/cvs-api";
import { saveCvPdf } from "@/utils/download-cv-pdf";
import { embedApi } from "@/utils/embed-api";
import { embedEditorPath } from "@/utils/embed-path";
import { SEmbedHomePage } from "@/views/embed-home-page/styles";

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/** The person's CVs in this embed, and a new one. */
const EmbedHomePage = () => {
  const { publicKey, config } = useEmbed();
  const router = useRouter();
  const confirm = useConfirm();
  const [cvs, setCvs] = useState<TSavedCv[] | { error: string }>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const firstStep = config.sections[0] ?? "templates";
  const canDownload = config.features.includes("pdf.download");

  const load = useCallback(
    () =>
      embedApi.list({ pageSize: 48 }).then(
        (page) => setCvs(page.items),
        (caught: unknown) => setCvs({ error: messageOf(caught) }),
      ),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const open = (cvId?: string) =>
    router.push(`${embedEditorPath(publicKey, cvId)}/${firstStep}`);

  const onDelete = async (cv: TSavedCv) => {
    try {
      await confirm({
        title: `Delete "${cv.name}"?`,
        description: "It can't be brought back.",
        confirmLabel: "Delete",
        color: "error",
      });
    } catch (caught) {
      if (isConfirmCancelled(caught)) return;
      throw caught;
    }
    setBusy(cv.id);
    setError(undefined);
    try {
      await embedApi.remove(cv.id);
      await load();
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setBusy(undefined);
    }
  };

  const onDownload = async (cv: TSavedCv) => {
    setBusy(cv.id);
    setError(undefined);
    try {
      saveCvPdf(await embedApi.pdf({ id: cv.id }), cv.name);
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setBusy(undefined);
    }
  };

  if (!cvs) {
    return (
      <SEmbedHomePage>
        <Skeleton width="100%" height={240} radius="lg" aria-busy />
      </SEmbedHomePage>
    );
  }
  if ("error" in cvs) {
    return (
      <SEmbedHomePage>
        <Alert color="error" variant="subtle">
          {cvs.error}
        </Alert>
      </SEmbedHomePage>
    );
  }
  if (cvs.length === 0) {
    return (
      <SEmbedHomePage>
        <Empty variant="surface" radius="lg">
          <EmptyHeader>
            <EmptyTitle>Create your CV</EmptyTitle>
            <EmptyDescription>
              Pick a template, fill in your details, and see it take shape as
              you type.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="solid" color="primary" onClick={() => open()}>
              Start a CV
            </Button>
          </EmptyContent>
        </Empty>
      </SEmbedHomePage>
    );
  }

  return (
    <SEmbedHomePage>
      <Flex direction="column" gap={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Heading as="h4">Your CVs</Heading>
          <Button variant="solid" color="primary" onClick={() => open()}>
            New CV
          </Button>
        </Flex>
        {error && (
          <Alert
            color="error"
            variant="subtle"
            onClose={() => setError(undefined)}
          >
            {error}
          </Alert>
        )}
        {cvs.map((cv) => (
          <Card key={cv.id} radius="lg">
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              wrap="wrap"
              style={{ padding: 16 }}
            >
              <Flex direction="column">
                <Strong>{cv.name}</Strong>
                <Small color="secondary">
                  Changed {shortDate.format(new Date(cv.updatedAt))}
                </Small>
              </Flex>
              <Flex gap={2} wrap="wrap">
                <Button size="sm" onClick={() => open(cv.id)}>
                  Edit
                </Button>
                {canDownload && (
                  <Button
                    size="sm"
                    disabled={busy === cv.id}
                    onClick={() => onDownload(cv)}
                  >
                    Download PDF
                  </Button>
                )}
                <Button
                  size="sm"
                  color="error"
                  disabled={busy === cv.id}
                  onClick={() => onDelete(cv)}
                >
                  Delete
                </Button>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    </SEmbedHomePage>
  );
};

export default EmbedHomePage;
