"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Modal,
  Pagination,
  Small,
  Switch,
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
} from "@/components/cv-export-modal/types";
import { useCv } from "@/providers/cv-provider/context";
import { downloadCvPdf } from "@/utils/download-cv-pdf";

/** Last look at the finished CV: page-by-page preview, file name and PDF. */
export const CvExportModal = ({ open, onClose }: TCvExportModalProps) => {
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
  // The CV may have fewer pages than the one last viewed.
  const currentPage = Math.min(page, pageCount);

  const onDownload = async () => {
    setDownloadState("loading");
    try {
      await downloadCvPdf(
        {
          data,
          appearance: {
            templateId: template.id,
            colorSchemeId,
            sizes,
            fontId,
            fontScale,
          },
        },
        resolvedFileName,
      );
      setDownloadState("idle");
    } catch (error) {
      console.error(error);
      setDownloadState("error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your CV is ready"
      size="xl"
      scrollable
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            color="primary"
            onClick={() => router.push("/")}
          >
            Save &amp; Finish
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
          <Switch label="Include fonts" size="sm" defaultChecked />
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
        </SCvExportModalSettings>
      </SCvExportModalBody>
    </Modal>
  );
};

export default CvExportModal;
