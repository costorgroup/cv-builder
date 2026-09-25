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
import { useCv } from "@/providers/cv-provider/context";
import type { TCvDocument } from "@/providers/cv-provider/types";
import { ApiError } from "@/utils/api-client";
import { cvsApi } from "@/utils/cvs-api";
import { downloadCvPdf } from "@/utils/download-cv-pdf";

/**
 * Last look at the finished CV: page-by-page preview, file name and PDF.
 * "Save & Finish" saves it to the account (and downloads the PDF, unless
 * unticked), then goes back to the dashboard.
 */
export const CvExportModal = ({ open, onClose, cvId }: TCvExportModalProps) => {
  const router = useRouter();
  const {
    data,
    template,
    colorSchemeId,
    sizes,
    fontId,
    fontScale,
    fileName,
    setFileName,
    resolvedFileName,
  } = useCv();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [downloadState, setDownloadState] =
    useState<TCvExportDownloadState>("idle");
  const [saveState, setSaveState] = useState<TCvExportSaveState>({
    status: "idle",
  });
  const [downloadOnSave, setDownloadOnSave] = useState(true);
  // Once saved, a retry (e.g. after the PDF failed) updates this CV instead
  // of creating another.
  const [savedCvId, setSavedCvId] = useState(cvId);
  const busy = saveState.status === "saving" || saveState.status === "downloading";
  // The CV may have fewer pages than the one last viewed.
  const currentPage = Math.min(page, pageCount);

  const cvDocument: TCvDocument = {
    data,
    appearance: {
      templateId: template.id,
      colorSchemeId,
      sizes,
      fontId,
      fontScale,
    },
  };

  const onDownload = async () => {
    setDownloadState("loading");
    try {
      await downloadCvPdf(cvDocument, resolvedFileName);
      setDownloadState("idle");
    } catch (error) {
      console.error(error);
      setDownloadState("error");
    }
  };

  const onSave = async () => {
    setSaveState({ status: "saving" });
    const body = { name: resolvedFileName, ...cvDocument };
    try {
      const saved = await (savedCvId
        ? cvsApi.update(savedCvId, body)
        : cvsApi.create(body));
      setSavedCvId(saved.id);
    } catch (error) {
      setSaveState({
        status: "error",
        message: `Couldn't save your CV: ${
          error instanceof ApiError
            ? error.message
            : "couldn't reach the server."
        }`,
      });
      return;
    }

    if (downloadOnSave) {
      setSaveState({ status: "downloading" });
      try {
        await downloadCvPdf(cvDocument, resolvedFileName);
      } catch (error) {
        console.error(error);
        setSaveState({
          status: "error",
          message:
            "Your CV was saved, but the PDF couldn't be created. Try again, or untick the download.",
        });
        return;
      }
    }
    router.push("/dashboard");
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
            disabled={busy}
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
          <TextField
            label="File Name"
            variant="subtle"
            size="sm"
            placeholder={resolvedFileName}
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            helperText={`Saved as "${resolvedFileName}.pdf"`}
          />
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
            disabled={downloadState === "loading"}
            onClick={onDownload}
          >
            {downloadState === "loading" ? "Preparing PDF…" : "Download as PDF"}
          </Button>
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
