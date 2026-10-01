"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  CheckBox,
  Modal,
  Pagination,
  Small,
  TextField,
} from "@costor/ui";
import CvDisplay from "@/components/cv-display";
import LockedFeaturesNotice from "@/components/locked-features-notice";
import UpgradePrompt from "@/components/upgrade-prompt";
import {
  SCvExportModalBody,
  SCvExportModalPage,
  SCvExportModalPreview,
  SCvExportModalSettings,
  SCvExportModalStage,
} from "@/components/cv-export-modal/styles";
import type {
  TCvExportDownloadState,
  TCvExportModalProps,
  TCvExportSaveState,
} from "@/components/cv-export-modal/types";
import { useCvEditorEnv } from "@/providers/cv-editor-env";
import { useCv } from "@/providers/cv-provider/context";
import type { TCvDocument } from "@/providers/cv-provider/types";
import { ApiError } from "@/utils/api-client";
import { cvsApi } from "@/utils/cvs-api";
import { MY_CVS_PATH } from "@/utils/dashboard-path";
import {
  downloadCvPdf,
  saveCvPdf,
  type TCvPdfSource,
} from "@/utils/download-cv-pdf";
import { useLockedFeatures } from "@/utils/locked-features";
import {
  planRestrictionOf,
  type TPlanRestriction,
} from "@/utils/plan-restriction";

/**
 * Last look at the finished CV: page-by-page preview, file name and PDF.
 * "Save & Finish" saves it to the account (and downloads the PDF, unless
 * unticked), then goes back to the dashboard.
 */
export const CvExportModal = ({ open, onClose, cvId }: TCvExportModalProps) => {
  const router = useRouter();
  const env = useCvEditorEnv();
  const canDownload = env.canDownload ?? true;
  const { data, appearance, fileName, setFileName, resolvedFileName } = useCv();
  // Premium options the plan doesn't include block saving and downloading
  // up front; the notices say what to change.
  const locked = useLockedFeatures();
  const blocked = locked.length > 0;
  // What the plan refused on the last save or download, if anything.
  const [restriction, setRestriction] = useState<TPlanRestriction>();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [downloadState, setDownloadState] =
    useState<TCvExportDownloadState>("idle");
  const [saveState, setSaveState] = useState<TCvExportSaveState>({
    status: "idle",
  });
  const [downloadOnSave, setDownloadOnSave] = useState(canDownload);
  // Once saved, a retry (e.g. after the PDF failed) updates this CV instead
  // of creating another.
  const [savedCvId, setSavedCvId] = useState(cvId);
  const busy =
    saveState.status === "saving" || saveState.status === "downloading";
  // The CV may have fewer pages than the one last viewed.
  const currentPage = Math.min(page, pageCount);

  const cvDocument: TCvDocument = { data, appearance };

  /** The PDF through the embed's own API, or the app's. */
  const download = async (source: TCvPdfSource) =>
    env.fetchPdf
      ? saveCvPdf(await env.fetchPdf(source), resolvedFileName)
      : downloadCvPdf(source, resolvedFileName);

  const onDownload = async () => {
    setDownloadState("loading");
    setRestriction(undefined);
    try {
      await download({ ...cvDocument, cvId: savedCvId });
      setDownloadState("idle");
    } catch (error) {
      const refused = planRestrictionOf(error);
      if (!refused) console.error(error);
      setRestriction(refused);
      setDownloadState(refused ? "idle" : "error");
    }
  };

  const onSave = async () => {
    setSaveState({ status: "saving" });
    setRestriction(undefined);
    const body = { name: resolvedFileName, ...cvDocument };
    let saved;
    try {
      saved = await (env.save
        ? env.save(savedCvId, body)
        : savedCvId
          ? cvsApi.update(savedCvId, body)
          : cvsApi.create(body));
      setSavedCvId(saved.id);
    } catch (error) {
      const refused = planRestrictionOf(error);
      setRestriction(refused);
      // A plan refusal is explained by its upgrade prompt instead.
      setSaveState(
        refused
          ? { status: "idle" }
          : {
              status: "error",
              message: `Couldn't save your CV: ${
                error instanceof ApiError
                  ? error.message
                  : "couldn't reach the server."
              }`,
            },
      );
      return;
    }

    if (canDownload && downloadOnSave) {
      setSaveState({ status: "downloading" });
      try {
        // Just saved, so the stored CV is what's on screen.
        await download({ id: saved.id });
      } catch (error) {
        const refused = planRestrictionOf(error);
        if (!refused) console.error(error);
        setRestriction(refused);
        setSaveState({
          status: "error",
          message: refused
            ? "Your CV was saved, but the PDF wasn't made."
            : "Your CV was saved, but the PDF couldn't be created. Try again, or untick the download.",
        });
        return;
      }
    }
    if (env.onSaved) env.onSaved(saved);
    else router.push(MY_CVS_PATH);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your CV is ready"
      size="lg"
      scrollable
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            color="primary"
            disabled={busy || blocked}
            onClick={onSave}
          >
            {saveState.status === "saving"
              ? "Saving…"
              : saveState.status === "downloading"
                ? "Preparing PDF…"
                : "Save & Finish"}
          </Button>
        </>
      }
    >
      <SCvExportModalBody>
        <SCvExportModalPreview direction="column" align="center" gap={4}>
          <SCvExportModalStage justify="center">
            <SCvExportModalPage>
              {/* Only rendered while open, so the CV isn't measured twice. */}
              {open && (
                <CvDisplay
                  variant="static"
                  page={currentPage - 1}
                  onReady={setPageCount}
                />
              )}
            </SCvExportModalPage>
          </SCvExportModalStage>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, next) => setPage(next)}
            size="sm"
          />
        </SCvExportModalPreview>
        <SCvExportModalSettings direction="column" gap={5}>
          <LockedFeaturesNotice />
          {/* A refused feature the list above already names isn't repeated. */}
          {restriction &&
            !(
              restriction.kind === "feature" &&
              locked.includes(restriction.feature)
            ) && <UpgradePrompt restriction={restriction} />}
          <TextField
            label="File Name"
            variant="subtle"
            size="sm"
            placeholder={resolvedFileName}
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            helperText={`Saved as "${resolvedFileName}.pdf"`}
          />
          {canDownload && (
            <>
              <CheckBox
                label="Download PDF when saving"
                size="sm"
                checked={downloadOnSave}
                onChange={(event) => setDownloadOnSave(event.target.checked)}
              />
              <Button
                variant="subtle"
                color="primary"
                fullWidth
                disabled={downloadState === "loading" || blocked}
                onClick={onDownload}
              >
                {downloadState === "loading"
                  ? "Preparing PDF…"
                  : "Download as PDF"}
              </Button>
            </>
          )}
          {downloadState === "error" && (
            <Small>Couldn&apos;t create the PDF. Try again.</Small>
          )}
          {saveState.status === "error" && (
            <Small color="error">{saveState.message}</Small>
          )}
        </SCvExportModalSettings>
      </SCvExportModalBody>
    </Modal>
  );
};

export default CvExportModal;
