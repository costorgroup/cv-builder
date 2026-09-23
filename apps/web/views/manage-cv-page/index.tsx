"use client";

import { ThemeToggle } from "@/components";
import {
  SManageCvPage,
  SManageCvPageCenter,
  SManageCvPageDocumentNameInput,
  SManageCvPageNavLink,
} from "./styles";
import type { TManageCvPageProps } from "./types";
import {
  Status,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Flex,
  IconButton,
  RedoIcon,
  UndoIcon,
  Small,
  Editable,
  Heading,
  Text,
  LinearProgress,
  UsersIcon,
} from "@costor/ui";
import { useState } from "react";

export const ManageCvPage = (_props: TManageCvPageProps) => {
  const [state, setState] = useState<any>({
    title: "CV Manager",
    lastSaved: "2 minutes ago",
  });

  const handleTitleChange = (value: string) => {
    setState({ ...state, title: value });
  };

  return (
    <SManageCvPage>
      <Card>
        <CardHeader variant="border">
          <Editable
            value={state.title}
            render={({ value, editable, handlers }) =>
              editable ? (
                <SManageCvPageDocumentNameInput
                  value={value}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              ) : (
                <CardTitle {...handlers}>{value}</CardTitle>
              )
            }
          />
          <CardDescription>
            <Status color="success" size="xs" />{" "}
            <Small>Last saved 2 minutes ago</Small>
          </CardDescription>
          <CardAction>
            <IconButton size="xs" variant="ghost">
              <UndoIcon />
            </IconButton>
            <IconButton size="xs" variant="ghost">
              <RedoIcon />
            </IconButton>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap={5}>
            <Flex direction="column">
              <Text>CV Completion</Text>
              <Flex direction="row" gap={2} align="center">
                <LinearProgress value={50} max={100} color="primary" />
                <Small>50%</Small>
              </Flex>
            </Flex>
            <Flex direction="column">
              <SManageCvPageNavLink
                href="/manage-cv/personal-information"
                active
              >
                <UsersIcon />
                Personal Information
              </SManageCvPageNavLink>
              <SManageCvPageNavLink href="/manage-cv/work-experience">
                Work Experience
              </SManageCvPageNavLink>
              <SManageCvPageNavLink href="/manage-cv/education">
                Education
              </SManageCvPageNavLink>
              <SManageCvPageNavLink href="/manage-cv/skills">
                Skills
              </SManageCvPageNavLink>
              <SManageCvPageNavLink href="/manage-cv/languages">
                Languages
              </SManageCvPageNavLink>
              <SManageCvPageNavLink href="/manage-cv/projects">
                Projects
              </SManageCvPageNavLink>
              <SManageCvPageNavLink href="/manage-cv/certifications">
                Certifications
              </SManageCvPageNavLink>
            </Flex>
          </Flex>
          {/* <ThemeToggle /> */}
        </CardContent>
        <CardFooter variant="border">
          <Flex justify="flex-end" gap={2} fullWidth>
            <Button>Back</Button>
            <Button color="primary">Continue</Button>
          </Flex>
        </CardFooter>
      </Card>
      <SManageCvPageCenter />
      <Card></Card>
    </SManageCvPage>
  );
};

export type { TManageCvPageProps };
