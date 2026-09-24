export type TCvExportModalProps = {
  open: boolean;
  onClose: () => void;
};

export type TCvExportDownloadState = "idle" | "loading" | "error";
