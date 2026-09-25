export type TCvExportModalProps = {
  open: boolean;
  onClose: () => void;
  /** The saved CV being edited; saving creates a new one without it. */
  cvId?: string;
};

export type TCvExportDownloadState = "idle" | "loading" | "error";

export type TCvExportSaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "downloading" }
  | { status: "error"; message: string };
