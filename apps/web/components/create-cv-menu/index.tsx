"use client";

import { useRouter } from "next/navigation";
import {
  FileIcon,
  Flex,
  IconButton,
  Menu,
  MenuItem,
  useMenu,
} from "@costor/ui";
import { PlusIcon } from "@/components/create-cv-menu/icons";
import { useAuth } from "@/providers/auth-provider";
import { cvEditorStepPath } from "@/utils/cv-editor";

/** A "+" button whose menu starts new things; only for signed-in users. */
export const CreateCvMenu = () => {
  const { status } = useAuth();
  const router = useRouter();
  const { triggerProps, menuProps, close } = useMenu({
    placement: "bottom-start",
    offset: 8,
  });

  if (status !== "signed-in") return null;

  return (
    <>
      <IconButton
        variant="subtle"
        color="primary"
        aria-label="Create"
        title="Create"
        {...triggerProps}
      >
        <PlusIcon />
      </IconButton>
      <Menu {...menuProps}>
        <MenuItem
          onClick={() => {
            close();
            router.push(cvEditorStepPath());
          }}
        >
          <Flex align="center" gap={2.5}>
            <FileIcon />
            Create new CV
          </Flex>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CreateCvMenu;
