"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FileIcon,
  Flex,
  Modal,
  Pagination,
  Small,
  TextField,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import CvCard, { CvCardSkeleton } from "@/components/cv-card";
import type { TCvCardAction } from "@/components/cv-card/types";
import UpgradePrompt from "@/components/upgrade-prompt";
import { useAuth } from "@/providers/auth-provider";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { ApiError } from "@/utils/api-client";
import { cvEditorStepPath } from "@/utils/cv-editor";
import { cvsApi, type TSavedCv } from "@/utils/cvs-api";
import { myCvsPath } from "@/utils/dashboard-path";
import { downloadCvPdf } from "@/utils/download-cv-pdf";
import { planRestrictionOf } from "@/utils/plan-restriction";
import {
  SMyCvsPage,
  SMyCvsPageGrid,
  SMyCvsPageHeader,
} from "@/views/my-cvs-page/styles";
import type {
  TMyCvsEmptyProps,
  TMyCvsPageNotice,
  TMyCvsPageProps,
  TMyCvsPageResult,
  TRenameCvModalProps,
} from "@/views/my-cvs-page/types";

const PAGE_SIZE = 12;
const NEW_CV_PATH = cvEditorStepPath();

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

const MyCvsEmpty = ({ title, description, action }: TMyCvsEmptyProps) => (
  <Empty variant="surface" radius="lg">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FileIcon />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
    {action && <EmptyContent>{action}</EmptyContent>}
  </Empty>
);

const RenameCvModal = ({ cv, onClose, onRenamed }: TRenameCvModalProps) => {
  const [name, setName] = useState(cv?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const trimmed = name.trim();

  const onSave = async () => {
    if (!cv || !trimmed) return;
    setSaving(true);
    setError(undefined);
    try {
      await cvsApi.update(cv.id, { name: trimmed });
      onRenamed();
    } catch (saveError) {
      setError(messageOf(saveError));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!cv}
      onClose={onClose}
      title="Rename CV"
      size="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            color="primary"
            disabled={saving || !trimmed || trimmed === cv?.name}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <TextField
          label="Name"
          variant="subtle"
          size="sm"
          autoFocus
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          helperText={error}
        />
      </form>
    </Modal>
  );
};

/**
 * The user's CVs: find, open, rename, duplicate, download and delete them,
 * with how many their plan allows.
 */
const MyCvsPage = ({ search = "", page = 1 }: TMyCvsPageProps) => {
  const router = useRouter();
  const auth = useAuth();
  const entitlements = useEntitlements();
  const confirm = useConfirm();
  const [result, setResult] = useState<TMyCvsPageResult>();
  // Bumped by "Try again" and after changes to fetch the same page again.
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<TMyCvsPageNotice>();
  const [renaming, setRenaming] = useState<TSavedCv>();
  // The CV an action is running on, so its menu can't start another.
  const [busyId, setBusyId] = useState<string>();
  const requestKey = `${search}|${page}|${attempt}`;

  const signedIn = auth.status === "signed-in";

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    cvsApi
      .list({ search, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((list) => setResult({ key: requestKey, list }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, error: messageOf(error) });
      });
    return () => controller.abort();
  }, [signedIn, search, page, requestKey]);

  /** Shows the list and the plan's usage as they are now. */
  const refresh = () => {
    setAttempt((count) => count + 1);
    entitlements.reload();
  };

  const onAction = async (action: TCvCardAction, cv: TSavedCv) => {
    if (action === "rename") {
      setRenaming(cv);
      return;
    }
    if (action === "delete") {
      try {
        await confirm({
          title: `Delete "${cv.name}"?`,
          description: "It will be gone for good; this can't be undone.",
          confirmLabel: "Delete",
          color: "error",
        });
      } catch (error) {
        if (isConfirmCancelled(error)) return;
        throw error;
      }
    }

    setNotice(undefined);
    setBusyId(cv.id);
    try {
      if (action === "duplicate") await cvsApi.duplicate(cv.id);
      if (action === "delete") await cvsApi.remove(cv.id);
      if (action === "download") await downloadCvPdf({ id: cv.id }, cv.name);
      if (action !== "download") refresh();
    } catch (error) {
      const restriction = planRestrictionOf(error);
      setNotice(restriction ? { restriction } : { error: messageOf(error) });
    } finally {
      setBusyId(undefined);
    }
  };

  // Skeletons until the answer for this exact search and page is in (or
  // while a signed-out visitor is sent to sign in by the layout).
  const current = result?.key === requestKey ? result : undefined;
  const newCvButton = (
    <Button as={ButtonLink} href={NEW_CV_PATH} variant="solid" color="primary">
      New CV
    </Button>
  );

  const renderUsage = () => {
    if (entitlements.status !== "ready") return null;
    const { used, max } = entitlements.usage.cvs;
    if (max !== null && used >= max) {
      // Not after a refused action: that notice already says the same.
      return notice && "restriction" in notice ? null : (
        <UpgradePrompt
          restriction={{ kind: "limit", limit: "cv.max", used, max }}
        />
      );
    }
    return (
      <Small color="secondary">
        {max === null
          ? `${used} ${used === 1 ? "CV" : "CVs"} · no limit on your plan`
          : `${used} of ${max} CVs used`}
      </Small>
    );
  };

  const renderList = () => {
    if (!current) {
      return (
        <SMyCvsPageGrid aria-busy>
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <CvCardSkeleton key={index} />
          ))}
        </SMyCvsPageGrid>
      );
    }
    if ("error" in current) {
      return (
        <MyCvsEmpty
          title="Couldn't load your CVs"
          description={current.error}
          action={
            <Button onClick={() => setAttempt((count) => count + 1)}>
              Try again
            </Button>
          }
        />
      );
    }
    const { items, pageCount } = current.list;
    if (items.length === 0) {
      return search ? (
        <MyCvsEmpty
          title="No matching CVs"
          description={`No CV names contain "${search}".`}
        />
      ) : (
        <MyCvsEmpty
          title="No CVs yet"
          description="Pick a template and fill in your details to make your first CV."
          action={newCvButton}
        />
      );
    }
    return (
      <>
        <SMyCvsPageGrid>
          {items.map((cv) => (
            <CvCard
              key={cv.id}
              cv={cv}
              onAction={onAction}
              busy={busyId === cv.id}
            />
          ))}
        </SMyCvsPageGrid>
        {pageCount > 1 && (
          <Flex justify="center">
            <Pagination
              count={pageCount}
              page={Math.min(page, pageCount)}
              onChange={(_, next) => router.push(myCvsPath(search, next))}
            />
          </Flex>
        )}
      </>
    );
  };

  return (
    <SMyCvsPage direction="column" gap={5}>
      <SMyCvsPageHeader direction="column" gap={3}>
        {renderUsage()}
        {notice &&
          ("restriction" in notice ? (
            <UpgradePrompt restriction={notice.restriction} />
          ) : (
            <Alert
              color="error"
              variant="subtle"
              size="sm"
              onClose={() => setNotice(undefined)}
            >
              {notice.error}
            </Alert>
          ))}
      </SMyCvsPageHeader>
      {renderList()}
      <RenameCvModal
        // Remounted per CV, so the field starts from that CV's name.
        key={renaming?.id}
        cv={renaming}
        onClose={() => setRenaming(undefined)}
        onRenamed={() => {
          setRenaming(undefined);
          refresh();
        }}
      />
    </SMyCvsPage>
  );
};

export default MyCvsPage;
