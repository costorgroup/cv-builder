"use client";

import {
  DownloadIcon,
  FileIcon,
  Flex,
  IconButton,
  Menu,
  MenuItem,
  MoreHorizontalIcon,
  Skeleton,
  Small,
  Strong,
  useMenu,
} from "@costor/ui";
import { findTemplateSpec } from "@repo/cv-core";
import CvDisplay from "@/components/cv-display";
import {
  SCvCard,
  SCvCardActions,
  SCvCardBody,
  SCvCardLink,
  SCvCardText,
  SCvCardThumbnail,
} from "@/components/cv-card/styles";
import type { TCvCardAction, TCvCardProps } from "@/components/cv-card/types";
import {
  CvProvider,
  getCvCompletion,
  withCvDefaults,
} from "@/providers/cv-provider";
import { cvEditorStepPath } from "@/utils/cv-editor";

const editedDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const ACTIONS: { action: TCvCardAction; label: string }[] = [
  { action: "rename", label: "Rename" },
  { action: "duplicate", label: "Duplicate" },
  { action: "download", label: "Download PDF" },
  { action: "delete", label: "Delete" },
];

/** A saved CV: its first page, name, template and when it was last edited. */
export const CvCard = ({ cv, onAction, busy }: TCvCardProps) => {
  const { triggerProps, menuProps, close } = useMenu({
    placement: "bottom-end",
    offset: 4,
  });
  const templateName =
    findTemplateSpec(cv.appearance?.templateId ?? "")?.name ?? "Template";
  // Older CVs may lack sections; count them as the editor would show them.
  const { percent } = getCvCompletion(withCvDefaults(cv.data));

  return (
    <SCvCard>
      <SCvCardLink
        href={cvEditorStepPath(cv.id)}
        aria-label={`Edit ${cv.name}`}
      >
        <SCvCardBody radius="lg">
          <SCvCardThumbnail aria-hidden>
            <CvProvider initialData={cv.data} initialAppearance={cv.appearance}>
              <CvDisplay variant="static" page={0} />
            </CvProvider>
          </SCvCardThumbnail>
          <SCvCardText direction="column">
            <Strong title={cv.name}>{cv.name}</Strong>
            <Small color="secondary">
              {templateName} · {percent}% complete
            </Small>
            <Small color="secondary">
              Edited {editedDate.format(new Date(cv.updatedAt))}
            </Small>
          </SCvCardText>
        </SCvCardBody>
      </SCvCardLink>
      {onAction && (
        <SCvCardActions>
          <IconButton
            size="sm"
            variant="solid"
            aria-label={`Actions for ${cv.name}`}
            disabled={busy}
            {...triggerProps}
          >
            <MoreHorizontalIcon />
          </IconButton>
          <Menu {...menuProps}>
            {ACTIONS.map(({ action, label }) => (
              <MenuItem
                key={action}
                color={action === "delete" ? "error" : undefined}
                onClick={() => {
                  close();
                  onAction(action, cv);
                }}
              >
                <Flex align="center" gap={2.5}>
                  {action === "download" ? <DownloadIcon /> : <FileIcon />}
                  {label}
                </Flex>
              </MenuItem>
            ))}
          </Menu>
        </SCvCardActions>
      )}
    </SCvCard>
  );
};

/** Stands in for a CV card while a list loads. */
export const CvCardSkeleton = () => (
  <SCvCardBody radius="lg" aria-hidden>
    <Skeleton width="100%" height="auto" style={{ aspectRatio: "210 / 297" }} />
    <Flex direction="column" gap={1.5}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="45%" height={12} />
    </Flex>
  </SCvCardBody>
);

export default CvCard;
